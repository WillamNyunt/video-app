import { useState } from 'react';
import { X } from 'lucide-react';
import { updateVideo } from '../api/videos';
import './VideoEditModal.css';

function PeopleMultiSelect({ allPeople, selectedIds, onChange }) {
  const [filter, setFilter] = useState('');
  const lower = filter.toLowerCase();
  const visible = allPeople.filter((p) => p.name.toLowerCase().includes(lower));

  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="people-multiselect">
      <input
        type="text"
        className="form-input people-multiselect__search"
        placeholder="Search people…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="people-multiselect__list">
        {visible.length === 0 && (
          <p className="people-multiselect__empty">No people found</p>
        )}
        {visible.map((p) => (
          <label key={p._id} className="people-multiselect__item">
            <input
              type="checkbox"
              checked={selectedIds.includes(p._id)}
              onChange={() => toggle(p._id)}
            />
            <span>{p.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function VideoEditModal({ video, allPeople, onSave, onClose }) {
  const [title, setTitle] = useState(video.title || '');
  const [timestamp, setTimestamp] = useState(video.timestamp || '');
  const [selectedPeople, setSelectedPeople] = useState(
    (video.people || []).map((p) => (typeof p === 'object' ? p._id : p))
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    setError('');
    setSaving(true);
    try {
      const updated = await updateVideo(video._id, {
        title: title.trim(),
        timestamp: timestamp || undefined,
        people: selectedPeople,
      });
      onSave(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal video-edit-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Video</h2>
        {error && <p className="error-message" style={{ marginBottom: 16 }}>{error}</p>}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              type="time"
              className="form-input"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              disabled={saving}
            />
          </div>
          {allPeople.length > 0 && (
            <div className="form-group">
              <label className="form-label">People</label>
              <PeopleMultiSelect
                allPeople={allPeople}
                selectedIds={selectedPeople}
                onChange={setSelectedPeople}
              />
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
