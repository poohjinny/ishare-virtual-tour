'use client';

import { Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { FormDescription, FormHint } from '@/components/form-field';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BRANDING_COPY } from '@/lib/authoring-copy';
import { cn } from '@/lib/utils';

/** Official Google Fonts catalog mark (public-domain geometric logo). */
function GoogleFontsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 16 16'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      aria-hidden='true'
    >
      <path fill='#F29900' d='M13.5 2H8L1 13h5.5z' />
      <path fill='#1A73E8' d='M8 2h5v11H8z' />
      <circle fill='#EA4335' cx='3.25' cy='4.25' r='2.25' />
      <path
        fill='#0D652D'
        d='M13.33 10L13 13c-1.66 0-3-1.34-3-3s1.34-3 3-3l.33 3z'
      />
      <path
        fill='#174EA6'
        d='M10.5 4.5A2.5 2.5 0 0113 2l.45 2.5L13 7a2.5 2.5 0 01-2.5-2.5z'
      />
      <path fill='#1A73E8' d='M13 2a2.5 2.5 0 010 5' />
      <path fill='#34A853' d='M13 7c1.66 0 3 1.34 3 3s-1.34 3-3 3' />
    </svg>
  );
}

const BRAND_FONT_PRESETS = [
  { family: 'Montserrat', fallback: 'Arial, sans-serif' },
  { family: 'Open Sans', fallback: 'Arial, sans-serif' },
  { family: 'Lato', fallback: 'Arial, sans-serif' },
  { family: 'Poppins', fallback: 'Arial, sans-serif' },
  { family: 'Merriweather', fallback: 'Georgia, serif' },
  { family: 'Playfair Display', fallback: 'Georgia, serif' },
] as const;

/** Select values that are not a family name. */
const DEFAULT_FONT_VALUE = '__default';
const GOOGLE_FONT_VALUE = '__google';

/** Pause while typing before asking Google Fonts for the family. */
const GOOGLE_FONT_CHECK_MS = 400;

type GoogleFontStatus = 'valid' | 'invalid';

function googleFontUrl(family: string): string {
  const queryFamily = family.trim().replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${queryFamily}:wght@400;600&display=swap`;
}

function fontStack(family: string, fallback: string): string {
  return `'${family}', ${fallback}`;
}

function primaryFamily(fontFamily: string): string {
  const match = fontFamily.trim().match(/^['"]?([^'",]+)['"]?/);
  return match?.[1]?.trim() ?? fontFamily.trim();
}

function presetFamily(fontFamily: string): string | undefined {
  const name = primaryFamily(fontFamily).toLowerCase();
  return BRAND_FONT_PRESETS.find(({ family }) => family.toLowerCase() === name)
    ?.family;
}

/** One family name in, both stored values out. */
function valuesForFamily(familyName: string): {
  fontFamily: string;
  fontSourceUrl: string;
} {
  const family = primaryFamily(familyName);
  if (!family) return { fontFamily: '', fontSourceUrl: '' };

  const preset = BRAND_FONT_PRESETS.find(
    ({ family: name }) => name.toLowerCase() === family.toLowerCase(),
  );
  return {
    fontFamily: fontStack(family, preset?.fallback ?? 'Arial, sans-serif'),
    fontSourceUrl: googleFontUrl(preset?.family ?? family),
  };
}

function googleFontsPageUrl(family: string): string {
  const name = family.trim();
  if (!name) return 'https://fonts.google.com/';
  return `https://fonts.google.com/?query=${encodeURIComponent(name)}`;
}

/**
 * One preview stylesheet per family, kept for the session. The link's load /
 * error events are the check: Google answers an unknown family with 400, which
 * fails the stylesheet — unlike `fetch`, this is not blocked by CORS.
 */
const googleFontChecks = new Map<string, Promise<GoogleFontStatus>>();

