import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type GuideTextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; label: string; href: string };

/** Fixture / shell markdown: `[Tours](/tours)` → in-app Link. Paths must start with `/`. */
const GUIDE_LINK_RE = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;

export function parseGuideMessageText(text: string): GuideTextPart[] {
  const parts: GuideTextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(GUIDE_LINK_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) });
    }
    parts.push({ type: 'link', label: match[1] ?? '', href: match[2] ?? '/' });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: text }];
}

export function GuideMessageBody({
  text,
  tone,
}: {
  text: string;
  tone: 'assistant' | 'user';
}) {
  const parts = parseGuideMessageText(text);
  const nodes: ReactNode[] = [];

  for (const [index, part] of parts.entries()) {
    if (part.type === 'text') {
      nodes.push(<Fragment key={index}>{part.value}</Fragment>);
      continue;
    }
    nodes.push(
      <Link
        key={index}
        href={part.href}
        prefetch
        className={cn(
          'font-medium underline underline-offset-2 transition-opacity hover:opacity-80',
          tone === 'user' ? 'text-primary-foreground' : 'text-primary',
        )}
      >
        {part.label}
      </Link>,
    );
  }

  return <>{nodes}</>;
}
