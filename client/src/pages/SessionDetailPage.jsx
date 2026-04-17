import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Search, ArrowUpDown, Pencil } from 'lucide-react';
import { getSession, updateSession } from '../api/sessions';
import { getVideos, deleteVideo } from '../api/videos';
import { getPeople } from '../api/people';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import VideoPlayerModal from '../components/VideoPlayerModal';
import VideoEditModal from '../components/VideoEditModal';
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
  // Accept HH:MM, HH.MM, or HH-MM (and optional :SS/.SS/-SS) at end of name
  const timeMatch = base.match(/_(\d{1,2}[:.\-]\d{2}(?:[:.\-]\d{2})?)$/);
  let timestamp = '';
  let title = base;
  if (timeMatch) {
    timestamp = timeMatch[1].replace(/[.\-]/g, ':');
    title = base.slice(0, base.length - timeMatch[0].length);
  }
  title = title.replace(/_/g, ' ').trim();
  return { title, timestamp };
}

export default function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [session, setSession] = useState(null);
  const [videos, setVideos] = useState([]);
  const [personVideoMap, setPersonVideoMap] = useState({});
  const [allPeople, setAllPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(true);

  const [deleteError, setDeleteError] = useState('');
  const [playerIndex, setPlayerIndex] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);

  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState('');

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
      setNotes(sess.notes || '');
      setVideos(vids);
      setAllPeople(people);
      const pmap = {};
      people.forEach((p) => { pmap[p._id] = p; });
      setPersonVideoMap(pmap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleVideoSaved(updated) {
    setVideos((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
    setEditingVideo(null);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    setNotesError('');
    try {
      const updated = await updateSession(id, { notes });
      setSession(updated);
      setNotes(updated.notes || '');
      setEditingNotes(false);
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setSavingNotes(false);
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
            {session.title ? session.title : formatDate(session.date)}
          </h1>
          {session.title && (
            <p className="session-detail-date">{formatDate(session.date)}</p>
          )}
        </div>
      )}

      <div className="session-notes">
        <div className="session-notes__header">
          <span className="session-notes__label">Notes</span>
          {isAdmin && !editingNotes && (
            <button className="btn btn-ghost session-notes__edit-btn" onClick={() => setEditingNotes(true)}>
              <Pencil size={13} />
              {notes ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        {notesError && <p className="error-message" style={{ marginBottom: 8 }}>{notesError}</p>}
        {editingNotes ? (
          <div className="session-notes__editor">
            <textarea
              className="form-input session-notes__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add session notes…"
              rows={4}
              disabled={savingNotes}
            />
            <div className="session-notes__actions">
              <button className="btn btn-secondary" onClick={() => { setEditingNotes(false); setNotes(session.notes || ''); }} disabled={savingNotes}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : notes ? (
          <p className="session-notes__text">{notes}</p>
        ) : (
          !isAdmin && <p className="session-notes__empty">No notes.</p>
        )}
      </div>

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
          <button className="btn btn-primary" onClick={() => navigate(`/sessions/${id}/upload`)}>
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
          {filteredVideos.map((v, i) => (
            <VideoCard
              key={v._id}
              video={v}
              people={getPeopleForVideo(v)}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onClick={() => setPlayerIndex(i)}
              onEdit={isAdmin ? setEditingVideo : undefined}
            />
          ))}
        </div>
      )}

      {playerIndex !== null && (
        <VideoPlayerModal
          videos={filteredVideos}
          startIndex={playerIndex}
          personVideoMap={personVideoMap}
          onClose={() => setPlayerIndex(null)}
        />
      )}

      {editingVideo && (
        <VideoEditModal
          video={editingVideo}
          allPeople={allPeople}
          onSave={handleVideoSaved}
          onClose={() => setEditingVideo(null)}
        />
      )}

    </div>
  );
}
