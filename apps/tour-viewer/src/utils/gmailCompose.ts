/** Gmail web compose — same open path as Share dock Email. */
export function buildGmailComposeUrl(options: {
  to?: string | null;
  subject?: string | null;
  body?: string | null;
}): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1' });
  const to = options.to?.trim();
  const subject = options.subject?.trim();
  const body = options.body?.trim();
  if (to) params.set('to', to);
  if (subject) params.set('su', subject);
  if (body) params.set('body', body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function isGmailComposeUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return (
      parsed.hostname === 'mail.google.com' &&
      parsed.pathname.startsWith('/mail') &&
      parsed.searchParams.get('view') === 'cm'
    );
  } catch {
    return false;
  }
}
