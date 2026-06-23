# Styling — Tailwind + custom CSS (hybrid)

> How we migrate styles in **iShare Virtual Tour**.  
> Tokens: [tokens.css](../src/styles/tokens.css) · Components:
> [COMPONENTS.md](./COMPONENTS.md)

---

## Goal

**Delete colocated BEM CSS from React components** and replace with Tailwind
utilities. Keep custom CSS where Tailwind is a poor fit (PSV, HTML markers,
glass, hotspots).

---

## Layer rules

| Layer                                                         | Approach                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Design tokens**                                             | `tokens.css` only — single source of hex/rgb values                               |
| **Tailwind `@theme`**                                         | `var(--ishare-*)` aliases for utilities (`bg-ishare-primary`, etc.)               |
| **React-only pages**                                          | Tailwind utilities; **delete** `Component.css` when done                          |
| **Shared `ui/*` (React)**                                     | Migrate TSX to Tailwind; delete CSS when HTML markers no longer need same classes |
| **HTML markers** (`buildMarkers.ts`, `tourGlassPanelHtml.ts`) | Custom CSS + `*Classes.ts` — **no Tailwind utilities in strings** (purge risk)    |
| **PSV chrome**                                                | `layout.css` — custom                                                             |
| **Hotspots / glass / animation**                              | `hotspots.css`, `TourGlassPanel.css`, etc. — custom                               |

---

## Import order (`main.tsx`)

1. `tokens.css`
2. `tailwind.css`
3. Global feature CSS (layout, hotspots, glass, …)

---

## Migrating one React component

1. Add any new `@theme` aliases in `tailwind.css` (only what the component
   needs).
2. Replace BEM classes in `.tsx` with Tailwind utilities.
3. Remove `import './Component.css'`.
4. **Delete** `Component.css`.
5. `npm run build` + visual QA (desktop, mobile, focus, embed query if
   relevant).
6. One commit per component ([GIT_WORKFLOW.md](./GIT_WORKFLOW.md)).

---

## Migration order (living list)

| Status | Component                                                   |
| ------ | ----------------------------------------------------------- |
| done   | `TourNotFound`                                              |
| next   | `TourErrorState` (React wrapper)                            |
| hold   | `hotspots.css`, `layout.css` (PSV), `tourGlassPanelHtml.ts` |

---

## Do not

- Duplicate hex in `@theme` — use `var(--ishare-*)` only.
- Put Tailwind class strings in PSV HTML without safelist policy.
- Mix unrelated component migrations in one commit.
