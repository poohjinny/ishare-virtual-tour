import { Fragment, type ReactNode } from 'react';

/** Bold / italic markers only — same subset authors type in Dev description fields. */
const INLINE_TOKEN_RE =
  /(\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_\s][^_]*?_)/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain text for aria, search, and speech — drops ** / * / __ / _ wrappers. */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * After length truncation, drop dangling emphasis so UI does not show raw `**`.
 */
export function repairTruncatedInlineMarkdown(text: string): string {
  let next = text.replace(/(?:\*\*|__|\*|_)+$/u, '');

  const boldMarks = next.match(/\*\*/g)?.length ?? 0;
  if (boldMarks % 2 === 1) {
    const at = next.lastIndexOf('**');
    if (at >= 0) next = `${next.slice(0, at)}${next.slice(at + 2)}`;
  }

  const underBold = next.match(/__/g)?.length ?? 0;
  if (underBold % 2 === 1) {
    const at = next.lastIndexOf('__');
    if (at >= 0) next = `${next.slice(0, at)}${next.slice(at + 2)}`;
  }

  // Single * / _ — count unpaired markers outside ** / __
  const withoutBold = next
    .replace(/\*\*[^*]*?\*\*/g, '')
    .replace(/__[^_]*?__/g, '');
  const starCount = (withoutBold.match(/\*/g) ?? []).length;
  if (starCount % 2 === 1) {
    const at = next.lastIndexOf('*');
    if (
      at >= 0 &&
      next.slice(at, at + 2) !== '**' &&
      next.slice(at - 1, at + 1) !== '**'
    ) {
      next = `${next.slice(0, at)}${next.slice(at + 1)}`;
    }
  }
  const underCount = (withoutBold.match(/_/g) ?? []).length;
  if (underCount % 2 === 1) {
    const at = next.lastIndexOf('_');
    if (
      at >= 0 &&
      next.slice(at, at + 2) !== '__' &&
      next.slice(at - 1, at + 1) !== '__'
    ) {
      next = `${next.slice(0, at)}${next.slice(at + 1)}`;
    }
  }

  return next.trimEnd();
}

function wrapInlineHtml(raw: string): string {
  if (
    (raw.startsWith('**') && raw.endsWith('**')) ||
    (raw.startsWith('__') && raw.endsWith('__'))
  ) {
    return `<strong>${raw.slice(2, -2)}</strong>`;
  }
  if (
    (raw.startsWith('*') && raw.endsWith('*')) ||
    (raw.startsWith('_') && raw.endsWith('_'))
  ) {
    return `<em>${raw.slice(1, -1)}</em>`;
  }
  return raw;
}

/** Escape, then apply inline bold/italic — safe for glass-panel HTML strings. */
export function formatInlineMarkdownHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(INLINE_TOKEN_RE, (raw) => wrapInlineHtml(raw));
}

export function splitMarkdownParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function buildInlineMarkdownParagraphsHtml(
  body: string,
  paragraphClass: string,
): string {
  return splitMarkdownParagraphs(body)
    .map(
      (paragraph) =>
        `<p class="${paragraphClass}">${formatInlineMarkdownHtml(paragraph)}</p>`,
    )
    .join('');
}

function renderInlineTokens(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN_RE)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const key = `${keyPrefix}-${tokenIndex++}`;
    if (
      (raw.startsWith('**') && raw.endsWith('**')) ||
      (raw.startsWith('__') && raw.endsWith('__'))
    ) {
      nodes.push(<strong key={key}>{raw.slice(2, -2)}</strong>);
    } else if (
      (raw.startsWith('*') && raw.endsWith('*')) ||
      (raw.startsWith('_') && raw.endsWith('_'))
    ) {
      nodes.push(<em key={key}>{raw.slice(1, -1)}</em>);
    } else {
      nodes.push(raw);
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/** Inline bold/italic as React nodes (no HTML injection). */
export function renderInlineMarkdown(
  text: string,
  keyPrefix = 'md',
): ReactNode {
  const lines = text.split('\n');
  if (lines.length <= 1) {
    return <>{renderInlineTokens(text, keyPrefix)}</>;
  }

  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={`${keyPrefix}-ln${index}`}>
          {index > 0 ?
            <br />
          : null}
          {renderInlineTokens(line, `${keyPrefix}-ln${index}`)}
        </Fragment>
      ))}
    </>
  );
}

/** One or more `<p>` blocks with inline emphasis. */
export function InlineMarkdownParagraphs({
  text,
  className,
  paragraphClassName,
}: {
  text: string;
  className?: string;
  paragraphClassName?: string;
}) {
  const paragraphs = splitMarkdownParagraphs(text);
  const blocks = paragraphs.length > 0 ? paragraphs : [text];

  if (blocks.length === 1) {
    return (
      <p className={paragraphClassName}>
        {renderInlineMarkdown(blocks[0]!, 'p0')}
      </p>
    );
  }

  return (
    <div className={className}>
      {blocks.map((paragraph, index) => (
        <p key={index} className={paragraphClassName}>
          {renderInlineMarkdown(paragraph, `p${index}`)}
        </p>
      ))}
    </div>
  );
}
