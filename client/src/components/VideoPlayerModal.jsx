import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getVideoFileUrl } from '../api/videos';
import './VideoPlayerModal.css';

export default function VideoPlayerModal({ videos, startIndex, personVideoMap = {}, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const animating = useRef(false);

  const video = videos[currentIndex];

  function navigate(dir) {
    if (animating.current) return;
    if (dir === 'next' && currentIndex >= videos.length - 1) return;
    if (dir === 'prev' && currentIndex <= 0) return;

    animating.current = true;
    setCurrentIndex((prev) => (dir === 'next' ? prev + 1 : prev - 1));

    setTimeout(() => { animating.current = false; }, 350);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { navigate('next'); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { navigate('prev'); return; }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const people = (video.people || [])
    .map((pid) => {
      const id = typeof pid === 'object' ? pid._id : pid;
      return personVideoMap?.[id];
    })
    .filter(Boolean);

  return (
    <div className="vplayer-overlay" onClick={handleOverlayClick}>
      <div className="vplayer-counter">{currentIndex + 1} / {videos.length}</div>

      <button className="vplayer-close" onClick={onClose} aria-label="Close player">
        <X size={20} />
      </button>

      <div
        key={currentIndex}
        className="vplayer-slide"
      >
        <video
          key={video._id}
          className="vplayer-video"
          src={getVideoFileUrl(video._id)}
          controls
          autoPlay
          playsInline
        />
        <div className="vplayer-info-gradient" />
        {people.length > 0 && (
          <div className="vplayer-people">
            {people.map((p) => (
              <Link
                key={p._id}
                to={`/people/${p._id}`}
                className="vplayer-person-chip"
                onClick={(e) => e.stopPropagation()}
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}
        <p className="vplayer-title">{video.title}</p>
      </div>

      <button
        className="vplayer-nav vplayer-nav--left"
        onClick={() => navigate('prev')}
        disabled={currentIndex === 0}
        aria-label="Previous video"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        className="vplayer-nav vplayer-nav--right"
        onClick={() => navigate('next')}
        disabled={currentIndex === videos.length - 1}
        aria-label="Next video"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
