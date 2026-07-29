import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import type { Scene } from '../types/tour';
import {
  MATERIAL_SYMBOL_SIZE_16,
  MATERIAL_SYMBOL_SIZE_18,
} from './ui/materialSymbolClasses';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { ExploreSceneInfoButton } from './ExploreSceneInfoButton';
import {
  TOUR_BREADCRUMB_BAR_ATTR,
  TOUR_BREADCRUMB_SIBLING_MENU_ATTR,
  tourNavBreadcrumbChevronBtnClassName,
  tourNavBreadcrumbChevronIconClassName,
  tourNavBreadcrumbCurrentMenuTriggerClassName,
  tourNavBreadcrumbLinkClassName,
  tourNavBreadcrumbSiblingMenuClassName,
  tourNavBreadcrumbSiblingOptionCheckClassName,
  tourNavBreadcrumbSiblingOptionClassName,
  tourNavBreadcrumbSiblingRowClassName,
  tourNavBreadcrumbSiblingRowCurrentClassName,
  tourNavBreadcrumbSplitClassName,
  tourNavExploreSortMenuInClassName,
  tourNavExploreSortMenuOutClassName,
} from './tourNavFloatVariants';

export interface BreadcrumbSiblingOption {
  id: string;
  title: string;
}

interface TourBreadcrumbSiblingMenuProps {
  /** Crumb being rendered (selected row in the menu). */
  crumbId: string;
  label: string;
  siblings: BreadcrumbSiblingOption[];
  /** Ancestor: title navigates, chevron opens. Current: whole label opens. */
  variant: 'ancestor' | 'current';
  open: boolean;
  disabled?: boolean;
  /** Scene id whose Explore / place detail is currently open (info expanded). */
  detailSceneId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (sceneId: string) => void;
  /** Left info control — opens place details for that sibling. */
  onShowDetails: (sceneId: string) => void;
}

/** Match `--animate-explore-sort-menu-out` duration in globals.css. */
const SIBLING_MENU_EXIT_MS = 140;

/**
 * Clearance below the glass pill. Enter anim also starts at translateY(-6px),
 * so keep this ≥ that travel or the menu kisses the bar mid-tween.
 */
const SIBLING_MENU_GAP_PX = 10;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Keep the menu mounted through the exit animation (same pattern as Explore refine). */
function useDeferredSiblingMenuMount(open: boolean): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    const timer = window.setTimeout(
      () => setMounted(false),
      prefersReducedMotion() ? 0 : SIBLING_MENU_EXIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open]);

  return open || mounted;
}

function useMenuPosition(
  menuMounted: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!menuMounted) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const bar = anchor.closest(`[${TOUR_BREADCRUMB_BAR_ATTR}]`);
      const horizontalRect = anchor.getBoundingClientRect();
      const verticalRect =
        bar instanceof HTMLElement ?
          bar.getBoundingClientRect()
        : horizontalRect;

      const pad = 8;
      const maxWidth = Math.min(240, window.innerWidth - pad * 2);
      let left = horizontalRect.left;
      if (left + maxWidth > window.innerWidth - pad) {
        left = Math.max(pad, window.innerWidth - pad - maxWidth);
      }
      setStyle({
        top: verticalRect.bottom + SIBLING_MENU_GAP_PX,
        left,
        minWidth: Math.min(Math.max(horizontalRect.width, 160), maxWidth),
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [menuMounted, anchorRef]);

  return style;
}

