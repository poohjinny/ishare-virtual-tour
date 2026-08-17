import { buildViewerDevApiUrl } from '@/lib/viewer-url';

export function requireDevMode() {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

export async function forwardViewerDevApi(
  path: string,
  body: Record<string, unknown>,
  method: 'POST' | 'PATCH' = 'POST',
) {
  const response = await fetch(buildViewerDevApiUrl(path), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as { error?: string };

  if (!response.ok) {
    return Response.json(
      { error: result.error ?? 'Viewer dev API request failed' },
      { status: response.status },
    );
  }

  return Response.json(result);
}

export function badRequest(error: unknown) {
  const message = error instanceof Error ? error.message : 'Invalid request';
  return Response.json({ error: message }, { status: 400 });
}
