# Performance playbook

> **How** to optimize when embed, mobile, or multi-scene tours feel slow.  
> **What to schedule** (sprints, deploy): [ROADMAP.md](./ROADMAP.md) — the only
> checklist for committed product work.  
> Stack context: [TECH_STACK.md](./TECH_STACK.md).

Acceptable for Phase 1 today. When a [ROADMAP](./ROADMAP.md) item or risk
triggers tuning, work **top-down P0 → P5** below — do not duplicate tasks here.

---

## Current baseline (Mar 2026)

Measured from a production `npm run build` and Ken Sargent House assets.

| Area                      | Size                                                      | Notes                                 |
| ------------------------- | --------------------------------------------------------- | ------------------------------------- |
| **JS bundle**             | ~1,033 KB min (~**287 KB gzip**)                          | Single chunk; Vite warns above 500 KB |
| **CSS**                   | ~115 KB min (~**18 KB gzip**)                             | Shared glass panels, nav, hotspots    |
| **Dependencies**          | PSV core + markers + virtual-tour, React 19, React Router | No extra UI/chart libraries           |
| **Panorama files**        | ~1.1–2.4 MB per scene (WebP)                              | Dominates network and GPU memory      |
| **Tour JSON / knowledge** | Bundled inline                                            | Negligible vs JS and images           |

**Runtime:** WebGL 360° viewer (Photo Sphere Viewer) — GPU use during drag/zoom
is expected. React UI (FABs, panels, AI shell) is comparatively light.

**Preload today:** After the first scene loads, `preloadOtherScenes()` in
[`src/viewer/transition.ts`](../src/viewer/transition.ts) fetches **all other
scenes** in the background for faster transitions.

Re-measure after major changes; update this table when gzip or panorama sizes
shift meaningfully.

---

## Conventions already in place

- **WebP panoramas** — JPG under `panoramas/` is converted via
  `scripts/convert-jpg-to-webp.mjs`; tour JSON references `.webp` only. See
  [`assets/README.md`](../assets/README.md#panoramas--jpg--webp-required).

---

## Priority order (P0 → P5)

**Image delivery usually wins before JS splitting.** Use as a decision guide,
not a task list.

### P0 — Panorama assets (highest impact)

| Technique               | Guidance                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Compress exports**    | Target ~800 KB–1.2 MB per scene at acceptable quality (current ~1.1–2.4 MB).                                                                                                    |
| **Resolution tiers**    | Optional mobile/downlink-aware URLs (e.g. 4K desktop, 2K mobile) via tour JSON or loader.                                                                                       |
| **CDN / cache headers** | Long-cache `public/assets/`; align with iShare embed origin — [ROADMAP Phase 2](./ROADMAP.md#accessibility--performance-ongoing).                                               |
| **Thumbnail previews**  | Explore location cards use baked `scene.thumbnail`; naming hotspot cards may still runtime-crop at the NO view — [ROADMAP Sprint A](./ROADMAP.md#sprint-a--embed--demo-safety). |

**Touch:** `assets/{clientId}/{tourId}/panoramas/`, `tours/*.json` (`panorama`,
`thumbnail`), deploy/CDN config.

---

### P1 — Preload strategy

| Technique                     | Guidance                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| **Limit background preload**  | Adjacent scenes only, or after `requestIdleCallback` / first interaction — not all scenes on load. |
| **Connection-aware preload**  | Skip or reduce on `navigator.connection.saveData` or slow effective types (`2g`, `slow-2g`).       |
| **Cancel in-flight preloads** | On navigate away or embed close — avoid wasted MB on large tours.                                  |

**Touch:** [`src/viewer/transition.ts`](../src/viewer/transition.ts)
(`preloadOtherScenes`, `ensureScenePreloaded`).

---

### P2 — JavaScript bundle

| Technique           | Guidance                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **Code-split PSV**  | Lazy-load viewer + plugins on tour mount (`React.lazy` + dynamic `import()`).              |
| **Lazy-load Guide** | Defer `AiAssistant` until panel open or idle — bigger win when live LLM SDK lands.         |
| **Manual chunks**   | Vite `manualChunks` for `photo-sphere-viewer` vs `react-vendor`.                           |
| **Per-tour JSON**   | Dynamic `import()` per tour when catalog grows — [`loadTour.ts`](../src/data/loadTour.ts). |

**Touch:** [`src/pages/TourPage.tsx`](../src/pages/TourPage.tsx),
[`vite.config.ts`](../vite.config.ts).

---

### P3 — Runtime & rendering

| Technique              | Guidance                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`render` listeners** | Audit PSV `render` work (e.g. [`anchoredPanelPosition.ts`](../src/viewer/anchoredPanelPosition.ts)); throttle if hot on low-end devices.                                                                                                                 |
| **Hotspot marker GPU** | Hotspot glass uses `backdrop-filter`; chrome animations pause when the tab is hidden or the pointer leaves the browser; main PSV and nav preview mini viewer pause render when the window loses focus (`viewerPerfPause.ts`, `navPreviewMiniViewer.ts`). |
| **Marker DOM churn**   | Minimize HTML marker add/remove on scene change; profile 10+ hotspots.                                                                                                                                                                                   |
| **Panel measure host** | Cache off-screen NO/nav height per `(popup hash, width)` if repeat opens are hot.                                                                                                                                                                        |

---

### P4 — CSS & fonts

| Technique        | Guidance                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| **CSS audit**    | ~115 KB is fine for Phase 1; purge unused rules as stylesheet grows.       |
| **Font loading** | `font-display: swap`; subset weights actually used (Roboto / Google Sans). |

**Touch:** [`src/styles/`](../src/styles/), [`src/main.tsx`](../src/main.tsx).

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
| Scene change stutter after preload | P0 resolution + P1 preload limits                                  |
| Vite / bundle budget CI failure    | P2                                                                 |
| 10+ scenes per tour                | P1 + per-tour JSON (P2)                                            |
| Embed in iShare mobile webview     | P0 + mobile tiers (P0); React UI layout — [MOBILE.md](./MOBILE.md) |

---

## How to measure (before / after)

1. **Lighthouse** (mobile, throttled) — LCP, TBT, total byte weight.
2. **`npm run build`** — JS/CSS gzip sizes.
3. **Network tab** — first scene + preload waterfall; total MB in first 30s.
4. **Device test** — mid-range Android + iPhone Safari in embed iframe.

Optional: `vite-plugin-visualizer` for chunk composition (temporary).

---

## Out of scope (for now)

- Replacing PSV with a lighter custom renderer (high cost, low return).
- Native app packaging for performance alone.
- Aggressive tree-shaking of PSV plugins we rely on (markers, virtual tour).

---

## Related code

| Concern              | Location                                                                      |
| -------------------- | ----------------------------------------------------------------------------- |
| Scene preload        | [`src/viewer/transition.ts`](../src/viewer/transition.ts)                     |
| Viewer mount         | [`src/viewer/PanoramaViewer.tsx`](../src/viewer/PanoramaViewer.tsx)           |
| Hotspot perf pause   | [`src/viewer/viewerPerfPause.ts`](../src/viewer/viewerPerfPause.ts)           |
| Nav preview mini PSV | [`src/viewer/navPreviewMiniViewer.ts`](../src/viewer/navPreviewMiniViewer.ts) |
| Tour asset paths     | [`src/data/loadTour.ts`](../src/data/loadTour.ts)                             |
| Build config         | [`vite.config.ts`](../vite.config.ts)                                         |
| Panorama files       | `assets/{clientId}/panoramas/` → `public/assets/` via sync script             |
