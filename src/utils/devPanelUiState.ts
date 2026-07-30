import type { DevPanelTab } from '../constants/devPanel';
import { DEV_PANEL_TABS } from '../constants/devPanel';

/**
 * Survives DevTools remount during ?dev=1 tour switches (bootstrap splash
 * briefly unmounts the panel tree). In-memory for the tab session only.
 */
let rememberedPanelOpen: boolean | null = null;
let rememberedPanelTab: DevPanelTab | null = null;
let rememberedPanelScrollTop = 0;

const PANEL_TAB_IDS = new Set<string>(DEV_PANEL_TABS.map((tab) => tab.id));

export function readRememberedDevPanelOpen(fallback: boolean): boolean {
  return rememberedPanelOpen ?? fallback;
}

export function writeRememberedDevPanelOpen(open: boolean): void {
  rememberedPanelOpen = open;
}

export function readRememberedDevPanelTab(fallback: DevPanelTab): DevPanelTab {
  if (rememberedPanelTab && PANEL_TAB_IDS.has(rememberedPanelTab)) {
    return rememberedPanelTab;
  }
  return fallback;
}

export function writeRememberedDevPanelTab(tab: DevPanelTab): void {
  rememberedPanelTab = tab;
}

export function readRememberedDevPanelScrollTop(): number {
  return rememberedPanelScrollTop;
}

export function writeRememberedDevPanelScrollTop(scrollTop: number): void {
  rememberedPanelScrollTop = Math.max(0, scrollTop);
}
