# Performance playbook

> **How** to optimize when embed, mobile, or multi-scene tours feel slow.  
> **What to schedule** (sprints, deploy): [ROADMAP.md](../ROADMAP.md) — the only
> checklist for committed product work.  
> Stack context: [TECH_STACK.md](./TECH_STACK.md).

Acceptable for Phase 1 today. When a [ROADMAP](../ROADMAP.md) item or risk
triggers tuning, work **top-down P0 → P5** below — do not duplicate tasks here.

---

## Current baseline (Aug 2026)

Measured from `npm run build` (Vite 6) after vendor `manualChunks` + lazy
`DevTools` / `PanoramaViewer` / `ThreeDViewer`. Gzip is per-file (concatenating
chunks is slightly less efficient than one bundle).

| Area                 | Size                                                          | Notes                                                                                 |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **First-load JS**    | ~**1.79 MB** min / ~**494 KB gzip**                           | `index` + `react-vendor` + `psv` + `three` + `PanoramaViewer` (typical panorama tour) |
| **`index`**          | 698 KB min / **192 KB gzip**                                  | TourPage + Explore chrome; Vite still warns (>500 KB)                                 |
| **`react-vendor`**   | 232 KB / **74 KB gzip**                                       | React 19 + react-dom + react-router                                                   |
| **`psv`**            | 175 KB / **50 KB gzip**                                       | `@photo-sphere-viewer/*` — lazy with `PanoramaViewer`                                 |
| **`three`**          | 627 KB / **161 KB gzip**                                      | One copy (`dedupe`); PSV + model3d share it. Vite warns.                              |
| **`PanoramaViewer`** | 53 KB / **17 KB gzip**                                        | `React.lazy`                                                                          |
| **`ThreeDViewer`**   | 51 KB / **18 KB gzip**                                        | `React.lazy` — not on panorama first load                                             |
| **`DevTools`**       | 149 KB / **38 KB gzip**                                       | `React.lazy` — only with `?dev=1`                                                     |
| **`AiChatPanel`**    | 38 KB / **14 KB gzip**                                        | Already lazy when Guide opens                                                         |
| **CSS**              | 335 KB min / **47 KB gzip** (+ PSV 13 / 3)                    | Tailwind + glass / hotspot / nav layers                                               |
| **Panorama files**   | Ken **42** / **75.7 MB** (max 5.77); QCH **49** / **60.6 MB** | Encode ≤8192w / q90; outdoor Ken scenes dominate                                      |
| **Demo GLBs**        | ~**55 MB** (London 32 + Unreal 17 + Cozy 7)                   | Unlisted `ishare-demos` — still synced; unlisted URLs stay routable                   |
| **Tour JSON**        | Eager `import.meta.glob` of `tours/*.json`                    | Fine at ~9 tours; async load is Phase 2                                               |

**Runtime:** WebGL 360° viewer (Photo Sphere Viewer) — GPU use during drag/zoom
is expected. React UI (FABs, panels, Guide shell) is comparatively light.

**Preload today:** None in the background. The start scene loads for landing;
other panoramas load only when navigating (`ensureScenePreloaded` inside
`navigateToScene`).

`sync-assets` copies **all** of `assets/` (including unlisted demos). Do not
filter to `visibility: public` — unlisted tours are still direct-linkable.

Re-measure after major changes; update this table when gzip or panorama sizes
shift meaningfully.

---

## Conventions already in place

