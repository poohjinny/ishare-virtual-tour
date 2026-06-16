import { useCallback, useEffect, useState } from 'react';
import { VIRTUAL_TOUR_GUIDE_AVATAR } from '../../constants/branding';

interface GuideAvatarImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
}

export function GuideAvatarImage({
  src,
  onError,
  ...props
}: GuideAvatarImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  const handleError: React.ReactEventHandler<HTMLImageElement> = useCallback(
    (event) => {
      setResolvedSrc((current) =>
        current === VIRTUAL_TOUR_GUIDE_AVATAR ?
          current
        : VIRTUAL_TOUR_GUIDE_AVATAR,
      );
      onError?.(event);
    },
    [onError],
  );

  return <img {...props} src={resolvedSrc} onError={handleError} />;
}
