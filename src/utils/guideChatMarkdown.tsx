import { Fragment, type ReactNode } from 'react';
import {
  namingOpportunityStatusConfig,
  namingOpportunityStatusFromParenLabel,
} from '../data/namingOpportunityStatus';
import { cn } from '../lib/cn';
import { NamingStatusBadge } from '../components/ui/NamingStatusBadge';

const LIST_ITEM_RE = /^(\s*)([-*•]|\d+[.)])\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const INLINE_TOKEN_RE =
  /(\*\*[^*]+?\*\*|__[^_]+?__|~~[^~]+?~~|`[^`]+?`|\[[^\]]+?\]\([^)\s]+\)|\*[^*]+?\*|_[^_\s][^_]*?_|https?:\/\/[^\s<>\]]+)/g;
/** Guide lists often append status after the name: `Family Corridor (Open)`. */
const STATUS_PAREN_RE = /(\s*)\(([^)\n]+)\)/g;

/** Compact fill chip aligned with guide card status badges. */
const guideInlineStatusBadgeClassName = cn(
  'mx-1 align-middle px-1.5 py-0.5 text-[0.5625rem] font-medium leading-none tracking-[0.03em]',
);

function isSafeHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function trimTrailingPunctuation(url: string): {
  href: string;
  trailing: string;
} {
  const match = url.match(/^(.*?)([),.!?;:]+)$/);
  if (!match) return { href: url, trailing: '' };
  const href = match[1] ?? url;
  const trailing = match[2] ?? '';
  if (!isSafeHttpUrl(href)) return { href: url, trailing: '' };
  return { href, trailing };
}

function renderPlainWithStatusBadges(
  text: string,
  keyPrefix: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(STATUS_PAREN_RE)) {
    const full = match[0];
    const start = match.index ?? 0;
    const inner = match[2] ?? '';
    const status = namingOpportunityStatusFromParenLabel(inner);
    if (!status) continue;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const config = namingOpportunityStatusConfig(status);
    nodes.push(
      <NamingStatusBadge
        key={`${keyPrefix}-st${tokenIndex++}`}
        status={status}
        compact
        includeOpen
        ariaLabel={config.label}
        className={guideInlineStatusBadgeClassName}
      />,
    );
    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN_RE)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(
        ...renderPlainWithStatusBadges(
          text.slice(lastIndex, start),
          `${keyPrefix}-p${tokenIndex}`,
        ),
      );
    }

    const key = `${keyPrefix}-i${tokenIndex++}`;
    if (
      (raw.startsWith('**') && raw.endsWith('**')) ||
      (raw.startsWith('__') && raw.endsWith('__'))
    ) {
      nodes.push(<strong key={key}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('~~') && raw.endsWith('~~')) {
      nodes.push(<del key={key}>{raw.slice(2, -2)}</del>);
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      nodes.push(<code key={key}>{raw.slice(1, -1)}</code>);
    } else if (raw.startsWith('[')) {
      const linkMatch = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const label = linkMatch?.[1]?.trim() ?? '';
      const href = linkMatch?.[2]?.trim() ?? '';
      if (label && isSafeHttpUrl(href)) {
        nodes.push(
          <a key={key} href={href} target='_blank' rel='noopener noreferrer'>
            {label}
          </a>,
        );
      } else {
        nodes.push(raw);
      }
    } else if (
      (raw.startsWith('*') && raw.endsWith('*')) ||
      (raw.startsWith('_') && raw.endsWith('_'))
    ) {
      nodes.push(<em key={key}>{raw.slice(1, -1)}</em>);
    } else {
      const { href, trailing } = trimTrailingPunctuation(raw);
      if (isSafeHttpUrl(href)) {
        nodes.push(
          <a key={key} href={href} target='_blank' rel='noopener noreferrer'>
            {href}
          </a>,
        );
        if (trailing) nodes.push(trailing);
      } else {
        nodes.push(raw);
      }
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      ...renderPlainWithStatusBadges(
        text.slice(lastIndex),
        `${keyPrefix}-t`,
      ),
    );
  }

  return nodes;
}

function renderInlineLines(lines: string[], keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  lines.forEach((line, index) => {
    if (index > 0) nodes.push(<br key={`${keyPrefix}-br${index}`} />);
    nodes.push(
      <Fragment key={`${keyPrefix}-ln${index}`}>
        {renderInline(line, `${keyPrefix}-ln${index}`)}
      </Fragment>,
    );
  });
  return nodes;
}

type ListItem = {
  text: string;
  children?: { type: 'ul' | 'ol'; items: ListItem[] };
};

type Block =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'ul' | 'ol'; items: ListItem[] };

type FlatListItem = { depth: number; listType: 'ul' | 'ol'; text: string };

function listDepth(indent: string): number {
  const spaces = indent.replace(/\t/g, '  ').length;
  return Math.floor(spaces / 2);
}

/**
 * Ask Guide option lists are almost always flat peers. Models still emit
 * leading spaces / restarted `1.` that look nested; ignore depth so every
 * item stays a sibling (no CSS `ol ol` / `pl-5` nesting indent).
 *
 * Mental check: `1. a\n2. b\n3. c` and `- a\n- b` → one list, three/two
 * root `<li>`s — never `<li>a<ol><li>b`.
 */
function flattenGuideListDepth(flat: FlatListItem[]): FlatListItem[] {
  return flat.map((entry) =>
    entry.depth === 0 ? entry : { ...entry, depth: 0 },
  );
}

/**
 * Nest flat list rows by depth. Root frame is depth 0 (holds peer items).
 * Do not use a depth -1 sentinel: `entry.depth > -1` is always true, so the
 * 2nd+ depth-0 peer was incorrectly nested under the first `<li>`.
 */
function nestListItems(
  flat: FlatListItem[],
): { type: 'ul' | 'ol'; items: ListItem[] } | null {
  if (flat.length === 0) return null;

  const rootType = flat[0]?.listType ?? 'ul';
  const rootItems: ListItem[] = [];
  const stack: Array<{ depth: number; items: ListItem[] }> = [
    { depth: 0, items: rootItems },
  ];

  for (const entry of flat) {
    const depth = Math.max(0, entry.depth);

    while (stack.length > 1 && (stack.at(-1)?.depth ?? 0) > depth) {
      stack.pop();
    }

    let parent = stack.at(-1);
    if (!parent) continue;

    while (depth > parent.depth) {
      const last = parent.items.at(-1);
      if (!last) break;
      if (!last.children || last.children.type !== entry.listType) {
        last.children = { type: entry.listType, items: [] };
      }
      stack.push({ depth: parent.depth + 1, items: last.children.items });
      parent = stack.at(-1);
      if (!parent) break;
    }

    if (!parent) continue;
    parent.items.push({ text: entry.text });
  }

  return { type: rootType, items: rootItems };
}

/** Blank lines between list items flush separate lists — merge adjacent same-type lists. */
function coalesceAdjacentLists(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (const block of blocks) {
    const prev = out.at(-1);
    if (
      prev &&
      (block.type === 'ol' || block.type === 'ul') &&
      prev.type === block.type
    ) {
      prev.items.push(...block.items);
      continue;
    }
    out.push(block);
  }
  return out;
}

function renderList(
  list: { type: 'ul' | 'ol'; items: ListItem[] },
  keyPrefix: string,
): ReactNode {
  const ListTag = list.type === 'ol' ? 'ol' : 'ul';
  return (
    <ListTag key={keyPrefix}>
      {list.items.map((item, itemIndex) => (
        <li key={`${keyPrefix}-li${itemIndex}`}>
          {renderInline(item.text, `${keyPrefix}-li${itemIndex}`)}
          {item.children ?
            renderList(item.children, `${keyPrefix}-li${itemIndex}-sub`)
          : null}
        </li>
      ))}
    </ListTag>
  );
}

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let flatList: FlatListItem[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'paragraph', lines: paragraph });
    paragraph = [];
  };

  const flushQuote = () => {
    if (quote.length === 0) return;
    blocks.push({ type: 'quote', lines: quote });
    quote = [];
  };

  const flushList = () => {
    const nested = nestListItems(flattenGuideListDepth(flatList));
    flatList = [];
    if (nested) blocks.push(nested);
  };

  for (const line of lines) {
    const trimmedEnd = line.trimEnd();
    if (!trimmedEnd.trim()) {
      flushParagraph();
      flushQuote();
      // Keep the active list open across blank lines so "1. a\\n\\n1. b"
      // (or 1.\\n\\n2.) stay one <ol> — lazy restarts still merge via coalesce.
      continue;
    }

    const quoteMatch = trimmedEnd.match(QUOTE_RE);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1] ?? '');
      continue;
    }

    const listMatch = trimmedEnd.match(LIST_ITEM_RE);
    if (listMatch) {
      flushParagraph();
      flushQuote();
      const indent = listMatch[1] ?? '';
      const marker = listMatch[2] ?? '-';
      const itemText = listMatch[3] ?? '';
      const listType: 'ul' | 'ol' = /^\d+[.)]$/.test(marker) ? 'ol' : 'ul';
      // Switching marker family after a gap starts a new list block.
      if (
        flatList.length > 0 &&
        flatList[0]?.listType !== listType &&
        listDepth(indent) === 0
      ) {
        flushList();
      }
      flatList.push({
        depth: listDepth(indent),
        listType,
        text: itemText,
      });
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(trimmedEnd);
  }

  flushParagraph();
  flushQuote();
  flushList();
  return coalesceAdjacentLists(blocks);
}

/** Safe subset used by Ask Guide assistant replies. */
export function GuideChatMarkdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseBlocks(text);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const key = `b${blockIndex}`;
        if (block.type === 'paragraph') {
          return <p key={key}>{renderInlineLines(block.lines, key)}</p>;
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={key}>
              {renderInlineLines(block.lines, key)}
            </blockquote>
          );
        }
        return renderList(block, key);
      })}
    </div>
  );
}
