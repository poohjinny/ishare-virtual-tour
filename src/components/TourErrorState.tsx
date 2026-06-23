import type { ReactNode } from 'react';
import './TourErrorState.css';

export interface TourErrorAction {
  label: string;
  onClick: () => void;
}

export interface TourErrorStateProps {
  title: string;
  body: ReactNode;
  primaryAction: TourErrorAction;
  secondaryAction?: TourErrorAction;
}

const ERROR_ICON = (
  <svg
    className='tour-error-state__icon'
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
  >
    <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='1.75' />
    <path
      d='M12 8v5'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
    />
    <circle cx='12' cy='16.25' r='1' fill='currentColor' />
  </svg>
);

export function TourErrorState({
  title,
  body,
  primaryAction,
  secondaryAction,
}: TourErrorStateProps) {
  return (
    <div className='tour-error-state' role='alert' aria-live='assertive'>
      <div className='tour-error-state__card'>
        <div className='tour-error-state__icon-wrap'>{ERROR_ICON}</div>
        <h2 className='tour-error-state__title'>{title}</h2>
        <p className='tour-error-state__body'>{body}</p>
        <div className='tour-error-state__actions'>
          <button
            type='button'
            className='tour-error-state__cta'
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </button>
          {secondaryAction && (
            <button
              type='button'
              className='tour-error-state__cta tour-error-state__cta--secondary'
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
