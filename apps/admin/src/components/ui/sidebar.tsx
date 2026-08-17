'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import {
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  SIDEBAR_WIDTH_STORAGE_KEY,
  clampSidebarWidth,
  syncSidebarBootWidth,
} from '@/lib/admin-sidebar-rail';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH_MOBILE = '16.5rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const SIDEBAR_WIDTH_EVENT = 'ishare-admin-sidebar-width';
// Extra pull past the minimum before a drag snaps to the collapsed icon rail.
const SIDEBAR_SNAP_SLOP = 48;
const SIDEBAR_RESIZE_STEP = 16;
const SIDEBAR_RESIZE_STEP_LARGE = 32;
const SIDEBAR_RESIZE_LABEL = 'Resize sidebar';

function readSidebarWidth() {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (raw === null) return SIDEBAR_WIDTH_DEFAULT;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ?
        clampSidebarWidth(parsed)
      : SIDEBAR_WIDTH_DEFAULT;
  } catch {
    return SIDEBAR_WIDTH_DEFAULT;
  }
}

function writeSidebarWidth(width: number) {
  // The rail sizes off the boot custom property, so this is the live value too.
  syncSidebarBootWidth(width);
  try {
    window.localStorage.setItem(
      SIDEBAR_WIDTH_STORAGE_KEY,
      String(clampSidebarWidth(width)),
    );
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(new Event(SIDEBAR_WIDTH_EVENT));
}

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  width: number;
  setWidth: (width: number) => void;
  /** Drag in progress — the rail drops its width transition so it tracks 1:1. */
  resizing: boolean;
  setResizing: (resizing: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [resizing, setResizing] = React.useState(false);
  const subscribeWidth = React.useCallback((onStoreChange: () => void) => {
    window.addEventListener(SIDEBAR_WIDTH_EVENT, onStoreChange);
    window.addEventListener('storage', onStoreChange);
    return () => {
      window.removeEventListener(SIDEBAR_WIDTH_EVENT, onStoreChange);
      window.removeEventListener('storage', onStoreChange);
    };
  }, []);
  const width = React.useSyncExternalStore(
    subscribeWidth,
    readSidebarWidth,
    () => SIDEBAR_WIDTH_DEFAULT,
  );

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // Own-tab writes stamp the property themselves; this catches another tab's.
  React.useEffect(() => {
    syncSidebarBootWidth(width);
  }, [width]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      width,
      setWidth: writeSidebarWidth,
      resizing,
      setResizing,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [
      state,
      open,
      setOpen,
      width,
      resizing,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    ],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot='sidebar-wrapper'
        // `--sidebar-width` is inherited from the boot property on <html>, so
        // the rail paints at the stored width instead of jumping after
        // hydration. See `lib/admin-sidebar-rail.ts`.
        style={
          {
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
  const { isMobile, state, openMobile, setOpenMobile, resizing } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        data-slot='sidebar'
        className={cn(
          'flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar='sidebar'
          data-slot='sidebar'
          data-mobile='true'
          className='w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden'
          style={
            { '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className='flex h-full w-full flex-col'>{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        'group peer hidden shrink-0 text-sidebar-foreground md:block',
        // One expanded width, whatever the content: rows truncate instead of
        // widening the rail, so a fold cannot resize it.
        'w-(--sidebar-width)',
        // Same beat as the rows inside it, so the edge and the labels it clips
        // move together instead of the content snapping a frame ahead.
        'transition-[width] duration-200 ease-out motion-reduce:transition-none',
        // The collapse toggle animates; a drag must not, or it lags the pointer.
        'data-[resizing=true]:transition-none',
        'data-[collapsible=offcanvas]:hidden',
        variant === 'floating' || variant === 'inset' ?
          'data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
        : 'data-[collapsible=icon]:w-(--sidebar-width-icon)',
      )}
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-resizing={resizing}
      data-variant={variant}
      data-side={side}
      data-slot='sidebar'
    >
      <div
        data-slot='sidebar-container'
        data-side={side}
        className={cn(
          'sticky top-0 z-10 flex h-svh w-full',
          // Adjust the padding for floating and inset variants.
          variant === 'floating' || variant === 'inset' ?
            'p-2'
          : 'group-data-[side=left]:border-r group-data-[side=right]:border-l',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar='sidebar'
          data-slot='sidebar-inner'
          className='flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border'
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const label =
    isMobile ?
      openMobile ? 'Close sidebar'
      : 'Open sidebar'
    : state === 'collapsed' ? 'Expand sidebar'
    : 'Collapse sidebar';
  const expanded = isMobile ? openMobile : state === 'expanded';
  // Both marks stay mounted and cross-fade on the rail's own beat, so the icon
  // turns over with the moving edge instead of hard-swapping a frame ahead.
  // The layer carries the opacity, not the svg, so the button's ghost icon
  // dimming still applies underneath.
  const iconLayer =
    'absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-sidebar='trigger'
          data-slot='sidebar-trigger'
          variant='ghost'
          size='icon'
          className={cn(className)}
          aria-label={label}
          onClick={(event) => {
            onClick?.(event);
            toggleSidebar();
          }}
          {...props}
        >
          <span className='relative block size-4' aria-hidden='true'>
            <span
              className={cn(
                iconLayer,
                expanded ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
              )}
            >
              <PanelLeftCloseIcon />
            </span>
            <span
              className={cn(
                iconLayer,
                expanded ? 'scale-75 opacity-0' : 'scale-100 opacity-100',
              )}
            >
              <PanelLeftOpenIcon />
            </span>
          </span>
          <span className='sr-only'>{label}</span>
        </Button>
      </TooltipTrigger>
      {/* The trigger lives in the header, so the tip drops below the bar. */}
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The rail as rendered — the handle's offset parent is the inner container, so
 * this is the collapsed icon width too, not just the stored expanded width.
 */
function railWidthOf(handle: HTMLElement) {
  const container = handle.offsetParent;
  return container instanceof HTMLElement ? container.offsetWidth : null;
}

function SidebarResizeHandle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { open, setOpen, width, setWidth, resizing, setResizing } =
    useSidebar();
  // Grab offset keeps the pointer on the edge it started on.
  const dragRef = React.useRef<{ offset: number } | null>(null);

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    setResizing(false);
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      data-sidebar='resize-handle'
      data-slot='sidebar-resize-handle'
      role='separator'
      aria-orientation='vertical'
      aria-label={SIDEBAR_RESIZE_LABEL}
      aria-valuemin={SIDEBAR_WIDTH_MIN}
      aria-valuemax={SIDEBAR_WIDTH_MAX}
      aria-valuenow={width}
      tabIndex={0}
      className={cn(
        'absolute inset-y-0 right-0 z-20 hidden w-1.5 translate-x-1/2 cursor-col-resize touch-none md:block',
        // `right-0` is the border's inner edge and the handle is pushed out by
        // half its width, so its midline lands there: the hairline starts at
        // the midline and covers the border pixel whole. Centring it on the
        // midline instead would straddle two pixels and smear on hover.
        'after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent hover:after:bg-primary/40',
        resizing && 'after:bg-primary/50',
        className,
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        dragRef.current = {
          offset: (railWidthOf(event.currentTarget) ?? width) - event.clientX,
        };
        setResizing(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        // The sidebar starts at the viewport edge, so the pointer x is the
        // width. Pulling well past the minimum collapses to the icon rail
        // (same state as the toggle); dragging back out expands again.
        const next = event.clientX + drag.offset;
        if (next < SIDEBAR_WIDTH_MIN - SIDEBAR_SNAP_SLOP) {
          if (open) setOpen(false);
          return;
        }
        if (!open) setOpen(true);
        // `setWidth` clamps to the bounds, so pulling past the maximum
        // cannot bank slack the pointer would unwind before the edge moves.
        setWidth(next);
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onDoubleClick={() => {
        if (!open) setOpen(true);
        setWidth(SIDEBAR_WIDTH_DEFAULT);
      }}
      onKeyDown={(event) => {
        const step =
          event.shiftKey ? SIDEBAR_RESIZE_STEP_LARGE : SIDEBAR_RESIZE_STEP;

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          if (!open) return;
          if (width <= SIDEBAR_WIDTH_MIN) setOpen(false);
          else setWidth(width - step);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          if (!open) setOpen(true);
          else setWidth(width + step);
        } else if (event.key === 'Home') {
          event.preventDefault();
          if (open) setWidth(SIDEBAR_WIDTH_MIN);
        } else if (event.key === 'End') {
          event.preventDefault();
          if (!open) setOpen(true);
          setWidth(SIDEBAR_WIDTH_MAX);
        }
      }}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot='sidebar-inset'
      className={cn(
        'relative flex min-w-0 flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot='sidebar-input'
      data-sidebar='input'
      className={cn('h-8 w-full bg-background shadow-none', className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-header'
      data-sidebar='header'
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-footer'
      data-sidebar='footer'
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot='sidebar-separator'
      data-sidebar='separator'
      className={cn('mx-2 w-auto bg-sidebar-border', className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-content'
      data-sidebar='content'
      className={cn(
        // Groups read as groups: this gap plus each group's own padding is the
        // wide beat between sections, against the tight one inside a menu.
        'no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-group'
      data-sidebar='group'
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot='sidebar-group-label'
      data-sidebar='group-label'
      className={cn(
        // The label belongs to the rows under it, so it sits close to them and
        // far from the group above. Box plus margin stays the 1.75rem the
        // collapsed rail pulls back, so the icon rail loses the label whole.
        'mb-1 flex h-6 shrink-0 items-center rounded-md px-2 font-heading text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-out motion-reduce:transition-none group-data-[collapsible=icon]:-mt-7 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot='sidebar-group-action'
      data-sidebar='group-action'
      className={cn(
        'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-group-content'
      data-sidebar='group-content'
      className={cn('w-full text-sm', className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot='sidebar-menu'
      data-sidebar='menu'
      // Rows of one group stack flush, like a fold's sub-items, so a group
      // reads as one block against the wider gap between groups.
      className={cn('flex w-full min-w-0 flex-col gap-0', className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot='sidebar-menu-item'
      data-sidebar='menu-item'
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  // The current page is a soft accent wash, not a filled row; hover stays a
  // fainter tint of the same token so it never out-reads the active row.
  'peer/menu-button group/menu-button flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md p-2 text-left font-heading text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding,background-color,color] duration-200 ease-out motion-reduce:transition-none group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent/60 active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent/40 data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent/60 data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate',
  {
    variants: {
      variant: {
        default:
          'hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]',
      },
      size: {
        // One height and padding for every top-level nav row — links and folds
        // alike. Do not re-height a row per call site.
        default: 'h-9 text-sm',
        sm: 'h-7 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot.Root : 'button';
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot='sidebar-menu-button'
      data-sidebar='menu-button'
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === 'string') {
    tooltip = { children: tooltip };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side='right'
        align='center'
        hidden={state !== 'collapsed' || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot='sidebar-menu-action'
      data-sidebar='menu-action'
      className={cn(
        'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-menu-badge'
      data-sidebar='menu-badge'
      className={cn(
        'pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & { showIcon?: boolean }) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  });

  return (
    <div
      data-slot='sidebar-menu-skeleton'
      data-sidebar='menu-skeleton'
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className='size-4 rounded-md'
          data-sidebar='menu-skeleton-icon'
        />
      )}
      <Skeleton
        className='h-4 max-w-(--skeleton-width) flex-1'
        data-sidebar='menu-skeleton-text'
        style={{ '--skeleton-width': width } as React.CSSProperties}
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot='sidebar-menu-sub'
      data-sidebar='menu-sub'
      className={cn(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-0 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot='sidebar-menu-sub-item'
      data-sidebar='menu-sub-item'
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      data-slot='sidebar-menu-sub-button'
      data-sidebar='menu-sub-button'
      data-size={size}
      data-active={isActive}
      className={cn(
        // Same wash, weight, and heading face as the parent row above it, a
        // half-step tighter in box so the fold still reads as the level below.
        'flex h-8 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2.5 font-heading text-sidebar-foreground ring-sidebar-ring outline-hidden transition-colors duration-200 ease-out motion-reduce:transition-none group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent/60 active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent/60 data-active:font-medium data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarResizeHandle,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