function loadGoogleFont(family: string): Promise<GoogleFontStatus> {
  const key = family.toLowerCase();
  const cached = googleFontChecks.get(key);
  if (cached) return cached;

  const check = new Promise<GoogleFontStatus>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.adminFontPreview = key;
    link.addEventListener('load', () => resolve('valid'), { once: true });
    link.addEventListener('error', () => resolve('invalid'), { once: true });
    link.href = googleFontUrl(family);
    document.head.appendChild(link);
  });
  googleFontChecks.set(key, check);
  return check;
}

/**
 * Brand font: one select listing the platform default and the preset faces, with
 * a name field that appears only for `Google font…`. Authors deal in family
 * names; the CSS stack and stylesheet URL are derived. Typed Google names are
 * checked against fonts.googleapis.com before the source URL is kept.
 */
export function BrandFontField({
  idPrefix,
  fontFamily,
  disabled,
  onChange,
}: {
  idPrefix: string;
  fontFamily: string;
  disabled?: boolean;
  onChange: (fontFamily: string, fontSourceUrl: string) => void;
}) {
  const familyName = primaryFamily(fontFamily);
  const matchedPreset = presetFamily(fontFamily);
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleResult, setGoogleResult] = useState<{
    family: string;
    status: GoogleFontStatus;
  } | null>(null);
  // Sticky open only covers the empty Google-name row after picking
  // `Google font…`. A controlled preset/default from the parent (e.g. switching
  // the tour to client branding) must win — and a disabled field never keeps
  // that empty sticky open, or client mode would look like a frozen Google row.
  const isGoogleFont =
    (!!familyName && !matchedPreset) ||
    (googleOpen && !disabled && !familyName && !matchedPreset);
  const selectValue =
    isGoogleFont ? GOOGLE_FONT_VALUE
    : matchedPreset ? matchedPreset
    : DEFAULT_FONT_VALUE;

  const trimmedGoogleName = isGoogleFont ? familyName.trim() : '';
  const googleCheck =
    !trimmedGoogleName ? 'idle'
    : googleResult?.family === trimmedGoogleName ? googleResult.status
    : 'checking';

  const emitRef = useRef({ fontFamily: '', fontSourceUrl: '' });
  function emit(nextFamily: string, nextSourceUrl: string) {
    if (
      emitRef.current.fontFamily === nextFamily &&
      emitRef.current.fontSourceUrl === nextSourceUrl
    ) {
      return;
    }
    emitRef.current = { fontFamily: nextFamily, fontSourceUrl: nextSourceUrl };
    onChange(nextFamily, nextSourceUrl);
  }

  useEffect(() => {
    for (const { family } of BRAND_FONT_PRESETS) {
      void loadGoogleFont(family);
    }
  }, []);

  useEffect(() => {
    if (!trimmedGoogleName) return;

    const family = trimmedGoogleName;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadGoogleFont(family).then((status) => {
        if (cancelled) return;
        setGoogleResult({ family, status });
        // Keep the typed stack either way so the input stays filled; drop the
        // URL when Google has no such family, so a save cannot ship a
        // stylesheet that 404s for visitors.
        emit(
          fontStack(family, 'Arial, sans-serif'),
          status === 'valid' ? googleFontUrl(family) : '',
        );
      });
    }, GOOGLE_FONT_CHECK_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // emit closes over the latest onChange; the name drives the check.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [trimmedGoogleName]);

  const previewStack =
    isGoogleFont ?
      googleCheck === 'valid' ?
        fontFamily.trim() || undefined
      : undefined
    : fontFamily.trim() || undefined;
  const googleInvalid = googleCheck === 'invalid';
  const showPreview = !isGoogleFont || googleCheck === 'valid';
  const googleHint =
    googleCheck === 'checking' ? BRANDING_COPY.brandFontChecking
    : googleCheck === 'invalid' ? BRANDING_COPY.brandFontInvalid
    : BRANDING_COPY.brandFontCustomHint;

  function setFamily(name: string) {
    const next = valuesForFamily(name);
    // Optimistic URL while the debounced check runs; invalid clears it.
    emit(next.fontFamily, next.fontSourceUrl);
  }

  function selectFont(value: string) {
    if (value === GOOGLE_FONT_VALUE) {
      setGoogleOpen(true);
      if (matchedPreset) emit('', '');
      return;
    }
    setGoogleOpen(false);
    setFamily(value === DEFAULT_FONT_VALUE ? '' : value);
  }

  return (
    <div className='grid gap-2'>
      <Label htmlFor={`${idPrefix}-select`}>{BRANDING_COPY.brandFont}</Label>
      <FormDescription>{BRANDING_COPY.brandFontDescription}</FormDescription>
      {/*
       * The select is the field itself. Below its border: an inset Google-name
       * input (when needed) and a full-bleed preview for the current face.
       * Focus chrome sits on the box, so the select drops its own border and ring.
       */}
      <div
        className={cn(
          'grid overflow-hidden rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30 has-[:disabled]:opacity-50 dark:bg-input/30',
          googleInvalid &&
            'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        )}
      >
        <Select
          value={selectValue}
          onValueChange={selectFont}
          disabled={disabled}
        >
          <SelectTrigger
            id={`${idPrefix}-select`}
            className='rounded-none border-0 focus-visible:ring-0 disabled:opacity-100 dark:bg-transparent'
            style={{ fontFamily: isGoogleFont ? undefined : previewStack }}
          >
            <SelectValue>
              {isGoogleFont ?
                familyName.trim() || BRANDING_COPY.brandFontGoogleSelected
              : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_FONT_VALUE}>
              {BRANDING_COPY.brandFontDefault}
            </SelectItem>
            <SelectSeparator />
            {BRAND_FONT_PRESETS.map(({ family, fallback }) => (
              <SelectItem
                key={family}
                value={family}
                style={{ fontFamily: fontStack(family, fallback) }}
              >
                {family}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value={GOOGLE_FONT_VALUE}>
              {BRANDING_COPY.brandFontGoogle}
            </SelectItem>
          </SelectContent>
        </Select>

        <div className='grid border-t border-input'>
          {isGoogleFont ?
            <div
              className={cn(
                'grid gap-1.5 px-2.5 pt-3.5',
                // No preview panel below means this row owes the box its floor.
                !showPreview && 'pb-2.5',
              )}
            >
              <div className='relative w-full'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={googleFontsPageUrl(familyName)}
                      target='_blank'
                      rel='noreferrer'
                      aria-label={BRANDING_COPY.brandFontBrowse}
                      className='absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center'
                    >
                      <GoogleFontsIcon className='size-5' />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    {BRANDING_COPY.brandFontBrowse}
                  </TooltipContent>
                </Tooltip>
                <Input
                  id={`${idPrefix}-family`}
                  aria-label={BRANDING_COPY.brandFontNameLabel}
                  aria-invalid={googleInvalid || undefined}
                  aria-describedby={`${idPrefix}-google-hint`}
                  value={familyName}
                  onChange={(event) => setFamily(event.target.value)}
                  placeholder={BRANDING_COPY.brandFontPlaceholder}
                  disabled={disabled}
                  className='pl-9 not-read-only:focus-visible:ring-0 disabled:opacity-100'
                  style={{ fontFamily: previewStack }}
                />
              </div>
              <FormHint
                id={`${idPrefix}-google-hint`}
                className={googleInvalid ? 'text-destructive' : undefined}
              >
                {googleHint}
              </FormHint>
            </div>
          : null}

          {/* Only a face that actually loaded is worth previewing. Fold uses the
              same height/opacity keyframes as form-section collapses. */}
          <Collapsible open={showPreview} data-slot='brand-font-preview'>
            <CollapsibleContent className='overflow-hidden'>
              <div
                className={cn(
                  'grid gap-0.5 bg-muted/40 px-2.5 py-2',
                  // Extra air under the Google-name hint before the panel.
                  isGoogleFont && 'mt-3.5',
                )}
              >
                <div className='type-meta flex items-center gap-1.5 text-muted-foreground'>
                  <Type aria-hidden='true' className='size-3' />
                  {BRANDING_COPY.brandFontPreview}
                </div>
                <p className='text-base' style={{ fontFamily: previewStack }}>
                  {BRANDING_COPY.brandFontPreviewText}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
