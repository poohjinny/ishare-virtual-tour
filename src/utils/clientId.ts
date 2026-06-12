/**
 * Derives a client id from a website URL — hostname without www and without TLD.
 * e.g. https://gphospitalfoundation.ca/ → "gphospitalfoundation"
 */
export function clientIdFromUrl(websiteUrl: string): string {
  const hostname = new URL(websiteUrl).hostname
    .toLowerCase()
    .replace(/^www\./, '');
  const withoutTld = hostname.replace(/\.(ca|com|org|net|co\.uk|io)$/i, '');
  return withoutTld;
}
