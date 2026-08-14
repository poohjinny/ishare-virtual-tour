# Technology stack

Why this repo is a Vite SPA with Photo Sphere Viewer + Three.js, not Next.js.
**Repo layout:** [CODING_GUIDELINES.md](./CODING_GUIDELINES.md). **Deploy:**
[DEPLOY.md](../ops/DEPLOY.md). **Embed:** [EMBED.md](../ops/EMBED.md).

## Current versions

From `package.json` (keep this table in sync when bumping):

| Layer      | Technology                            | Version          |
| ---------- | ------------------------------------- | ---------------- |
| Runtime    | React                                 | ^19              |
| Language   | TypeScript                            | ~5.7             |
| Build      | Vite                                  | ^6               |
| 360 viewer | Photo Sphere Viewer + markers + VT    | ^5.11            |
| 3D viewer  | Three.js (GLTF walkthrough)           | ^0.179           |
| Styling    | Tailwind 4 + `@theme` tokens + CVA    | ^4               |
| AI         | Tour Guide — mock + Cloudflare Worker | per-tour         |
| OG / share | `workers/tour-og` (JPEG for FB/LI)    | Wrangler         |
| Hosting    | Static SPA on GitHub Pages            | `tour.ishare.ca` |

## Why this stack

### Vite + React + TypeScript (not Next.js)

