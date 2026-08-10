# iShare Virtual Tour — Documentation

Project documentation for the iShare virtual tour platform.

## Start here

| If you need…                       | Read                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **What to build next**             | [ROADMAP.md](./ROADMAP.md)                                                                                       |
| **URL / embed / catalog rules**    | [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)                                                                             |
| **iframe embed (`?embed=1`)**      | [EMBED.md](./EMBED.md)                                                                                           |
| **Production deploy**              | [DEPLOY.md](./DEPLOY.md)                                                                                         |
| **Why we built this, demo script** | [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)                                                                       |
| **How to code in this repo**       | [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)                                                                   |
| **Viewer isolation (pano vs 3D)**  | [CODING_GUIDELINES.md § Viewer-type isolation](./CODING_GUIDELINES.md#viewer-type-isolation-panorama-vs-model3d) |
| **Dev panel & local authoring**    | [DEV_PANEL.md](./DEV_PANEL.md)                                                                                   |
| **New client — what to ask**       | [CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md)                                               |
| **Client privacy / data brief**    | [CLIENT_PRIVACY_DATA_BRIEF.md](./CLIENT_PRIVACY_DATA_BRIEF.md)                                                   |
| **3D handoff — what to deliver**   | [ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md)                                                         |
| **Mobile chrome**                  | [MOBILE.md](./MOBILE.md)                                                                                         |
| **Tour Guide / Ask Guide**         | [PRODUCT_NAMING.md](./PRODUCT_NAMING.md), [DEPLOY.md](./DEPLOY.md)                                               |

## All documents

| Document                                                           | Description                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [ROADMAP.md](./ROADMAP.md)                                         | Backlog and phasing — Phase 0–3 (**Phase 1 complete**)                  |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)                               | Product contracts — routing, embed, catalog, JSON schemas, UI layout    |
| [EMBED.md](./EMBED.md)                                             | Embed mode — iframe URL, chrome, postMessage, QA                        |
| [DEPLOY.md](./DEPLOY.md)                                           | Production deploy — `tour.ishare.ca`, DNS, GitHub Pages, Tour Guide API |
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)                         | SeekBeak context, stakeholder demo script                               |
| [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)                     | Engineering reference — structure, **viewer-type isolation**, styling   |
| [DEV_PANEL.md](./DEV_PANEL.md)                                     | Dev panel (`?dev=1`) — Scene/Scenes/Namings/Tours/Clients/Debug         |
| [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)                               | Git commit/push guidelines — one task per commit                        |
| [STYLING.md](./STYLING.md)                                         | Tailwind + custom CSS; **rem-first** responsive units                   |
| [TECH_STACK.md](./TECH_STACK.md)                                   | Technology choices (PSV + Three.js), Tour Guide, dependencies           |
| [SCENE_TRANSITIONS.md](./SCENE_TRANSITIONS.md)                     | Scene transition UX, zoom semantics, tuning                             |
| [COMPONENTS.md](./COMPONENTS.md)                                   | Shared UI components — React and HTML marker popups                     |
| [PRODUCT_NAMING.md](./PRODUCT_NAMING.md)                           | Naming hierarchy — platform vs client tour vs Tour Guide                |
| [NAMING_OPPORTUNITIES.md](./NAMING_OPPORTUNITIES.md)               | Naming status values and status-driven popup CTAs                       |
| [PERFORMANCE.md](./PERFORMANCE.md)                                 | Performance playbook — P0–P5 guidance (tasks only in ROADMAP)           |
| [MOBILE.md](./MOBILE.md)                                           | React chrome layout on phone — breakpoints, QA                          |
| [GIFTABULATOR_GIVE_NOW.md](./GIFTABULATOR_GIVE_NOW.md)             | Giftabulator Give Now CTA wiring                                        |
| [CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md) | Client intake — full tour onboarding checklist (sales)                  |
| [CLIENT_PRIVACY_DATA_BRIEF.md](./CLIENT_PRIVACY_DATA_BRIEF.md)     | Client-facing — cookies, local storage, Tour Guide, analytics           |
| [ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md)           | 3D handoff — panoramas, GLTF models, spatial package (architect → dev)  |
| [CURSOR_GLOBAL_RULES.md](./CURSOR_GLOBAL_RULES.md)                 | Cursor agent rules snapshot (optional)                                  |

## Quick links

- [Root README](../README.md) — install and run
- [Tour catalog](../tours/catalog.json) — clients, tour ids, categories
- [Tour configs](../tours/) — `{tourId}.json` and `catalog.json`
- [Assets workflow](../assets/README.md) — folder layout, JPG → WebP for
  panoramas
