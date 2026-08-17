'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Bug,
  ChevronDown,
  Code,
  Copy,
  EyeOff,
  Flag,
  Hand,
  Hourglass,
  Laptop,
  LayoutTemplate,
  Maximize,
  MessageCircle,
  MessageCircleQuestionMark,
  Monitor,
  RefreshCw,
  Scaling,
  SearchX,
  SkipForward,
  Smartphone,
  Tablet,
  TabletSmartphone,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigationPending } from '@/components/navigation-progress';
import { usePausePreviewIframe } from '@/lib/admin-debug';
import { ADMIN_DEBUG_COPY, DEBUG_VIEWPORT_COPY } from '@/lib/authoring-copy';
import type { AdminViewerType } from '@/lib/tour-detail';
import { cn } from '@/lib/utils';
import {
  buildPreviewNavigateCommand,
  positionFromClickPayload,
  publishPreviewClick,
  publishPreviewView,
  sceneFromReadyPayload,
  subscribePreviewReload,
  viewFromPayload,
} from '@/lib/preview-click';
import {
  ADMIN_PREVIEW_FLAG_TOGGLES,
  buildAdminPreviewUrl,
  buildEmbedIframeHtml,
  buildProductionEmbedUrl,
  type AdminPreviewFlagKey,
  type AdminPreviewFlags,
} from '@/lib/viewer-url';

const DEVICE_PRESETS = [
  {
    id: 'responsive',
    label: 'Responsive',
    width: '100%',
    height: '42rem',
    group: 'Viewport',
    icon: Scaling,
  },
  {
    id: 'iphone-14',
    label: 'iPhone 14',
    width: '390px',
    height: '844px',
    group: 'Phone',
    icon: Smartphone,
  },
  {
    id: 'pixel-7',
    label: 'Pixel 7',
    width: '412px',
    height: '915px',
    group: 'Phone',
    icon: Smartphone,
  },
  {
    id: 'ipad',
    label: 'iPad',
    width: '768px',
    height: '1024px',
    group: 'Tablet',
    icon: Tablet,
  },
  {
    id: 'laptop',
    label: 'Laptop',
    width: '1280px',
    height: '800px',
    group: 'Computer',
    icon: Laptop,
  },
  {
    id: 'desktop',
    label: 'Desktop',
    width: '1920px',
    height: '1080px',
    group: 'Computer',
    icon: Monitor,
  },
] as const;

const DEVICE_FRAME_GROUPS = ['Phone', 'Tablet', 'Computer'] as const;

/**
 * One glyph per preview flag, keyed by the toggle it names, so a flag row reads
 * like every other Debug row instead of starting at the label.
 */
const DEBUG_FLAG_ICONS: Record<
  (typeof ADMIN_PREVIEW_FLAG_TOGGLES)[number]['key'],
  LucideIcon
> = {
  notFoundTest: SearchX,
  loadErrorTest: TriangleAlert,
  disableNavPreview: EyeOff,
  skipLanding: SkipForward,
  splashHold: Hourglass,
  firstVisitHint: Hand,
  askGuide: MessageCircleQuestionMark,
  guideMock: Bot,
  guideUiTest: LayoutTemplate,
};

/**
 * Floor for a card that sizes itself. A compact stage is measured by the frame
 * around it instead, so the editor's viewer column cannot outgrow its row.
 */
const PREVIEW_STAGE_FLOOR = 'min-h-[42rem]';

type ViewportMode = 'live' | 'device' | 'embed';
type DebugFlagGroup = (typeof ADMIN_PREVIEW_FLAG_TOGGLES)[number]['group'];
type DevicePresetId = (typeof DEVICE_PRESETS)[number]['id'];
type DevicePresetGroup = (typeof DEVICE_PRESETS)[number]['group'];

/** A frame group wears its first preset's glyph — presets stay the icon source. */
function devicePresetGroupIcon(
  group: DevicePresetGroup,
): LucideIcon | undefined {
  return DEVICE_PRESETS.find((preset) => preset.group === group)?.icon;
}

/**
 * Hold after `tour:ready` (splash overlay starts fading). Matches
 * `getTourLoadSplashFadeMs` in the viewer plus a short WebGL settle.
 */
const PREVIEW_LIVE_SPLASH_HOLD_MS = 4670;
const PREVIEW_EMBED_SPLASH_HOLD_MS = 2070;
const PREVIEW_SPLASH_FALLBACK_PAD_MS = 8000;
/** After a tour/scene switch, wait for the crumb menu and click-through to settle. */
const PREVIEW_ROUTE_ARM_MS = 400;

