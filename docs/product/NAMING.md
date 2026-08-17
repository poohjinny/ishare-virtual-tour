# Naming — product names & naming opportunities

Two related topics in one place:

1. **Product naming** — official names for the platform, client tours, and the
   AI assistant, and which name appears on which screen.
2. **Naming opportunities (NO)** — status values and status-driven popup CTAs.

---

## Part 1 — Product naming

Official names for the Virtual Tour SaaS platform and what appears in the app.

Names follow a **hierarchy** — the UI shows the name for the **current layer**,
not one global label everywhere.

### Hierarchy

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

/t_l01wnq8eh6/s_dtv27wfrbi   (inside a client tour)
   → {Client} Virtual Tour        ← client tour layer
   → tour.title for facility name where relevant (Ken Sargent House, etc.)

Intro list row
   → tour.title (primary) + organization.name (secondary) + category
   → not the platform or client-tour product line — catalog / facility level
```

### Platform — iShare Virtual Tour

- Company/common product name for the SaaS platform.
- **May appear in app UI on platform-level screens** — when the user has not
  entered a client tour yet.
- Primary example: **client intro picker** at `/` with multiple catalog tours
  (`ClientIntroPicker` + `TourProductBranding` without `clientName`).
- **Do not use** on in-tour chrome (Help welcome, splash, tab title after a tour
  is loaded) — those use the client tour name.
- Recorded in code as `ISHARE_VIRTUAL_TOUR_NAME` and
  `PLATFORM_PRODUCT_NAME_PREFIX` in `apps/tour-viewer/src/constants/branding.ts`.

### Client tour — `{client full name} Virtual Tour`

- Derived from `organization.name` + ` Virtual Tour`.
- Override per tour with optional `productFullName` in tour JSON.
- Helper: `getTourProductFullName(tour)` in `apps/tour-viewer/src/utils/tourProductName.ts`.
- Used when the **client tour layer** is active: browser tab title, Help welcome
  line, load splash aria-label, `TourProductBranding` with `clientName` + client
  theme color.

### AI assistant — Virtual Tour Guide

- Shared across all client tours; enable per tour with `askGuideEnabled`.
- Display name: `Tour Guide` (`VIRTUAL_TOUR_GUIDE_NAME`).
- FAB label: `Ask Tour Guide` (`VIRTUAL_TOUR_GUIDE_FAB_LABEL`).
- Composer hint / short CTA: `Ask a question` (`VIRTUAL_TOUR_GUIDE_CTA`).
- Constants live in `apps/tour-viewer/src/constants/branding.ts`.

### UI component — `TourProductBranding`

| Context                 | Props                               | Renders                                               |
| ----------------------- | ----------------------------------- | ----------------------------------------------------- |
| Platform (intro header) | no `clientName`                     | `[iShare logo] Virtual Tour` — logo lockup, no marker |
| Client tour             | `clientName`, optional `themeColor` | `[marker] {Client} Virtual Tour` (client primary)     |

### Code references

```text
apps/tour-viewer/src/constants/branding.ts       ISHARE_VIRTUAL_TOUR_NAME, PLATFORM_PRODUCT_*
apps/tour-viewer/src/utils/tourProductName.ts    getTourProductFullName, getTourClientFullName
apps/tour-viewer/src/components/TourProductBranding.tsx
apps/tour-viewer/src/components/ClientIntroPicker.tsx
tours/*.json                    organization.name, title (facility), productFullName (optional)
```

---

## Part 2 — Naming opportunity status & CTAs

Status-driven footer CTAs for naming opportunity popups. Config lives in
`apps/tour-viewer/src/data/namingOpportunityStatus.ts`.

### Status values

Canonical JSON values (`NamingOpportunityStatus`). Each status defines footer
CTAs (primary + secondary when Giftabulator applies):

| JSON `status`      | Label        | Primary CTA                         | Secondary CTA     |
| ------------------ | ------------ | ----------------------------------- | ----------------- |
| `open` _(default)_ | Open         | **Express interest** → `mailto:`    | **GIFTABULATOR®** |
| `reserved`         | Reserved     | **Speak with the team** → `mailto:` | **GIFTABULATOR®** |
| `soon`             | Coming soon  | **Notify me** → `mailto:`           | **GIFTABULATOR®** |
| `sold`             | Sold / Named | Donor credit + mission CTA          | optional GT       |

Omit `status` in tour JSON → treated as `open`.

**Legacy aliases** (still accepted, normalized at runtime): `on_sale` /
`on-sale` → `open`; `coming_soon` / `coming-soon` → `soon`.

### Giftabulator® CTA

Secondary footer button — brand label **GIFTABULATOR®**, tooltip description
_See tax-efficient giving_. Links to the client’s Giftabulator give-now page
with `calc=` prefill from NO price. URL rules:
[GIFTABULATOR.md — Give Now](./GIFTABULATOR.md#give-now).

| Status     | Giftabulator fit | Notes                                                                 |
| ---------- | ---------------- | --------------------------------------------------------------------- |
| **`open`** | **Best**         | Listed price is actionable; donor wants tax impact before committing. |
| `soon`     | Optional         | Use only if price is firm enough to model; pair with **Notify me**.   |
| `reserved` | Poor             | Opportunity is spoken for — contact is the right path.                |
| `sold`     | Avoid            | Gift is complete; mission / thank-you CTAs only.                      |

### CTA resolution

1. If `popup.ctas` is set → **full override** (array of buttons).
2. Else → status defaults from `namingOpportunityStatus.ts` (`ctas` array).
3. If `popup.cta` has `product: "giftabulator"` + `url` → **GT URL override**
   only (hand-tuned `calc=`); primary status CTA unchanged.
4. Contact preset uses client email; falls back to website if no email.
5. Mail subject/body include the naming opportunity legal name.
6. Primary CTA description (`sublabel`) → **hover tooltip** on the primary
   button, not footer text.
7. Footer order: secondary left, primary right (`primary-stack` / `row-equal`).

### Tour JSON example

```json
"namingOpportunity": {
  "name": "Reception Desk Naming Opportunity",
  "price": "150000",
  "status": "open"
}
```

Giftabulator URL is built automatically from `price` — no `cta` block required.
Tour-level catalog uses `tour.namingOpportunities` + hotspot `namingId`.

### Giftabulator URL override

```json
"namingOpportunity": { "name": "...", "price": "150000", "status": "open" },
"cta": {
  "product": "giftabulator",
  "url": "https://client.giftabulatornow.com/give-now?locale=en-CA&calc=..."
}
```

Replaces only the secondary GT link. See
[GIFTABULATOR.md — Give Now](./GIFTABULATOR.md#give-now) for auto `calc` rules.

### Adding a status

1. Extend `NamingOpportunityStatus` in `apps/tour-viewer/src/types/tour.ts`.
2. Add entry to status config in `namingOpportunityStatus.ts` with CTA presets.
3. Add CSS / badge modifier if needed (`badgeClasses.ts`, hotspot styles).