/** Sibling scene picker for a breadcrumb crumb (parent-nav brothers). */
export function TourBreadcrumbSiblingMenu({
  crumbId,
  label,
  siblings,
  variant,
  open,
  disabled = false,
  detailSceneId = null,
  onOpenChange,
  onSelect,
  onShowDetails,
}: TourBreadcrumbSiblingMenuProps) {
  const listId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuMounted = useDeferredSiblingMenuMount(open);
  const menuStyle = useMenuPosition(menuMounted, rootRef);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest(`[${TOUR_BREADCRUMB_SIBLING_MENU_ATTR}]`)
      ) {
        return;
      }
      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  const menuLabel = `Places near ${label}`;
  const chevron = (
    <MaterialSymbol
      name='expand_more'
      className={cn(
        tourNavBreadcrumbChevronIconClassName,
        open && 'rotate-180',
      )}
      sizePx={
        variant === 'current' ?
          MATERIAL_SYMBOL_SIZE_18
        : MATERIAL_SYMBOL_SIZE_16
      }
    />
  );

  const menu =
    menuMounted && typeof document !== 'undefined' ?
      createPortal(
        <ul
          {...{ [TOUR_BREADCRUMB_SIBLING_MENU_ATTR]: '' }}
          id={listId}
          role='listbox'
          aria-label={menuLabel}
          aria-hidden={!open}
          className={cn(
            tourNavBreadcrumbSiblingMenuClassName,
            open ?
              tourNavExploreSortMenuInClassName
            : tourNavExploreSortMenuOutClassName,
          )}
          style={menuStyle}
        >
          {siblings.map((sibling) => {
            const selected = sibling.id === crumbId;
            return (
              <li
                key={sibling.id}
                role='presentation'
                className={cn(
                  tourNavBreadcrumbSiblingRowClassName,
                  selected && tourNavBreadcrumbSiblingRowCurrentClassName,
                )}
              >
                <ExploreSceneInfoButton
                  sceneTitle={sibling.title}
                  variant='breadcrumb'
                  hideTooltip
                  disabled={!open}
                  expanded={detailSceneId === sibling.id}
                  onShow={() => {
                    onOpenChange(false);
                    onShowDetails(sibling.id);
                  }}
                />
                <button
                  type='button'
                  role='option'
                  aria-selected={selected}
                  aria-current={selected ? 'true' : undefined}
                  className={tourNavBreadcrumbSiblingOptionClassName}
                  disabled={!open || selected}
                  tabIndex={open ? undefined : -1}
                  onClick={() => {
                    onOpenChange(false);
                    if (!selected) onSelect(sibling.id);
                  }}
                >
                  <span className='min-w-0 flex-1 truncate'>
                    {sibling.title}
                  </span>
                  {selected ?
                    <MaterialSymbol
                      name='check'
                      className={tourNavBreadcrumbSiblingOptionCheckClassName}
                      sizePx={MATERIAL_SYMBOL_SIZE_16}
                    />
                  : null}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body,
      )
    : null;

  if (variant === 'current') {
    return (
      <span ref={rootRef} className={tourNavBreadcrumbSplitClassName}>
        <button
          ref={triggerRef}
          type='button'
          className={tourNavBreadcrumbCurrentMenuTriggerClassName}
          disabled={disabled}
          aria-haspopup='listbox'
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={menuLabel}
          onClick={() => onOpenChange(!open)}
        >
          <span className='min-w-0 overflow-hidden text-ellipsis whitespace-nowrap'>
            {label}
          </span>
          {chevron}
        </button>
        {menu}
      </span>
    );
  }

  return (
    <span ref={rootRef} className={tourNavBreadcrumbSplitClassName}>
      <button
        type='button'
        className={tourNavBreadcrumbLinkClassName}
        disabled={disabled}
        onClick={() => {
          onOpenChange(false);
          onSelect(crumbId);
        }}
      >
        {label}
      </button>
      <button
        ref={triggerRef}
        type='button'
        className={tourNavBreadcrumbChevronBtnClassName}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={menuLabel}
        onClick={() => onOpenChange(!open)}
      >
        {chevron}
      </button>
      {menu}
    </span>
  );
}

export function resolveBreadcrumbSiblingOptions(
  siblingIds: string[],
  scenesById: Record<string, Scene>,
): BreadcrumbSiblingOption[] {
  return siblingIds.map((id) => ({ id, title: scenesById[id]?.title ?? id }));
}
