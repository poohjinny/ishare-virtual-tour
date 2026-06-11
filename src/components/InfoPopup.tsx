import { useEffect } from 'react';
import type { PopupContent } from '../types/tour';
import './InfoPopup.css';

interface InfoPopupProps {
  popup: PopupContent | null;
  onClose: () => void;
}

export function InfoPopup({ popup, onClose }: InfoPopupProps) {
  useEffect(() => {
    if (!popup) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [popup, onClose]);

  if (!popup) return null;

  return (
    <div
      className='info-popup-backdrop'
      role='dialog'
      aria-modal='true'
      aria-labelledby='info-popup-title'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className='info-popup'>
        <button
          type='button'
          className='info-popup__close'
          onClick={onClose}
          aria-label='Close'
        >
          ×
        </button>
        {popup.image && (
          <img src={popup.image} alt='' className='info-popup__image' />
        )}
        <h2 id='info-popup-title' className='info-popup__title'>
          {popup.title}
        </h2>
        <p className='info-popup__body'>{popup.body}</p>
      </div>
    </div>
  );
}
