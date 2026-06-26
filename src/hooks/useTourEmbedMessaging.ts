import { useEffect, useRef } from 'react';

import { postTourEmbedMessage } from '../constants/tourEmbed';

interface UseTourEmbedMessagingOptions {
  embed: boolean;
  tourId: string | undefined;
  sceneId: string;
  /** First panorama reveal — splash done and viewer interactive. */
  ready: boolean;
  activeNamingHotspotId: string | null;
}

/** Notify the parent iframe host about tour lifecycle (analytics, resize). */
export function useTourEmbedMessaging({
  embed,
  tourId,
  sceneId,
  ready,
  activeNamingHotspotId,
}: UseTourEmbedMessagingOptions) {
  const readySentRef = useRef(false);

  useEffect(() => {
    if (!embed || !tourId || !ready) return;
    if (readySentRef.current) return;
    readySentRef.current = true;
    postTourEmbedMessage({ type: 'tour:ready', tourId, sceneId });
  }, [embed, ready, sceneId, tourId]);

  useEffect(() => {
    if (!embed || !tourId || !readySentRef.current) return;
    postTourEmbedMessage({
      type: 'tour:scene',
      tourId,
      sceneId,
      namingHotspotId: activeNamingHotspotId,
    });
  }, [activeNamingHotspotId, embed, sceneId, tourId]);

  useEffect(() => {
    if (!embed || !tourId) return;

    const postHeight = () => {
      postTourEmbedMessage({
        type: 'tour:resize',
        tourId,
        height: document.documentElement.clientHeight,
      });
    };

    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [embed, tourId]);
}
