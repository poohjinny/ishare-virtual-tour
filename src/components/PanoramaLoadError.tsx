import { TourErrorState } from './TourErrorState';

interface PanoramaLoadErrorProps {
  sceneTitle?: string;
  canGoHome: boolean;
  onRetry: () => void;
  onGoHome?: () => void;
}

export function PanoramaLoadError({
  sceneTitle,
  canGoHome,
  onRetry,
  onGoHome,
}: PanoramaLoadErrorProps) {
  return (
    <TourErrorState
      title='Could not load this view'
      body={
        sceneTitle ?
          <>
            <span className='tour-error-state__emphasis'>{sceneTitle}</span>
            {" didn't load. Check your connection and try again."}
          </>
        : "The panorama didn't load. Check your connection and try again."
      }
      primaryAction={{ label: 'Try again', onClick: onRetry }}
      secondaryAction={
        canGoHome && onGoHome ?
          { label: 'Back to overview', onClick: onGoHome }
        : undefined
      }
    />
  );
}
