'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState, type RefObject } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { THREAD_NEAR_BOTTOM_PX } from '@/hooks/use-thread-autoscroll';
import { ADMIN_GUIDE_COPY } from '@/lib/authoring-copy';
import { cn } from '@/lib/utils';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Floating jump-to-latest for a chat thread — same show rule as the viewer
 * Tour Guide (`AiThreadScrollToBottom`): visible once the reader is more than
 * the near-bottom window away from the newest output.
 */
export function ThreadScrollToBottom({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const sync = () => {
      const remaining = root.scrollHeight - root.scrollTop - root.clientHeight;
      setVisible(remaining > THREAD_NEAR_BOTTOM_PX);
    };

    let frame = window.requestAnimationFrame(sync);
    root.addEventListener('scroll', sync, { passive: true });

    const observer =
      typeof ResizeObserver !== 'undefined' ?
        new ResizeObserver(() => {
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(sync);
        })
      : null;
    observer?.observe(root);
    // Cards can grow scrollHeight without changing the scroller's border box.
    const content = root.firstElementChild;
    if (content) observer?.observe(content);

    return () => {
      window.cancelAnimationFrame(frame);
      root.removeEventListener('scroll', sync);
      observer?.disconnect();
    };
  }, [scrollRef]);

  return (
    <div
      className='pointer-events-none absolute inset-x-0 bottom-2 flex justify-center'
      aria-hidden={!visible}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            tabIndex={visible ? 0 : -1}
            aria-label={ADMIN_GUIDE_COPY.scrollToBottom}
            className={cn(
              'pointer-events-auto rounded-full bg-background shadow-md transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none',
              visible ? 'opacity-100' : 'translate-y-1 opacity-0',
            )}
            onClick={() => {
              const root = scrollRef.current;
              if (!root) return;
              root.scrollTo({
                top: Math.max(0, root.scrollHeight - root.clientHeight),
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
              });
            }}
          >
            <ChevronDown aria-hidden='true' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='left'>
          {ADMIN_GUIDE_COPY.scrollToBottom}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