The tour is a **client-side WebGL viewer** in an iframe. It does not need SSR,
SEO landing pages (iShare owns those), or API routes in the same app. Vite gives
fast HMR and a static `dist/` for Pages. Admin/CMS, if it comes, is a **separate
Next.js app** that previews this viewer in an iframe — see
[ROADMAP Phase 2](../ROADMAP.md#phase-2--platform-integration).

### Photo Sphere Viewer (not raw Three.js for panoramas)

PSV is a specialised 360° library (WebGL/Three.js underneath): equirect mapping,
drag/zoom, HTML markers at yaw/pitch, multi-scene virtual tour, fade +
`animate()`. Rebuilding that from Three.js would be weeks of infrastructure
before product work.

### Three.js (model3d walkthrough)

`ThreeDViewer` (`src/viewer-3d/`, `React.lazy`) loads GLTF/GLB when
`tour.viewerType === 'model3d'`. Three.js is already a PSV transitive
dependency; it is a direct dep so both viewers share one copy (`vite.config`
`dedupe: ['three']`). Both implement `TourViewerHandle`
(`src/viewer-shared/viewerHandle.ts`). **Do not silently restyle one viewer
while fixing the other** —
[viewer-type isolation](./CODING_GUIDELINES.md#viewer-type-isolation-panorama-vs-model3d).

### Tour Guide + OG crawlers

- **Guide:** `assembleTourContext` from tour JSON + catalog. Mock:
  `?guideMock=1`. Live: `workers/ask-guide/` → `VITE_ASK_GUIDE_API_URL`.
  Optional Azure Functions in `api/` (same contract). Per-tour:
  `askGuideEnabled`; global `SHOW_ASK_GUIDE` stays off; QA `?askGuide=1`.
- **Share / Facebook:** humans see SPA meta (WebP scene-thumbs). Crawlers hit
  `workers/tour-og` for HTML + JPEG (`/og/jpg/…`). Copy is shared via
  `src/utils/ogShareCopy.mjs`. Donor normalize/credit:
  `src/utils/namingDonor.mjs` (scripts re-export).

---

## Library comparison (decision record)

| Criterion         | Pannellum    | Photo Sphere Viewer     | Three.js (direct, 360)   |
| ----------------- | ------------ | ----------------------- | ------------------------ |
| Setup speed       | Fastest      | Moderate                | Slowest                  |
| Bundle size       | ~50 KB       | Larger (core + plugins) | Largest                  |
| Scene transitions | Fade only    | Fade + animate + VT     | Fully custom             |
| Hotspot UX        | CSS tooltips | HTML markers plugin     | Manual raycast + project |
| TypeScript        | Community    | Official                | Full                     |
| Long-term 3D / XR | Limited      | Extensible              | Maximum                  |

**Decision:** PSV for **panorama** tours; Three.js `ThreeDViewer` for **GLTF**
tours. Not Next.js for the embed viewer.

### PSV plugins

| Plugin                | Role                                        |
| --------------------- | ------------------------------------------- |
| `core`                | Panorama, zoom, fullscreen, `animate()`     |
| `markers-plugin`      | HTML hotspots (nav + info + naming)         |
| `virtual-tour-plugin` | Multi-node scenes, `setCurrentNode()`, fade |

---

## Data flow

```
tours/{tourId}.json + catalog.json
        │  infer conventional assets (tourAssetResolve.mjs)
        ▼
TourPage  (viewerType)
        ├─ panorama → PanoramaViewer (PSV)     lazy
        ├─ model3d  → ThreeDViewer (Three.js)  lazy
        └─ chrome   → TourNavFloat, InfoPopup, Ask Guide

Crawlers  →  workers/tour-og  (OG HTML + JPEG)
Guide chat →  workers/ask-guide  or mock
```

`useTourState` owns `currentSceneId` + history. URL sync: `useTourRouteSync` +
`tourPaths.ts`. Load: `loadTour` → `normalizeTourAssets` (sync JSON default;
`VITE_TOUR_API_URL` is not wired on `TourPage` yet).

Styling: `@theme` tokens in `globals.css`, layer CSS (`hotspot-layer`,
`psv-layer`, `viewer-3d-layer`), React via Tailwind + `cva`. See
[STYLING.md](./STYLING.md).

---

## URL query flags

Parsed in `useAppSearchParams()`. Preserved across in-app nav:
`PRESERVED_SEARCH_KEYS` in `src/utils/tourPaths.ts`. Product contract:
[PRODUCT_SPEC.md](../product/PRODUCT_SPEC.md). QA toggles:
[DEV_PANEL.md](./DEV_PANEL.md).

| Param                   | Purpose                               |
| ----------------------- | ------------------------------------- |
| `?embed=1`              | Embed chrome — [EMBED.md](../ops/EMBED.md) |
| `?intro=1` / `?intro=0` | Force / skip intro gallery at `/`     |
| `?dev=1`                | Dev panel                             |
| `?no=no_*`              | Open naming opportunity               |
| `?askGuide=1`           | Force Tour Guide on                   |
| `?guideMock=1`          | Scripted Guide replies                |
| `?guideUiTest=1`        | Guide UI fixtures                     |
| `?notFoundTest=1`       | Force 404                             |
| `?loadErrorTest=1`      | Force viewer load-error overlay       |
| `?disableNavPreview=1`  | Disable nav-preview mini viewer       |
| `?skipLanding=1`        | Skip landing zoom                     |
| `?splashHold=1`         | Hold splash longer                    |

**Legacy (redirect once):** kebab / client-id path segments (SPA + tour-og via
`legacyTourPathAliases.mjs`); `?tour=` / `?scene=`; QA aliases `chatTest` →
`guideUiTest`, `askGuideMock` → `guideMock`, `panoramaErrorTest` →
`loadErrorTest`.

---

## Deploy (pointer)

Production host is **`https://tour.ishare.ca`** (GitHub Pages + custom domain +
Cloudflare Workers for OG and Ask Guide). Do not treat Vercel/Netlify as the
primary path. Full steps: [DEPLOY.md](../ops/DEPLOY.md).

```bash
npm run build   # sync-assets + typecheck + vite → dist/
```

---

## What’s next (stack)

Monorepo viewer + Next admin + public API + Postgres —
[ROADMAP Phase 2](../ROADMAP.md#phase-2--platform-integration). Do not move the
embed viewer into Next for SSR.
