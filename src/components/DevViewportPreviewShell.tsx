import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  DEV_DEVICE_BROWSER_CHROME_HEIGHT_PX,
  DEV_DEVICE_RESPONSIVE_MAX,
  DEV_DEVICE_RESPONSIVE_MIN,
} from '../constants/devDevicePresets';
import { cn } from '../lib/cn';
import { iframeAlreadyShowsSrc } from '../utils/devDeviceFrameSync';
import { useDevPanelPrefs } from '../utils/devPanelPrefs';
import { DevDeviceBrowserChrome } from './DevDeviceBrowserChrome';
import {
  devDevicePreviewBezelClassName,
  devDevicePreviewHostClassName,
  devDevicePreviewIframeClassName,
  devDevicePreviewResizeHandleEClassName,
  devDevicePreviewResizeHandleSClassName,
  devDevicePreviewResizeHandleSeClassName,
  devDevicePreviewScaleViewportClassName,
  devDevicePreviewToolbarClassName,
  devDevicePreviewViewportClassName,
} from './devViewPanelVariants';

const SCALE_PAD_PX = 8;

type ResizeEdge = 'e' | 's' | 'se';

function clampAxis(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export type DevViewportPreviewShellProps = {
  width: number;
  height: number;
  iframeSrc: string;
  iframeKey: string;
  iframeTitle: string;
  /** Optional `data-dev-device` on the host. */
  dataDevice?: string;
  /** Browser chrome above the measured viewport. */
  browserChrome?: { url: string; badgeLabel?: string } | null;
  /** Drag-resize (Responsive / host viewport). */
  resizable?: boolean;
  onResizeCommit?: (size: { width: number; height: number }) => void;
  /** Toolbar span updated with ` · N%` when scaled below 100%. */
  scaleLabelRef?: RefObject<HTMLSpanElement | null>;
  toolbar: ReactNode;
};

/**
 * Shared browser-viewport stage: scale-to-fit, optional chrome, iframe,
 * optional drag-resize. Device / Embed modes supply their own toolbars.
 */
export function DevViewportPreviewShell({
  width,
  height,
  iframeSrc,
  iframeKey,
  iframeTitle,
  dataDevice,
  browserChrome = null,
  resizable = false,
  onResizeCommit,
  scaleLabelRef,
  toolbar,
}: DevViewportPreviewShellProps) {
  const { theme } = useDevPanelPrefs();
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const bezelRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scaleRef = useRef(1);
  const frameSizeRef = useRef({ width: 0, height: 0 });
  const resizeRef = useRef<{
    edge: ResizeEdge;
    pointerId: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const [dragSize, setDragSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const isResizing = dragSize !== null;
  const frameWidth = dragSize?.width ?? width;
  const frameHeight = dragSize?.height ?? height;
  const showChrome = Boolean(browserChrome);
  const shellWidth = frameWidth;
  const shellHeight =
    frameHeight > 0 ?
      frameHeight + (showChrome ? DEV_DEVICE_BROWSER_CHROME_HEIGHT_PX : 0)
    : 0;
  frameSizeRef.current = { width: shellWidth, height: shellHeight };

  useEffect(() => {
    setDragSize(null);
  }, [width, height, resizable]);

  // Parent-driven URL changes update the iframe via the DOM. When the nested
  // frame already navigated (and mirrored the parent URL), skip so we don't reload.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (iframeAlreadyShowsSrc(iframe, iframeSrc)) return;
    iframe.src = iframeSrc;
  }, [iframeSrc, iframeKey]);

  useLayoutEffect(() => {
    if (shellWidth <= 0 || shellHeight <= 0) return;
    const host = hostRef.current;
    const stage = stageRef.current;
    const toolbar = toolbarRef.current;
    const bezel = bezelRef.current;
    if (!host || !stage || !bezel) return;

    const apply = (next: number, centerY: number) => {
      scaleRef.current = next;
      bezel.style.top = `${centerY}px`;
      bezel.style.transform = `translate(-50%, -50%) scale(${next})`;
      if (scaleLabelRef?.current) {
        scaleLabelRef.current.textContent =
          next < 0.999 ? ` · ${Math.round(next * 100)}%` : '';
      }
    };

    const update = () => {
      const { width: w, height: h } = frameSizeRef.current;
      if (w <= 0 || h <= 0) return;
      const toolbarH = toolbar?.offsetHeight ?? 0;
      const stageH = stage.clientHeight;
      const stageW = stage.clientWidth;
      // Keep the scaled frame clear of the floating toolbar band.
      const availW = Math.max(0, stageW - SCALE_PAD_PX * 2);
      const availH = Math.max(0, stageH - toolbarH - SCALE_PAD_PX * 2);
      const next =
        availW <= 0 || availH <= 0 ? 1 : Math.min(1, availW / w, availH / h);
      const centerY = toolbarH + (stageH - toolbarH) / 2;
      if (
        Math.abs(scaleRef.current - next) < 0.001 &&
        Math.abs(Number.parseFloat(bezel.style.top) - centerY) < 0.5
      ) {
        return;
      }
      apply(next, centerY);
    };

    const initialToolbarH = toolbar?.offsetHeight ?? 0;
    apply(1, initialToolbarH + (stage.clientHeight - initialToolbarH) / 2);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(stage);
    observer.observe(host);
    if (toolbar) observer.observe(toolbar);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [shellWidth, shellHeight, showChrome, scaleLabelRef]);

  useEffect(() => {
    if (!resizable) return;
    const onPointerMove = (event: PointerEvent) => {
      const drag = resizeRef.current;
      if (!drag) return;
      const scale = Math.max(0.001, scaleRef.current);
      const dx = (event.clientX - drag.startX) / scale;
      const dy = (event.clientY - drag.startY) / scale;
      const nextW =
        drag.edge === 's' ?
          drag.startW
        : clampAxis(
            drag.startW + dx,
            DEV_DEVICE_RESPONSIVE_MIN.width,
            DEV_DEVICE_RESPONSIVE_MAX.width,
          );
      const nextH =
        drag.edge === 'e' ?
          drag.startH
        : clampAxis(
            drag.startH + dy,
            DEV_DEVICE_RESPONSIVE_MIN.height,
            DEV_DEVICE_RESPONSIVE_MAX.height,
          );
      setDragSize({ width: nextW, height: nextH });
    };
    const onPointerUp = (event: PointerEvent) => {
      const drag = resizeRef.current;
      if (!drag) return;
      if (
        event.type !== 'pointercancel' &&
        event.pointerId !== drag.pointerId
      ) {
        return;
      }
      const target = event.target;
      if (
        target instanceof Element &&
        target.hasPointerCapture?.(drag.pointerId)
      ) {
        target.releasePointerCapture(drag.pointerId);
      }
      resizeRef.current = null;
      setDragSize((current) => {
        if (current) onResizeCommit?.(current);
        return null;
      });
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onResizeCommit, resizable]);

  const startResize = (
    edge: ResizeEdge,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      edge,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startW: frameWidth,
      startH: frameHeight,
    };
    setDragSize({ width: frameWidth, height: frameHeight });
  };

  return (
    <div
      ref={hostRef}
      className={devDevicePreviewHostClassName}
      data-dev-device={dataDevice}
      data-dev-theme={theme}
    >
      <div ref={stageRef} className={devDevicePreviewScaleViewportClassName}>
        <div
          ref={bezelRef}
          className={devDevicePreviewBezelClassName}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: shellWidth,
            height: shellHeight,
            transform: 'translate(-50%, -50%) scale(1)',
            transformOrigin: 'center center',
          }}
        >
          {browserChrome ?
            <DevDeviceBrowserChrome
              url={browserChrome.url}
              badgeLabel={browserChrome.badgeLabel}
              showBadge={frameWidth >= 520}
            />
          : null}
          <div
            className={devDevicePreviewViewportClassName}
            style={{ width: frameWidth, height: frameHeight }}
          >
            <iframe
              key={iframeKey}
              ref={iframeRef}
              title={iframeTitle}
              className={cn(
                devDevicePreviewIframeClassName,
                isResizing && 'pointer-events-none',
              )}
              width={frameWidth}
              height={frameHeight}
              allow='fullscreen; autoplay; clipboard-write'
            />
            {resizable ?
              <>
                <div
                  className={devDevicePreviewResizeHandleEClassName}
                  aria-label='Resize width'
                  onPointerDown={(event) => startResize('e', event)}
                />
                <div
                  className={devDevicePreviewResizeHandleSClassName}
                  aria-label='Resize height'
                  onPointerDown={(event) => startResize('s', event)}
                />
                <div
                  className={devDevicePreviewResizeHandleSeClassName}
                  aria-label='Resize width and height'
                  onPointerDown={(event) => startResize('se', event)}
                />
              </>
            : null}
          </div>
        </div>
      </div>

      <div ref={toolbarRef} className={devDevicePreviewToolbarClassName}>
        {toolbar}
      </div>
    </div>
  );
}
