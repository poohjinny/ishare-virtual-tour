# iShare Virtual Tour — Documentation

Project documentation for the iShare virtual tour platform.

## Start here

| If you need…                       | Read                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **What to build next**             | [ROADMAP.md](./ROADMAP.md)                                                                                                |
| **URL / embed / catalog rules**    | [PRODUCT_SPEC.md](./product/PRODUCT_SPEC.md)                                                                                      |
| **iframe embed (`?embed=1`)**      | [ops/EMBED.md](./ops/EMBED.md)                                                                                            |
| **Production deploy**              | [ops/DEPLOY.md](./ops/DEPLOY.md)                                                                                          |
| **Why we built this, demo script** | [product/PROJECT_CONTEXT.md](./product/PROJECT_CONTEXT.md)                                                                |
| **How to code in this repo**       | [engineering/CODING_GUIDELINES.md](./engineering/CODING_GUIDELINES.md)                                                    |
| **Viewer isolation (pano vs 3D)**  | [CODING_GUIDELINES § Viewer-type isolation](./engineering/CODING_GUIDELINES.md#viewer-type-isolation-panorama-vs-model3d) |
| **Dev panel & local authoring**    | [engineering/DEV_PANEL.md](./engineering/DEV_PANEL.md)                                                                    |
| **New client — what to ask**       | [client/CLIENT_REQUIRED_INFORMATION.md](./client/CLIENT_REQUIRED_INFORMATION.md)                                          |
| **Client privacy / data brief**    | [client/CLIENT_PRIVACY_DATA_BRIEF.md](./client/CLIENT_PRIVACY_DATA_BRIEF.md)                                              |
| **3D handoff — what to deliver**   | [client/ARCHITECT_DELIVERABLES.md](./client/ARCHITECT_DELIVERABLES.md)                                                    |
| **Mobile chrome**                  | [engineering/MOBILE.md](./engineering/MOBILE.md)                                                                          |
| **Tour Guide / Ask Guide**         | [product/NAMING.md](./product/NAMING.md), [ops/DEPLOY.md](./ops/DEPLOY.md)                                                |
| **Tour product DB (design)**       | [TOUR_DB.md](./product/TOUR_DB.md)                                                                  |

## Layout

```text
docs/
  README.md                 ← this index
  ROADMAP.md                ← what to build next
  product/                  ← contracts, naming, Tour DB, context
  engineering/              ← how to build in this repo
  ops/                      ← embed & deploy
  client/                   ← external handoffs (sales / IT / 3D)
  archive/                  ← frozen snapshots
```

## All documents

### Root

| Document                   | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| [ROADMAP.md](./ROADMAP.md) | What to build next — Phase 2–3 (**Phase 1 complete**) |

### `product/`

| Document                                                           | Description                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [PRODUCT_SPEC.md](./product/PRODUCT_SPEC.md)                       | Product contracts — routing, embed, catalog, JSON schemas, UI layout |
| [TOUR_DB.md](./product/TOUR_DB.md)   | Tour product DB design — Ops license, JSON → DB                      |
| [NAMING.md](./product/NAMING.md)                                   | Product names + naming-opportunity statuses / CTAs                     |
| [GIFTABULATOR.md](./product/GIFTABULATOR.md)     | Giftabulator integrations (Give Now today; more modules later)       |
| [PROJECT_CONTEXT.md](./product/PROJECT_CONTEXT.md)                 | SeekBeak context, stakeholder demo script                            |

### `engineering/`

| Document                                                   | Description                                                           |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| [CODING_GUIDELINES.md](./engineering/CODING_GUIDELINES.md) | Engineering reference — structure, viewer-type isolation, transitions |
| [DEV_PANEL.md](./engineering/DEV_PANEL.md)                 | Dev panel (`?dev=1`) — Scene/Scenes/Namings/Tours/Clients/Debug       |
| [GIT_WORKFLOW.md](./engineering/GIT_WORKFLOW.md)           | Git commit/push guidelines — one task per commit                      |
| [STYLING.md](./engineering/STYLING.md)                     | Tailwind + custom CSS; rem-first responsive units                     |
| [TECH_STACK.md](./engineering/TECH_STACK.md)               | Why this stack (PSV + Three.js, Workers, not Next.js)                 |
| [COMPONENTS.md](./engineering/COMPONENTS.md)               | Shared UI components — React and HTML marker popups                   |
| [PERFORMANCE.md](./engineering/PERFORMANCE.md)             | Performance playbook — P0–P5 (tasks only in ROADMAP)                  |
| [MOBILE.md](./engineering/MOBILE.md)                       | React chrome layout on phone — breakpoints, QA                        |

### `ops/`

| Document                     | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| [EMBED.md](./ops/EMBED.md)   | Embed mode — iframe URL, chrome, postMessage, QA                        |
| [DEPLOY.md](./ops/DEPLOY.md) | Production deploy — `tour.ishare.ca`, DNS, GitHub Pages, Tour Guide API |

### `client/`

| Document                                                                  | Description                                                            |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [CLIENT_REQUIRED_INFORMATION.md](./client/CLIENT_REQUIRED_INFORMATION.md) | Client intake — full tour onboarding checklist (sales)                 |
| [CLIENT_PRIVACY_DATA_BRIEF.md](./client/CLIENT_PRIVACY_DATA_BRIEF.md)     | Client-facing — cookies, local storage, Tour Guide, analytics          |
| [ARCHITECT_DELIVERABLES.md](./client/ARCHITECT_DELIVERABLES.md)           | 3D handoff — panoramas, GLTF models, spatial package (architect → dev) |

### `archive/`

| Document                                                   | Description                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| [CURSOR_GLOBAL_RULES.md](./archive/CURSOR_GLOBAL_RULES.md) | Archived Cursor rules snapshot — live SoT is `.cursor/rules/` |

## Quick links

- [Root README](../README.md) — install and run
- [Tour catalog](../tours/catalog.json) — clients, tour ids, categories
- [Tour configs](../tours/) — `{tourId}.json` and `catalog.json`
- [Assets workflow](../assets/README.md) — folder layout, JPG → WebP for
  panoramas
- Suite Ops (sibling repo):
  [FMI-SUITE-OPS-ACCOUNTS-ACCESS.md](../../fmi-suite-dashboard/docs/FMI-SUITE-OPS-ACCOUNTS-ACCESS.md)
