/**
 * Derives a client id from a website URL — hostname without www and without TLD.
 * e.g. https://gphospitalfoundation.ca/ → "gphospitalfoundation"
 */
export function clientIdFromUrl(websiteUrl) {
  const hostname = new URL(websiteUrl).hostname
    .toLowerCase()
    .replace(/^www\./, '');
  const withoutTld = hostname.replace(/\.(ca|com|org|net|co\.uk|io)$/i, '');
  return withoutTld;
}

/** Same as {@link clientIdFromUrl}, but accepts bare hostnames and never throws. */
export function tryClientIdFromWebsite(website) {
  const trimmed = typeof website === 'string' ? website.trim() : '';
  if (!trimmed) return '';
  const candidates =
    /^https?:\/\//i.test(trimmed) ? [trimmed] : [`https://${trimmed}`];
  for (const candidate of candidates) {
    try {
      const id = clientIdFromUrl(candidate).trim().toLowerCase();
      if (/^[a-z][a-z0-9_-]{1,63}$/.test(id)) return id;
    } catch {
      /* invalid URL */
    }
  }
  return '';
}
