'use client';

import { useEffect, useState } from 'react';

import { ADMIN_GUIDE_COPY } from '@/lib/authoring-copy';

const PHRASE_ROTATE_MS = 2200;

/** Reply pending — bouncing dots + rotating status copy (viewer Guide parity). */
export function GuideThinkingIndicator() {
  const phrases = ADMIN_GUIDE_COPY.thinkingPhrases;
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setPhraseIndex((index) => (index + 1) % phrases.length);
    }, PHRASE_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [phrases.length]);

  return (
    <div
      className='mr-auto flex items-center gap-2 rounded-xl bg-muted px-3 py-2'
      aria-live='polite'
      aria-busy='true'
    >
      <span className='flex items-center gap-1' aria-hidden='true'>
        {[0, 0.16, 0.32].map((delay) => (
          <span
            key={delay}
            className='size-1.5 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none'
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </span>
      <span className='type-meta'>{phrases[phraseIndex]}</span>
    </div>
  );
}
