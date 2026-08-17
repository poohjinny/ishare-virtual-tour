'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function useObjectUrl(file: File | null) {
  const url = useMemo(
    () =>
      file?.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    [file],
  );

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}

/**
 * File control shaped like the viewer Dev panel field: a Choose row on top and
 * the image preview inside the same bordered shell. With no pick yet, the
 * already-saved asset previews instead, so replacing shows what it replaces.
 */
export function FileInput({
  id,
  file,
  onFileChange,
  accept,
  disabled,
  required,
  aspect = 'square',
  currentUrl,
  currentFallbackUrl,
  className,
}: {
  id?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  required?: boolean;
  /** `video` for panoramas (full-width 2:1), `square` for logos and favicons. */
  aspect?: 'square' | 'video';
  /** Saved asset shown until a new file is picked. */
  currentUrl?: string;
  /** Second path to try — favicons are `.png` or `.ico` by convention. */
  currentFallbackUrl?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const pickedUrl = useObjectUrl(file);

  /**
   * Conventional asset paths are guesses: a miss tries the fallback path, then
   * hides the panel instead of leaving a broken image behind. Misses are keyed
   * by the URL they belong to, so a new `currentUrl` starts over on its own.
   */
  const [misses, setMisses] = useState({ url: currentUrl, count: 0 });
  const missCount = misses.url === currentUrl ? misses.count : 0;
  const currentSrc =
    missCount === 0 ? currentUrl
    : missCount === 1 ? currentFallbackUrl
    : undefined;

  // Clearing the bound file has to reset the native input, or picking the same
  // file again fires no change event.
  useEffect(() => {
    if (file || !inputRef.current) return;
    inputRef.current.value = '';
  }, [file]);

  const previewUrl = pickedUrl ?? currentSrc;
  const imageClassName = cn(
    'block rounded-md',
    aspect === 'video' ?
      'aspect-[2/1] w-full object-cover object-center'
    : 'max-h-10 w-auto max-w-full object-contain object-left',
  );

  return (
    <div
      className={cn(
        'grid w-full min-w-0 overflow-hidden rounded-lg border border-input bg-transparent transition-colors',
        'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30',
        disabled ?
          'cursor-not-allowed bg-input/50 opacity-50 dark:bg-input/80'
        : 'hover:border-ring/40 dark:bg-input/30',
        className,
      )}
    >
      <div className='flex min-w-0 items-center gap-2 p-1'>
        <Button
          type='button'
          variant='outline'
          size='xs'
          disabled={disabled}
          aria-controls={inputId}
          onClick={() => inputRef.current?.click()}
        >
          Choose
        </Button>
        <span
          className={cn(
            'min-w-0 flex-1 truncate type-meta',
            !file && 'text-muted-foreground/50',
          )}
          title={file?.name}
        >
          {file?.name ??
            (currentSrc ?
              'Current file — choose to replace'
            : 'No file chosen')}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type='file'
          accept={accept}
          disabled={disabled}
          required={required}
          className='sr-only'
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </div>
      {previewUrl ?
        <div className='grid gap-2 border-t border-input bg-muted/30 p-2'>
          {/* eslint-disable-next-line @next/next/no-img-element -- object URL / viewer-origin asset */}
          <img
            src={previewUrl}
            alt=''
            className={imageClassName}
            onError={
              pickedUrl ? undefined : (
                () => setMisses({ url: currentUrl, count: missCount + 1 })
              )
            }
          />
          {file ?
            <div className='flex justify-start'>
              <Button
                type='button'
                variant='outline'
                size='xs'
                disabled={disabled}
                onClick={() => onFileChange(null)}
              >
                Clear
              </Button>
            </div>
          : null}
        </div>
      : null}
    </div>
  );
}
