# Mobile — React UI layout pass

> **Scope:** Tour **React chrome** on small viewports — fixed overlays, dock
> panels, popups, safe-area, sizing, and collisions.  
> **Out of scope:** PSV touch/drag feel, gyro, asset/preload — see
> [PERFORMANCE.md](./PERFORMANCE.md).  
> **Task checkboxes:**
> [ROADMAP Sprint B](./ROADMAP.md#sprint-b--orientation--content-sync).

---

## Why this doc exists

First real-device pass: **PSV pan/zoom is fine**; **React chrome** needed
structure — overlapping fixed UI, breakpoint drift, panel padding/scroll bugs.

This file is the **layout spec + QA reference**. Sprint checkboxes stay in
ROADMAP.

---

## Chrome modes (3 tiers)

Source of truth: `src/constants/tourChrome.ts` + `useTourChromeLayout()`. Prefer
`matchMedia` over `innerWidth` for JS gating (keeps CSS in sync).

| Mode        | Width      | Breadcrumb               | Nav dock (not `embed`)    | Minimap | PSV bottom pill |
| ----------- | ---------- | ------------------------ | ------------------------- | ------- | --------------- |
| **mobile**  | ≤480px     | Current scene only; left | Explore + ⋯ (Share, Help) | Hidden  | Hidden          |
| **compact** | 481–1023px | Full path; left          | Explore + ⋯ (Share, Help) | Hidden  | Hidden          |
| **desktop** | ≥1024px    | Full path; centered      | Explore + Share + Help    | Shown   | Shown           |

- **PSV bottom pill** — zoom / move / recenter / immersive / fullscreen. On
  desktop, collapse to a small chip via **Show toolbar** / **Hide toolbar** on
  the pill (`viewer-container--controls-collapsed`); keyboard **C** toggles the
  same. Hidden ≤1023px (`psv-layer.css`); desktop forces zoom+move when touch is
  mis-detected (`syncPsvNavbarDesktopControls.ts`).

Hook: `chromeMode`, `isMobile`, `isCompact`, `isDesktop`, `isCoarsePointer`.

---

## Breakpoints

| Token       | Width   | Use                                                                                 |
| ----------- | ------- | ----------------------------------------------------------------------------------- |
| **phone**   | ≤480px  | `TOUR_CHROME_MOBILE_MAX_PX`, `max-[480px]:`, mobile-only breadcrumb                 |
| **compact** | ≤1023px | `TOUR_CHROME_COMPACT_MAX_PX`, left breadcrumb, overflow dock, hide minimap/PSV pill |
| **desktop** | ≥1024px | Centered breadcrumb, inline dock, minimap, PSV pill                                 |
| **sheet**   | ≤640px  | InfoPopup bottom sheet, AI panel full-width (`max-sm:`)                             |

**Known inconsistency:** InfoPopup sheet uses **640px**; nav chrome uses **480 /
1023**. Acceptable (modal vs chrome); unify only if it feels wrong on 481–640px
phones.

- [x] `viewport-fit=cover` in `index.html`
- [ ] `tourGlassPanelHtml.ts` — `viewportMaxPanelWidth()` not reactive to
      rotate/resize

---

## Chrome map (≤1023px)

```
┌─────────────────────────────────────────────┐
│  breadcrumb (left)              [dock ⋯]   │  top
│              panorama (PSV)                   │
│  [DEV]                          [Guide FAB] │  bottom
└─────────────────────────────────────────────┘

Dock panels: Explore, Share, Help (top-right slot)
Modals: InfoPopup (sheet ≤640px), ClientIntro (landing)
```

**≤1023px:** no minimap, no PSV pill. Bottom row = Dev FAB (left) + Guide FAB
(right).

**Desktop:** minimap bottom-left; PSV pill bottom-center; no Dev bottom-left
(Dev stays top-left).

---

## Done (layout pass)

| Area                 | What shipped                                                             |
| -------------------- | ------------------------------------------------------------------------ |
| **Chrome modes**     | `tourChrome.ts`, `useTourChromeLayout()`, JS dock split (`isDesktop`)    |
| **Nav dock**         | Mobile/compact: Explore + ⋯ overflow (Share, Help only)                  |
| **Breadcrumb**       | Mobile: current scene; compact: full path left; desktop: centered        |
| **Minimap**          | `FloorPlanMinimap` returns null when `!isDesktop`                        |
| **PSV pill**         | Hidden `.tour-page` ≤1023px; desktop zoom/move reliability fix           |
| **Safe-area**        | `--tour-chrome-inset-*` on `.tour-page`                                  |
| **Share panel**      | Mobile width + body padding parity with explore/help                     |
| **Explore panel**    | Directory body padding token; scroll at panel edge; mobile `22px` inline |
| **AI Guide panel**   | Body overflow fix (single scroll region); mobile panel sizing            |
| **Dev tools**        | Default closed on mobile; FAB + panel **bottom-left** ≤1023px            |
| **First-visit hint** | Positioned above bottom chrome on phone                                  |
| **Embed**            | Controls tune FAB hidden; PSV pill stays on (embed is not chrome-tiered) |

---

## Remaining work

### P1 — polish

- [x] **Explore header** — search pill uses panel flex width (not `100vw` calc)
- [x] **Directory tabs** — scrollable segmented tabs; active tab scrolls into
      view
- [ ] **Panel width JS** — `tourGlassPanelHtml.ts` listen `resize` /
      `orientationchange`
- [ ] **Help panel** — hide keyboard-shortcuts section on `(pointer: coarse)`
      (decided, not wired)
- [ ] **Dev default closed** — extend to compact and/or `(pointer: coarse)`
      (today: mobile only via `prefersMobileTourChrome()`)

### P2 — touch targets & sheets

- [ ] **Share / copy** — social tiles ~40px; copy ~30px (target 44px primary)
- [ ] **InfoPopup** — optional swipe-to-dismiss; header safe-area polish
- [ ] **Hotspot markers** — 48px touch target per
      [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) (CSS in `psv-layer.css`)

### P3 — QA & docs

- [ ] Device matrix: iPhone Safari, Android Chrome, iShare webview
- [ ] Screenshot baseline per screen
- [ ] `suppressKeyboard` from `TourPage` when dock panels / InfoPopup open

### Parallel (not layout)

- [ ] Mobile panorama tiers, preload — [PERFORMANCE.md](./PERFORMANCE.md)

---

## Layout decisions (locked)

| Question           | Decision                                     |
| ------------------ | -------------------------------------------- |
| Minimap            | Hidden mobile + compact; desktop only        |
| PSV bottom pill    | Hidden mobile + compact; desktop only        |
| Controls tune FAB  | Hidden mobile + compact; desktop inline dock |
| Nav overflow       | Share + Help only (no Controls)              |
| Breadcrumb mobile  | Current scene only                           |
| Breadcrumb compact | Full path, left                              |
| Breadcrumb desktop | Full path, centered                          |
| Guide FAB          | Always visible; bottom-right + safe-area     |
| Dev on phone       | Default closed; bottom-left ≤1023px          |
| InfoPopup sheet    | 640px breakpoint (unchanged)                 |

---

## QA checklist (manual)

Run on a **real phone** after changes:

- [ ] Landing intro — readable, CTA tappable
- [ ] Tour load — breadcrumb not under notch; left-aligned ≤1023px
- [ ] Nav dock — Explore + ⋯; Share/Help from overflow; panels fit width
- [ ] Explore — tabs, scroll, padding even; scrollbar at panel edge
- [ ] Share / Help — scroll; no double scrollbars
- [ ] AI Guide — no stray scrollbar track in body; composer visible
- [ ] NO popup — bottom sheet; footer above home indicator
- [ ] Bottom — Dev left, Guide right; no PSV pill ≤1023px
- [ ] Desktop ≥1024px — minimap, PSV pill, centered breadcrumb, inline dock
- [ ] Rotate — panel widths recover
- [ ] `?dev=1` — usable on phone (bottom-left Dev)

---

## Key files

| Concern            | Path                                                                     |
| ------------------ | ------------------------------------------------------------------------ |
| Chrome breakpoints | `src/constants/tourChrome.ts`                                            |
| Layout hook        | `src/hooks/useTourChromeLayout.ts`                                       |
| Tour shell         | `src/pages/TourPage.tsx`                                                 |
| Nav + panels       | `src/components/TourNavFloat.tsx`, `tourNavFloatVariants.ts`             |
| PSV pill chrome    | `src/styles/psv-layer.css`, `src/viewer/syncPsvNavbarDesktopControls.ts` |
| Glass panels       | `src/styles/glass-panels-layer.css`                                      |
| AI panel           | `src/components/ai/aiAssistantVariants.ts`, `AiChatPanel.tsx`            |
| Dev overlay        | `src/components/DevTools.tsx`, `devViewPanelVariants.ts`                 |
| Minimap            | `src/components/FloorPlanMinimap.tsx`                                    |
| Viewport meta      | `index.html`                                                             |

---

## Related

| Doc                                | Relevance             |
| ---------------------------------- | --------------------- |
| [ROADMAP.md](./ROADMAP.md)         | Sprint B tasks        |
| [PERFORMANCE.md](./PERFORMANCE.md) | Bytes, preload        |
| [STYLING.md](./STYLING.md)         | Variants + CSS layers |

---

## Changelog

| Date       | Note                                                                         |
| ---------- | ---------------------------------------------------------------------------- |
| 2026-06-25 | Initial doc — React chrome layout pass                                       |
| 2026-06-29 | Three chrome modes (mobile / compact ≤1023 / desktop)                        |
| 2026-06-25 | Refresh — PSV pill hidden ≤1023px; explore/AI/dev fixes; trim stale sections |
