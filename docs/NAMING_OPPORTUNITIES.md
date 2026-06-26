# Naming opportunity status & CTAs

Status-driven footer CTAs for naming opportunity popups. Config lives in
`src/data/namingOpportunityStatus.ts`.

## Status values

Each status defines **two footer CTAs** (primary + secondary):

| JSON `status`         | Label       | Primary CTA                           | Secondary CTA     |
| --------------------- | ----------- | ------------------------------------- | ----------------- |
| `on_sale` _(default)_ | On sale     | **Express your interest** → `mailto:` | **GIFTABULATOR®** |
| `reserved`            | Reserved    | **Speak with our team** → `mailto:`   | **GIFTABULATOR®** |
| `coming_soon`         | Coming soon | **Notify me** → `mailto:`             | **GIFTABULATOR®** |
| `sold`                | Sold        | **Support our mission** → org website | **GIFTABULATOR®** |

Omit `status` in tour JSON → treated as `on_sale`.

## Giftabulator® CTA

Secondary footer button — brand label **GIFTABULATOR®**, tooltip description
_See your tax-efficient giving_. Links to the client’s Giftabulator give-now
page with `calc=` prefill from NO price. URL rules:
[GIFTABULATOR_GIVE_NOW.md](./GIFTABULATOR_GIVE_NOW.md).

| Status        | Giftabulator fit | Notes                                                                 |
| ------------- | ---------------- | --------------------------------------------------------------------- |
| **`on_sale`** | **Best**         | Listed price is actionable; donor wants tax impact before committing. |
| `coming_soon` | Optional         | Use only if price is firm enough to model; pair with **Notify me**.   |
| `reserved`    | Poor             | Opportunity is spoken for — contact is the right path.                |
| `sold`        | Avoid            | Gift is complete; mission / thank-you CTAs only.                      |

## CTA resolution

1. If `popup.ctas` is set → **full override** (array of buttons).
2. Else → status defaults from `namingOpportunityStatus.ts` (`ctas` array).
3. If `popup.cta` has `product: "giftabulator"` + `url` → **GT URL override**
   only (hand-tuned `calc=`); primary status CTA unchanged.
4. Contact preset uses `organization.email`; falls back to
   `organization.website` or `tour.url` if no email.
5. Mail subject/body include the naming opportunity legal name.
6. Primary CTA description (`sublabel`) → **hover tooltip** on the primary
   button, not footer text.
7. Footer order: secondary left, primary right (`primary-stack` / `row-equal`).

## Tour JSON example

```json
"namingOpportunity": {
  "name": "Reception Desk Naming Opportunity",
  "price": "150000",
  "status": "on_sale"
}
```

Giftabulator URL is built automatically from `price` — no `cta` block required.

## Giftabulator URL override

```json
"namingOpportunity": { "name": "...", "price": "150000", "status": "on_sale" },
"cta": {
  "product": "giftabulator",
  "url": "https://client.giftabulatornow.com/give-now?locale=en-CA&calc=..."
}
```

Replaces only the secondary GT link. See
[GIFTABULATOR_GIVE_NOW.md](./GIFTABULATOR_GIVE_NOW.md) for auto `calc` rules.

## Adding a status

1. Extend `NamingOpportunityStatus` in `src/types/tour.ts`.
2. Add entry to `STATUS_CONFIG` in `namingOpportunityStatus.ts` with at least
   two `ctas` entries (`variant`: `primary` | `secondary`).
3. Add CSS modifier in `Badge.css` / `tokens.css` / `hotspots.css` if needed.
