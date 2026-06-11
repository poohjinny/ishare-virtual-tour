import { useEffect, useState } from 'react';
import './LoadProgressBar.css';

interface LoadProgressBarProps {
  progress: number;
  visible: boolean;
}

export function LoadProgressBar({ progress, visible }: LoadProgressBarProps) {
  const [mounted, setMounted] = useState(visible);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setExiting(false);
      return;
    }

    if (!mounted) return;

    setExiting(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [visible, mounted]);

  if (!mounted) return null;

  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`load-progress${exiting ? ' load-progress--exit' : ''}`}
      role='progressbar'
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label='Loading panorama'
    >
      <div className='load-progress__bar' style={{ width: `${clamped}%` }} />
    </div>
  );
}
