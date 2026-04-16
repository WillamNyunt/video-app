import { useEffect, useRef, useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { getVideoFileUrl } from '../api/videos';
import './VideoPlayerModal.css';

export default function VideoPlayerModal({ videos, startIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [direction, setDirection] = useState(null);
  const animating = useRef(false);

  const video = videos[currentIndex];

  function navigate(dir) {
    if (animating.current) return;
    if (dir === 'next' && currentIndex >= videos.length - 1) return;
    if (dir === 'prev' && currentIndex <= 0) return;

    animating.current = true;
    setDirection(dir);
    setCurrentIndex((prev) => (dir === 'next' ? prev + 1 : prev - 1));

    setTimeout(() => {
      animating.current = false;
    }, 350);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { navigate('next'); return; }
      if (e.key === 'ArrowUp') { navigate('prev'); return; }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  useEffect(() => {
    function handleWheel(e) {
      if (e.deltaY > 0) navigate('next');
      else if (e.deltaY < 0) navigate('prev');
    }
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentIndex]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="vplayer-overlay" onClick={handleOverlayClick}>
      <div className="vplayer-counter">{currentIndex + 1} / {videos.length}</div>

      <button className="vplayer-close" onClick={onClose} aria-label="Close player">
        <X size={20} />
      </button>

      <button
        className="vplayer-nav vplayer-nav--up"
        onClick={() => navigate('prev')}
        disabled={currentIndex === 0}
        aria-label="Previous video"
      >
        <ChevronUp size={22} />
      </button>

      <div
        key={currentIndex}
        className={`vplayer-slide${direction ? ` vplayer-slide--${direction}` : ''}`}
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
        <p className="vplayer-title">{video.title}</p>
      </div>

      <button
        className="vplayer-nav vplayer-nav--down"
        onClick={() => navigate('next')}
        disabled={currentIndex === videos.length - 1}
        aria-label="Next video"
      >
        <ChevronDown size={22} />
      </button>
    </div>
  );
}
