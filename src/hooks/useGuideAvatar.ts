import { useEffect, useState } from 'react';
import { VIRTUAL_TOUR_GUIDE_AVATAR } from '../constants/branding';
import type { Tour } from '../types/tour';
import { resolveGuideAvatarUrl } from '../utils/clientGuideAvatar';

export function useGuideAvatar(tour: Pick<Tour, 'id' | 'clientId'>): string {
  const [avatarUrl, setAvatarUrl] = useState(VIRTUAL_TOUR_GUIDE_AVATAR);

  useEffect(() => {
    let cancelled = false;
    setAvatarUrl(VIRTUAL_TOUR_GUIDE_AVATAR);

    void resolveGuideAvatarUrl(tour).then((url) => {
      if (!cancelled) {
        setAvatarUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [tour.id, tour.clientId]);

  return avatarUrl;
}
