import { Fragment, type ReactNode } from 'react';

const LIST_ITEM_RE = /^(\s*)([-*•]|\d+[.)])\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const INLINE_TOKEN_RE =
  /(\*\*[^*]+?\*\*|__[^_]+?__|~~[^~]+?~~|`[^`]+?`|\[[^\]]+?\]\([^)\s]+\)|\*[^*]+?\*|_[^_\s][^_]*?_|https?:\/\/[^\s<>\]]+)/g;

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

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN_RE)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
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
    nodes.push(text.slice(lastIndex));
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

function nestListItems(
  flat: FlatListItem[],
): { type: 'ul' | 'ol'; items: ListItem[] } | null {
  if (flat.length === 0) return null;

  const rootType = flat[0]?.listType ?? 'ul';
  const rootItems: ListItem[] = [];
  const stack: Array<{ depth: number; items: ListItem[] }> = [
    { depth: -1, items: rootItems },
  ];

  for (const entry of flat) {
    while (stack.length > 1 && (stack.at(-1)?.depth ?? -1) >= entry.depth) {
      stack.pop();
    }

    let parent = stack.at(-1);
    if (!parent) continue;

    while (entry.depth > parent.depth + 1) {
      const last = parent.items.at(-1);
      if (!last) break;
      if (!last.children) {
        last.children = { type: entry.listType, items: [] };
      }
      stack.push({ depth: parent.depth + 1, items: last.children.items });
      parent = stack.at(-1);
      if (!parent) break;
    }

    if (!parent) continue;

    if (entry.depth > parent.depth) {
      const last = parent.items.at(-1);
      if (last) {
        if (!last.children || last.children.type !== entry.listType) {
          last.children = { type: entry.listType, items: [] };
        }
        stack.push({ depth: entry.depth, items: last.children.items });
        parent = stack.at(-1) ?? parent;
      }
    }

    parent.items.push({ text: entry.text });
  }

  return { type: rootType, items: rootItems };
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
    const nested = nestListItems(flatList);
    flatList = [];
    if (nested) blocks.push(nested);
  };

  for (const line of lines) {
    const trimmedEnd = line.trimEnd();
    if (!trimmedEnd.trim()) {
      flushParagraph();
      flushQuote();
      flushList();
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
      flatList.push({
        depth: listDepth(indent),
        listType: /^\d+[.)]$/.test(marker) ? 'ol' : 'ul',
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
  return blocks;
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
