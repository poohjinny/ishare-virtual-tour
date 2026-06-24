# Styling — Tailwind-first

> How we style **iShare Virtual Tour**.  
> Theme: [globals.css](../src/styles/globals.css) · Components:
> [COMPONENTS.md](./COMPONENTS.md)

---

## Goal

**Tailwind utilities + `cva` variants** for all React UI. Delete colocated BEM
CSS as each component migrates. Keep a thin custom CSS layer only where Tailwind
is a poor fit (PSV chrome, hotspot animation, HTML marker shells).

---

## Architecture

```
globals.css (@theme)     ← single source of hex/rgb/type scale
       ↓
Tailwind utilities       ← bg-primary, text-lg, font-display, …
       ↓
React components         ← className + cn() + cva()
       ↓
@layer base shims        ← --ishare-* aliases (legacy CSS, removed over time)
```

| Layer              | Approach                                                          |
| ------------------ | ----------------------------------------------------------------- |
| **Design tokens**  | `@theme` in `globals.css` only                                    |
| **Runtime brand**  | `--brand-*` on `:root` via `clientTheme.ts` → `--color-primary`   |
| **React UI**       | Tailwind utilities + `cn()` + `class-variance-authority`          |
| **HTML markers**   | `@layer components` with `@apply` — stable class names in strings |
| **PSV / hotspots** | `psv-layer.css` — PSV chrome + HTML hotspot markers               |

---

## Key files

| File                                | Role                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/styles/globals.css`            | `@import 'tailwindcss'`, full `@theme`, legacy `--ishare-*` shims |
| `src/styles/components-layer.css`   | `@layer components` — badge/accordion/skeleton for HTML markers   |
| `src/styles/glass-panels-layer.css` | `@layer components` — glass panel, nav preview, info popup shells |
| `src/styles/psv-layer.css`          | PSV navbar chrome + HTML hotspot marker styles                    |
| `src/lib/cn.ts`                     | `clsx` + `tailwind-merge` helper                                  |
| `src/utils/clientTheme.ts`          | Sets `--brand-primary*` at runtime per tour                       |

---

## Import order (`main.tsx`)

1. `globals.css` (includes `components-layer.css`, `glass-panels-layer.css`,
   `psv-layer.css`)
2. No other global CSS imports in `main.tsx`

No per-component CSS imports in `main.tsx` long-term — only globals that HTML
markers or PSV still need before migration completes.

---

## Utilities cheat sheet

| Token                | Utility examples                                      |
| -------------------- | ----------------------------------------------------- |
| `--color-primary`    | `bg-primary`, `text-primary`, `outline-primary`       |
| `--color-page`       | `bg-page` — app shell background                      |
| `--color-foreground` | `text-foreground` — headings                          |
| `--color-body`       | `text-body` — default body copy                       |
| `--color-muted`      | `text-muted` — secondary copy                         |
| `--text-lg`          | `text-lg` (14px — iShare scale, not Tailwind default) |
| `--font-display`     | `font-display`                                        |

Add new `@theme` entries in `globals.css` when migrating a component — do not
duplicate hex elsewhere.

---

## Icons

**Default: Material Symbols Rounded** (ligature font). The font is loaded in
[`index.html`](../index.html); base styles live in
[`glass-panels-layer.css`](../src/styles/glass-panels-layer.css)
(`.material-symbols-rounded`).

| When                                             | Approach                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **New UI icon** (buttons, menus, CTAs, tooltips) | Material glyph in a `<span>` — see [`glassPanelCtaIcons.tsx`](../src/components/glassPanelCtaIcons.tsx) |
| **Custom SVG**                                   | Only when explicitly requested (brand mark, one-off art direction, animation the font cannot do)        |

**React pattern (preferred):** use
[`MaterialSymbol.tsx`](../src/components/ui/MaterialSymbol.tsx) with size tokens
from
[`materialSymbolClasses.ts`](../src/components/ui/materialSymbolClasses.ts).

```tsx
import { MaterialSymbol } from './ui/MaterialSymbol';
import { materialSymbolPanelHeaderClassName } from './ui/materialSymbolClasses';

<MaterialSymbol name='sort' className={materialSymbolPanelHeaderClassName} />;
```

Size icons with **`font-size` only** (`text-[18px]`,
`tour-glass-panel__close-icon`, etc.). Let the **parent**
(`flex items-center justify-center`) center the glyph — do not set fixed
`width`/`height` on the ligature span or use `translate` offsets.

**Do not** add new hand-drawn SVG icon files for routine UI (sort, layout
toggle, tabs, chevrons, etc.) unless the task or design spec asks for custom
artwork. Pick the closest [Material Symbols](https://fonts.google.com/icons)
name instead.

**Existing custom SVG** (e.g. explore tab icons, tour nav chevrons) may stay
until touched — prefer Material when refactoring those surfaces.

---

## Migrating one React component

1. Add any missing `@theme` tokens in `globals.css`.
2. Replace BEM classes with Tailwind utilities (use `cn()` for conditionals).
3. For repeated variants, extract `cva()` in the same file or `ui/*Variants.ts`.
4. Remove `import './Component.css'`.
5. **Delete** `Component.css`.
6. `npm run build` + visual QA.
7. One commit per component ([GIT_WORKFLOW.md](./GIT_WORKFLOW.md)).

---

## Migration phases

| Phase | Scope                                                     | Status |
| ----- | --------------------------------------------------------- | ------ |
| **0** | `@theme` + `cn`/`cva` + `globals.css`                     | done   |
| **1** | `ui/*` — Badge, Accordion, SegmentedTabs, PreviewSkeleton | done   |
| **2** | Leaf pages — TourErrorState, LoadSplash                   | done   |
| **3** | Intro — ClientIntro*, ShareTour*, PlatformBrandLink       | done   |
| **4** | Tour chrome — TourNavFloat, AiAssistant, FloorPlanMinimap | done   |
| **5** | Glass / markers — `@layer components` + shrink CSS files  | done   |
| **6** | PSV trim — layout/hotspots dead code removal              | done   |

---

## Do not

- Add hex values outside `globals.css` `@theme`.
- Put long Tailwind utility strings in PSV HTML (purge risk) — use
  `@layer components`.
- Reintroduce `tokens.css` or `tailwind.config.js` (v4 CSS-first).
- Mix unrelated component migrations in one commit.
- Add bespoke SVG icons for standard UI chrome without an explicit custom-icon
  request.

---

## Legacy shims

Existing CSS still references `--ishare-*`. Those variables are defined in
`globals.css` `@layer base` as aliases to `@theme` tokens. Remove each shim when
no file references that variable anymore.
