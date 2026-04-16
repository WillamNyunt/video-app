import { Play, Trash2 } from 'lucide-react';
import { getUploadUrl } from '../api/files';
import './VideoCard.css';

export default function VideoCard({ video, people = [], isAdmin, onDelete, onClick }) {
  const thumbnailSrc = getUploadUrl(video.thumbnailUrl);

  function handleDelete(e) {
    e.stopPropagation();
    if (onDelete) onDelete(video._id);
  }

  return (
    <div className="video-card" onClick={onClick}>
      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt={video.title}
          className="video-card__thumbnail"
        />
      ) : (
        <div className="video-card__thumbnail-placeholder" />
      )}

      <div className="video-card__gradient" />

      <div className="video-card__play-icon">
        <Play size={36} fill="white" color="white" />
      </div>

      <p className="video-card__title">{video.title}</p>

      {isAdmin && onDelete && (
        <button
          className="video-card__delete"
          onClick={handleDelete}
          title="Delete video"
          aria-label="Delete video"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
