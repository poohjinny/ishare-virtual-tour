'use client';

import * as React from 'react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';

/**
 * Radix closes a menu on select or an outside press — neither of which a route
 * change has to involve. Admin chrome (account, crumb `PeerSwitcher`, Debug)
 * and the visual editor stay mounted across navigations on purpose, so a
 * back/forward, a `router.push`, or a select whose close is dropped while the
 * transition re-renders leaves the portal open over the next page. A modal one
 * takes its scroll lock, `aria-hidden`, and outside-pointer-events lock along
 * with it, which reads as the next click going nowhere. Own the open state so
 * every menu — controlled or not — closes when the pathname changes.
 */
function DropdownMenu({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  const pathname = usePathname();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  /*
   * Latest-value refs, not deps: callers pass an inline `onOpenChange`, so a
   * `setOpen` dependency would re-run the close below on every render and shut
   * the menu as it opens.
   */
  const openRef = React.useRef(isOpen);
  const setOpenRef = React.useRef(setOpen);
  React.useEffect(() => {
    openRef.current = isOpen;
    setOpenRef.current = setOpen;
  });

  const closedForPathname = React.useRef(pathname);
  React.useEffect(() => {
    if (closedForPathname.current === pathname) return;
    closedForPathname.current = pathname;
    if (openRef.current) setOpenRef.current(false);
  }, [pathname]);

  return (
    <DropdownMenuPrimitive.Root
      data-slot='dropdown-menu'
      open={isOpen}
      onOpenChange={setOpen}
      {...props}
    />
  );
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot='dropdown-menu-portal' {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot='dropdown-menu-trigger'
      {...props}
    />
  );
}

function ignoreIframeFocusOutside(event: Event) {
  if (event.defaultPrevented) return;
  if (document.activeElement instanceof HTMLIFrameElement) {
    event.preventDefault();
  }
}

/**
 * Radix keeps a closed menu mounted for its exit animation, and holds the
 * faded-out end state by setting `animation-fill-mode: forwards` inline the
 * moment the animation ends — then clears that inline style on the next task,
 * assuming React has unmounted the node by then. A menu whose item navigates
 * breaks the assumption: the unmount commit is queued behind the route
 * transition, so the cleared fill lets the finished animation be dropped and
 * the panel repaints at its base style — full opacity, full scale. It reads as
 * the menu re-opening after it closed, then closing again once the navigation
 * lands. Make the exit end state the resting state of a closed panel instead,
 * and keep one nobody can see from swallowing clicks on the page it covers.
 */
const MENU_EXIT_HOLD =
  'data-closed:fill-mode-forwards data-closed:pointer-events-none';

function DropdownMenuContent({
  className,
  align = 'start',
  sideOffset = 4,
  onFocusOutside,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot='dropdown-menu-content'
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'ishare-scrollbar admin-menu-scroll z-50 w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          MENU_EXIT_HOLD,
          className,
        )}
        onFocusOutside={(event) => {
          onFocusOutside?.(event);
          ignoreIframeFocusOutside(event);
        }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot='dropdown-menu-group' {...props} />
  );
}

/**
 * Highlight tone fades on the same 200ms ease-out beat as a sidebar row, so a
 * pointer crossing the menu washes rather than snaps. Icons carry their own
 * tone instead of inheriting the row's, so they need the transition too.
 */
const MENU_ROW_MOTION =
  'transition-colors duration-200 ease-out motion-reduce:transition-none [&_svg]:transition-colors [&_svg]:duration-200 [&_svg]:ease-out motion-reduce:[&_svg]:transition-none';

/**
 * Every menu row reads `[leading icon] [label] … [trailing affordance]`, where
 * the trailing slot is the check, submenu chevron, or shortcut.
 * Call sites pass content only — the row owns its icon/label gap.
 */
