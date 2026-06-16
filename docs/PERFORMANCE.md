# Performance optimization backlog

> Deferred performance work for the iShare Virtual Tour MVP.  
> The app is **acceptable for demo/MVP** today; use this list when mobile,
> embed, or multi-scene tours feel slow.

For product phasing, see [ROADMAP.md](./ROADMAP.md) (mobile polish, CDN).  
For stack context, see [TECH_STACK.md](./TECH_STACK.md).

---

## Current baseline (Mar 2026)

Measured from a production `npm run build` and Ken Sargent House assets.

| Area                      | Size                                                      | Notes                                 |
| ------------------------- | --------------------------------------------------------- | ------------------------------------- |
| **JS bundle**             | ~1,033 KB min (~**287 KB gzip**)                          | Single chunk; Vite warns above 500 KB |
| **CSS**                   | ~115 KB min (~**18 KB gzip**)                             | Shared glass panels, nav, hotspots    |
| **Dependencies**          | PSV core + markers + virtual-tour, React 19, React Router | No extra UI/chart libraries           |
| **Panorama JPGs**         | ~1.1–2.4 MB per scene                                     | Dominates network and GPU memory      |
| **Tour JSON / knowledge** | Bundled inline                                            | Negligible vs JS and images           |

**Runtime:** WebGL 360° viewer (Photo Sphere Viewer) — GPU use during drag/zoom
is expected. React UI (FABs, panels, AI shell) is comparatively light.

**Preload:** After the first scene loads, `preloadOtherScenes()` in
[`src/viewer/transition.ts`](../src/viewer/transition.ts) fetches **all other
scenes** in the background for faster transitions.

---

## Priority order

Work top-down when optimization becomes a goal. **Image delivery usually wins
before JS splitting.**

### P0 — Panorama assets (highest impact)

- [x] **WebP in repo** — convention: every JPG added under `panoramas/` is
      converted with `scripts/convert-jpg-to-webp.mjs`; tour JSON references
      `.webp` only. See
      [`assets/README.md`](../assets/README.md#panoramas--jpg--webp-required).
- [ ] **Compress source panoramas** — target ~800 KB–1.2 MB per scene at
      acceptable quality (current exports are 1.1–2.4 MB).
- [ ] **Resolution tiers** — optional mobile/downlink-aware URLs (e.g. 4K
      desktop, 2K mobile) via tour JSON or a small loader wrapper.
- [ ] **CDN / cache headers** — long-cache static assets under `public/assets/`;
      align with iShare embed origin.
- [ ] **Thumbnail previews** — use generated thumbs for nav preview / directory
      instead of full panoramas where possible (see ROADMAP thumbnails item).

**Touch:** `assets/{clientId}/{tourId}/panoramas/`, `tours/*.json` (`panorama`,
`thumbnail` fields), deploy/CDN config.

---

### P1 — Preload strategy

- [ ] **Limit background preload** — e.g. adjacent scenes only, or preload after
      `requestIdleCallback` / first user interaction instead of immediately on
      load.
- [ ] **Connection-aware preload** — skip or reduce preload on
      `navigator.connection.saveData` or slow effective types (`2g`, `slow-2g`).
- [ ] **Cancel in-flight preloads** — when user navigates away or closes embed,
      avoid wasted downloads on large tours.

**Touch:** [`src/viewer/transition.ts`](../src/viewer/transition.ts)
(`preloadOtherScenes`, `ensureScenePreloaded`).

---

### P2 — JavaScript bundle

- [ ] **Code-split Photo Sphere Viewer** — lazy-load viewer + plugins on tour
      route mount (`React.lazy` + dynamic `import()` for `PanoramaViewer`).
- [ ] **Lazy-load AI assistant** — defer `AiAssistant` chunk until panel open or
      idle (big UX win only if assistant grows with live LLM SDK).
- [ ] **Manual chunks** — Vite `build.rollupOptions.output.manualChunks` for
      `photo-sphere-viewer` vs `react-vendor`.
- [ ] **Per-tour JSON** — when many clients exist, dynamic `import()` tour JSON
      instead of bundling all tours in [`loadTour.ts`](../src/data/loadTour.ts).

**Touch:** [`src/pages/TourPage.tsx`](../src/pages/TourPage.tsx),
[`vite.config.ts`](../vite.config.ts).

---

### P3 — Runtime & rendering

- [ ] **Reduce `render` listeners** — audit work on PSV `render` (e.g. anchored
      panel gap sync in
      [`anchoredPanelPosition.ts`](../src/viewer/anchoredPanelPosition.ts));
      throttle if profiling shows cost on low-end devices.
- [ ] **Marker DOM churn** — minimize HTML marker add/remove on scene change;
      profile with 10+ hotspots per scene.
- [ ] **Panel measure host** — off-screen NO/nav height measurement runs on
      open; cache per `(popup hash, width)` if repeated opens are hot.

---

### P4 — CSS & fonts

- [ ] **Audit CSS size** — ~115 KB is fine for MVP; purge unused rules if the
      stylesheet grows with new clients.
- [ ] **Font loading** — ensure Roboto / Google Sans (if loaded externally) use
      `font-display: swap` and subset weights actually used.

**Touch:** [`src/styles/`](../src/styles/), [`src/main.tsx`](../src/main.tsx).

---

### P5 — Network & caching (product)

- [ ] **Service worker / offline** — optional; only if embed needs repeat visits
      on poor networks (scope carefully with panorama size).
- [ ] **HTTP/2 push / early hints** — infra-level; pair with CDN for first scene
  - JS.
- [ ] **NO deep links** — when `?no=` URL params land, avoid loading unrelated
      scenes before target (future feature).

---

## When to start

| Signal                             | Start with                        |
| ---------------------------------- | --------------------------------- |
| Slow first load on 4G              | P0 (images) + P2 (JS split)       |
| Scene change stutter after preload | P0 resolution + P1 preload limits |
| Vite/bundle budget CI failure      | P2                                |
| 10+ scenes per tour                | P1 + per-tour JSON (P2)           |
| Embed in iShare mobile webview     | P0 + mobile tiers (P0)            |

---

## Measurement checklist

Before/after each optimization:

1. **Lighthouse** (mobile, throttled) — LCP, TBT, total byte weight.
2. **`npm run build`** — JS/CSS gzip sizes.
3. **Network tab** — first scene + preload waterfall; total MB in first 30s.
4. **Device test** — mid-range Android + iPhone Safari embed iframe.

Optional: add `vite-plugin-visualizer` temporarily to inspect chunk composition.

---

## Out of scope (for now)

- Replacing PSV with a lighter custom renderer (high cost, low MVP return).
- Native app packaging for performance alone.
- Aggressive tree-shaking of PSV plugins we rely on (markers, virtual tour).

---

## Related code

| Concern          | Location                                                            |
| ---------------- | ------------------------------------------------------------------- |
| Scene preload    | [`src/viewer/transition.ts`](../src/viewer/transition.ts)           |
| Viewer mount     | [`src/viewer/PanoramaViewer.tsx`](../src/viewer/PanoramaViewer.tsx) |
| Tour asset paths | [`src/data/loadTour.ts`](../src/data/loadTour.ts)                   |
| Build config     | [`vite.config.ts`](../vite.config.ts)                               |
| Panorama files   | `assets/{clientId}/panoramas/` → `public/assets/` via sync script   |
