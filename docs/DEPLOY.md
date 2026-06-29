# Deploy — `tour.ishare.ca`

> Production hosting for the Vite SPA viewer: GitHub Pages (default in this
> repo), optional Azure Static Web Apps, and ishare.ca iframe wiring.

**Canonical URLs:** [EMBED.md](./EMBED.md) ·
[PRODUCT_SPEC.md](./PRODUCT_SPEC.md)

---

## Production host

| Item          | Value                                                     |
| ------------- | --------------------------------------------------------- |
| Viewer URL    | `https://tour.ishare.ca`                                  |
| Embed pattern | `https://tour.ishare.ca/{tourId}/{sceneId}?embed=1`       |
| Build         | `npm run build` (`base: /`, `.env.production`)            |
| SPA fallback  | `dist/404.html` (copied from `index.html` in `postbuild`) |

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
   https://tour.ishare.ca/med-surg-inpatient/entrance?embed=1
   ```

### Legacy GitHub project demo

Subpath demo (`/ishare-virtual-tour/`) for `*.github.io` project pages:

```bash
npm run build:ghpages
```

Do **not** use `build:ghpages` for `tour.ishare.ca` — production uses root
`base: /`.

---

## Azure Static Web Apps (alternative)

`public/staticwebapp.config.json` ships with the build:

- SPA `navigationFallback` → `index.html`
- Long-cache headers for `/assets/*`

Point `tour.ishare.ca` CNAME to the SWA endpoint instead of GitHub Pages if your
infra team prefers Azure. Build command stays `npm run build`; upload `dist/`.

---

## Environment

| Variable                  | When                                 | Purpose                                                       |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| `VITE_TOUR_PUBLIC_ORIGIN` | Production build (`.env.production`) | Absolute share/embed URLs default to `https://tour.ishare.ca` |
| `VITE_TOUR_API_URL`       | Phase 2 only                         | API-backed tours — unset for static JSON Phase 1              |

Code: [`src/constants/tourOrigin.ts`](../src/constants/tourOrigin.ts)

---

## ishare.ca iframe integration

Replace SeekBeak (or staging) embeds on the parent site:

```html
<iframe
  src="https://tour.ishare.ca/med-surg-inpatient/entrance?embed=1"
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

Local QA without DNS: `public/embed-test.html` or dev panel **Debug → embed**.

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

| Doc                              | Topic                             |
| -------------------------------- | --------------------------------- |
| [EMBED.md](./EMBED.md)           | Embed contract, `postMessage`, QA |
| [TECH_STACK.md](./TECH_STACK.md) | Stack overview                    |
| [ROADMAP.md](./ROADMAP.md)       | Phase 1 exit criteria             |
