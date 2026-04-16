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

function parseFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  const timeMatch = base.match(/_(\d{1,2}:\d{2}(?::\d{2})?)$/);
  let timestamp = '';
  let title = base;
  if (timeMatch) {
    timestamp = timeMatch[1];
    title = base.slice(0, base.length - timeMatch[0].length);
  }
  title = title.replace(/_/g, ' ').trim();
  return { title, timestamp };
}

export default function SessionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [session, setSession] = useState(null);
  const [videos, setVideos] = useState([]);
  const [personVideoMap, setPersonVideoMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(true);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadItems, setUploadItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { fetchData(); }, [id]);

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
      const pmap = {};
      people.forEach((p) => { pmap[p._id] = p; });
      setPersonVideoMap(pmap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getPeopleForVideo(video) {
    if (!video.people || !Array.isArray(video.people)) return [];
    return video.people.map((pid) => {
      const p = personVideoMap[pid] || personVideoMap[pid?._id];
      return p || (typeof pid === 'object' ? pid : null);
    }).filter(Boolean);
  }

  const filteredVideos = useMemo(() => {
    let result = [...videos];
    if (filterText.trim()) {
      const lower = filterText.toLowerCase();
      result = result.filter((v) => v.title.toLowerCase().includes(lower));
    }
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
        default:
          valA = a.timestamp || '';
          valB = b.timestamp || '';
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [videos, filterText, sortBy, sortAsc]);

  function toggleSort(field) {
    if (sortBy === field) setSortAsc((prev) => !prev);
    else { setSortBy(field); setSortAsc(true); }
  }

  function handleFilesSelected(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const items = files.map((file) => {
      const { title, timestamp } = parseFilename(file.name);
      return { file, title, timestamp, thumbnailFile: null, error: null };
    });
    setUploadItems(items);
    setUploadError('');
    e.target.value = '';
  }

  function updateItem(index, field, value) {
    setUploadItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleUploadAll(e) {
    e.preventDefault();
    setUploadError('');

    const missing = uploadItems.findIndex((item) => !item.title.trim() || !item.thumbnailFile);
    if (missing !== -1) {
      setUploadError(`Item ${missing + 1}: title and thumbnail are required for all videos.`);
      return;
    }

    setUploading(true);
    const results = [];

    for (let i = 0; i < uploadItems.length; i++) {
      setUploadProgress({ current: i + 1, total: uploadItems.length });
      const item = uploadItems[i];
      try {
        const fd = new FormData();
        fd.append('sessionId', id);
        fd.append('title', item.title.trim());
        if (item.timestamp.trim()) fd.append('timestamp', item.timestamp.trim());
        fd.append('video', item.file);
        fd.append('thumbnail', item.thumbnailFile);
        const newVideo = await createVideo(fd);
        results.push({ ok: true, video: newVideo });
        setVideos((prev) => [newVideo, ...prev]);
        // Mark item as done
        setUploadItems((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], error: null, done: true };
          return next;
        });
      } catch (err) {
        results.push({ ok: false, error: err.message });
        setUploadItems((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], error: err.message };
          return next;
        });
      }
    }

    setUploading(false);
    setUploadProgress(null);

    const failed = results.filter((r) => !r.ok).length;
    if (failed === 0) {
      closeUpload();
    } else {
      setUploadError(`${failed} of ${results.length} uploads failed. See items above.`);
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
    setUploadItems([]);
    setUploading(false);
    setUploadProgress(null);
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
            Upload Videos
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
        <div className="modal-overlay" onClick={!uploading ? closeUpload : undefined}>
          <div className="modal upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Upload Videos</h2>

            {uploadItems.length === 0 ? (
              <div className="upload-drop-area">
                <p className="upload-drop-hint">Select one or more video files</p>
                <label className="btn btn-primary upload-file-label">
                  Choose Files
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFilesSelected}
                  />
                </label>
              </div>
            ) : (
              <form onSubmit={handleUploadAll}>
                {uploadError && (
                  <p className="error-message" style={{ marginBottom: 16 }}>{uploadError}</p>
                )}

                <div className="upload-items-list">
                  {uploadItems.map((item, i) => (
                    <div
                      key={i}
                      className={`upload-item${item.done ? ' upload-item--done' : ''}${item.error ? ' upload-item--error' : ''}`}
                    >
                      <p className="upload-item__filename">{item.file.name}</p>
                      {item.error && (
                        <p className="upload-item__error">{item.error}</p>
                      )}
                      <div className="upload-item__fields">
                        <div className="form-group">
                          <label className="form-label">Title *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={item.title}
                            onChange={(e) => updateItem(i, 'title', e.target.value)}
                            disabled={uploading || item.done}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Timestamp</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="HH:MM"
                            value={item.timestamp}
                            onChange={(e) => updateItem(i, 'timestamp', e.target.value)}
                            disabled={uploading || item.done}
                          />
                        </div>
                        <div className="form-group upload-item__thumb">
                          <label className="form-label">Thumbnail *</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-input"
                            onChange={(e) => updateItem(i, 'thumbnailFile', e.target.files[0] || null)}
                            disabled={uploading || item.done}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeUpload}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading
                      ? `Uploading ${uploadProgress?.current} / ${uploadProgress?.total}...`
                      : `Upload ${uploadItems.length} Video${uploadItems.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
