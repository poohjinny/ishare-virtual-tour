# Naming opportunity status & CTAs

Status-driven footer CTAs for naming opportunity popups. Config lives in
`src/data/namingOpportunityStatus.ts`.

## Status values

Canonical JSON values (`NamingOpportunityStatus`). Each status defines footer
CTAs (primary + secondary when Giftabulator applies):

| JSON `status`      | Label        | Primary CTA                           | Secondary CTA     |
| ------------------ | ------------ | ------------------------------------- | ----------------- |
| `open` _(default)_ | Open         | **Express interest** → `mailto:`    | **GIFTABULATOR®** |
| `reserved`         | Reserved     | **Speak with the team** → `mailto:` | **GIFTABULATOR®** |
| `soon`             | Coming soon  | **Notify me** → `mailto:`             | **GIFTABULATOR®** |
| `sold`             | Sold / Named | Donor credit + mission CTA            | optional GT       |

Omit `status` in tour JSON → treated as `open`.

**Legacy aliases** (still accepted, normalized at runtime): `on_sale` /
`on-sale` → `open`; `coming_soon` / `coming-soon` → `soon`.

## Giftabulator® CTA

Secondary footer button — brand label **GIFTABULATOR®**, tooltip description
_See tax-efficient giving_. Links to the client’s Giftabulator give-now
page with `calc=` prefill from NO price. URL rules:
[GIFTABULATOR_GIVE_NOW.md](./GIFTABULATOR_GIVE_NOW.md).

| Status     | Giftabulator fit | Notes                                                                 |
| ---------- | ---------------- | --------------------------------------------------------------------- |
| **`open`** | **Best**         | Listed price is actionable; donor wants tax impact before committing. |
| `soon`     | Optional         | Use only if price is firm enough to model; pair with **Notify me**.   |
| `reserved` | Poor             | Opportunity is spoken for — contact is the right path.                |
| `sold`     | Avoid            | Gift is complete; mission / thank-you CTAs only.                      |

## CTA resolution

1. If `popup.ctas` is set → **full override** (array of buttons).
2. Else → status defaults from `namingOpportunityStatus.ts` (`ctas` array).
3. If `popup.cta` has `product: "giftabulator"` + `url` → **GT URL override**
   only (hand-tuned `calc=`); primary status CTA unchanged.
4. Contact preset uses client email; falls back to website if no email.
5. Mail subject/body include the naming opportunity legal name.
6. Primary CTA description (`sublabel`) → **hover tooltip** on the primary
   button, not footer text.
7. Footer order: secondary left, primary right (`primary-stack` / `row-equal`).

## Tour JSON example

```json
"namingOpportunity": {
  "name": "Reception Desk Naming Opportunity",
  "price": "150000",
  "status": "open"
}
```

Giftabulator URL is built automatically from `price` — no `cta` block required.
Tour-level catalog uses `tour.namingOpportunities` + hotspot `namingId`.

## Giftabulator URL override

```json
"namingOpportunity": { "name": "...", "price": "150000", "status": "open" },
"cta": {
  "product": "giftabulator",
  "url": "https://client.giftabulatornow.com/give-now?locale=en-CA&calc=..."
}
```

Replaces only the secondary GT link. See
[GIFTABULATOR_GIVE_NOW.md](./GIFTABULATOR_GIVE_NOW.md) for auto `calc` rules.

## Adding a status

1. Extend `NamingOpportunityStatus` in `src/types/tour.ts`.
2. Add entry to status config in `namingOpportunityStatus.ts` with CTA presets.
3. Add CSS / badge modifier if needed (`badgeClasses.ts`, hotspot styles).
