# Mobile — React UI layout pass

> **Scope:** Tour **React chrome** on small viewports — fixed overlays, dock
> panels, popups, safe-area, sizing, and component collisions.  
> **Out of scope here:** PSV viewer feel (touch drag, navbar pill, gyro) and
> asset/preload performance — see notes below only.  
> **Task list:**
> [ROADMAP Sprint B — Mobile layout pass](./ROADMAP.md#sprint-b--orientation--content-sync).  
> **Slow
> on device:** [PERFORMANCE.md](./PERFORMANCE.md) (playbook, not duplicated
> here).

---

## Why this doc exists

First real-device pass (phone) showed **PSV is acceptable**; **React UI** needs
work — overlapping fixed elements, inconsistent breakpoints, tap targets, and
panels that do not fully respect notched viewports.

This document is the **layout/spec reference** for that pass. Implementation
checkboxes stay in [ROADMAP.md](./ROADMAP.md).

---

## Scope split

| Area                    | Owner doc                                              | Notes                                                                                               |
| ----------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **React tour chrome**   | **This doc**                                           | Nav dock, panels, minimap, AI FAB, intro, dev tools, glass popups                                   |
| **PSV viewer**          | [TECH_STACK.md](./TECH_STACK.md), `psv-layer.css`      | Touch pan/zoom, bottom control pill — **reference only**; no active rework unless regressing        |
| **Load / bytes**        | [PERFORMANCE.md](./PERFORMANCE.md)                     | Mobile panorama tiers, preload limits, Lighthouse                                                   |
| **Hotspot marker HTML** | `psv-layer.css` + [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) | 48px touch target spec; marker shell is CSS, not React — track here for QA, implement in marker CSS |

---

## Breakpoints (target convention)

Today breakpoints are **duplicated** across variant files and CSS. Standardize
on these roles when touching mobile layout:

| Token          | Width    | Role                                                                                                     |
| -------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| **phone**      | `≤480px` | Primary pass — `max-[480px]:` in `*Variants.ts`; `@media (max-width: 480px)` in `glass-panels-layer.css` |
| **sheet**      | `≤640px` | Bottom-sheet modals, AI panel full-width — `max-sm:` (Tailwind) / `@media (max-width: 640px)`            |
| **intro grid** | `≥560px` | `ClientIntroPicker` two-column catalog only                                                              |

**Gaps to fix**

- `index.html` has no `viewport-fit=cover` — limits `env(safe-area-inset-*)`.
- `tourGlassPanelHtml.ts` uses `window.innerWidth <= 480` once — not reactive to
  rotate/resize.
- InfoPopup sheet uses **640px** while most nav chrome uses **480px** — feels
  inconsistent on phones 481–640px wide.

---

## React chrome map (`TourPage` stack)

Fixed / overlay UI rendered **outside** or **beside** the PSV container:

```
┌─────────────────────────────────────────────┐
│  [dev FAB]     breadcrumb (+ history)  [dock] │  z ~85–100
│                                               │
│              panorama (PSV)                   │
│                                               │
│  [minimap]              [first-visit hint]  │  z ~85
│              [PSV navbar pill — CSS]          │
│                          [AI Guide FAB]       │  z ~95
└─────────────────────────────────────────────┘

Modals: InfoPopup (bottom sheet ≤640px), ClientIntro (landing)
Dock panels: Explore, Share, Help (from TourNavFloat, top-right)
```

**Highest collision risk (≤480px, short viewport):** bottom row — **floor
minimap** (left), **PSV navbar pill** (center, CSS), **AI Guide FAB** (right).
ROADMAP calls this out explicitly.

---

## Component audit

### Done (partial phone pass)

| Component             | File(s)                                       | What exists                                                                               |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **TourNavFloat**      | `TourNavFloat.tsx`, `tourNavFloatVariants.ts` | Breadcrumb shrink; dock FABs `44px`; explore/help `min(100vw-32px, 360px)`; gallery 1-col |
| **FloorPlanMinimap**  | `floorPlanMinimapVariants.ts`                 | Smaller map, `bottom-4 left-3` at 480px                                                   |
| **AiAssistant**       | `aiAssistantVariants.ts`                      | `max-sm:` full-width panel, `inset-x-3`                                                   |
| **ClientIntroPicker** | `ClientIntroPicker.tsx`                       | Bottom-aligned sheet feel, tighter padding                                                |
| **InfoPopup**         | `InfoPopup.tsx`, `glass-panels-layer.css`     | Bottom sheet ≤640px; footer `safe-area-inset-bottom`                                      |
| **Glass panels**      | `glass-panels-layer.css`                      | `touch-action: pan-y`; global width cap ≤480px                                            |
| **Dev tools**         | `devViewPanelVariants.ts`                     | Narrower stack ≤480px                                                                     |

### Gaps (React UI — work queue)

| Priority | Area                 | Issue                                                                             | File(s)                                                                           |
| -------- | -------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **P0**   | Bottom chrome        | Minimap vs AI FAB vs PSV pill overlap on short screens                            | `floorPlanMinimapVariants.ts`, `aiAssistantVariants.ts`, layout in `TourPage.tsx` |
| **P0**   | Safe area            | No systematic `env(safe-area-inset-*)` on top-right dock, breadcrumb, bottom FABs | `tourNavFloatVariants.ts`, `index.html`                                           |
| **P1**   | Share panel          | No `max-[480px]` width variant (explore/help have one)                            | `shareTourPanelVariants.ts`, `tourNavFloatVariants.ts`                            |
| **P1**   | Explore header       | Search pill `calc(100vw - 176px)` may be tight with full dock                     | `tourNavFloatVariants.ts`                                                         |
| **P1**   | Segmented tabs       | Fixed `min-w` on directory tabs — overflow on very narrow widths                  | `tourNavFloatVariants.ts`, `segmentedTabsClasses.ts`                              |
| **P1**   | Panel width JS       | `viewportMaxPanelWidth()` not updated on orientation change                       | `tourGlassPanelHtml.ts`                                                           |
| **P2**   | Share / copy targets | Social tiles ~40px; copy control ~30px                                            | `shareTourPanelVariants.ts`                                                       |
| **P2**   | Help panel           | Keyboard shortcuts section low value on touch-only                                | `TourHelpPanel.tsx`, `tourHelp.ts` — hide or collapse via `(pointer: coarse)`     |
| **P2**   | First-visit hint     | Centered pill may overlap PSV navbar                                              | `tourFirstVisitHintVariants.ts`                                                   |
| **P2**   | Dev panel            | Default open; overlaps breadcrumb / minimap on phone                              | `DevTools.tsx`, `devViewPanelVariants.ts`                                         |
| **P3**   | Breakpoint alignment | Unify 480 vs 640 for popup sheet vs nav                                           | `glass-panels-layer.css`, variants                                                |
| **P3**   | InfoPopup polish     | Optional swipe-to-dismiss; safe-area on header                                    | `InfoPopup.tsx`, CSS                                                              |

### PSV (reference only — not in this pass)

Acceptable on device today. Do **not** expand scope unless regressing:

- Bottom navbar pill spacing (`psv-layer.css` ≤640px)
- `.psv--is-touch` hover suppression
- `PanoramaViewer` touchmove capture on panel bodies
- Gyroscope plugin — future / optional

Performance (large WebP, preload-all) →
[PERFORMANCE.md P0–P1](./PERFORMANCE.md#priority-order-p0--p5).

---

## Phased plan

Work **top-down**. Checkboxes in ROADMAP when starting a sprint.

### M0 — Conventions (≈0.5 day)

- [ ] Add `viewport-fit=cover` to `index.html`
- [ ] Document phone vs sheet breakpoints in one place (this file — done)
- [ ] Device QA matrix: iPhone Safari, Android Chrome, iShare webview (if
      available)
- [ ] Screenshot baseline per screen (dock open, explore, NO popup, intro)

### M1 — Collisions & safe-area (≈1–2 days) **highest impact**

- [ ] Bottom layout: stagger or hide minimap when AI FAB + PSV pill conflict
- [ ] `safe-area-inset-top/right` on nav dock + breadcrumb row
- [ ] `safe-area-inset-bottom` on AI FAB (popup footer already has it)
- [ ] Share panel mobile width parity with explore/help
- [ ] First-visit hint position above bottom chrome

**Done when:** iPhone SE-class — nothing critical clipped or untappable at
bottom.

### M2 — Panels & touch polish (≈1–2 days)

- [ ] Explore search width + directory tabs on narrow screens
- [ ] `tourGlassPanelHtml.ts` — listen `resize` / `orientationchange` for panel
      width
- [ ] `suppressKeyboard` from `TourPage` when dock panels / `InfoPopup` open
      ([CODING_GUIDELINES](./CODING_GUIDELINES.md))
- [ ] Help: de-emphasize keyboard shortcuts on coarse pointer
- [ ] Larger share/copy tap targets (44px goal for primary actions)

### M3 — Dev & edge cases (≈0.5–1 day, lower priority)

- [ ] Dev tools: default `panelOpen: false` on coarse pointer or ≤480px
- [ ] Align InfoPopup sheet breakpoint with phone pass (480 vs 640 — decide
      once)
- [ ] Optional: swipe-down on bottom sheet

### M4 — Performance (parallel track)

Not layout — [PERFORMANCE.md](./PERFORMANCE.md): mobile panorama tiers, preload
policy, explore thumbnails.

---

## Layout decisions (TBD before M1)

Record choices here when implementing:

| Question                   | Options                                                     | Decision |
| -------------------------- | ----------------------------------------------------------- | -------- |
| Minimap on phone           | Keep small / collapse to chip / hide until floor plan scene | _TBD_    |
| AI Guide FAB on phone      | Always visible / minimize after first use                   | _TBD_    |
| Primary QA device          | iPhone / Android / iShare webview                           | _TBD_    |
| InfoPopup sheet breakpoint | 480 (align nav) vs 640 (current)                            | _TBD_    |

---

## QA checklist (manual)

Run on a **real phone** after each milestone:

- [ ] Landing intro — readable, CTA tappable, no horizontal scroll
- [ ] Tour load — splash dismisses; breadcrumb not under notch
- [ ] Nav dock — all four FABs tappable; panels fit width; close on outside tap
- [ ] Explore — search, tabs, scroll; active item scroll-into-view (location +
      NO)
- [ ] Share — native share when available; copy URL works
- [ ] Help — scroll; FAQ readable
- [ ] NO / info popup — bottom sheet; footer CTAs above home indicator
- [ ] Bottom row — minimap, PSV pill, AI FAB do not overlap
- [ ] Rotate portrait ↔ landscape — panel widths recover
- [ ] `?dev=1` — usable or intentionally degraded on phone

---

## Key files

| Concern                | Path                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| Tour shell composition | `src/pages/TourPage.tsx`                                            |
| Nav + dock panels      | `src/components/TourNavFloat.tsx`, `tourNavFloatVariants.ts`        |
| Share / help panels    | `shareTourPanelVariants.ts`, `TourHelpPanel.tsx`                    |
| Glass popup modal      | `src/components/InfoPopup.tsx`, `src/styles/glass-panels-layer.css` |
| Panel width JS         | `src/components/tourGlassPanelHtml.ts`                              |
| Minimap                | `src/components/floorPlanMinimapVariants.ts`                        |
| AI FAB + panel         | `src/components/ai/aiAssistantVariants.ts`                          |
| Intro landing          | `src/components/ClientIntroPicker.tsx`                              |
| Dev overlay            | `src/components/DevTools.tsx`, `devViewPanelVariants.ts`            |
| Viewport meta          | `index.html`                                                        |
| Styling conventions    | [STYLING.md](./STYLING.md)                                          |

---

## Related documents

| Document                             | Relevance                                  |
| ------------------------------------ | ------------------------------------------ |
| [ROADMAP.md](./ROADMAP.md)           | Sprint B mobile task; sole checkbox list   |
| [PERFORMANCE.md](./PERFORMANCE.md)   | Bytes, preload, Lighthouse — not layout    |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) | 48px hotspot touch target contract         |
| [STYLING.md](./STYLING.md)           | Tailwind + `cva` variant pattern for fixes |
| [COMPONENTS.md](./COMPONENTS.md)     | Glass panel shared UI                      |

---

## Changelog

| Date       | Note                                                                 |
| ---------- | -------------------------------------------------------------------- |
| 2026-06-25 | Initial doc — React UI layout pass; PSV reference-only; phased M0–M4 |
