import { useEffect, useMemo, useState } from 'react';

import {
  subscribeTourEmbedDebug,
  TOUR_EMBED_MESSAGE_SOURCE,
  type TourEmbedMessagePayload,
} from '../constants/tourEmbed';
import {
  buildAbsoluteEmbedUrl,
  buildEmbedTestPageUrl,
} from '../utils/buildShareUrl';
import { cn } from '../lib/cn';
import { DevPanelFormSection } from './DevPanelFormGroup';
import {
  devViewPanelActionsClassName,
  devViewPanelBtnVariants,
  devViewPanelCoordsClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelScrollbarClassName,
  devViewPanelSectionHintClassName,
} from './devViewPanelVariants';

const MAX_EMBED_LOG_ENTRIES = 20;

interface DevPanelEmbedDebugProps {
  tourId: string;
  currentSceneId: string;
  firstSceneId: string;
}

interface EmbedLogEntry {
  at: number;
  message: TourEmbedMessagePayload;
}

function formatEmbedLogEntry(entry: EmbedLogEntry, inIframe: boolean): string {
  const time = new Date(entry.at).toLocaleTimeString();
  const payload = JSON.stringify(entry.message);
  const delivery = inIframe ? 'parent' : 'local only';
  return `${time} [${delivery}] ${payload}`;
}

export function DevPanelEmbedDebug({
  tourId,
  currentSceneId,
  firstSceneId,
}: DevPanelEmbedDebugProps) {
  const inIframe = window.parent !== window;
  const [log, setLog] = useState<EmbedLogEntry[]>([]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'done' | 'error'>(
    'idle',
  );

  const embedUrl = useMemo(
    () =>
      buildAbsoluteEmbedUrl({ tourId, sceneId: currentSceneId, firstSceneId }),
    [currentSceneId, firstSceneId, tourId],
  );

  useEffect(() => {
    return subscribeTourEmbedDebug((message) => {
      setLog((entries) =>
        [{ at: Date.now(), message }, ...entries].slice(
          0,
          MAX_EMBED_LOG_ENTRIES,
        ),
      );
    });
  }, []);

  const handleCopyEmbedUrl = async () => {
    try {
      await navigator.clipboard.writeText(embedUrl);
      setCopyStatus('done');
      window.setTimeout(() => setCopyStatus('idle'), 1600);
    } catch {
      setCopyStatus('error');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <DevPanelFormSection
      divided
      title='Embed'
      description='Navigate the tour to exercise postMessage.'
    >
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1.5'>
          <span className={devViewPanelFieldLabelClassName}>In iframe</span>
          <p className={devViewPanelCoordsClassName}>
            {inIframe ? 'yes — parent receives postMessage' : 'no — log only'}
          </p>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className={devViewPanelFieldLabelClassName}>
            Message source
          </span>
          <p className={devViewPanelCoordsClassName}>
            <code>{TOUR_EMBED_MESSAGE_SOURCE}</code>
          </p>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className={devViewPanelFieldLabelClassName}>Embed URL</span>
          <p className={devViewPanelCoordsClassName}>{embedUrl}</p>
          <div className={devViewPanelActionsClassName}>
            <button
              type='button'
              className={devViewPanelBtnVariants({ tone: 'secondary' })}
              onClick={() => void handleCopyEmbedUrl()}
            >
              {copyStatus === 'done' ?
                'Copied'
              : copyStatus === 'error' ?
                'Copy failed'
              : 'Copy URL'}
            </button>
            <button
              type='button'
              className={devViewPanelBtnVariants({ tone: 'primary' })}
              onClick={() => {
                window.open(
                  buildEmbedTestPageUrl({
                    tourId,
                    sceneId: currentSceneId,
                    dev: true,
                  }),
                  '_blank',
                  'noopener,noreferrer',
                );
              }}
            >
              Open iframe test
            </button>
          </div>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className={devViewPanelFieldLabelClassName}>
            postMessage log
          </span>
          {log.length === 0 ?
            <p className={devViewPanelSectionHintClassName}>
              Waiting for tour:ready / tour:scene / tour:resize…
            </p>
          : <div
              className={cn(
                'flex max-h-48 flex-col gap-2 overflow-y-auto rounded-md bg-[rgba(0,0,0,0.2)] p-1',
                devViewPanelScrollbarClassName,
              )}
            >
              {log.map((entry, index) => (
                <p
                  key={`${entry.at}-${index}`}
                  className={devViewPanelCoordsClassName}
                >
                  {formatEmbedLogEntry(entry, inIframe)}
                </p>
              ))}
            </div>
          }
        </div>
      </div>
    </DevPanelFormSection>
  );
}
