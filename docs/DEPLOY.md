# Deploy — `tour.ishare.ca`

> Production hosting for the Vite SPA viewer: GitHub Pages (default in this
> repo), optional Azure Static Web Apps, and ishare.ca iframe wiring.

**Canonical URLs:** [EMBED.md](./EMBED.md) ·
[PRODUCT_SPEC.md](./PRODUCT_SPEC.md)

---

## Production host

| Item               | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| Viewer URL         | `https://tour.ishare.ca`                                  |
| Embed pattern      | `https://tour.ishare.ca/{tourId}/{sceneId}?embed=1`       |
| Build              | `npm run build` (`base: /`, `.env.production`)            |
| SPA fallback       | `dist/404.html` (copied from `index.html` in `postbuild`) |
| Tour JSON (public) | `dist/tours/*.json` — fetched by the Open Graph Worker    |

### Share link previews (Open Graph)

Social apps **do not run JavaScript**. Client-side `useTourOpenGraph` alone is
not enough for Facebook / Slack / LinkedIn / iMessage cards.

Use the **Cloudflare Worker** [`workers/tour-og/`](../workers/tour-og/): bots
get per-URL `og:*` HTML (scene + `?no=` naming); humans still get the SPA.
Requires `tour` DNS proxied through Cloudflare — setup in that README.

After Worker + Pages deploy, re-scrape in Facebook Sharing Debugger. Expect a
scene/naming thumbnail, not `assets/brand/logo_ishare.png`.

---

## GitHub Pages (CI in this repo)

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

On push to `main`:

1. `npm run build` — production bundle + `public/CNAME` → `dist/CNAME`
2. GitHub Pages deploy

### One-time GitHub + DNS setup

1. **Repo → Settings → Pages**
   - Source: **GitHub Actions**
   - Custom domain: **`tour.ishare.ca`**
   - Enforce HTTPS: **on** (after DNS validates)

2. **DNS** (ishare.ca zone — registrar or Cloudflare/Azure DNS)

   | Type    | Name   | Value                     |
   | ------- | ------ | ------------------------- |
   | `CNAME` | `tour` | `<org-or-user>.github.io` |

   Use the exact target shown in GitHub Pages custom-domain settings for this
   repository.

3. Wait for DNS + GitHub certificate (often 15–60 minutes).

4. Smoke test:

   ```
   https://tour.ishare.ca/
   https://tour.ishare.ca/t_l01wnq8eh6/s_dtv27wfrbi?embed=1
   ```

### Legacy GitHub project demo

Subpath demo (`/ishare-virtual-tour/`) for `*.github.io` project pages:

```bash
npm run build:ghpages
```

Do **not** use `build:ghpages` for `tour.ishare.ca` — production uses root
`base: /`.

---

## Ask Guide live API (Cloudflare Worker — preferred)

GitHub Pages cannot run a server. Early live Ask Guide uses a **Cloudflare
Worker** OpenAI proxy:

- Code: [`workers/ask-guide/`](../workers/ask-guide/)
- Routes: `GET/POST …/api/tour/chat/status` and `…/api/tour/chat`
- Setup: [workers/ask-guide/README.md](../workers/ask-guide/README.md)

Azure Functions in [`api/`](../api/) remain an optional alternative (same
routes).

## Share Open Graph Worker

Crawler share-card previews require this Worker (GitHub Pages alone cannot
inject per-URL `og:*`). Proxy `tour` through Cloudflare and deploy
[`workers/tour-og/`](../workers/tour-og/) — setup in that README. Build
publishes `dist/tours/*.json` for the Worker to read.

---

## Azure Static Web Apps (alternative)

`public/staticwebapp.config.json` ships with the build:

- SPA `navigationFallback` → `index.html` (excludes `/api/*` and `/assets/*`)
- Long-cache headers for `/assets/*`
- `/api/*` left for linked Azure Functions (Ask Guide) if you use SWA + `api/`

Point `tour.ishare.ca` CNAME to the SWA endpoint instead of GitHub Pages if your
infra team prefers Azure. Build command stays `npm run build`; upload `dist/`.

---

## Environment

