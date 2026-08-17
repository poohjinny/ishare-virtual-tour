"use client";

import { useRef, useState, type MouseEventHandler } from "react";

/**
 * Radix anchors a `DropdownMenu` to its trigger, so a right-click reuses the
 * row's kebab menu rather than a second menu with copied items: the pointer
 * position is expressed as align/side offsets from that button, which lands
 * the menu's top-left corner on the pointer. Collision handling then keeps a
 * cursor-opened menu on screen like a clicked one, flipping it above the
 * pointer near the bottom edge.
 */
type CursorAnchor = {
  align: "start";
  alignOffset: number;
  sideOffset: number;
  /*
   * Radix's default `sticky: 'partial'` limits the shift that keeps a menu on
   * screen to the span where it still touches its trigger, so every offset
   * past the kebab's own width was thrown away and the menu opened beside the
   * button. Shifting without that limit honours the pointer offset and still
   * clamps the menu to the viewport.
   */
  sticky: "always";
  collisionPadding: number;
};

/** Breathing room a cursor-opened menu keeps from the viewport edge. */
const VIEWPORT_MARGIN = 8;

/**
 * Radix hands a closing menu's focus back to its trigger, and the kebab is a
 * `TooltipTrigger`, so a plain click outside re-focuses the button and pops its
 * tooltip open. These handlers keep the focus return for the closes that need
 * it — Escape, a select — and drop it when a press outside is what dismissed
 * the menu, the way Radix already drops it for a right-click outside.
 */
type DismissHandlers = {
  onPointerDownOutside: () => void;
  onCloseAutoFocus: (event: Event) => void;
};

export type TableRowMenuContentProps = Partial<CursorAnchor> & DismissHandlers;

/*
 * Not `[data-slot="dropdown-menu-trigger"]`: every kebab is wrapped in a
 * `TooltipTrigger asChild`, whose `data-slot` is merged into the dropdown
 * trigger's props and re-applied after it, so the rendered button reports
 * `tooltip-trigger`. Radix writes `aria-haspopup` before caller props, so it
 * survives that merge.
 */
const ROW_TRIGGER_SELECTOR = '[aria-haspopup="menu"]';

export function useTableRowActionMenu() {
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  /*
   * An anchor belongs to a row and outlives that row's menu, because Radix
   * keeps a closed menu mounted for its exit animation: dropping the anchor as
   * the menu closes re-anchors the fading panel under the kebab, which reads as
   * a second menu opening at the dots and vanishing. Only the row's next open
   * replaces its anchor — cursor offsets for a right-click, `null` for a kebab
   * click, which is what returns that menu to the button.
   */
  const [anchors, setAnchors] = useState<Record<string, CursorAnchor | null>>(
    {},
  );
  /*
   * The row whose menu an outside press dismissed, tracked by row because the
   * press that closes one menu often opens another — a click on a second row's
   * kebab — and the first menu reports its close only once its exit animation
   * ends, after that second menu is up.
   */
  const pressDismissedRowRef = useRef<string | null>(null);

  function openRow(rowId: string, anchor: CursorAnchor | null) {
    if (pressDismissedRowRef.current === rowId) {
      pressDismissedRowRef.current = null;
    }
    setAnchors((current) => ({ ...current, [rowId]: anchor }));
    setOpenRowId(rowId);
  }

  function rowActionProps(
    rowId: string,
    disabled = false,
  ): { onContextMenu: MouseEventHandler<HTMLTableRowElement> } {
    return {
      onContextMenu: (event) => {
        if (disabled || event.defaultPrevented) return;
        const trigger = event.currentTarget.querySelector(ROW_TRIGGER_SELECTOR);
        // Rows without an action menu keep the browser menu.
        if (!trigger) return;
        event.preventDefault();
        const rect = trigger.getBoundingClientRect();
        openRow(rowId, {
          align: "start",
          alignOffset: event.clientX - rect.left,
          sideOffset: event.clientY - rect.bottom,
          sticky: "always",
          collisionPadding: VIEWPORT_MARGIN,
        });
      },
    };
  }

  function menuProps(rowId: string) {
    return {
      open: openRowId === rowId,
      onOpenChange: (open: boolean) => {
        if (open) {
          openRow(rowId, null);
          return;
        }
        /*
         * Only this row's close, because the press that dismisses a menu can
         * open the next one first: clicking a second row's kebab toggles that
         * menu open on `pointerdown`, and Radix reports the first menu's
         * outside-press close after it. An unscoped reset shut the menu that
         * had just opened.
         */
        setOpenRowId((current) => (current === rowId ? null : current));
      },
    };
  }

  function contentProps(rowId: string): TableRowMenuContentProps {
    return {
      ...anchors[rowId],
      onPointerDownOutside: () => {
        pressDismissedRowRef.current = rowId;
      },
      onCloseAutoFocus: (event) => {
        if (pressDismissedRowRef.current !== rowId) return;
        pressDismissedRowRef.current = null;
        event.preventDefault();
      },
    };
  }

  return { contentProps, menuProps, rowActionProps };
}
