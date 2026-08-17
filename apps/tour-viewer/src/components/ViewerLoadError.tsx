import { TourErrorState, tourErrorEmphasisClassName } from './TourErrorState';

interface ViewerLoadErrorProps {
  sceneTitle?: string;
  canGoHome: boolean;
  onRetry: () => void;
  onGoHome?: () => void;
}

export function ViewerLoadError({
  sceneTitle,
  canGoHome,
  onRetry,
  onGoHome,
}: ViewerLoadErrorProps) {
  return (
    <TourErrorState
      title='Could not load this view'
      body={
        sceneTitle ?
          <>
            <span className={tourErrorEmphasisClassName}>{sceneTitle}</span>
            {" didn't load. Check your connection and try again."}
          </>
        : "This view didn't load. Check your connection and try again."
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