function DebugToggleCopy({ label, hint }: { label: string; hint?: ReactNode }) {
  return (
    <span className='flex min-w-0 flex-col gap-0.5'>
      <span>{label}</span>
      {hint ?
        <span className='type-meta'>{hint}</span>
      : null}
    </span>
  );
}

function DebugSubmenu({
  label,
  icon: Icon,
  /** Two-line option copy needs the wide panel; plain preset lists do not. */
  wide = Boolean(Icon),
  children,
}: {
  label: ReactNode;
  icon?: LucideIcon;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {Icon ?
          <Icon aria-hidden='true' />
        : null}
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={wide ? 'w-80 min-w-80' : 'min-w-44'}>
        {children}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function TourPreviewPanel({
  sceneId,
  title,
  tourId,
  viewerType,
  previewRoute,
  sceneNav = 'reload',
  compact = false,
}: {
  sceneId?: string;
  title: string;
  tourId: string;
  viewerType: AdminViewerType;
  /** When set, iframe arms on this Admin path instead of the scene/detail route. */
  previewRoute?: string;
  /**
   * The panorama editor already names and frames the viewer, so the card drops
   * its explanatory copy and lets the surrounding stage own the height.
   */
  compact?: boolean;
  /**
   * `reload` rebuilds the iframe URL per scene (scene detail). `live` keeps one
   * viewer mounted and hops scenes over the bridge (visual editor).
   */
  sceneNav?: 'reload' | 'live';
}) {
  const [flags, setFlags] = useState<AdminPreviewFlags>({});
  const [viewportMode, setViewportMode] = useState<ViewportMode>('live');
  const [devicePreset, setDevicePreset] =
    useState<DevicePresetId>('responsive');
  const [reloadKey, setReloadKey] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<string | undefined>();
  const [settledPreviewKey, setSettledPreviewKey] = useState<string>();
  const [armedPreviewPath, setArmedPreviewPath] = useState<string>();
  const liveSceneNav = sceneNav === 'live';
  /** Scene the current iframe run booted on — a hop never rewrites the URL. */
  const [bootSceneId, setBootSceneId] = useState(sceneId);
  /** Scene the running viewer is showing, learned from `tour:ready` / hops. */
  const viewerSceneRef = useRef<string>(undefined);
  const sceneIdRef = useRef(sceneId);
  const pausePreviewIframe = usePausePreviewIframe();
  const pathname = usePathname();
  const navPending = useNavigationPending();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewPath =
    previewRoute ??
    (sceneId ? `/tours/${tourId}/scenes/${sceneId}` : `/tours/${tourId}`);
  const onPreviewRoute =
    pausePreviewIframe.ready &&
    !pausePreviewIframe.enabled &&
    pathname === previewPath &&
    !navPending;
  const showIframe = onPreviewRoute && armedPreviewPath === previewPath;
  const splashHoldMs =
    viewportMode === 'embed' ?
      PREVIEW_EMBED_SPLASH_HOLD_MS
    : PREVIEW_LIVE_SPLASH_HOLD_MS;

  const previewFlags = useMemo(
    () => ({
      ...flags,
      ...(viewportMode === 'embed' ? { embed: true } : {}),
      ...(flags.guideMock || flags.guideUiTest ?
        { askGuide: true, askGuideOff: false }
      : {}),
    }),
    [flags, viewportMode],
  );

  const bootUrlSceneId = liveSceneNav ? bootSceneId : sceneId;
  const previewUrl = useMemo(
    () =>
      buildAdminPreviewUrl(tourId, {
        sceneId: bootUrlSceneId,
        flags: previewFlags,
        includeDev: viewportMode !== 'embed',
      }),
    [bootUrlSceneId, previewFlags, tourId, viewportMode],
  );
  const previewRunKey = `${reloadKey}:${previewUrl}`;
  const previewSettled = !showIframe || settledPreviewKey === previewRunKey;

  const device = DEVICE_PRESETS.find((preset) => preset.id === devicePreset);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (typeof event.data !== 'object' || event.data === null) return;
      const type = (event.data as { type?: unknown }).type;
      if (typeof type !== 'string' || !type.startsWith('tour:')) return;
      const click = positionFromClickPayload(event.data);
      if (click) publishPreviewClick(click);
      const view = viewFromPayload(event.data);
      if (view) publishPreviewView(view);
      setMessages((current) =>
        [`${new Date().toLocaleTimeString()} ${type}`, ...current].slice(0, 20),
      );
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    sceneIdRef.current = sceneId;
  }, [sceneId]);

  useEffect(
    () =>
      subscribePreviewReload(() => {
        // A reload rebuilds the iframe, so boot it on the scene in view.
        setBootSceneId(sceneIdRef.current);
        setReloadKey((value) => value + 1);
      }),
    [],
  );

  useEffect(() => {
    if (!onPreviewRoute) return;
    const timer = window.setTimeout(
      () => setArmedPreviewPath(previewPath),
      PREVIEW_ROUTE_ARM_MS,
    );
    return () => window.clearTimeout(timer);
  }, [onPreviewRoute, previewPath]);

  useEffect(() => {
    if (!showIframe) return;
    let settled = false;
    let holdTimer: number | undefined;
    viewerSceneRef.current = undefined;

    function settle() {
      if (settled) return;
      settled = true;
      setSettledPreviewKey(previewRunKey);
    }

    function onReady(event: MessageEvent) {
      if (typeof event.data !== 'object' || event.data === null) return;
      if ((event.data as { type?: unknown }).type !== 'tour:ready') return;
      viewerSceneRef.current = sceneFromReadyPayload(event.data) ?? undefined;
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(settle, splashHoldMs);
    }

    const fallbackTimer = window.setTimeout(
      settle,
      splashHoldMs + PREVIEW_SPLASH_FALLBACK_PAD_MS,
    );
    window.addEventListener('message', onReady);
    return () => {
      window.removeEventListener('message', onReady);
      window.clearTimeout(holdTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [previewRunKey, showIframe, splashHoldMs]);

  // Scene hop for the mounted viewer. A run that booted on the wrong scene
  // (reload, flag change) reconciles here once `tour:ready` reports its scene.
  useEffect(() => {
    if (!liveSceneNav || !sceneId) return;
    if (!showIframe || !previewSettled) return;
    if (viewerSceneRef.current === sceneId) return;
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    viewerSceneRef.current = sceneId;
    frame.postMessage(
      buildPreviewNavigateCommand(tourId, sceneId),
      new URL(previewUrl).origin,
    );
  }, [liveSceneNav, previewSettled, previewUrl, sceneId, showIframe, tourId]);

  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    return () => {
      if (!iframe) return;
      iframe.src = 'about:blank';
    };
  }, [previewUrl, reloadKey, showIframe]);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`Copied ${label}`);
    } catch {
      setCopyStatus(`Could not copy ${label}`);
    }
  }

  function selectDevicePreset(value: string) {
    setDevicePreset(value as DevicePresetId);
    setViewportMode('device');
  }

  /** One check across the whole Viewport tree: a preset reads active only in device mode. */
  function devicePresetItems(group: DevicePresetGroup) {
    return DEVICE_PRESETS.filter((preset) => preset.group === group).map(
      (preset) => {
        const Icon = preset.icon;

        return (
          <DropdownMenuCheckboxItem
            key={preset.id}
            checked={viewportMode === 'device' && devicePreset === preset.id}
            onSelect={(event) => {
              event.preventDefault();
              selectDevicePreset(preset.id);
            }}
          >
            <Icon aria-hidden='true' />
            <DebugToggleCopy label={preset.label} />
          </DropdownMenuCheckboxItem>
        );
      },
    );
  }

  function flagToggleItems(group: DebugFlagGroup) {
    return ADMIN_PREVIEW_FLAG_TOGGLES.filter(
      (toggle) => toggle.group === group,
    ).map((toggle) => {
      const Icon = DEBUG_FLAG_ICONS[toggle.key];

      return (
        <DropdownMenuCheckboxItem
          key={toggle.key}
          checked={flags[toggle.key] === true}
          onCheckedChange={(checked) => setFlag(toggle.key, checked === true)}
          onSelect={(event) => event.preventDefault()}
        >
          <Icon aria-hidden='true' />
          <DebugToggleCopy label={toggle.label} hint={toggle.hint} />
        </DropdownMenuCheckboxItem>
      );
    });
  }

  function setFlag(key: AdminPreviewFlagKey, enabled: boolean) {
    setFlags((current) =>
      key === 'askGuide' ?
        { ...current, askGuide: enabled, askGuideOff: !enabled }
      : { ...current, [key]: enabled },
    );
  }

  return (
    <Card size={compact ? 'sm' : 'default'} className='h-full'>
      {/* Compact sits beside the editor's other column headers, so the title
          centers on the action row instead of hanging at its top. */}
      <CardHeader className={cn(compact && 'items-center')}>
        <CardTitle>Viewer preview</CardTitle>
        {compact ? null : (
          <CardDescription>
            Local {viewerType} viewer in authoring mode. Debug flags rebuild the
            iframe URL.
          </CardDescription>
        )}
        <CardAction>
          <div className='flex flex-wrap items-center justify-end gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setReloadKey((value) => value + 1)}
            >
              <RefreshCw aria-hidden='true' />
              Reload
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type='button' size='sm' variant='outline'>
                  <Bug aria-hidden='true' />
                  Debug
                  <ChevronDown aria-hidden='true' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-52'>
                <DebugSubmenu label='URL flags' icon={Flag}>
                  {flagToggleItems('url')}
                </DebugSubmenu>
                <DebugSubmenu label='Viewport' icon={Monitor}>
                  <DropdownMenuCheckboxItem
                    checked={viewportMode === 'live'}
                    onSelect={(event) => {
                      event.preventDefault();
                      setViewportMode('live');
                    }}
                  >
                    <Maximize aria-hidden='true' />
                    <DebugToggleCopy
                      label={DEBUG_VIEWPORT_COPY.off.label}
                      hint={DEBUG_VIEWPORT_COPY.off.hint}
                    />
                  </DropdownMenuCheckboxItem>
                  <DebugSubmenu
                    icon={TabletSmartphone}
                    wide={false}
                    label={
                      <DebugToggleCopy
                        label={DEBUG_VIEWPORT_COPY.device.label}
                        hint={DEBUG_VIEWPORT_COPY.device.hint}
                      />
                    }
                  >
                    {devicePresetItems('Viewport')}
                    {DEVICE_FRAME_GROUPS.map((group) => (
                      <DebugSubmenu
                        key={group}
                        label={group}
                        icon={devicePresetGroupIcon(group)}
                        wide={false}
                      >
                        {devicePresetItems(group)}
                      </DebugSubmenu>
                    ))}
                  </DebugSubmenu>
                  <DropdownMenuCheckboxItem
                    checked={viewportMode === 'embed'}
                    onSelect={(event) => {
                      event.preventDefault();
                      setViewportMode('embed');
                    }}
                  >
                    <Code aria-hidden='true' />
                    <DebugToggleCopy
                      label={DEBUG_VIEWPORT_COPY.embed.label}
                      hint={DEBUG_VIEWPORT_COPY.embed.hint}
                    />
                  </DropdownMenuCheckboxItem>
                </DebugSubmenu>
                <DebugSubmenu label='Tour Guide' icon={MessageCircle}>
                  {flagToggleItems('guide')}
                </DebugSubmenu>
                {viewportMode === 'embed' ?
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() =>
                        void copyText(
                          'embed URL',
                          buildProductionEmbedUrl(tourId, sceneId),
                        )
                      }
                    >
                      <Copy aria-hidden='true' />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        void copyText(
                          'iframe HTML',
                          buildEmbedIframeHtml(tourId, sceneId),
                        )
                      }
                    >
                      <Copy aria-hidden='true' />
                      Copy HTML
                    </DropdownMenuItem>
                  </>
                : null}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Messages</DropdownMenuLabel>
                <div className='ishare-scrollbar mx-1 mb-1 max-h-40 overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-xs'>
                  {messages.length > 0 ?
                    <ul className='space-y-1'>
                      {messages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  : <p className='text-muted-foreground'>
                      Waiting for tour:ready / tour:scene / tour:resize…
                    </p>
                  }
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {copyStatus ?
              <p className='basis-full text-right type-meta' role='status'>
                {copyStatus}
              </p>
            : null}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col'>
        <div
          className={cn(
            'min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted',
            // A device frame is taller than the stage it sits in, so it scrolls
            // rather than losing its bottom half to the clip.
            viewportMode === 'device' && 'ishare-scrollbar overflow-auto',
            viewportMode === 'device' &&
              devicePreset !== 'responsive' &&
              'mx-auto',
          )}
          style={
            viewportMode === 'device' && device ?
              { width: device.width, maxWidth: '100%' }
            : undefined
          }
        >
          {showIframe ?
            <iframe
              ref={iframeRef}
              key={`${previewUrl}-${reloadKey}`}
              src={previewUrl}
              title={`${title} authoring preview`}
              tabIndex={-1}
              className={cn(
                'admin-preview-iframe size-full bg-black',
                !compact && PREVIEW_STAGE_FLOOR,
                !previewSettled && 'is-splashing',
              )}
              {...(!previewSettled ? { inert: true } : {})}
              style={
                viewportMode === 'device' && device ?
                  { height: device.height, minHeight: device.height }
                : undefined
              }
              allow='fullscreen; xr-spatial-tracking'
              allowFullScreen
            />
          : <div
              className={cn(
                'flex size-full items-center justify-center bg-muted p-6 text-center',
                !compact && PREVIEW_STAGE_FLOOR,
              )}
              style={
                viewportMode === 'device' && device ?
                  { height: device.height, minHeight: device.height }
                : undefined
              }
            >
              {pausePreviewIframe.ready && pausePreviewIframe.enabled ?
                <p className='type-body max-w-sm text-muted-foreground'>
                  {ADMIN_DEBUG_COPY.preview.paused}
                </p>
              : null}
            </div>
          }
        </div>
      </CardContent>
    </Card>
  );
}
