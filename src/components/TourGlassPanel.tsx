import type { ReactNode } from 'react';
import { BADGE_CLASS } from './ui/badgeClasses';
import './TourGlassPanel.css';

export type TourGlassPanelVariant = 'anchored' | 'dock';
export type TourGlassPanelAnimation = 'enter' | 'exit' | 'none';

export function GlassPanelCloseIcon() {
  return (
    <svg
      className='tour-glass-panel__close-icon'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M5 5L15 15M15 5L5 15'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
      />
    </svg>
  );
}

export function GlassPanelInfoBadge() {
  return (
    <span className={BADGE_CLASS.fillLgAccentIcon}>
      <svg
        className={BADGE_CLASS.icon}
        viewBox='0 0 24 24'
        fill='none'
        aria-hidden='true'
      >
        <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' />
        <path
          d='M12 11v5'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <circle cx='12' cy='8' r='1.25' fill='currentColor' />
      </svg>
      <span className={BADGE_CLASS.label}>Info</span>
    </span>
  );
}

interface TourGlassPanelProps {
  title?: string;
  titleId: string;
  onClose?: () => void;
  badge?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  variant?: TourGlassPanelVariant;
  animation?: TourGlassPanelAnimation;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  role?: 'dialog';
}

function shellAnimationClass(animation: TourGlassPanelAnimation): string {
  if (animation === 'enter') return ' tour-glass-panel__shell--enter';
  if (animation === 'exit') return ' tour-glass-panel__shell--exit';
  return '';
}

export function TourGlassPanel({
  title,
  titleId,
  onClose,
  badge,
  header,
  footer,
  variant = 'dock',
  animation = 'none',
  className = '',
  bodyClassName = '',
  children,
  role = 'dialog',
}: TourGlassPanelProps) {
  const variantClass =
    variant === 'anchored' ?
      'tour-glass-panel tour-glass-panel--anchored'
    : 'tour-glass-panel tour-glass-panel--dock';

  return (
    <article
      className={`${variantClass}${className ? ` ${className}` : ''}`}
      role={role}
      aria-labelledby={titleId}
    >
      <div
        className={`tour-glass-panel__shell${shellAnimationClass(animation)}`}
      >
        <header className='tour-glass-panel__header'>
          {header ?? (
            <>
              <div className='tour-glass-panel__title-row'>
                <div className='tour-glass-panel__header-leading'>
                  {title ?
                    <h2 id={titleId} className='tour-glass-panel__title'>
                      {title}
                    </h2>
                  : null}
                  {badge}
                </div>
                {onClose && (
                  <div className='tour-glass-panel__title-actions'>
                    <button
                      type='button'
                      className='tour-glass-panel__close'
                      onClick={onClose}
                      aria-label='Close'
                    >
                      <GlassPanelCloseIcon />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </header>
        <div
          className={`tour-glass-panel__body ishare-scrollbar${bodyClassName ? ` ${bodyClassName}` : ''}`}
        >
          {children}
        </div>
        {footer}
      </div>
    </article>
  );
}
