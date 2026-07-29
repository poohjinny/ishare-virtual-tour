# Ask Guide API — Cloudflare Worker (preferred for early live)

Thin OpenAI proxy for GitHub Pages (`tour.ishare.ca`). Reuses
[`api/shared/askGuideCore.mjs`](../../api/shared/askGuideCore.mjs).

## One-time setup

1. Cloudflare account (free tier is enough for QA).
2. Install deps and log in:

```bash
cd workers/ask-guide
npm install
npx wrangler login
```

3. Put the OpenAI key as a **secret** (not in `wrangler.toml`):

```bash
npx wrangler secret put OPENAI_API_KEY
```

## Local

```bash
cd workers/ask-guide
npm run dev
```

Default: `http://127.0.0.1:8787`

Point the Vite app at it (repo root `.env.local`):

```bash
VITE_ASK_GUIDE_API_URL=http://127.0.0.1:8787/api
```

(Or skip this in DEV — Vite still uses `/__dev/api/ask-guide/*` when the env is
unset.)

## Deploy

```bash
cd workers/ask-guide
npm run deploy
```

Wrangler prints a URL like `https://ishare-ask-guide.<subdomain>.workers.dev`.

Smoke:

```text
https://ishare-ask-guide.<subdomain>.workers.dev/api/tour/chat/status
```

→ `{"ok":true,"enabled":true,...}`

## Wire production viewer

GitHub Actions / `.env.production`:

```bash
VITE_ASK_GUIDE_API_URL=https://ishare-ask-guide.<subdomain>.workers.dev/api
```

Then open:

```text
https://tour.ishare.ca/{tourId}?askGuide=1
```

## Optional vars

In `wrangler.toml` `[vars]` or dashboard:

- `OPENAI_ASK_GUIDE_MODEL` (default `gpt-4o-mini`)
- `ASK_GUIDE_CORS_ORIGINS` (comma list; `https://tour.ishare.ca` is built-in)
- `ASK_GUIDE_RATE_LIMIT_PER_MIN` (default `30`)

## Azure alternative

[`api/`](../../api/) Azure Functions remain available if infra prefers Azure —
same route contract (`/api/tour/chat`).
