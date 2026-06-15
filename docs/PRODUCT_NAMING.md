# Product naming

Official names for the Virtual Tour SaaS platform and what appears in the app.

## Hierarchy

| Level                     | Official name                                 | In-app UI               |
| ------------------------- | --------------------------------------------- | ----------------------- |
| **Platform (SaaS)**       | **iShare Virtual Tour**                       | No — internal/docs only |
| **Client tour**           | `{organization.name} Virtual Tour`            | Yes                     |
| **AI assistant**          | **Virtual Tour Guide**                        | Yes                     |
| **Facility / experience** | `tour.title` in JSON (e.g. Ken Sargent House) | Where needed in copy    |

## Platform — iShare Virtual Tour

- Company/common product name for the SaaS platform.
- **Do not show in the tour app UI** (help, splash, tab title, chat, etc.).
- Recorded in code as `ISHARE_VIRTUAL_TOUR_NAME` in `src/constants/branding.ts`
  for docs and internal reference only.

## Client tour — `{client full name} Virtual Tour`

- Derived from `organization.name` + ` Virtual Tour`.
- Override per tour with optional `productFullName` in tour JSON.
- Helper: `getTourProductFullName(tour)` in `src/utils/tourProductName.ts`.
- Used for: browser tab title, Help welcome line, load splash aria-label.

## AI assistant — Virtual Tour Guide

- Shared across all client tours.
- Constant: `VIRTUAL_TOUR_GUIDE_NAME` in `src/constants/branding.ts`.
- Short CTA: `Ask Guide` (`VIRTUAL_TOUR_GUIDE_CTA`).

## Code references

```text
src/constants/branding.ts     ISHARE_VIRTUAL_TOUR_NAME, VIRTUAL_TOUR_GUIDE_*
src/utils/tourProductName.ts  getTourProductFullName, getTourClientFullName
tours/*.json                  organization.name, title (facility), productFullName (optional)
```
