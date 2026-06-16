# Product naming

Official names for the Virtual Tour SaaS platform and what appears in the app.

Names follow a **hierarchy** — the UI shows the name for the **current layer**,
not one global label everywhere.

## Hierarchy

| Level                        | Official name                                 | Typical in-app UI                                               |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| **Platform (SaaS)**          | **iShare Virtual Tour**                       | Platform-level screens only (e.g. multi-client intro `/`)       |
| **Client tour**              | `{organization.name} Virtual Tour`            | Inside a tour — tab title, splash, Help welcome                 |
| **AI assistant**             | **Virtual Tour Guide**                        | Chat panel, FAB, Help copy                                      |
| **Facility / catalog entry** | `tour.title` in JSON (e.g. Ken Sargent House) | Intro list item title, in-tour copy where the facility is named |

### Which name when?

```text
/  (client intro — no tour loaded yet)
   → iShare Virtual Tour          ← top layer; user is picking a client tour

/ken-sargent-house/overview   (inside a client tour)
   → {Client} Virtual Tour        ← client tour layer
   → tour.title for facility name where relevant (Ken Sargent House, etc.)

Intro list row
   → tour.title (primary) + organization.name (secondary) + category
   → not the platform or client-tour product line — catalog / facility level
```

## Platform — iShare Virtual Tour

- Company/common product name for the SaaS platform.
- **May appear in app UI on platform-level screens** — when the user has not
  entered a client tour yet.
- Primary example: **client intro picker** at `/` with multiple catalog tours
  (`ClientIntroPicker` + `TourProductBranding` without `clientName`).
- **Do not use** on in-tour chrome (Help welcome, splash, tab title after a tour
  is loaded) — those use the client tour name.
- Recorded in code as `ISHARE_VIRTUAL_TOUR_NAME` and
  `PLATFORM_PRODUCT_NAME_PREFIX` in `src/constants/branding.ts`.

## Client tour — `{client full name} Virtual Tour`

- Derived from `organization.name` + ` Virtual Tour`.
- Override per tour with optional `productFullName` in tour JSON.
- Helper: `getTourProductFullName(tour)` in `src/utils/tourProductName.ts`.
- Used when the **client tour layer** is active: browser tab title, Help welcome
  line, load splash aria-label, `TourProductBranding` with `clientName` + client
  theme color.

## AI assistant — Virtual Tour Guide

- Shared across all client tours.
- Constant: `VIRTUAL_TOUR_GUIDE_NAME` in `src/constants/branding.ts`.
- Short CTA: `Ask Guide` (`VIRTUAL_TOUR_GUIDE_CTA`).

## UI component — `TourProductBranding`

| Context                 | Props                               | Renders                                               |
| ----------------------- | ----------------------------------- | ----------------------------------------------------- |
| Platform (intro header) | no `clientName`                     | `[iShare logo] Virtual Tour` — logo lockup, no marker |
| Client tour             | `clientName`, optional `themeColor` | `[marker] {Client} Virtual Tour` (client primary)     |

## Code references

```text
src/constants/branding.ts       ISHARE_VIRTUAL_TOUR_NAME, PLATFORM_PRODUCT_*
src/utils/tourProductName.ts    getTourProductFullName, getTourClientFullName
src/components/TourProductBranding.tsx
src/components/ClientIntroPicker.tsx
tours/*.json                    organization.name, title (facility), productFullName (optional)
```
