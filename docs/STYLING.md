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
| **PSV / hotspots** | `psv-layer.css` — PSV chrome + HTML hotspot markers              |

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
| **2** | Leaf pages — TourErrorState, LoadSplash, ClientSelector   | done   |
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

---

## Legacy shims

Existing CSS still references `--ishare-*`. Those variables are defined in
`globals.css` `@layer base` as aliases to `@theme` tokens. Remove each shim when
no file references that variable anymore.
