import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { getLocations, createLocation, deleteLocation } from '../api/locations';
import { useAuth } from '../context/AuthContext';
import './LocationsPage.css';

export default function LocationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Form state
  const [address, setAddress] = useState('');
  const [pictureFile, setPictureFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    setLoading(true);
    setError('');
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!address.trim()) {
      setFormError('Address is required.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('address', address.trim());
      if (pictureFile) fd.append('picture', pictureFile);
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile);
      const newLoc = await createLocation(fd);
      setLocations((prev) => [newLoc, ...prev]);
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    setDeleteError('');
    if (!confirm('Delete this location and all its sessions?')) return;
    try {
      await deleteLocation(id);
      setLocations((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  function closeModal() {
    setShowModal(false);
    setAddress('');
    setPictureFile(null);
    setThumbnailFile(null);
    setFormError('');
  }

  if (loading) return <div className="spinner" aria-label="Loading" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <MapPin size={20} />
          Locations
        </h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Location
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}
      {deleteError && <p className="error-message">{deleteError}</p>}

      {locations.length === 0 && !error ? (
        <p className="empty-state">No locations yet. {isAdmin && 'Add one above.'}</p>
      ) : (
        <div className="card-grid">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="location-card"
              onClick={() => navigate(`/locations/${loc._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/locations/${loc._id}`)}
            >
              <div className="location-card__thumbnail">
                {loc.thumbnailUrl ? (
                  <img src={loc.thumbnailUrl} alt={loc.address} />
                ) : (
                  <div className="location-card__placeholder">
                    <MapPin size={28} />
                  </div>
                )}
              </div>
              <div className="location-card__body">
                <p className="location-card__address">{loc.address}</p>
                {isAdmin && (
                  <button
                    className="btn-icon danger location-card__delete"
                    onClick={(e) => handleDelete(e, loc._id)}
                    title="Delete location"
                    aria-label="Delete location"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Location</h2>
            {formError && <p className="error-message" style={{ marginBottom: 16 }}>{formError}</p>}
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Address *</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setPictureFile(e.target.files[0])}
                  disabled={submitting}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 4 }}>
                <label className="form-label">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setThumbnailFile(e.target.files[0])}
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
