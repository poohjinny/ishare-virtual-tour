import type { RefObject } from 'react';
import type { TourBranding } from '../types/tour';

export const CLIENT_FONT_VAR = '--client-font';
const FONT_LINK_SELECTOR = 'link[data-client-font]';

const PLATFORM_BODY_FONT = "'Roboto', Arial, sans-serif";
const PLATFORM_DISPLAY_FONT = "'Google Sans', system-ui, sans-serif";

function normalizeFontStack(stack: string): string {
  return stack.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Skip override when the client stack matches a platform font. */
export function resolveClientFontFamily(
  fontFamily?: string,
): string | undefined {
  if (!fontFamily?.trim()) return undefined;

  const normalized = normalizeFontStack(fontFamily);
  if (normalized === normalizeFontStack(PLATFORM_BODY_FONT)) return undefined;
  if (normalized === normalizeFontStack(PLATFORM_DISPLAY_FONT))
    return undefined;

  return fontFamily.trim();
}

function isAllowedFontSource(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' && parsed.hostname === 'fonts.googleapis.com'
    );
  } catch {
    return false;
  }
}

function getFontLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>(FONT_LINK_SELECTOR);
}

function ensureFontLink(sourceUrl: string): void {
  if (!isAllowedFontSource(sourceUrl)) return;

  let link = getFontLink();
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.clientFont = 'true';
    document.head.appendChild(link);
  }

  if (link.href !== sourceUrl) {
    link.href = sourceUrl;
  }
}

/** Sets `--client-font` on the tour root — body and display resolve via tour-page tokens. */
export function applyClientFont(
  root: HTMLElement | null,
  branding?: Pick<TourBranding, 'fontFamily' | 'fontSourceUrl'>,
): void {
  if (!root) return;

  const clientFont = resolveClientFontFamily(branding?.fontFamily);
  if (clientFont) {
    root.style.setProperty(CLIENT_FONT_VAR, clientFont);
  }

  if (clientFont && branding?.fontSourceUrl) {
    ensureFontLink(branding.fontSourceUrl);
  }
}

export function resetClientFont(root: HTMLElement | null): void {
  root?.style.removeProperty(CLIENT_FONT_VAR);
  getFontLink()?.remove();
}

export type ClientFontRootRef = RefObject<HTMLElement | null>;
