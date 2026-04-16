import { Clock, HardDrive, Timer, Play } from 'lucide-react';
import { getVideoFileUrl } from '../api/videos';
import PersonChip from './PersonChip';
import './VideoCard.css';

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function VideoCard({ video, people = [], onDelete, isAdmin }) {
  const fileUrl = getVideoFileUrl(video._id);

  return (
    <div className="video-card">
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="video-card__thumbnail-link"
        aria-label={`Play ${video.title}`}
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="video-card__thumbnail"
          />
        ) : (
          <div className="video-card__thumbnail-placeholder">
            <Play size={28} />
          </div>
        )}
        <div className="video-card__play-overlay">
          <Play size={20} />
        </div>
      </a>

      <div className="video-card__body">
        <h3 className="video-card__title">{video.title}</h3>

        <div className="video-card__meta">
          {video.timestamp && (
            <span className="video-card__meta-item">
              <Clock size={13} />
              {video.timestamp}
            </span>
          )}
          {video.durationSeconds != null && (
            <span className="video-card__meta-item">
              <Timer size={13} />
              {formatDuration(video.durationSeconds)}
            </span>
          )}
          {video.fileSizeBytes != null && (
            <span className="video-card__meta-item">
              <HardDrive size={13} />
              {formatFileSize(video.fileSizeBytes)}
            </span>
          )}
        </div>

        {people.length > 0 && (
          <div className="video-card__people">
            {people.map((p) => (
              <PersonChip key={p._id} person={p} />
            ))}
          </div>
        )}
      </div>

      {isAdmin && onDelete && (
        <div className="video-card__actions">
          <button
            className="btn-icon danger"
            onClick={() => onDelete(video._id)}
            title="Delete video"
            aria-label="Delete video"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
