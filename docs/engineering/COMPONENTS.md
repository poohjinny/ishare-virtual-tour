# Shared UI Components

This project renders UI in **two places**:

1. **React** — dock panels (Explore, Search, Help), AI assistant, modals
2. **HTML strings** — Photo Sphere Viewer markers (nav preview, info popups,
   anchored panels)

Because the same patterns appear in both, we treat reusable UI as **shared
components**, not one-off CSS in feature files. Small context-specific tweaks
are fine; duplicating whole patterns is not.

This file is **tour-viewer** only. Admin is a separate app
([ADMIN_UI.md](./ADMIN_UI.md)) — do not import viewer glass / hotspot / chrome
into Admin, or unify them into one `Button`.

---

## Principles

### 1. One visual language

- Design tokens live in [`apps/tour-viewer/src/styles/globals.css`](../../apps/tour-viewer/src/styles/globals.css)
  `@theme` (`--color-*`; legacy `--ishare-*` shims during migration).
- Shared primitives use an `ishare-` class prefix (e.g. `ishare-badge`,
  `ishare-accordion`).
- When a pattern appears twice (Help accordion + nav preview NO accordion),
  extract it before a third copy appears.

### 2. React + HTML parity

Many tour surfaces are HTML injected into PSV markers. A shared component
therefore has **three layers**:

| Layer                       | Purpose                                       | Example                                            |
| --------------------------- | --------------------------------------------- | -------------------------------------------------- |
| **CSS**                     | Single source of look & behaviour             | `components-layer.css`, `*Variants.ts`             |
| **Class constants**         | Same class strings in React and HTML builders | `badgeClasses.ts`, `accordionClasses.ts`           |
| **React component**         | Ergonomic JSX where we control the tree       | `Badge.tsx`, `Accordion.tsx`                       |
| **HTML helpers** (optional) | String builders for marker popups             | `accordionChevronHtml.ts`, `tourGlassPanelHtml.ts` |

Import shared CSS from [`apps/tour-viewer/src/main.tsx`](../../apps/tour-viewer/src/main.tsx) so marker HTML gets the
same styles as React.

### 3. Compose before forking

Prefer:

- **Props / modifiers** on a shared component (`nested`, `iconPosition`,
  `extra`)
- **Wrapper class** on a parent for layout-only tweaks (e.g.
  `.nav-preview-panel__naming .ishare-accordion__panel-inner { padding: … }`)
- **Thin domain wrappers** (`NamingStatusBadge` → `Badge` + tour status config)

Avoid:

- Copy-pasting trigger/panel markup into a new feature file
- Feature-specific class names for generic patterns (`help-section-trigger` when
  `ishare-accordion__trigger` exists)

### 4. Tweaks are allowed

Not every surface is identical. Acceptable differences:

- Panel inner padding per context (Help vs nav preview naming body)
- `extra` slot on accordion triggers (badges beside the title)
- `animated` accordion items (grid height animation for HTML button mode)
- Domain copy and data wiring in feature components (`TourHelpPanel`,
  `buildNavPreviewNamingListHtml`)

Unacceptable: reimplementing chevron hover, open border tint, or badge fill
variants locally.

---

## Folder layout

```
apps/tour-viewer/src/components/ui/
  Badge.tsx / NamingStatusBadge.tsx
  badgeVariants.ts / badgeClasses.ts

  Accordion.tsx / AccordionChevron.tsx
  accordionClasses.ts / accordionChevronHtml.ts

  SegmentedTabs.tsx / SegmentedTabPanel.tsx
  IconTooltip.tsx
  MaterialSymbol.tsx
  ExploreLayoutPanel.tsx
```

Feature components (`TourHelpPanel`, `TourNavFloat`, `TourGlassPanel`,
`ShareTourPanel`, `AiAssistant`, Explore directory/detail, `TourFirstVisitHint`,
`TourLoadSplash`, `ClientIntroPicker`) **consume** `ui/*`. Viewer HTML builders
(`tourGlassPanelHtml.ts`) **import class constants and HTML helpers** from
`ui/*`.

Floor-plan minimap was removed — do not reintroduce `FloorPlanMinimap`.

---

## Current shared components

### Badge (`ishare-badge`)

**Use for:** status chips, price pills, outline labels, dots in lists.

**React**

```tsx
import { Badge } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';

<Badge variant="outline" tone="muted">Location</Badge>
<NamingStatusBadge status="open" />
```

**HTML popups**

```ts
import { BADGE_CLASS } from './ui/badgeClasses';

`<span class="${BADGE_CLASS.fillLgStatus('open')}">
  <span class="${BADGE_CLASS.label}">Available</span>
</span>`;
```

**Variants:** `outline` | `fill`; sizes `sm` | `lg`; tones `primary` | `accent`
| `muted`; naming status modifiers `open` | `soon` | `sold` | `reserved`.

---

### Accordion (`ishare-accordion`)

**Use for:** Help sections, FAQ nested items.

