import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, UserCircle, Edit2, Check, X, CheckSquare, Square } from 'lucide-react';
import { getPerson, getPersonVideos, updatePerson } from '../api/people';
import { getSchema } from '../api/attributeSchema';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
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

      {/* Videos */}
      <div className="person-videos">
        <h2 className="section-title" style={{ marginBottom: 16 }}>
          Videos ({videos.length})
        </h2>
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
    </div>
  );
}
