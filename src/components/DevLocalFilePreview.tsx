import { useObjectUrlPreview } from '../hooks/useObjectUrlPreview';

interface DevLocalFilePreviewProps {
  file: File | null;
  className: string;
  alt: string;
}

/** Preview for a locally chosen file only — no preview when input is empty. */
export function DevLocalFilePreview({
  file,
  className,
  alt,
}: DevLocalFilePreviewProps) {
  const previewUrl = useObjectUrlPreview(file);
  if (!previewUrl) return null;

  return <img className={className} src={previewUrl} alt={alt} />;
}