**Note:** Nav preview naming opportunities still use dedicated
`nav-preview-panel__naming-*` markup/CSS (HTML markers) — not
`ishare-accordion`.

**React**

```tsx
import { Accordion, AccordionItem } from './ui/Accordion';

<Accordion gap='md'>
  <AccordionItem title='Using this tour' defaultOpen iconPosition='left'>
    …
  </AccordionItem>
  <AccordionItem title='FAQ' iconPosition='right'>
    …
  </AccordionItem>
</Accordion>;
```

**Props**

| Prop                 | Description                                    |
| -------------------- | ---------------------------------------------- |
| `iconPosition`       | `'left'` (default) or `'right'` (Help panel)   |
| `nested`             | Lighter nested card (FAQ inside Help)          |
| `extra`              | React node beside title (e.g. badges)          |
| `defaultOpen`        | Initial open state (`details`)                 |
| `gap` on `Accordion` | `'default'` (10px), `'md'` (8px), `'sm'` (6px) |

**HTML (button + JS toggle)**

Nav preview naming uses dedicated `nav-preview-panel__naming-*` classes — see
`tourGlassPanelHtml.ts`, `glass-panels-layer.css`, and
`navPreviewNamingAccordion.ts` (`data-nav-naming-toggle` /
`data-nav-naming-accordion`).

**Interaction baseline (Help accordion):**

- Hover: neutral background; chevron turns primary when closed
- Open: primary border tint; chevron rotated 180° and primary

---

## Larger shells (not in `ui/` yet)

These are shared patterns but still feature-scoped. Prefer aligning with them
before inventing new panel chrome:

| Shell             | React                | HTML                                  | Notes                          |
| ----------------- | -------------------- | ------------------------------------- | ------------------------------ |
| Glass panel       | `TourGlassPanel.tsx` | `tourGlassPanelHtml.ts`               | Header, body, footer, CTA row  |
| Nav dock          | `TourNavFloat.tsx`   | —                                     | Explore / Search / Help        |
| Nav preview panel | —                    | `glass-panels-layer.css` + glass HTML | Hero, naming section overrides |

When adding panel UI, check whether it belongs **inside** an existing shell with
`ui/*` primitives, rather than new panel-specific accordion/badge styles.

---

## Chrome inventory — pick, don't invent

Not a design-language system. The point is one pick-list so call sites stop
inventing `h-[42px]`. There is **no** shared viewer `Button` — size lives in
tokens and the CVA / BEM recipes below.

Two viewer layers (do not mix). Admin console `Button` is not this inventory —
[ADMIN_UI.md](./ADMIN_UI.md).

| Layer | Owns | Does not own |
| --- | --- | --- |
| **Tour chrome** | Docks, FABs, glass panels, Explore pills | Scene hotspot markers; Admin `Button` |
| **Hotspots** | Nav / info / general-info scene markers | Chrome buttons; Admin |

### Shared scale

| What | Use when | Do not | Canonical |
| --- | --- | --- | --- |
| Color / type / radius | Any new viewer React or CSS | Hex, `text-[13px]`, `rounded-[11px]` at a call site | `@theme` in [`globals.css`](../../apps/tour-viewer/src/styles/globals.css) (`--color-*`, `--text-*`, `--radius-*`) |
| Spacing | Padding, gap, margin | Arbitrary `p-[13px]` / `h-[42px]` | Tailwind spacing (rem). A new step → one `@theme` token **and** a line in this table |
| Rem chrome | Tour React / CSS that must track UI scale | Lock the phone root to `16px`; size chrome in `px` | [STYLING.md](./STYLING.md) (Units); `--ishare-font-size-base` in `globals.css` |

### Tour chrome

`--tour-chrome-*` is declared on `.tour-page` in
[`psv-layer.css`](../../apps/tour-viewer/src/styles/psv-layer.css) (phone
overrides in the same file). Menu stacking
(`--tour-chrome-menu-z-index`) lives on `:root` in `globals.css`.

