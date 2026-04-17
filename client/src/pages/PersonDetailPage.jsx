import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, UserCircle, Edit2, Check, X, CheckSquare, Square, ImagePlus, Trash2 } from 'lucide-react';
import { getPerson, getPersonVideos, updatePerson } from '../api/people';
import { getSchema } from '../api/attributeSchema';
import { useAuth } from '../context/AuthContext';
import { getPersonPictures, uploadPersonPictures, deletePersonPicture } from '../api/personPictures';
import { getUploadUrl } from '../api/files';
import VideoCard from '../components/VideoCard';
import PictureLightbox from '../components/PictureLightbox';
import './PersonDetailPage.css';

function AttributeDisplay({ schema, value }) {
  if (value === undefined || value === null || value === '') {
    return <span className="attr-empty">—</span>;
  }

  if (schema.type === 'checkbox') {
    return value ? (
      <span className="attr-checkbox checked"><CheckSquare size={15} /> Yes</span>
    ) : (
      <span className="attr-checkbox"><Square size={15} /> No</span>
    );
  }

  if (schema.type === 'dropdown') {
    return <span className="badge">{value}</span>;
  }

  if (schema.type === 'slider') {
    const min = schema.options?.min ?? 0;
    const max = schema.options?.max ?? 100;
    return (
      <div className="attr-slider-display">
        <span className="attr-slider-value">{value}</span>
        <div className="attr-slider-track">
          <div
            className="attr-slider-fill"
            style={{ width: `${Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))}%` }}
          />
        </div>
        <span className="attr-slider-range">{min}–{max}</span>
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

function AttributeEditor({ schema, value, onChange }) {
  if (schema.type === 'checkbox') {
    return (
      <label className="attr-edit-checkbox">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {schema.label}
      </label>
    );
  }

  if (schema.type === 'dropdown') {
    const items = schema.options?.items || [];
    return (
      <select
        className="form-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— none —</option>
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
      <div className="attr-edit-slider">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="attr-slider-value">{value ?? min}</span>
      </div>
    );
  }

  return null;
}

export default function PersonDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [person, setPerson] = useState(null);
  const [videos, setVideos] = useState([]);
  const [schema, setSchema] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editAttrs, setEditAttrs] = useState({});
  const [editName, setEditName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('videos');
  const [pictures, setPictures] = useState([]);
  const [picturesLoading, setPicturesLoading] = useState(false);
  const [pictureError, setPictureError] = useState('');
  const [pictureUploading, setPictureUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const pictureInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [p, vids, sch] = await Promise.all([
        getPerson(id),
        getPersonVideos(id),
        getSchema(),
      ]);
      setPerson(p);
      setVideos(vids);
      setSchema(sch.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    setEditName(person.name);
    setEditAttrs(person.attributes ? { ...person.attributes } : {});
    setSaveError('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError('');
  }

  async function handleSave() {
    setSaveError('');
    if (!editName.trim()) { setSaveError('Name is required.'); return; }
    setSaving(true);
    try {
      const updated = await updatePerson(id, {
        name: editName.trim(),
        attributes: editAttrs,
      });
      setPerson(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function setAttr(key, value) {
    setEditAttrs((prev) => ({ ...prev, [key]: value }));
  }

  async function loadPictures() {
    if (pictures.length > 0) return;
    setPicturesLoading(true);
    setPictureError('');
    try {
      const data = await getPersonPictures(id);
      setPictures(data);
    } catch (err) {
      setPictureError(err.message);
    } finally {
      setPicturesLoading(false);
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'pictures') loadPictures();
  }

  async function handlePictureUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setPictureUploading(true);
    setPictureError('');
    try {
      const fd = new FormData();
      fd.append('personId', id);
      files.forEach((f) => fd.append('pictures', f));
      const created = await uploadPersonPictures(fd);
      setPictures((prev) => [...created, ...prev]);
    } catch (err) {
      setPictureError(err.message);
    } finally {
      setPictureUploading(false);
      e.target.value = '';
    }
  }

  async function handlePictureDelete(picId) {
    if (!confirm('Delete this picture?')) return;
    try {
      await deletePersonPicture(picId);
      setPictures((prev) => prev.filter((p) => p._id !== picId));
    } catch (err) {
      setPictureError(err.message);
    }
  }

  if (loading) return <div className="spinner" aria-label="Loading" />;
  if (error) return <p className="error-message">{error}</p>;
  if (!person) return null;

  return (
    <div>
      <div className="detail-back">
        <Link to="/people" className="btn btn-ghost">
          <ChevronLeft size={16} />
          People
        </Link>
      </div>

      <div className="person-detail-header">
        <div className="person-detail-avatar">
          <UserCircle size={56} />
        </div>
        <div className="person-detail-info">
          {editing ? (
            <input
              type="text"
              className="form-input person-name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={saving}
              autoFocus
            />
          ) : (
            <h1 className="page-title">{person.name}</h1>
          )}
        </div>
        {isAdmin && !editing && (
          <button className="btn btn-secondary" onClick={startEdit}>
            <Edit2 size={14} />
            Edit
          </button>
        )}
        {isAdmin && editing && (
          <div className="person-edit-actions">
            <button className="btn btn-secondary" onClick={cancelEdit} disabled={saving}>
              <X size={14} />
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Check size={14} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {saveError && <p className="error-message" style={{ marginBottom: 16 }}>{saveError}</p>}

      {/* Attributes */}
      {schema.length > 0 && (
        <div className="person-attrs">
          <h2 className="section-title" style={{ marginBottom: 14 }}>Attributes</h2>
          <div className="person-attrs-grid">
            {schema.map((s) => (
              <div key={s._id} className="attr-row">
                <span className="attr-label">{s.label}</span>
                <div className="attr-value">
                  {editing ? (
                    <AttributeEditor
                      schema={s}
                      value={editAttrs[s.label]}
                      onChange={(v) => setAttr(s.label, v)}
                    />
                  ) : (
                    <AttributeDisplay
                      schema={s}
                      value={person.attributes?.[s.label]}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="person-tabs">
        <button
          className={`person-tab${activeTab === 'videos' ? ' person-tab--active' : ''}`}
          onClick={() => handleTabChange('videos')}
        >
          Videos ({videos.length})
        </button>
        <button
          className={`person-tab${activeTab === 'pictures' ? ' person-tab--active' : ''}`}
          onClick={() => handleTabChange('pictures')}
        >
          Pictures {pictures.length > 0 ? `(${pictures.length})` : ''}
        </button>
      </div>

      {activeTab === 'videos' && (
        <div className="person-tab-content">
          {videos.length === 0 ? (
            <p className="empty-state">This person does not appear in any videos.</p>
          ) : (
            <div className="card-grid">
              {videos.map((v) => (
                <VideoCard key={v._id} video={v} isAdmin={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pictures' && (
        <div className="person-tab-content">
          {isAdmin && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="btn btn-primary"
                onClick={() => pictureInputRef.current?.click()}
                disabled={pictureUploading}
              >
                <ImagePlus size={16} />
                {pictureUploading ? 'Uploading…' : 'Add Photos'}
              </button>
              <input
                ref={pictureInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handlePictureUpload}
              />
            </div>
          )}
          {pictureError && <p className="error-message" style={{ marginBottom: 12 }}>{pictureError}</p>}
          {picturesLoading ? (
            <div className="spinner" aria-label="Loading" />
          ) : pictures.length === 0 ? (
            <p className="empty-state">No pictures yet.{isAdmin ? ' Add some above.' : ''}</p>
          ) : (
            <div className="picture-grid">
              {pictures.map((pic, i) => (
                <div
                  key={pic._id}
                  className="picture-cell"
                  onClick={() => setLightboxIndex(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View picture ${i + 1}`}
                  onKeyDown={(e) => e.key === 'Enter' && setLightboxIndex(i)}
                >
                  <img
                    src={getUploadUrl(pic.url)}
                    alt=""
                    className="picture-cell__img"
                  />
                  {isAdmin && (
                    <button
                      className="picture-cell__delete"
                      onClick={(e) => { e.stopPropagation(); handlePictureDelete(pic._id); }}
                      aria-label="Delete picture"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <PictureLightbox
          pictures={pictures}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
