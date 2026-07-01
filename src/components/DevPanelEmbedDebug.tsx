import { useEffect, useMemo, useState } from 'react';

import {
  subscribeTourEmbedDebug,
  TOUR_EMBED_MESSAGE_SOURCE,
  type TourEmbedMessagePayload,
} from '../constants/tourEmbed';
import {
  buildAbsoluteEmbedUrl,
  buildEmbedIframeHtml,
  buildEmbedTestPageUrl,
} from '../utils/buildShareUrl';
import { copyToClipboard } from '../utils/clipboard';
import {
  getTourFullscreenBlockHint,
  isTourFullscreenApiEnabled,
} from '../utils/tourEmbedFullscreen';
import { cn } from '../lib/cn';
import { DevPanelFormSection } from './DevPanelFormGroup';
import {
  devViewPanelActionsClassName,
  devViewPanelBtnVariants,
  devViewPanelCoordsClassName,
  devViewPanelControlRadiusClassName,
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

type EmbedCopyTarget = 'url' | 'iframe';

type EmbedCopyState = 'idle' | 'copied' | 'failed';

function formatEmbedLogEntry(entry: EmbedLogEntry, inIframe: boolean): string {
  const time = new Date(entry.at).toLocaleTimeString();
  const payload = JSON.stringify(entry.message);
  const delivery = inIframe ? 'parent' : 'local only';
  return `${time} [${delivery}] ${payload}`;
}

function embedCopyButtonLabel(
  target: EmbedCopyTarget,
  state: EmbedCopyState,
): string {
  if (state === 'copied') return 'Copied';
  if (state === 'failed') return 'Copy failed';

  return target === 'url' ? 'Copy embed URL' : 'Copy iframe HTML';
}

export function DevPanelEmbedDebug({
  tourId,
  currentSceneId,
  firstSceneId,
}: DevPanelEmbedDebugProps) {
  const inIframe = window.parent !== window;
  const [log, setLog] = useState<EmbedLogEntry[]>([]);
  const [copyState, setCopyState] = useState<
    Record<EmbedCopyTarget, EmbedCopyState>
  >({ url: 'idle', iframe: 'idle' });

  const embedOptions = useMemo(
    () => ({ tourId, sceneId: currentSceneId, firstSceneId }),
    [currentSceneId, firstSceneId, tourId],
  );

  const embedUrl = useMemo(
    () => buildAbsoluteEmbedUrl(embedOptions),
    [embedOptions],
  );

  const embedIframeHtml = useMemo(
    () => buildEmbedIframeHtml(embedOptions),
    [embedOptions],
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

  const handleCopy = async (target: EmbedCopyTarget) => {
    const text = target === 'url' ? embedUrl : embedIframeHtml;
    const ok = await copyToClipboard(text);
    setCopyState((state) => ({ ...state, [target]: ok ? 'copied' : 'failed' }));
    window.setTimeout(
      () => setCopyState((state) => ({ ...state, [target]: 'idle' })),
      ok ? 1600 : 2000,
    );
  };

  return (
    <DevPanelFormSection
      divided
      title='Embed'
      description='Build host markup for this scene, open the iframe harness, then navigate to verify postMessage.'
    >
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1.5'>
          <span className={devViewPanelFieldLabelClassName}>In iframe</span>
          <p className={devViewPanelCoordsClassName}>
            {inIframe ? 'yes — parent receives postMessage' : 'no — log only'}
          </p>
        </div>

        {inIframe ?
          <div className='flex flex-col gap-1.5'>
            <span className={devViewPanelFieldLabelClassName}>
              Fullscreen API
            </span>
            <p className={devViewPanelCoordsClassName}>
              {isTourFullscreenApiEnabled() ?
                'enabled — control pill fullscreen should work'
              : (getTourFullscreenBlockHint() ??
                'blocked — parent iframe needs allow="fullscreen"')
              }
            </p>
          </div>
        : null}

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
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className={devViewPanelFieldLabelClassName}>Iframe HTML</span>
          <pre
            className={cn(
              devViewPanelCoordsClassName,
              'max-h-28 overflow-auto whitespace-pre-wrap break-all bg-[rgba(0,0,0,0.2)] p-2',
              devViewPanelControlRadiusClassName,
              devViewPanelScrollbarClassName,
            )}
          >
            {embedIframeHtml}
          </pre>
        </div>

        <div className={devViewPanelActionsClassName}>
          <button
            type='button'
            className={devViewPanelBtnVariants({ tone: 'secondary' })}
            onClick={() => void handleCopy('url')}
          >
            {embedCopyButtonLabel('url', copyState.url)}
          </button>
          <button
            type='button'
            className={devViewPanelBtnVariants({ tone: 'secondary' })}
            onClick={() => void handleCopy('iframe')}
          >
            {embedCopyButtonLabel('iframe', copyState.iframe)}
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
                'flex max-h-48 flex-col gap-2 overflow-y-auto bg-[rgba(0,0,0,0.2)] p-1',
                devViewPanelControlRadiusClassName,
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