function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot='dropdown-menu-item'
      data-inset={inset}
      data-variant={variant}
      className={cn(
        MENU_ROW_MOTION,
        "group/dropdown-menu-item relative flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground/70 data-[variant=destructive]:*:[svg]:text-destructive",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The one selected-state row in a menu, for both an exclusive choice and a
 * multi-select group — the control is identical, only the caller's selection
 * logic differs: an exclusive group keeps one row `checked` and re-applies the
 * value on select, a multi-select group toggles each row on its own. There is
 * no radio row.
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot='dropdown-menu-checkbox-item'
      data-inset={inset}
      data-variant={variant}
      className={cn(
        MENU_ROW_MOTION,
        "group/dropdown-checkbox relative flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      {/*
        Leading icons live here so the trailing check keeps its own tone, and
        they sit on the first copy line like the check does on a two-line row.
      */}
      <span className="flex min-w-0 flex-1 items-start gap-2 [&>svg]:mt-0.5 [&_svg:not([class*='text-'])]:text-muted-foreground/70 group-data-[variant=destructive]/dropdown-checkbox:[&_svg]:text-destructive">
        {children}
      </span>
      {/*
        A check mark only when selected — no empty box on the unselected rows,
        which read as "toggle as many as you like" on an exclusive menu. Same
        glyph and tone as a selected `SelectItem` or `PeerSwitcher` row.
      */}
      <span
        className='pointer-events-none mt-0.5 flex size-4 shrink-0 items-center justify-center'
        data-slot='dropdown-menu-checkbox-item-indicator'
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className='text-primary group-data-[variant=destructive]/dropdown-checkbox:text-destructive' />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot='dropdown-menu-label'
      data-inset={inset}
      className={cn(
        'px-1.5 py-1 font-heading text-xs font-medium text-muted-foreground data-inset:pl-7',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot='dropdown-menu-separator'
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='dropdown-menu-shortcut'
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Radix opens a submenu on hover, but while an *earlier* submenu is open it
 * draws a 300ms "grace polygon" from the exit point across that panel and
 * `preventDefault()`s item-enter inside it. A tall panel covers the rows below
 * its trigger, so moving straight down to a sibling submenu is swallowed — and
 * a parked cursor fires no further pointermove, so it never recovers. We hover
 * the sub open ourselves, which the grace area cannot suppress.
 */
const SUB_HOVER_OPEN_MS = 100;

const SubOpenContext = React.createContext<((open: boolean) => void) | null>(
  null,
);

function DropdownMenuSub({
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  const [hoverOpen, setHoverOpen] = React.useState(false);
  const isControlled = open !== undefined;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setHoverOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SubOpenContext.Provider value={setOpen}>
      <DropdownMenuPrimitive.Sub
        data-slot='dropdown-menu-sub'
        open={isControlled ? open : hoverOpen}
        onOpenChange={setOpen}
        {...props}
      />
    </SubOpenContext.Provider>
  );
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  onPointerEnter,
  onPointerLeave,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  const setOpen = React.useContext(SubOpenContext);
  const openTimer = React.useRef(0);

  const clearOpenTimer = React.useCallback(() => {
    window.clearTimeout(openTimer.current);
    openTimer.current = 0;
  }, []);

  React.useEffect(() => clearOpenTimer, [clearOpenTimer]);

  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot='dropdown-menu-sub-trigger'
      data-inset={inset}
      className={cn(
        MENU_ROW_MOTION,
        // Top-aligned like a check row: a trigger whose label carries a hint
        // line keeps its icon and chevron on the label, not on the hint.
        "flex cursor-default items-start gap-2 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-open:bg-accent data-open:text-accent-foreground [&>svg]:mt-0.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground/70 data-open:[&_svg:not([class*='text-'])]:text-accent-foreground",
        className,
      )}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType !== 'mouse' || props.disabled || !setOpen) return;

        const trigger = event.currentTarget;
        clearOpenTimer();
        openTimer.current = window.setTimeout(() => {
          openTimer.current = 0;
          if (!trigger.isConnected || !trigger.matches(':hover')) return;
          // Focus so the sibling submenu closes on focus-outside, as on a
          // hover Radix handled itself.
          trigger.focus();
          setOpen(true);
        }, SUB_HOVER_OPEN_MS);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        clearOpenTimer();
      }}
      {...props}
    >
      {children}
      <ChevronRightIcon className='ml-auto' />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  onFocusOutside,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot='dropdown-menu-sub-content'
      className={cn(
        'ishare-scrollbar admin-menu-scroll z-50 min-w-[96px] origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
        MENU_EXIT_HOLD,
        className,
      )}
      onFocusOutside={(event) => {
        onFocusOutside?.(event);
        ignoreIframeFocusOutside(event);
      }}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