| What | Use when | Do not | Canonical |
| --- | --- | --- | --- |
| Circular dock control | Explore / Share / Help / More | A new `IconButton`; a one-off square `size-*` | `tourNavCircleBtnVariants` in [`tourNavFloatVariants.ts`](../../apps/tour-viewer/src/components/tourNavFloatVariants.ts); diameter `--tour-chrome-fab-size` |
| Ask Guide FAB | Bottom-right Tour Guide launcher | Dock fab size; `h-[64px]` | `aiFabVariants` in [`aiAssistantVariants.ts`](../../apps/tour-viewer/src/components/ai/aiAssistantVariants.ts); `--tour-chrome-ai-fab-size` |
| Toolbar hide FAB | Show / hide the bottom viewer control pill | New circular button styles | [`TourViewerControlsToggleFab.tsx`](../../apps/tour-viewer/src/components/TourViewerControlsToggleFab.tsx); `.tour-viewer-controls-toggle-fab` in `psv-layer.css` |
| Insets / z / panel header | Positioning docks, menus, panel headers | Hard-coded `top-4` / `z-50` beside chrome | `--tour-chrome-inset-*`, `--tour-chrome-z-index`, `--tour-chrome-panel-header-*` |
| Glass footer CTA | Panel footer actions (Visit, Donate, Share) | Admin `Button`; hotspot pill classes | `.tour-glass-panel__cta` + `--ishare-panel-cta-*` in [`glass-panels-layer.css`](../../apps/tour-viewer/src/styles/glass-panels-layer.css); size layouts `default` / `wide` / `full` in [`popupCtaLayout.ts`](../../apps/tour-viewer/src/utils/popupCtaLayout.ts) |
| Status chips | Status, category, price labels | Using a chip as a button | `Badge` / `badgeVariants` — [`ui/Badge.tsx`](../../apps/tour-viewer/src/components/ui/Badge.tsx) |
| Explore gallery pills | Visit / info on gallery heroes | Copying `h-7` into a new feature; hotspot tokens | `tourNavLocationGalleryHeroPillCtaClassName` (+ Secondary) in `tourNavFloatVariants.ts` |
| Explore search pill | Explore header search expand | A new circular search button | `tourNavExploreSearchPillVariants`; height `--ishare-panel-header-btn-size` (aliases `--tour-chrome-panel-header-btn-size`) |

### Glass shell

| What | Use when | Do not | Canonical |
| --- | --- | --- | --- |
| Glass panel | Dock + anchored popups (header / body / footer) | New panel chrome; Admin Card | [`TourGlassPanel.tsx`](../../apps/tour-viewer/src/components/TourGlassPanel.tsx), [`tourGlassPanelHtml.ts`](../../apps/tour-viewer/src/components/tourGlassPanelHtml.ts); look tokens `--ishare-glass-*` in `globals.css` |

### Hotspots (not buttons)

Scene markers are screen-space overlays. They share HTML via
[`buildMarkers.ts`](../../apps/tour-viewer/src/viewer-shared/buildMarkers.ts)
and look tokens `--ishare-hotspot-*` in
[`hotspot-layer.css`](../../apps/tour-viewer/src/styles/hotspot-layer.css).
Do not restyle them as dock FABs or Admin buttons.

**Viewer-type isolation:** `--ishare-hotspot-*` is consumed by both panorama
and `model3d`. Do not “fix” 3D by changing a shared hotspot token without
checking a panorama tour (and the reverse). Scope type-specific CSS under
`.viewer-container` / `.psv-*` or `.viewer-3d-container` / `.hotspot-3d-*`.
See [CODING_GUIDELINES.md — Viewer-type isolation](./CODING_GUIDELINES.md#viewer-type-isolation-panorama-vs-model3d).

| What | Use when | Do not | Canonical |
| --- | --- | --- | --- |
| Hotspot pill / chip | Nav, info, general-info markers | Chrome buttons; `h-[26px]` at a call site | `--ishare-hotspot-*` in `hotspot-layer.css`; HTML in `viewer-shared/buildMarkers.ts` |

### Rule

A pattern that appears a **third** time → extract (token, CVA, or `ui/*`).
Do not add `h-[42px]` (or any arbitrary height) at a call site. Pick an
existing size / variant, or add **one** token step **and** one line in this
inventory.

---

## Adding a new shared component

1. **Confirm reuse** — Will it appear in React and HTML, or at least twice in
   the app?
2. **Add styles** — Tailwind + `cva()` in React; `@layer components` in
   `components-layer.css` or a feature layer file for HTML marker shells.
3. **Add `componentClasses.ts`** if HTML builders need the same strings.
4. **Add `ComponentName.tsx`** for React trees; keep it thin.
5. **Import only via `globals.css`** — no per-component CSS in `main.tsx`.
6. **Document** props, modifiers, and HTML usage in this file.
7. **Migrate** existing duplicates rather than leaving parallel styles.

### Checklist before merge

- [ ] Class prefix is `ishare-*`, not feature-specific
- [ ] Tokens used instead of hard-coded colours where possible
- [ ] React and HTML paths both covered (or issue filed for HTML follow-up)
- [ ] Context-specific tweaks live in feature CSS as narrow overrides
- [ ] `npm run build` passes

---

## Related docs

- [STYLING.md](./STYLING.md) — `@theme`, rem chrome, Tailwind-first
- [ADMIN_UI.md](./ADMIN_UI.md) — Admin console primitives (separate `Button`)
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md#viewer-type-isolation-panorama-vs-model3d) — panorama vs model3d
- [PRODUCT_SPEC.md](../product/PRODUCT_SPEC.md) — UI layout, product contracts
- [ROADMAP.md](../ROADMAP.md) — backlog and phasing
- [TECH_STACK.md](./TECH_STACK.md) — React, PSV, styling approach
- [`apps/tour-viewer/assets/README.md`](../../apps/tour-viewer/assets/README.md) — per-client media
