import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { getSession } from '../api/sessions';
import { getLocation } from '../api/locations';
import { getSchema } from '../api/attributeSchema';
import { createPerson } from '../api/people';
import { createVideo } from '../api/videos';
import './UploadPage.css';

function parseFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  const timeMatch = base.match(/_(\d{1,2}[:.\-]\d{2}(?:[:.\-]\d{2})?)$/);
  let timestamp = '';
  let title = base;
  if (timeMatch) {
    timestamp = timeMatch[1].replace(/[.\-]/g, ':');
    title = base.slice(0, base.length - timeMatch[0].length);
  }
  // Also handle 4-digit HHMM format at end: _1405 → 14:05
  if (!timeMatch) {
    const hhmm = base.match(/_(\d{4})$/);
    if (hhmm) {
      const raw = hhmm[1];
      timestamp = `${raw.slice(0, 2)}:${raw.slice(2)}`;
      title = base.slice(0, base.length - hhmm[0].length);
    }
  }
  title = title.replace(/_/g, ' ').trim();
  return { title, timestamp };
}

function makePersonName(locationAddress, sessionTitle, sessionDate) {
  const formatDate = (d) => new Date(d).toISOString().slice(0, 10).replace(/-/g, '');
  const loc = (locationAddress || 'Unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const sess = (sessionTitle || formatDate(sessionDate)).replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const id = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${loc}_${sess}_${id}`;
}

function AttributeCell({ schema, value, onChange, disabled }) {
  if (schema.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="upload-attr-checkbox"
      />
    );
  }
  if (schema.type === 'dropdown') {
    const items = schema.options?.items || [];
    return (
      <select
        className="form-select upload-attr-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">—</option>
        {items.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    );
  }
  if (schema.type === 'slider') {
    const min = schema.options?.min ?? 0;
    const max = schema.options?.max ?? 100;
    const step = schema.options?.step ?? 1;
    return (
      <div className="upload-attr-slider">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          style={{ accentColor: 'var(--color-accent)' }}
        />
        <span className="upload-attr-slider-val">{value ?? min}</span>
      </div>
    );
  }
  return null;
}

export default function UploadPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [location, setLocation] = useState(null);
  const [schema, setSchema] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [rows, setRows] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(null); // { current, total }

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const sess = await getSession(sessionId);
        setSession(sess);
        const [loc, schemaData] = await Promise.all([
          getLocation(sess.locationId),
          getSchema(),
        ]);
        setLocation(loc);
        setSchema(schemaData || []);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  function buildRow(file) {
    const { title, timestamp } = parseFilename(file.name);
    const attributes = {};
    return {
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      title,
      timestamp,
      thumbnailFile: null,
      thumbnailPreview: null,
      attributes,
      status: 'pending', // pending | uploading | done | error
      error: null,
    };
  }

  function addFiles(files) {
    const videoFiles = Array.from(files).filter((f) => f.type.startsWith('video/'));
    if (!videoFiles.length) return;
    setRows((prev) => [...prev, ...videoFiles.map(buildRow)]);
  }

  function handleFileInput(e) {
    addFiles(e.target.files);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  function updateAttr(id, key, value) {
    setRows((prev) => prev.map((r) =>
      r.id === id ? { ...r, attributes: { ...r.attributes, [key]: value } } : r
    ));
  }

  function handleThumbnail(id, file) {
    const preview = file ? URL.createObjectURL(file) : null;
    setRows((prev) => prev.map((r) =>
      r.id === id ? { ...r, thumbnailFile: file, thumbnailPreview: preview } : r
    ));
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    const invalid = rows.findIndex((r) => r.status !== 'done' && (!r.title.trim() || !r.thumbnailFile));
    if (invalid !== -1) {
      setSubmitError(`Row ${invalid + 1}: title and thumbnail are required.`);
      return;
    }

    const pending = rows.filter((r) => r.status !== 'done');
    if (!pending.length) {
      navigate(`/sessions/${sessionId}`);
      return;
    }

    setSubmitting(true);
    let doneCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status === 'done') continue;

      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: 'uploading', error: null } : r));
      setProgress({ current: doneCount + errorCount + 1, total: pending.length });

      try {
        const personName = makePersonName(location?.address, session?.title, session?.date);
        const person = await createPerson({ name: personName, attributes: row.attributes });

        const fd = new FormData();
        fd.append('sessionId', sessionId);
        fd.append('title', row.title.trim());
        if (row.timestamp.trim()) fd.append('timestamp', row.timestamp.trim());
        fd.append('video', row.file);
        fd.append('thumbnail', row.thumbnailFile);
        fd.append('personIds', JSON.stringify([person._id]));

        await createVideo(fd);
        setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: 'done' } : r));
        doneCount++;
      } catch (err) {
        setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: 'error', error: err.message } : r));
        errorCount++;
      }
    }

    setSubmitting(false);
    setProgress(null);

    if (errorCount === 0) {
      navigate(`/sessions/${sessionId}`);
    } else {
      setSubmitError(`${errorCount} upload(s) failed. Fix errors and resubmit.`);
    }
  }

  if (loading) return <div className="spinner" aria-label="Loading" />;
  if (loadError) return <p className="error-message" style={{ margin: 32 }}>{loadError}</p>;

  const allDone = rows.length > 0 && rows.every((r) => r.status === 'done');
  const hasRows = rows.length > 0;
  const pendingCount = rows.filter((r) => r.status !== 'done').length;

  return (
    <div className="upload-page">
      <div className="detail-back">
        <Link to={`/sessions/${sessionId}`} className="btn btn-ghost">
          <ChevronLeft size={16} />
          Back to Session
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Upload size={20} />
            Upload Videos
          </h1>
          <p className="upload-page__subtitle">
            {session?.title || new Date(session?.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            {location && <span> · {location.address}</span>}
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className={`upload-drop-zone${dragging ? ' upload-drop-zone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !submitting && fileInputRef.current?.click()}
      >
        <Upload size={32} className="upload-drop-zone__icon" />
        <p className="upload-drop-zone__primary">Drag & drop videos here</p>
        <p className="upload-drop-zone__secondary">or click to browse · Filenames like <code>Parrots_Dance_1405</code> auto-fill title & time</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
          disabled={submitting}
        />
      </div>

      {hasRows && (
        <form onSubmit={handleSubmit}>
          {/* Progress bar */}
          {submitting && progress && (
            <div className="upload-progress">
              <div className="upload-progress__track">
                <div
                  className="upload-progress__fill"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="upload-progress__label">Uploading {progress.current} of {progress.total}…</p>
            </div>
          )}

          {submitError && <p className="error-message" style={{ marginBottom: 16 }}>{submitError}</p>}

          {/* Table */}
          <div className="upload-table-wrap">
            <table className="upload-table">
              <thead>
                <tr>
                  <th className="upload-th upload-th--status"></th>
                  <th className="upload-th">File</th>
                  <th className="upload-th">Title *</th>
                  <th className="upload-th">Time</th>
                  <th className="upload-th">Thumbnail *</th>
                  {schema.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((s) => (
                    <th key={s._id} className="upload-th">{s.label}</th>
                  ))}
                  <th className="upload-th upload-th--remove"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isUploading = row.status === 'uploading';
                  const isDone = row.status === 'done';
                  const isError = row.status === 'error';
                  const disabled = submitting || isDone;
                  return (
                    <tr
                      key={row.id}
                      className={`upload-row${isDone ? ' upload-row--done' : ''}${isError ? ' upload-row--error' : ''}${isUploading ? ' upload-row--uploading' : ''}`}
                    >
                      <td className="upload-td upload-td--status">
                        {isUploading && <Loader size={15} className="upload-status-spin" />}
                        {isDone && <CheckCircle size={15} className="upload-status-done" />}
                        {isError && <AlertCircle size={15} className="upload-status-error" title={row.error} />}
                      </td>
                      <td className="upload-td upload-td--file">
                        <span className="upload-filename" title={row.file.name}>{row.file.name}</span>
                        {isError && <span className="upload-row-error">{row.error}</span>}
                      </td>
                      <td className="upload-td">
                        <input
                          type="text"
                          className="form-input upload-input"
                          value={row.title}
                          onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                          disabled={disabled}
                          placeholder="Title"
                        />
                      </td>
                      <td className="upload-td">
                        <input
                          type="time"
                          className="form-input upload-input"
                          value={row.timestamp}
                          onChange={(e) => updateRow(row.id, 'timestamp', e.target.value)}
                          disabled={disabled}
                        />
                      </td>
                      <td className="upload-td upload-td--thumb">
                        {row.thumbnailPreview ? (
                          <div className="upload-thumb-preview">
                            <img src={row.thumbnailPreview} alt="thumb" className="upload-thumb-img" />
                            {!disabled && (
                              <label className="upload-thumb-change" title="Change thumbnail">
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleThumbnail(row.id, e.target.files[0] || null)}
                                  disabled={disabled}
                                />
                                ✎
                              </label>
                            )}
                          </div>
                        ) : (
                          <label className={`upload-thumb-empty${disabled ? ' upload-thumb-empty--disabled' : ''}`}>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleThumbnail(row.id, e.target.files[0] || null)}
                              disabled={disabled}
                            />
                            + Add
                          </label>
                        )}
                      </td>
                      {schema.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((s) => (
                        <td key={s._id} className="upload-td upload-td--attr">
                          <AttributeCell
                            schema={s}
                            value={row.attributes[s._id]}
                            onChange={(val) => updateAttr(row.id, s._id, val)}
                            disabled={disabled}
                          />
                        </td>
                      ))}
                      <td className="upload-td upload-td--remove">
                        {!isDone && (
                          <button
                            type="button"
                            className="btn-icon danger"
                            onClick={() => removeRow(row.id)}
                            disabled={submitting}
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="upload-page__actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/sessions/${sessionId}`)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || allDone}
            >
              {submitting
                ? 'Uploading…'
                : `Upload ${pendingCount} Video${pendingCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
