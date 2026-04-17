import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUploadUrl } from '../api/files';
import './PictureLightbox.css';

export default function PictureLightbox({ pictures, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const throttle = useRef(false);

  const pic = pictures[index];

  function navigate(dir) {
    if (throttle.current) return;
    if (dir === 'next' && index >= pictures.length - 1) return;
    if (dir === 'prev' && index <= 0) return;
    throttle.current = true;
    setIndex((i) => (dir === 'next' ? i + 1 : i - 1));
    setTimeout(() => { throttle.current = false; }, 150);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight') { navigate('next'); return; }
      if (e.key === 'ArrowLeft')  { navigate('prev'); return; }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="lightbox-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Picture viewer"
    >
      <span className="lightbox-counter" aria-live="polite">
        {index + 1} / {pictures.length}
      </span>

      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <X size={20} />
      </button>

      <button
        className="lightbox-nav lightbox-nav--left"
        onClick={() => navigate('prev')}
        disabled={index === 0}
        aria-label="Previous picture"
      >
        <ChevronLeft size={24} />
      </button>

      <img
        key={pic._id}
        src={getUploadUrl(pic.url)}
        alt={`Picture ${index + 1}`}
        className="lightbox-img"
      />

      <button
        className="lightbox-nav lightbox-nav--right"
        onClick={() => navigate('next')}
        disabled={index === pictures.length - 1}
        aria-label="Next picture"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
