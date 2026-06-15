# Shared UI Components

This project renders UI in **two places**:

1. **React** — dock panels (Explore, Search, Help), AI assistant, modals
2. **HTML strings** — Photo Sphere Viewer markers (nav preview, info popups,
   anchored panels)

Because the same patterns appear in both, we treat reusable UI as **shared
components**, not one-off CSS in feature files. Small context-specific tweaks
are fine; duplicating whole patterns is not.

---

## Principles

### 1. One visual language

- Design tokens live in [`src/styles/tokens.css`](../src/styles/tokens.css)
  (`--ishare-*`).
- Shared primitives use an `ishare-` class prefix (e.g. `ishare-badge`,
  `ishare-accordion`).
- When a pattern appears twice (Help accordion + nav preview NO accordion),
  extract it before a third copy appears.

### 2. React + HTML parity

Many tour surfaces are HTML injected into PSV markers. A shared component
therefore has **three layers**:

| Layer                       | Purpose                                       | Example                                            |
| --------------------------- | --------------------------------------------- | -------------------------------------------------- |
| **CSS**                     | Single source of look & behaviour             | `Badge.css`, `Accordion.css`                       |
| **Class constants**         | Same class strings in React and HTML builders | `badgeClasses.ts`, `accordionClasses.ts`           |
| **React component**         | Ergonomic JSX where we control the tree       | `Badge.tsx`, `Accordion.tsx`                       |
| **HTML helpers** (optional) | String builders for marker popups             | `accordionChevronHtml.ts`, `tourGlassPanelHtml.ts` |

Import shared CSS from [`src/main.tsx`](../src/main.tsx) so marker HTML gets the
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
src/components/ui/
  Badge.tsx              React badge
  Badge.css              Shared badge styles
  badgeClasses.ts        Class strings for HTML popups
  NamingStatusBadge.tsx  Domain wrapper (naming opportunity status)

  Accordion.tsx          React accordion (details/summary)
  Accordion.css          Shared accordion styles (nav preview baseline)
  AccordionChevron.tsx   React chevron icon
  accordionClasses.ts    Class strings + helpers
  accordionChevronHtml.ts  HTML trigger/chevron builders
```

Feature components (`TourHelpPanel`, `TourNavFloat`, `TourGlassPanel`)
**consume** `ui/*`. Viewer HTML builders (`tourGlassPanelHtml.ts`) **import
class constants and HTML helpers** from `ui/*`.

---

## Current shared components

### Badge (`ishare-badge`)

**Use for:** status chips, price pills, outline labels, dots in lists.

**React**

```tsx
import { Badge } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';

<Badge variant="outline" tone="muted">Location</Badge>
<NamingStatusBadge status="on_sale" />
```

**HTML popups**

```ts
import { BADGE_CLASS } from './ui/badgeClasses';

`<span class="${BADGE_CLASS.fillLgStatus('on-sale')}">
  <span class="${BADGE_CLASS.label}">On sale</span>
</span>`;
```

**Variants:** `outline` | `fill`; sizes `sm` | `lg`; tones `primary` | `accent`
| `muted`; naming status modifiers `on-sale` | `sold` | `reserved`.

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
`tourGlassPanelHtml.ts`, `NavPreviewPanel.css`, and
`navPreviewNamingAccordion.ts` (`data-nav-naming-toggle` /
`data-nav-naming-accordion`).

**Interaction baseline (Help accordion):**

- Hover: neutral background; chevron turns primary when closed
- Open: primary border tint; chevron rotated 180° and primary

---

## Larger shells (not in `ui/` yet)

These are shared patterns but still feature-scoped. Prefer aligning with them
before inventing new panel chrome:

| Shell             | React                | HTML                               | Notes                          |
| ----------------- | -------------------- | ---------------------------------- | ------------------------------ |
| Glass panel       | `TourGlassPanel.tsx` | `tourGlassPanelHtml.ts`            | Header, body, footer, CTA row  |
| Nav dock          | `TourNavFloat.tsx`   | —                                  | Explore / Search / Help        |
| Nav preview panel | —                    | `NavPreviewPanel.css` + glass HTML | Hero, naming section overrides |

When adding panel UI, check whether it belongs **inside** an existing shell with
`ui/*` primitives, rather than new panel-specific accordion/badge styles.

---

## Adding a new shared component

1. **Confirm reuse** — Will it appear in React and HTML, or at least twice in
   the app?
2. **Create `ui/ComponentName.css`** with `ishare-*` BEM classes.
3. **Add `componentClasses.ts`** if HTML builders need the same strings.
4. **Add `ComponentName.tsx`** for React trees; keep it thin.
5. **Import CSS in `main.tsx`** (and in the React file if colocated import is
   the pattern).
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

- [MVP_PLAN.md](./MVP_PLAN.md) — feature specs and UI layout
- [TECH_STACK.md](./TECH_STACK.md) — React, PSV, styling approach
- [`assets/README.md`](../assets/README.md) — per-client media
