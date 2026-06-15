# iShare Virtual Tour — Roadmap

> Future work after the current MVP. For completed scope and demo goals, see
> [PLANNING.md](./PLANNING.md) and [MVP_PLAN.md](./MVP_PLAN.md).

---

## Overview

The MVP proves in-house navigation, transitions, hotspot UX, naming
opportunities, multi-client branding, and scene-aware AI over the SeekBeak
embed. The roadmap below turns that prototype into a **scalable product**
integrated with iShare, Giftabulator®, and Power Donor Platform.

---

## Priority themes

### 1. VR / XR support

Extend the tour for **immersive viewing** on supported devices (VR headsets,
future AR / spatial experiences).

**Goals**

- Reuse existing panoramas, hotspots, and naming opportunity data — no duplicate
  content per format
- Support high-impact use cases: donor events, facility previews, campaign
  launches
- Evaluate WebXR / device-native paths based on audience and hardware

**Open questions**

- Which headsets and browsers are in scope for v1?
- Full VR walk mode vs. seated 360° — same tour or simplified mobile VR subset?

---

### 2. Database & platform integration

Move tour content from local JSON files into a **central database** and API.

**Goals**

- Single source of truth for clients, scenes, hotspots, naming opportunities,
  pricing, and status (`on_sale` | `sold` | `reserved`)
- Sync availability and CTAs with **Giftabulator** and donor workflows
- Serve tours to the **iShare website**, embed mode, and future admin tools
- Enable non-developer updates without redeploying static JSON

**Integration targets**

| System               | Purpose                                   |
| -------------------- | ----------------------------------------- |
| iShare website       | Embed tours, deep links, client pages     |
| Giftabulator®        | CTA URLs, calc context, giving flows      |
| Power Donor Platform | Donor / opportunity data where applicable |

**Notes**

- Current JSON schema (`tours/*.json`, `*-knowledge.json`) is the reference
  model for DB design
- Client id convention (`gphospitalfoundation`, `cancerresearchsociety`) should
  stay stable across URL paths and assets

---

### 3. Mobile optimization

The tour runs on phones and tablets today; this phase is **mobile-first
polish**.

**Goals**

- Touch-friendly navigation (FABs, panels, hotspots, popups)
- Performance on cellular networks (panorama size, preload strategy, progress
  UX)
- Layout tuning for small screens (breadcrumb, panels, anchored popups)
- Optional: device orientation / gyro where it improves exploration

**Success criteria**

- Comfortable first-load and scene change on mid-range mobile devices
- Naming opportunity popups readable and tappable without horizontal scroll
- Embed mode usable inside mobile web views

---

## Additional roadmap items

### 4. Content admin (CMS)

Simple admin UI to edit scenes, hotspot positions, copy, video URLs, pricing,
and status — reducing dependency on JSON edits and redeploys.

### 5. Live AI assistant

Upgrade Ask Guide from mock / knowledge-base rules to a **live LLM** backed by
per-client knowledge, with answers that stay current when DB content changes.

### 6. Analytics & insights

Track scene views, hotspot clicks, popup opens, and Giftabulator CTA clicks to
inform fundraising and content decisions.

### 7. Client rollout

Onboard new clients using the established pattern:

- `assets/{clientId}/` — panoramas, brand
- `tours/{clientId}.json` — tour config
- `tours/{clientId}-knowledge.json` — AI knowledge
- Register in `src/data/loadTour.ts`

### 8. Accessibility & performance

- Keyboard navigation (partially done — extend coverage and docs)
- Screen reader labels for nav and panels where practical
- CDN or asset pipeline for large panoramas
- Error recovery and offline / slow-network messaging
- Detailed optimization backlog: [PERFORMANCE.md](./PERFORMANCE.md)

---

## Suggested phasing

| Phase         | Focus                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| **Near term** | Mobile polish, more client tours, hotspot/content tuning workflow (`?dev=1`) |
| **Mid term**  | Database + API, Giftabulator / iShare integration, content admin MVP         |
| **Long term** | VR/XR modes, live AI assistant, analytics, deeper platform tie-ins           |

Phasing is flexible — **database integration** may move earlier if multiple
clients and live pricing updates become urgent.

---

## Out of scope (for now)

- Replacing professional 360° capture / photography workflow
- Full SeekBeak feature parity where it does not serve iShare fundraising UX
- Native iOS/Android apps (web-first unless VR/XR requires otherwise)

---

## Related documents

| Document                                | Relevance                             |
| --------------------------------------- | ------------------------------------- |
| [PLANNING.md](./PLANNING.md)            | MVP goals, SeekBeak context           |
| [MVP_PLAN.md](./MVP_PLAN.md)            | Current feature spec and schemas      |
| [TECH_STACK.md](./TECH_STACK.md)        | Stack choices; note DB/API when added |
| [assets/README.md](../assets/README.md) | Per-client asset layout               |

---

## Changelog

| Date       | Note                                                         |
| ---------- | ------------------------------------------------------------ |
| 2026-06-11 | Initial roadmap — VR/XR, database, mobile + supporting items |
