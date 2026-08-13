import { devViewPanelPanoramaPreviewImageClassName } from './devViewPanelVariants';
import { DevLocalFilePreview } from './DevLocalFilePreview';

interface DevPanoramaFilePreviewProps {
  file: File | null;
}

export function DevPanoramaFilePreview({ file }: DevPanoramaFilePreviewProps) {
  return (
    <DevLocalFilePreview
      file={file}
      className={devViewPanelPanoramaPreviewImageClassName}
      alt='Panorama preview'
    />
  );
}
