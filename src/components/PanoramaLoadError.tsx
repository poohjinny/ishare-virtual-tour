import './PanoramaLoadError.css';

interface PanoramaLoadErrorProps {
  sceneTitle?: string;
  canGoHome: boolean;
  onRetry: () => void;
  onGoHome?: () => void;
}

const ERROR_ICON = (
  <svg
    className='panorama-load-error__icon'
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

export function PanoramaLoadError({
  sceneTitle,
  canGoHome,
  onRetry,
  onGoHome,
}: PanoramaLoadErrorProps) {
  return (
    <div className='panorama-load-error' role='alert' aria-live='assertive'>
      <div className='panorama-load-error__card'>
        <div className='panorama-load-error__icon-wrap'>{ERROR_ICON}</div>
        <h2 className='panorama-load-error__title'>Could not load this view</h2>
        <p className='panorama-load-error__body'>
          {sceneTitle ?
            <>
              <span className='panorama-load-error__scene'>{sceneTitle}</span>
              {" didn't load. Check your connection and try again."}
            </>
          : "The panorama didn't load. Check your connection and try again."}
        </p>
        <div className='panorama-load-error__actions'>
          <button
            type='button'
            className='panorama-load-error__cta'
            onClick={onRetry}
          >
            Try again
          </button>
          {canGoHome && onGoHome && (
            <button
              type='button'
              className='panorama-load-error__cta panorama-load-error__cta--secondary'
              onClick={onGoHome}
            >
              Back to overview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
