import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { DEV_SHELL_TOUR_ID } from '../constants/devPanel';
import {
  parseTourEmbedMessage,
  type TourEmbedMessage,
} from '../constants/tourEmbed';
import { tryLoadTour } from '../data/loadTour';
import { resolveSceneId, resolveTourRoute } from '../utils/tourPaths';
import {
  buildAbsoluteEmbedUrl,
  buildEmbedIframeHtml,
} from '../utils/buildShareUrl';
import { copyToClipboard } from '../utils/clipboard';
import {
  MATERIAL_SYMBOL_SIZE_14,
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from './ui/materialSymbolClasses';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { DevViewportPreviewShell } from './DevViewportPreviewShell';
import {
  buildDevDevicePreviewSrc,
  formatDevDeviceChromeUrl,
} from '../utils/devDevicePreview';
import {
  bumpDevDevicePreviewReload,
  setDevPanelDeviceResponsiveSize,
  setDevPanelEmbedPreviewMode,
  toggleDevPanelDeviceBrowserChrome,
  useDevDevicePreviewReloadNonce,
  useDevPanelPrefs,
} from '../utils/devPanelPrefs';
import { cn } from '../lib/cn';
import {
  devDeviceEmbedMessagesActionsClassName,
  devDeviceEmbedMessagesBodyClassName,
  devDeviceEmbedMessagesEmptyClassName,
  devDeviceEmbedMessagesEntryClassName,
  devDeviceEmbedMessagesIconBtnClassName,
  devDeviceEmbedMessagesMenuClassName,
  devDeviceEmbedMessagesWrapClassName,
  devDevicePreviewToolbarBadgeClassName,
  devDevicePreviewToolbarBtnActiveClassName,
  devDevicePreviewToolbarBtnClassName,
  devDevicePreviewToolbarIconClassName,
  devDevicePreviewToolbarSelectFaceClassName,
  devDevicePreviewToolbarSelectMetaClassName,
  devDevicePreviewToolbarSelectNameClassName,
} from './devViewPanelVariants';

const MAX_EMBED_LOG_ENTRIES = 40;

type EmbedLogEntry = { at: number; message: TourEmbedMessage };

type EmbedCopyTarget = 'url' | 'iframe';

type EmbedCopyState = 'idle' | 'copied' | 'failed';

function formatEmbedLogLine(entry: EmbedLogEntry): string {
  const time = new Date(entry.at).toLocaleTimeString();
  const { source: _source, ...payload } = entry.message;
  return `${time} ${JSON.stringify(payload)}`;
}

function copyButtonLabel(
  target: EmbedCopyTarget,
  state: EmbedCopyState,
): string {
  if (state === 'copied') return 'Copied';
  if (state === 'failed') return 'Failed';
  return target === 'url' ? 'Copy URL' : 'Copy HTML';
}

/**
 * Embed mode — host iframe delivery QA (`?embed=1`, postMessage, copy markup).
 * Enter via Debug → Viewport → Embed mode.
 */
export function DevEmbedPreviewFrame() {
  const location = useLocation();
  const {
    tourOrScene,
    tourId: routeTourId,
    sceneId: sceneParam,
  } = useParams<{ tourOrScene?: string; tourId?: string; sceneId?: string }>();
  const route = useMemo(
    () => resolveTourRoute(tourOrScene ?? routeTourId, sceneParam),
    [sceneParam, routeTourId, tourOrScene],
  );
  const tour = useMemo(
    () => (route.tourId ? tryLoadTour(route.tourId) : null),
    [route.tourId],
  );
  const tourTitle = tour?.title?.trim() || route.tourId || '';
  const hasRealTour =
    Boolean(route.tourId) && route.tourId !== DEV_SHELL_TOUR_ID;

  const { deviceResponsiveSize, deviceBrowserChrome } = useDevPanelPrefs();
  const reloadNonce = useDevDevicePreviewReloadNonce();
  const scaleLabelRef = useRef<HTMLSpanElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const [embedLog, setEmbedLog] = useState<EmbedLogEntry[]>([]);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [copyState, setCopyState] = useState<
    Record<EmbedCopyTarget, EmbedCopyState>
  >({ url: 'idle', iframe: 'idle' });

  const frameWidth = deviceResponsiveSize.width;
  const frameHeight = deviceResponsiveSize.height;

  const embedOptions = useMemo(() => {
    if (!route.tourId || route.tourId === DEV_SHELL_TOUR_ID || !tour) {
      return { tourId: '', sceneId: '', firstSceneId: '' };
    }
    const sceneId = resolveSceneId(route.tourId, route.sceneId);
    return { tourId: route.tourId, sceneId, firstSceneId: tour.firstScene };
  }, [route.sceneId, route.tourId, tour]);

  const embedUrl = useMemo(
    () => (hasRealTour ? buildAbsoluteEmbedUrl(embedOptions) : ''),
    [embedOptions, hasRealTour],
  );

  const embedIframeHtml = useMemo(
    () => (hasRealTour ? buildEmbedIframeHtml(embedOptions) : ''),
    [embedOptions, hasRealTour],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = parseTourEmbedMessage(event.data);
      if (!message) return;
      setEmbedLog((entries) =>
        [{ at: Date.now(), message }, ...entries].slice(
          0,
          MAX_EMBED_LOG_ENTRIES,
        ),
      );
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!messagesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (messagesRef.current?.contains(target)) return;
      setMessagesOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMessagesOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [messagesOpen]);

  const iframeSrc = buildDevDevicePreviewSrc(
    `${location.pathname}${location.search}${location.hash}`,
    { touch: false, embed: true },
  );
  // Path stays out of the key — iframe→parent sync must not remount/reload.
  const iframeKey = `embed::${reloadNonce}`;
  const chromeUrl = formatDevDeviceChromeUrl(
    location.pathname,
    location.search,
  );

  const handleCopy = async (target: EmbedCopyTarget) => {
    const text = target === 'url' ? embedUrl : embedIframeHtml;
    if (!text) return;
    const ok = await copyToClipboard(text);
    setCopyState((state) => ({ ...state, [target]: ok ? 'copied' : 'failed' }));
    window.setTimeout(
      () => setCopyState((state) => ({ ...state, [target]: 'idle' })),
      ok ? 1600 : 2000,
    );
  };

  return (
    <DevViewportPreviewShell
      dataDevice='embed'
      width={frameWidth}
      height={frameHeight}
      iframeSrc={iframeSrc}
      iframeKey={iframeKey}
      iframeTitle='Embed preview'
      browserChrome={
        deviceBrowserChrome ? { url: chromeUrl, badgeLabel: tourTitle } : null
      }
      resizable
      onResizeCommit={setDevPanelDeviceResponsiveSize}
      scaleLabelRef={scaleLabelRef}
      toolbar={
        <>
          <span className={devDevicePreviewToolbarBadgeClassName}>
            <span className={devDevicePreviewToolbarSelectFaceClassName}>
              <span className={devDevicePreviewToolbarIconClassName}>
                <MaterialSymbol
                  name='open_in_browser'
                  sizePx={MATERIAL_SYMBOL_SIZE_14}
                  className={materialSymbolLayoutClassName}
                  aria-hidden
                />
              </span>
              <span className={devDevicePreviewToolbarSelectNameClassName}>
                Embed
              </span>
              <span className={devDevicePreviewToolbarSelectMetaClassName}>
                {frameWidth}×{frameHeight}
                <span ref={scaleLabelRef} />
              </span>
            </span>
          </span>
          <button
            type='button'
            className={cn(
              devDevicePreviewToolbarBtnClassName,
              deviceBrowserChrome && devDevicePreviewToolbarBtnActiveClassName,
            )}
            onClick={() => toggleDevPanelDeviceBrowserChrome()}
            aria-pressed={deviceBrowserChrome}
            aria-label={
              deviceBrowserChrome ?
                'Hide browser chrome'
              : 'Show browser chrome'
            }
            title='Browser chrome'
          >
            <span className={devDevicePreviewToolbarIconClassName}>
              <MaterialSymbol
                name='web_asset'
                sizePx={MATERIAL_SYMBOL_SIZE_14}
                className={materialSymbolLayoutClassName}
                aria-hidden
              />
            </span>
            Chrome
          </button>
          {hasRealTour ?
            <>
              <button
                type='button'
                className={devDevicePreviewToolbarBtnClassName}
                onClick={() => void handleCopy('url')}
                title={embedUrl}
              >
                {copyButtonLabel('url', copyState.url)}
              </button>
              <button
                type='button'
                className={devDevicePreviewToolbarBtnClassName}
                onClick={() => void handleCopy('iframe')}
                title='Copy iframe HTML'
              >
                {copyButtonLabel('iframe', copyState.iframe)}
              </button>
            </>
          : null}
          <div
            ref={messagesRef}
            className={devDeviceEmbedMessagesWrapClassName}
          >
            <button
              type='button'
              className={cn(
                devDevicePreviewToolbarBtnClassName,
                messagesOpen && devDevicePreviewToolbarBtnActiveClassName,
              )}
              aria-expanded={messagesOpen}
              aria-haspopup='dialog'
              aria-label={`postMessage log (${embedLog.length})`}
              title='postMessage log'
              onClick={() => setMessagesOpen((open) => !open)}
            >
              <span className={devDevicePreviewToolbarIconClassName}>
                <MaterialSymbol
                  name='forum'
                  sizePx={MATERIAL_SYMBOL_SIZE_14}
                  className={materialSymbolLayoutClassName}
                  aria-hidden
                />
              </span>
              Messages
              <span className='tabular-nums text-[rgba(148,163,184,0.78)]'>
                ({embedLog.length})
              </span>
              <span className={devDevicePreviewToolbarIconClassName}>
                <MaterialSymbol
                  name='expand_more'
                  sizePx={MATERIAL_SYMBOL_SIZE_14}
                  className={materialSymbolLayoutClassName}
                  aria-hidden
                />
              </span>
            </button>
            {messagesOpen ?
              <div
                className={devDeviceEmbedMessagesMenuClassName}
                role='dialog'
                aria-label='postMessage log'
              >
                <div className={devDeviceEmbedMessagesActionsClassName}>
                  {embedLog.length > 0 ?
                    <button
                      type='button'
                      className={devDeviceEmbedMessagesIconBtnClassName}
                      aria-label='Clear postMessage log'
                      title='Clear'
                      onClick={() => setEmbedLog([])}
                    >
                      <MaterialSymbol
                        name='delete'
                        sizePx={MATERIAL_SYMBOL_SIZE_18}
                        className={materialSymbolLayoutClassName}
                        aria-hidden
                      />
                    </button>
                  : null}
                  <button
                    type='button'
                    className={devDeviceEmbedMessagesIconBtnClassName}
                    aria-label='Close postMessage log'
                    title='Close'
                    onClick={() => setMessagesOpen(false)}
                  >
                    <MaterialSymbol
                      name='close'
                      sizePx={MATERIAL_SYMBOL_SIZE_18}
                      className={materialSymbolLayoutClassName}
                      aria-hidden
                    />
                  </button>
                </div>
                <div className={devDeviceEmbedMessagesBodyClassName}>
                  {embedLog.length === 0 ?
                    <p className={devDeviceEmbedMessagesEmptyClassName}>
                      Waiting for tour:ready / tour:scene / tour:resize…
                    </p>
                  : <ul className='flex flex-col gap-1.5'>
                      {embedLog.map((entry, index) => (
                        <li
                          key={`${entry.at}-${entry.message.type}-${index}`}
                          className={devDeviceEmbedMessagesEntryClassName}
                        >
                          {formatEmbedLogLine(entry)}
                        </li>
                      ))}
                    </ul>
                  }
                </div>
              </div>
            : null}
          </div>
          <button
            type='button'
            className={devDevicePreviewToolbarBtnClassName}
            onClick={() => bumpDevDevicePreviewReload()}
            aria-label='Reload embed preview'
            title='Reload preview'
          >
            <span className={devDevicePreviewToolbarIconClassName}>
              <MaterialSymbol
                name='refresh'
                sizePx={MATERIAL_SYMBOL_SIZE_14}
                className={materialSymbolLayoutClassName}
                aria-hidden
              />
            </span>
            Reload
          </button>
          <button
            type='button'
            className={devDevicePreviewToolbarBtnClassName}
            onClick={() => setDevPanelEmbedPreviewMode(false)}
            aria-label='Exit embed mode'
            title='Exit embed mode'
          >
            <span className={devDevicePreviewToolbarIconClassName}>
              <MaterialSymbol
                name='close'
                sizePx={MATERIAL_SYMBOL_SIZE_14}
                className={materialSymbolLayoutClassName}
                aria-hidden
              />
            </span>
            Exit
          </button>
        </>
      }
    />
  );
}