| Variable                  | When                                 | Purpose                                                                                                                                                        |
| ------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_TOUR_PUBLIC_ORIGIN` | Production build (`.env.production`) | Absolute share/embed URLs default to `https://tour.ishare.ca`                                                                                                  |
| `VITE_TOUR_API_URL`       | Phase 2 only                         | API-backed tours — unset for static JSON Phase 1                                                                                                               |
| `VITE_ASK_GUIDE_API_URL`  | Production / preview                 | Ask Guide API base ending in `/api` (Cloudflare Worker URL). Unset in DEV → Vite `/__dev/api/ask-guide/*`; unset in production → same-origin `/api` (SWA only) |

**Server-only** (never `VITE_*`): `OPENAI_API_KEY` on the Worker
(`wrangler secret put`) or Azure Function App; Vite `.env.local` for DEV proxy.

Code: [`src/constants/tourOrigin.ts`](../src/constants/tourOrigin.ts),
[`src/services/askGuide.ts`](../src/services/askGuide.ts)

---

## Ask Guide (live AI) readiness

Tour Guide shows when **`tour.askGuideEnabled`** is true (Dev → Tours create /
edit). Global `SHOW_ASK_GUIDE` remains `false` so unpublished tours stay quiet.
QA overrides: `?askGuide=1` (force on), `?guideMock=1` (scripted replies).

| Piece                                                                            | Status                              |
| -------------------------------------------------------------------------------- | ----------------------------------- |
| Chat UI + mock fallback                                                          | Ready                               |
| DEV live via Vite `/__dev/api/ask-guide` + `OPENAI_API_KEY`                      | Ready                               |
| Production API — Cloudflare Worker [`workers/ask-guide/`](../workers/ask-guide/) | Live (set `VITE_ASK_GUIDE_API_URL`) |
| Client prod wiring (`VITE_ASK_GUIDE_API_URL`)                                    | Ready                               |
| Per-tour enable (`askGuideEnabled`)                                              | Ready                               |
| Global product default (`SHOW_ASK_GUIDE = true`)                                 | Optional — prefer per-tour          |

### Smoke (live on tour.ishare.ca)

1. `cd workers/ask-guide && npm i && npx wrangler login && npx wrangler secret put OPENAI_API_KEY && npm run deploy`
2. Copy the `*.workers.dev` URL; set GitHub Actions secret
   `VITE_ASK_GUIDE_API_URL=https://ishare-ask-guide.<subdomain>.workers.dev/api`
   (workflow already passes it into the production build when set).
3. Push / re-run deploy.
4. Open a tour with `askGuideEnabled` (or `?askGuide=1`) → live reply.
5. Open `…?askGuide=1&guideMock=1` → scripted mock.

---

## ishare.ca iframe integration

Replace SeekBeak (or staging) embeds on the parent site:

```html
<iframe
  src="https://tour.ishare.ca/t_l01wnq8eh6/s_dtv27wfrbi?embed=1"
  title="Virtual Tour"
  allow="fullscreen"
  loading="lazy"
  style="width:100%; height:min(80vh, 720px); border:0; border-radius:8px;"
></iframe>
```

Parent `postMessage` listener — verify origin before trusting payloads:

```js
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://tour.ishare.ca') return;
  if (event.data?.source !== 'ishare-virtual-tour') return;
  // tour:ready | tour:scene | tour:resize — see EMBED.md
});
```

Local QA without DNS: Dev → **Debug** → **Viewport** → **Embed mode**.

---

## Pre-deploy checklist

- [ ] `npm run build` succeeds locally
- [ ] GitHub Pages custom domain + DNS configured
- [ ] HTTPS certificate active on `tour.ishare.ca`
- [ ] Deep links: `/`, `/{tourId}/{sceneId}`, `?embed=1`, `?no=`
- [ ] Large panoramas load from `/assets/` (CDN cache optional — Phase 2)
- [ ] ishare.ca staging page iframe updated to production URL

---

## Related docs

| Doc                              | Topic                                |
| -------------------------------- | ------------------------------------ |
| [EMBED.md](./EMBED.md)           | Embed contract, `postMessage`, QA    |
| [TECH_STACK.md](./TECH_STACK.md) | Stack overview                       |
| [ROADMAP.md](./ROADMAP.md)       | Phase 2+ backlog; Phase 1 is shipped |
