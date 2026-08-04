import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

export interface ExploreDirectorySectionPin {
  key: string;
  tab: 'locations' | 'naming';
  label: string;
  denseBottom: boolean;
  groupsAnyExpanded: boolean;
  hasToggle: boolean;
}

export interface ExploreDirectoryGroupPin {
  key: string;
  title: string;
  metaLabel?: string;
  expanded: boolean;
}

export interface ExploreDirectoryScrollPinsState {
  section: ExploreDirectorySectionPin | null;
  group: ExploreDirectoryGroupPin | null;
}

const EMPTY_PINS: ExploreDirectoryScrollPinsState = {
  section: null,
  group: null,
};

/** Treat near-zero as top — subpixel / bounce can leave fractional scrollTop. */
const PIN_SCROLL_TOP_EPS_PX = 1;

/**
 * After a pin key change, ignore further key flips briefly so pin-bar mount
 * layout doesn’t thrash resolve. Clearing to empty still bypasses this.
 */
const PIN_KEY_SETTLE_MS = 48;

function findPinSource(root: HTMLElement, key: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `[data-directory-pin-key="${key.replace(/"/g, '\\"')}"]`,
  );
}

function pinSourceLayoutBox(el: HTMLElement): HTMLElement {
  if (el.hasAttribute('data-directory-pin-row')) return el;
  return el.closest<HTMLElement>('[data-directory-pin-row]') ?? el;
}

function groupToggleEl(el: HTMLElement): HTMLElement | null {
  if (el.hasAttribute('aria-expanded')) return el;
  return el.querySelector<HTMLElement>('[aria-expanded]');
}

function readSectionPin(el: HTMLElement): ExploreDirectorySectionPin | null {
  const key = el.getAttribute('data-directory-pin-key');
  if (!key) return null;
  const tabAttr = el.getAttribute('data-directory-pin-tab');
  const tab = tabAttr === 'naming' ? 'naming' : 'locations';
  const label =
    el.querySelector('[data-directory-pin-label]')?.textContent?.trim() || '';
  const toggle =
    el.matches('[data-directory-pin-section-toggle]') ? el : (
      el.querySelector('[data-directory-pin-section-toggle]')
    );
  return {
    key,
    tab,
    label,
    denseBottom: el.hasAttribute('data-directory-pin-dense-bottom'),
    groupsAnyExpanded: toggle?.getAttribute('aria-expanded') === 'true',
    hasToggle: Boolean(toggle),
  };
}

function readGroupPin(el: HTMLElement): ExploreDirectoryGroupPin | null {
  const key = el.getAttribute('data-directory-pin-key');
  if (!key) return null;
  const title =
    el.querySelector('[data-directory-pin-group-title]')?.textContent?.trim() ||
    '';
  const meta =
    el.querySelector('[data-directory-pin-group-meta]')?.textContent?.trim() ||
    undefined;
  const toggle = groupToggleEl(el);
  return {
    key,
    title,
    metaLabel: meta || undefined,
    expanded: toggle?.getAttribute('aria-expanded') === 'true',
  };
}

function samePinKeys(
  a: ExploreDirectoryScrollPinsState,
  b: ExploreDirectoryScrollPinsState,
): boolean {
  return a.section?.key === b.section?.key && a.group?.key === b.group?.key;
}

function samePins(
  a: ExploreDirectoryScrollPinsState,
  b: ExploreDirectoryScrollPinsState,
): boolean {
  return (
    samePinKeys(a, b) &&
    a.section?.label === b.section?.label &&
    a.section?.denseBottom === b.section?.denseBottom &&
    a.section?.groupsAnyExpanded === b.section?.groupsAnyExpanded &&
    a.section?.hasToggle === b.section?.hasToggle &&
    a.group?.title === b.group?.title &&
    a.group?.metaLabel === b.group?.metaLabel &&
    a.group?.expanded === b.group?.expanded
  );
}

function isGroupExpanded(el: HTMLElement): boolean {
  return groupToggleEl(el)?.getAttribute('aria-expanded') === 'true';
}

/** Whole titled row has scrolled above the scroller clip. */
function isRowFullyPast(el: HTMLElement, edge: number): boolean {
  return pinSourceLayoutBox(el).getBoundingClientRect().bottom <= edge;
}

function firstSectionEl(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    '[data-directory-pin-source="section"]',
  );
}

/** Default pin: first section title (Places / Naming), no department. */
function defaultSectionPins(
  root: HTMLElement,
): ExploreDirectoryScrollPinsState {
  const el = firstSectionEl(root);
  return { section: el ? readSectionPin(el) : null, group: null };
}

function clearPinnedSectionCollapse(root: HTMLElement) {
  root.querySelectorAll('[data-directory-pin-active]').forEach((node) => {
    node.removeAttribute('data-directory-pin-active');
    if (node.getAttribute('data-directory-pin-a11y-hidden') === '1') {
      node.removeAttribute('aria-hidden');
      node.removeAttribute('data-directory-pin-a11y-hidden');
    }
  });
}

