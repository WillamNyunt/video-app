import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Plus, Trash2, Calendar } from 'lucide-react';
import { getLocation } from '../api/locations';
import { getSessions, createSession, deleteSession } from '../api/sessions';
import { useAuth } from '../context/AuthContext';
import './LocationDetailPage.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function LocationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [loc, sess] = await Promise.all([
        getLocation(id),
        getSessions(id),
      ]);
      setLocation(loc);
      setSessions(sess);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!date) { setFormError('Date is required.'); return; }
    if (!time) { setFormError('Time is required.'); return; }
    setSubmitting(true);
    try {
      const newSession = await createSession({ locationId: id, date, time });
      setSessions((prev) => [newSession, ...prev]);
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(e, sessionId) {
    e.stopPropagation();
    setDeleteError('');
    if (!confirm('Delete this session and all its videos?')) return;
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  function closeModal() {
    setShowModal(false);
    setDate('');
    setTime('');
    setFormError('');
  }

  if (loading) return <div className="spinner" aria-label="Loading" />;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div className="detail-back">
        <Link to="/" className="btn btn-ghost">
          <ChevronLeft size={16} />
          Locations
        </Link>
      </div>

      {location && (
        <div className="location-detail-header">
          {location.pictureUrl && (
            <img
              src={location.pictureUrl}
              alt={location.address}
              className="location-detail-image"
            />
          )}
          <div className="location-detail-info">
            <MapPin size={18} className="location-detail-icon" />
            <h1 className="page-title">{location.address}</h1>
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: 28 }}>
        <h2 className="section-title">Sessions ({sessions.length})</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Session
          </button>
        )}
      </div>

      {deleteError && <p className="error-message">{deleteError}</p>}

      {sessions.length === 0 ? (
        <p className="empty-state">No sessions yet. {isAdmin && 'Add one above.'}</p>
      ) : (
        <div className="sessions-list">
          {sessions.map((s) => (
            <div
              key={s._id}
              className="session-row"
              onClick={() => navigate(`/sessions/${s._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/sessions/${s._id}`)}
            >
              <Calendar size={16} className="session-row__icon" />
              <div className="session-row__info">
                <span className="session-row__date">{formatDate(s.date)}</span>
                <span className="session-row__time">{s.time}</span>
              </div>
              {isAdmin && (
                <button
                  className="btn-icon danger"
                  onClick={(e) => handleDelete(e, s._id)}
                  title="Delete session"
                  aria-label="Delete session"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Session</h2>
            {formError && <p className="error-message" style={{ marginBottom: 16 }}>{formError}</p>}
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: 4 }}>
                <label className="form-label">Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
