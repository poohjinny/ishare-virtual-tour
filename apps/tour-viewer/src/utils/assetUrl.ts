/** Prefix root-relative asset paths with Vite `base` (GitHub Pages subpath). */
export function withBaseUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}

/** Force refetch when a baked asset is overwritten at the same URL (dev thumbnail rebake). */
export function appendCacheBust(url: string, version: number | string): string {
  if (!url) return url;

  const hashIndex = url.indexOf('#');
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  const base =
    queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const params = new URLSearchParams(
    queryIndex === -1 ? '' : withoutHash.slice(queryIndex + 1),
  );
  params.set('v', String(version));
  const query = params.toString();
  return `${base}${query ? `?${query}` : ''}${hash}`;
}
