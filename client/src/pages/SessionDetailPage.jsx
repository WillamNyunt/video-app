import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Search, ArrowUpDown } from 'lucide-react';
import { getSession } from '../api/sessions';
import { getVideos, createVideo, deleteVideo } from '../api/videos';
import { getPeople } from '../api/people';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import './SessionDetailPage.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

const SORT_OPTIONS = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'title', label: 'Title' },
  { value: 'fileSize', label: 'File Size' },
  { value: 'duration', label: 'Duration' },
];

export default function SessionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [session, setSession] = useState(null);
  const [videos, setVideos] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  // personId → person object map for quick lookup
  const [personVideoMap, setPersonVideoMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Client-side filter/sort state
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(true);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTimestamp, setUploadTimestamp] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadThumbnail, setUploadThumbnail] = useState(null);

  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [sess, vids, people] = await Promise.all([
        getSession(id),
        getVideos(id),
        getPeople(),
      ]);
      setSession(sess);
      setVideos(vids);
      setAllPeople(people);
      // Build a map of videoId → [person, ...]
      // We'll use people's video associations (fetched separately via video's people field if available)
      // Or we keep allPeople and filter by video._id if person-video data is embedded
      const pmap = {};
      people.forEach((p) => pmap[p._id] = p);
      setPersonVideoMap(pmap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Get people chips for a video
  // The API may return video.people as an array of personIds
  function getPeopleForVideo(video) {
    if (!video.people || !Array.isArray(video.people)) return [];
    return video.people.map((pid) => {
      const p = personVideoMap[pid] || personVideoMap[pid?._id];
      return p || (typeof pid === 'object' ? pid : null);
    }).filter(Boolean);
  }

  // Client-side filter + sort (no API calls)
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // Filter by title text
    if (filterText.trim()) {
      const lower = filterText.toLowerCase();
      result = result.filter((v) =>
        v.title.toLowerCase().includes(lower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'title':
          valA = (a.title || '').toLowerCase();
          valB = (b.title || '').toLowerCase();
          break;
        case 'fileSize':
          valA = a.fileSizeBytes ?? -1;
          valB = b.fileSizeBytes ?? -1;
          break;
        case 'duration':
          valA = a.durationSeconds ?? -1;
          valB = b.durationSeconds ?? -1;
          break;
        case 'timestamp':
        default:
          valA = a.timestamp || '';
          valB = b.timestamp || '';
          break;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [videos, filterText, sortBy, sortAsc]);

  function toggleSort(field) {
    if (sortBy === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setUploadError('');
    if (!uploadTitle.trim()) { setUploadError('Title is required.'); return; }
    if (!uploadFile) { setUploadError('Video file is required.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('sessionId', id);
      fd.append('title', uploadTitle.trim());
      if (uploadTimestamp.trim()) fd.append('timestamp', uploadTimestamp.trim());
      fd.append('file', uploadFile);
      if (uploadThumbnail) fd.append('thumbnail', uploadThumbnail);
      const newVideo = await createVideo(fd);
      setVideos((prev) => [newVideo, ...prev]);
      closeUpload();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(videoId) {
    setDeleteError('');
    if (!confirm('Delete this video?')) return;
    try {
      await deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  function closeUpload() {
    setShowUpload(false);
    setUploadTitle('');
    setUploadTimestamp('');
    setUploadFile(null);
    setUploadThumbnail(null);
    setUploadError('');
  }

  if (loading) return <div className="spinner" aria-label="Loading" />;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div className="detail-back">
        <Link
          to={session?.locationId ? `/locations/${session.locationId}` : '/'}
          className="btn btn-ghost"
        >
          <ChevronLeft size={16} />
          Location
        </Link>
      </div>

      {session && (
        <div className="session-detail-header">
          <h1 className="page-title">
            {formatDate(session.date)} — {session.time}
          </h1>
        </div>
      )}

      {/* Filter + Sort Controls */}
      <div className="session-controls">
        <div className="session-search">
          <Search size={15} className="session-search__icon" />
          <input
            type="text"
            className="form-input session-search__input"
            placeholder="Filter videos by title..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <div className="session-sort">
          <span className="session-sort__label">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`session-sort__btn${sortBy === opt.value ? ' active' : ''}`}
              onClick={() => toggleSort(opt.value)}
            >
              {opt.label}
              {sortBy === opt.value && (
                <ArrowUpDown size={12} className={`sort-icon${sortAsc ? ' asc' : ' desc'}`} />
              )}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={16} />
            Upload Video
          </button>
        )}
      </div>

      {deleteError && <p className="error-message" style={{ marginBottom: 12 }}>{deleteError}</p>}

      {filteredVideos.length === 0 ? (
        <p className="empty-state">
          {filterText ? 'No videos match your filter.' : 'No videos in this session.'}
          {!filterText && isAdmin && ' Upload one above.'}
        </p>
      ) : (
        <div className="card-grid">
          {filteredVideos.map((v) => (
            <VideoCard
              key={v._id}
              video={v}
              people={getPeopleForVideo(v)}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showUpload && (
        <div className="modal-overlay" onClick={closeUpload}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Upload Video</h2>
            {uploadError && <p className="error-message" style={{ marginBottom: 16 }}>{uploadError}</p>}
            <form onSubmit={handleUpload}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  disabled={uploading}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Timestamp (e.g. 00:04:32)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00:00:00"
                  value={uploadTimestamp}
                  onChange={(e) => setUploadTimestamp(e.target.value)}
                  disabled={uploading}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Video File *</label>
                <input
                  type="file"
                  accept="video/*"
                  className="form-input"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  disabled={uploading}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 4 }}>
                <label className="form-label">Thumbnail (image)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setUploadThumbnail(e.target.files[0])}
                  disabled={uploading}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeUpload} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