/**
 * Collapse the in-flow section that the pin bar is mirroring so the heading
 * isn’t duplicated. Groups stay in-flow (they’re past the clip when pinned).
 */
function syncPinnedSectionCollapse(
  root: HTMLElement,
  pins: ExploreDirectoryScrollPinsState,
) {
  clearPinnedSectionCollapse(root);
  if (!pins.section) return;
  const el = findPinSource(root, pins.section.key);
  if (!el) return;
  const box = pinSourceLayoutBox(el);
  box.setAttribute('data-directory-pin-active', '');
  box.setAttribute('aria-hidden', 'true');
  box.setAttribute('data-directory-pin-a11y-hidden', '1');
}

/**
 * First section is always the default pin. Scroll only updates department /
 * later section pins; returning to top restores the default.
 * Display collapses the mirrored in-flow section — never rewrites scrollTop.
 */
function resolvePins(root: HTMLElement): ExploreDirectoryScrollPinsState {
  const defaults = defaultSectionPins(root);
  if (!defaults.section) return EMPTY_PINS;

  if (root.scrollTop <= PIN_SCROLL_TOP_EPS_PX) {
    return defaults;
  }

  const edge = root.getBoundingClientRect().top;
  const sections = [
    ...root.querySelectorAll<HTMLElement>(
      '[data-directory-pin-source="section"]',
    ),
  ];
  const groups = [
    ...root.querySelectorAll<HTMLElement>(
      '[data-directory-pin-source="group"]',
    ),
  ];

  let groupEl: HTMLElement | null = null;
  for (const el of groups) {
    if (!isGroupExpanded(el)) continue;
    if (isRowFullyPast(el, edge)) groupEl = el;
  }

  // Prefer the last fully-past section; otherwise keep the first-section default.
  let sectionEl: HTMLElement | null = null;
  if (groupEl) {
    for (const el of sections) {
      if (!isRowFullyPast(el, edge)) continue;
      const pos = el.compareDocumentPosition(groupEl);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
        sectionEl = el;
      }
    }
  } else {
    for (const el of sections) {
      if (isRowFullyPast(el, edge)) sectionEl = el;
    }
  }

  return {
    section: sectionEl ? readSectionPin(sectionEl) : defaults.section,
    group: groupEl ? readGroupPin(groupEl) : null,
  };
}

export function useExploreDirectoryScrollPins(
  scrollRef: RefObject<HTMLElement | null>,
  contentKey: string | number,
): { pins: ExploreDirectoryScrollPinsState; updatePins: () => void } {
  const [pins, setPins] = useState<ExploreDirectoryScrollPinsState>(EMPTY_PINS);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const rafRef = useRef<number | null>(null);
  const keySettleUntilRef = useRef(0);

  const updatePinsNow = useCallback(() => {
    const root = scrollRef.current;
    if (!root) {
      setPins((prev) => (prev.section || prev.group ? EMPTY_PINS : prev));
      return;
    }

    const next = resolvePins(root);
    const prev = pinsRef.current;

    if (
      !samePinKeys(prev, next) &&
      performance.now() < keySettleUntilRef.current
    ) {
      if (!next.section && !next.group) {
        setPins((p) => (samePins(p, EMPTY_PINS) ? p : EMPTY_PINS));
        return;
      }
      const settled: ExploreDirectoryScrollPinsState = {
        section:
          prev.section && next.section?.key === prev.section.key ?
            next.section
          : prev.section,
        group:
          prev.group && next.group?.key === prev.group.key ?
            next.group
          : prev.group,
      };
      setPins((p) => (samePins(p, settled) ? p : settled));
      return;
    }

    if (!samePinKeys(prev, next)) {
      keySettleUntilRef.current = performance.now() + PIN_KEY_SETTLE_MS;
    }

    setPins((p) => (samePins(p, next) ? p : next));
  }, [scrollRef]);

  const updatePins = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updatePinsNow();
    });
  }, [updatePinsNow]);

  useLayoutEffect(() => {
    keySettleUntilRef.current = 0;
    updatePinsNow();
  }, [contentKey, updatePinsNow, scrollRef]);

  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    syncPinnedSectionCollapse(root, pins);
  }, [pins, scrollRef, pins.section?.key]);

  useLayoutEffect(() => {
    const onResize = () => updatePins();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [updatePins]);

  useLayoutEffect(() => {
    const root = scrollRef.current;
    return () => {
      if (root) clearPinnedSectionCollapse(root);
    };
  }, [scrollRef]);

  return { pins, updatePins };
}

function clickExploreDirectoryPinSource(
  scrollRoot: HTMLElement | null | undefined,
  key: string,
) {
  const el = scrollRoot ? findPinSource(scrollRoot, key) : null;
  if (!el) return;
  const toggle =
    el.querySelector<HTMLElement>('[data-directory-pin-section-toggle]') ??
    groupToggleEl(el) ??
    el.querySelector<HTMLElement>('button');
  (toggle ?? el).click();
}

export { clickExploreDirectoryPinSource };
