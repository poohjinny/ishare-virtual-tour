'use client';

import { useEffect, useRef, useState } from 'react';

const COUNT_UP_MS = 1500;
/** Ease-out exponent: higher launches harder and coasts longer into the value. */
const COUNT_UP_EASE_EXPONENT = 5;

/** Counts integer stats with a pronounced ease-out, then settles on the exact value. */
export function AnimatedStatValue({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValue = useRef(0);

  useEffect(() => {
    let frame = 0;
    const from = currentValue.current;
    const distance = value - from;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentValue.current = value;
      frame = window.requestAnimationFrame(() => setDisplayValue(value));
      return () => window.cancelAnimationFrame(frame);
    }

    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / COUNT_UP_MS, 1);
      const eased = 1 - (1 - progress) ** COUNT_UP_EASE_EXPONENT;
      const nextValue =
        progress === 1 ? value : Math.round(from + distance * eased);

      currentValue.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      <span aria-hidden='true'>{displayValue}</span>
      <span className='sr-only'>{value}</span>
    </>
  );
}