- **WebP panoramas** — shared encode settings in
  [`scripts/lib/panoramaEncode.mjs`](../../scripts/lib/panoramaEncode.mjs): **max
  width 8192**, **WebP quality 90** (override via `PANORAMA_MAX_WIDTH` /
  `PANORAMA_WEBP_QUALITY`, or `WEBP_*` aliases). Used by:
  - Dev Panel upload (`saveUploadedPanoramaWebp`)
  - `scripts/convert-jpg-to-webp.mjs`
  - `scripts/recompress-panorama-webp.mjs` Tour JSON references `.webp` only —
    see [`assets/README.md`](../../assets/README.md#panoramas--jpg--webp-required).
    Byte size is **not** forced to a single MB target; outdoor/high-detail
    scenes stay larger at the same settings.

---

## Priority order (P0 → P5)

**Image delivery usually wins before JS splitting.** Use as a decision guide,
not a task list.

### P0 — Panorama assets (highest impact)

| Technique               | Guidance                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Compress exports**    | Fix encode settings (≤8192w, WebP q90 via `panoramaEncode.mjs`) — **not** a uniform MB budget. Expect ~0.5–1.5 MB indoors, several MB for outdoor/foliage at the same settings. |
| **Resolution tiers**    | Optional mobile/downlink-aware URLs (e.g. 4K desktop, 2K mobile) via tour JSON or loader.                                                                                       |
| **CDN / cache headers** | Long-cache `public/assets/`; align with iShare embed origin — [ROADMAP Phase 2](../ROADMAP.md#accessibility--performance-ongoing).                                               |
| **Thumbnail previews**  | Explore location cards use baked `scene-thumbs/`; naming pin cards use `hotspot-thumbs/` — [ROADMAP Sprint A](../ROADMAP.md#sprint-a--embed--demo-safety).                       |

**Touch:** `assets/{clientId}/{tourId}/panoramas/`, `tours/*.json` (`panorama`,
`thumbnail`), deploy/CDN config.

---

### P1 — Preload strategy

| Technique                    | Guidance                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| **Limit background preload** | No background prefetch (current). Only the navigate target is loaded.                         |
| **Connection-aware preload** | Optional later if soft-nav prefetch returns — skip on `saveData` / slow effective types.      |
| **Cancel in-flight loads**   | On navigate away or embed close — avoid wasted MB when a slow destination fetch is abandoned. |

**Touch:** [`src/viewer/transition.ts`](../../src/viewer/transition.ts)
(`navigateToScene`, `ensureScenePreloaded`).

---

### P2 — JavaScript bundle

| Technique           | Guidance                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **Code-split PSV**  | **Shipped** — `React.lazy` `PanoramaViewer` / `ThreeDViewer`.                              |
| **Lazy Dev panel**  | **Shipped** — `DevToolsHost` + device/embed preview frames only when `?dev=1`.             |
| **Manual chunks**   | **Shipped** — `psv` / `react-vendor` / `three` in [`vite.config.ts`](../vite.config.ts).   |
| **Lazy-load Guide** | Defer `AiAssistant` FAB shell until open or idle — `AiChatPanel` is already lazy.          |
| **Per-tour JSON**   | Dynamic `import()` per tour when catalog grows — [`loadTour.ts`](../../src/data/loadTour.ts). |

**Touch:** [`src/pages/TourPage.tsx`](../../src/pages/TourPage.tsx),
[`vite.config.ts`](../vite.config.ts). Do not raise `chunkSizeWarningLimit` just
to silence `three` / `index` — those sizes are real.

---

### P3 — Runtime & rendering

| Technique              | Guidance                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`render` listeners** | Audit PSV `render` work (e.g. [`anchoredPanelPosition.ts`](../../src/viewer/anchoredPanelPosition.ts)); throttle if hot on low-end devices.                                                                                                                                                                                                                                                                                                              |
| **Hotspot marker GPU** | Hotspot pills are solid white + alpha (no `backdrop-filter`) to skip a per-frame blur pass — see [Findings log](#findings-log). Chrome animations pause when the tab is hidden or the pointer leaves the browser; main PSV and nav preview mini viewer pause render when the window loses focus (`tourPerfPause.ts`, `navPreviewMiniViewer.ts`). model3d nav preview uses still/image hero (`navPreviewHero.ts`) so the 3D chunk does not import PSV. |
| **Marker DOM churn**   | Minimize HTML marker add/remove on scene change; profile 10+ hotspots.                                                                                                                                                                                                                                                                                                                                                                                |
| **Panel measure host** | Cache off-screen NO/nav height per `(popup hash, width)` if repeat opens are hot.                                                                                                                                                                                                                                                                                                                                                                     |

---

### P4 — CSS & fonts

| Technique        | Guidance                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| **CSS audit**    | ~115 KB is fine for Phase 1; purge unused rules as stylesheet grows.       |
| **Font loading** | `font-display: swap`; subset weights actually used (Roboto / Google Sans). |

**Touch:** [`src/styles/`](../../src/styles/), [`src/main.tsx`](../../src/main.tsx).

---

### P5 — Network & caching (advanced)

| Technique                     | Guidance                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **Service worker**            | Only if repeat embed visits on poor networks justify panorama cache complexity. |
| **HTTP/2 push / early hints** | Infra-level; pair with CDN for first scene + JS.                                |
| **`?no=` deep links**         | Avoid loading unrelated scenes before naming-opportunity target (future).       |

---

## When to apply which priority

| Signal                             | Start with                                                         |
| ---------------------------------- | ------------------------------------------------------------------ |
| Slow first load on 4G              | P0 (images) + P2 (JS split)                                        |
| Scene change stutter after preload | P1 (no background prefetch) + P0 if assets oversized               |
| Vite / bundle budget CI failure    | P2                                                                 |
| 10+ scenes per tour                | P1 + per-tour JSON (P2)                                            |
| Embed in iShare mobile webview     | P0 + mobile tiers (P0); React UI layout — [MOBILE.md](./MOBILE.md) |

---

## How to measure (before / after)

1. **Lighthouse** (mobile, throttled) — LCP, TBT, total byte weight.
2. **`npm run build`** — JS/CSS gzip sizes.
3. **Network tab** — first scene only during landing; destination fetch on
   navigate; total MB in first 30s.
4. **Device test** — mid-range Android + iPhone Safari in embed iframe.

Optional: `vite-plugin-visualizer` for chunk composition (temporary).

---

## Findings log

### Aug 2026 — Vendor chunks + lazy Dev panel

**Symptom:** Production `index` was a single ~1.6 MB-class chunk (Vite warn).
Mar 2026 baseline (~1.0 MB / 287 KB gzip, one file) was stale.

**Shipped:**

| Change                                           | Where                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `manualChunks`: `psv` / `react-vendor` / `three` | [`vite.config.ts`](../vite.config.ts) — keep one `three` (`dedupe`) |
| Lazy `DevToolsHost` + device/embed frames        | [`TourPage.tsx`](../../src/pages/TourPage.tsx) — production first-load |

**Result:** Panorama first-load ~**494 KB gzip** across five JS files. `?dev=1`
adds DevTools (~38 KB gzip). `three` (~161 KB gzip) still loads with PSV — do
not split a second Three.js copy. `sync-assets` visibility filter **not**
applied: unlisted tours remain routable.

### Jul 2026 — Ken landing stutter (panorama decode contention)

**Symptom:** Ken Sargent House felt janky during the splash curtain and landing
camera move. Chrome Performance showed long tasks; Bottom-Up ~52% React work and
~15% **image decode**. Network showed many `panoramas/*.webp` fetches starting
while the camera was still landing.

**Root cause (two layers):**

1. **`virtualTour` `node-changed`** called `preloadOtherScenes()` on the very
   first `setNodes` (start scene), before landing ran — so Ken’s ~29 other
   scenes competed with the landing decode/paint.
2. **Background preload policy** then fetched **the entire tour** (later
   narrowed to neighbors-first, concurrency 2). Even after deferring past
   landing + hotspot enter, warming all remaining scenes still burned bandwidth
   and decode budget after enter.

**Also checked / not the main win:**

- Deferring TourNavFloat mount until after splash — **no meaningful
  improvement**; reverted.
- Aggressive full-tour WebP recompress (≤4096w / q78) — large size win but
  **visible quality loss**; reverted.
- `covered-porch.webp` alone was **14000×7000** (~13 MB). Not a resize bug — Dev
  upload had **no max width**; source resolution passed through. Downscaled to
  ≤8192 to match other Ken scenes.

**Shipped:**

| Change                                          | Where                                                                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| No background panorama prefetch                 | [`transition.ts`](../../src/viewer/transition.ts) — load destination only in `navigateToScene` / `ensureScenePreloaded` |
| Do not kick preload from initial `node-changed` | [`PanoramaViewer.tsx`](../../src/viewer/PanoramaViewer.tsx)                                                             |
| Shared encode: ≤8192w, WebP q90                 | [`panoramaEncode.mjs`](../../scripts/lib/panoramaEncode.mjs) — Dev upload, JPG→WebP CLI, optional recompress            |
| Cap outlier `covered-porch` to 8192w            | Ken assets (~13 MB → ~5.5 MB)                                                                                        |

**Lesson:** For large tours, landing smoothness beats “prefetch everything.”
Uniform **encode settings** (width + quality) are good; forcing a uniform **MB
budget** is not (outdoor/foliage stays larger). Measure with Network during
landing: only the start-scene panorama should appear until the user navigates.

---

### Jul 2026 — Multi-monitor GPU compositor contention

**Symptom:** With the tour tab visible on a second monitor, a YouTube video on
the main monitor stuttered whenever the cursor moved over it — regardless of
window focus.

**Investigation (via temporary `?debug*` URL toggles, since removed):**

- Pausing looping chrome animations **or** disabling all `backdrop-filter` each
  reduced the stutter on their own — the expensive part is animated pixels under
  a blur layer forcing per-frame re-blur.
- Disabling MSAA (`antialias`) / capping render pixel ratio: no meaningful
  change.
- Hiding **all** hotspot/panel markers (`.psv-marker { display: none }`) removed
  the stutter completely — DOM markers each add a compositor layer that is
  re-composited every frame during rotate / cursor move.
- **Control test:** heavy third-party WebGL pages (WebGL Aquarium, Shadertoy,
  Google Earth) on the second monitor reproduced the **same** YouTube stutter.

**Conclusion:** Not an app bug. It is browser/driver-level GPU compositor
contention in multi-monitor setups (any second-monitor GPU load can disturb
main-monitor video). We cannot fully fix it in code — only reduce our own GPU
footprint. Mismatched monitor refresh rates and hardware-accel settings are the
main environmental levers (a user-environment concern, not app-fixable).

**Shipped from this:** Hotspot pills switched from frosted glass
(`backdrop-filter`) to **solid white + alpha** by default (`psv-layer.css`) —
one fewer per-frame blur pass per marker. Helps low-end / mobile / laptop
thermals broadly, independent of the multi-monitor issue.

**Deferred (larger, optional):** replace the nav-preview second live WebGL
viewer with a static preview; move markers into the WebGL scene (`imageLayer` /
`videoLayer`) to drop DOM compositor layers entirely.

---

## Out of scope (for now)

- Replacing PSV with a lighter custom renderer (high cost, low return).
- Native app packaging for performance alone.
- Aggressive tree-shaking of PSV plugins we rely on (markers, virtual tour).

---

## Related code

| Concern                | Location                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Scene load on navigate | [`src/viewer/transition.ts`](../../src/viewer/transition.ts)                                                                 |
| Panorama encode        | [`scripts/lib/panoramaEncode.mjs`](../../scripts/lib/panoramaEncode.mjs)                                                     |
| Viewer mount           | [`src/viewer/PanoramaViewer.tsx`](../../src/viewer/PanoramaViewer.tsx)                                                       |
| Hotspot perf pause     | [`src/viewer-shared/tourPerfPause.ts`](../../src/viewer-shared/tourPerfPause.ts) (+ PSV bind in `viewer/viewerPerfPause.ts`) |
| Nav preview mini PSV   | [`src/viewer-shared/navPreviewMiniViewer.ts`](../../src/viewer-shared/navPreviewMiniViewer.ts)                               |
| Tour asset paths       | [`src/data/loadTour.ts`](../../src/data/loadTour.ts)                                                                         |
| Build config           | [`vite.config.ts`](../vite.config.ts)                                                                                     |
| Panorama files         | `assets/{clientId}/{tourId}/panoramas/` → `public/assets/` via sync script                                                |
