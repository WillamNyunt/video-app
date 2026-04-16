import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2, UserCircle } from 'lucide-react';
import { getPeople, createPerson, deletePerson } from '../api/people';
import { useAuth } from '../context/AuthContext';
import './PeoplePage.css';

export default function PeoplePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchPeople();
  }, []);

  async function fetchPeople() {
    setLoading(true);
    setError('');
    try {
      const data = await getPeople();
      setPeople(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError('Name is required.'); return; }
    setSubmitting(true);
    try {
      const newPerson = await createPerson({ name: name.trim() });
      setPeople((prev) => [newPerson, ...prev]);
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(e, personId) {
    e.stopPropagation();
    setDeleteError('');
    if (!confirm('Delete this person?')) return;
    try {
      await deletePerson(personId);
      setPeople((prev) => prev.filter((p) => p._id !== personId));
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  function closeModal() {
    setShowModal(false);
    setName('');
    setFormError('');
  }

  if (loading) return <div className="spinner" aria-label="Loading" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Users size={20} />
          People
        </h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Person
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}
      {deleteError && <p className="error-message">{deleteError}</p>}

      {people.length === 0 && !error ? (
        <p className="empty-state">No people yet. {isAdmin && 'Add one above.'}</p>
      ) : (
        <div className="card-grid">
          {people.map((person) => (
            <div
              key={person._id}
              className="person-card"
              onClick={() => navigate(`/people/${person._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/people/${person._id}`)}
            >
              <div className="person-card__avatar">
                <UserCircle size={40} />
              </div>
              <div className="person-card__body">
                <p className="person-card__name">{person.name}</p>
              </div>
              {isAdmin && (
                <button
                  className="btn-icon danger person-card__delete"
                  onClick={(e) => handleDelete(e, person._id)}
                  title="Delete person"
                  aria-label="Delete person"
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
            <h2 className="modal-title">Add Person</h2>
            {formError && <p className="error-message" style={{ marginBottom: 16 }}>{formError}</p>}
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: 4 }}>
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  autoFocus
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
