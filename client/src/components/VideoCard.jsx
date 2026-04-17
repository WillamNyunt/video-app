import { Play, Trash2, Pencil } from 'lucide-react';
import { getUploadUrl } from '../api/files';
import './VideoCard.css';

export default function VideoCard({ video, people = [], isAdmin, onDelete, onClick, onEdit }) {
  const thumbnailSrc = getUploadUrl(video.thumbnailUrl);

  function handleDelete(e) {
    e.stopPropagation();
    if (onDelete) onDelete(video._id);
  }

  function handleEdit(e) {
    e.stopPropagation();
    if (onEdit) onEdit(video);
  }

  return (
    <div className="video-card" onClick={onClick}>
      {thumbnailSrc ? (
        <img src={thumbnailSrc} alt={video.title} className="video-card__thumbnail" />
      ) : (
        <div className="video-card__thumbnail-placeholder" />
      )}

      <div className="video-card__gradient" />

      <div className="video-card__play-icon">
        <Play size={36} fill="white" color="white" />
      </div>

      <div className="video-card__bottom">
        {people.length > 0 && (
          <div className="video-card__people">
            {people.slice(0, 2).map((p) => (
              <span key={p._id} className="video-card__person-chip">{p.name}</span>
            ))}
            {people.length > 2 && (
              <span className="video-card__person-chip video-card__person-chip--more">
                +{people.length - 2}
              </span>
            )}
          </div>
        )}
        {video.timestamp && (
          <span className="video-card__timestamp">{video.timestamp}</span>
        )}
        <p className="video-card__title">{video.title}</p>
      </div>

      {isAdmin && onEdit && (
        <button
          className="video-card__edit"
          onClick={handleEdit}
          title="Edit video"
          aria-label="Edit video"
        >
          <Pencil size={13} />
        </button>
      )}

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
