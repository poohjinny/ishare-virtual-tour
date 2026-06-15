# Naming opportunity status & CTAs

Status-driven footer CTAs for naming opportunity popups. Config lives in
`src/data/namingOpportunityStatus.ts`.

## Status values

Each status defines **two footer CTAs** (primary + secondary):

| JSON `status`         | Label       | Primary CTA                                | Secondary CTA              |
| --------------------- | ----------- | ------------------------------------------ | -------------------------- |
| `on_sale` _(default)_ | On sale     | **Express interest** → `mailto:` org email | **Visit our website**      |
| `reserved`            | Reserved    | **Contact us** → `mailto:`                 | **Visit our website**      |
| `coming_soon`         | Coming soon | **Notify me** → `mailto:`                  | **Visit our website**      |
| `sold`                | Sold        | **Support our mission** → org website      | **Contact us** → `mailto:` |

Omit `status` in tour JSON → treated as `on_sale`.

## Giftabulator® CTA

Giftabulator links to a tax-benefit calculator pre-filled with the naming
opportunity price. It fits best when a donor is **actively evaluating a gift at
that amount**:

| Status        | Giftabulator fit | Notes                                                                 |
| ------------- | ---------------- | --------------------------------------------------------------------- |
| **`on_sale`** | **Best**         | Listed price is actionable; donor wants tax impact before committing. |
| `coming_soon` | Optional         | Use only if price is firm enough to model; pair with **Notify me**.   |
| `reserved`    | Poor             | Opportunity is spoken for — contact is the right path.                |
| `sold`        | Avoid            | Gift is complete; mission / thank-you CTAs only.                      |

Per-opportunity Giftabulator URLs (with `calc=` prefill) live in tour JSON — not
in global status defaults.

## CTA resolution

1. If `popup.ctas` is set → **full override** (array of buttons).
2. Else if `popup.cta` is set → **primary override** (e.g. Giftabulator) plus
   status **contact** CTA as secondary (`Express interest`, `Contact us`, or
   `Notify me` depending on status).
3. Else → status defaults from `namingOpportunityStatus.ts` (`ctas` array).
4. Contact preset uses `organization.email`; falls back to
   `organization.website` or `tour.url` if no email.
5. Mail subject/body include the naming opportunity legal name.
6. Primary CTA sublabel renders below both buttons (nav preview order: secondary
   left, primary right).
7. Dual footer layout: secondary is shrink-wrapped (`nowrap`); primary grows and
   **wraps** (Giftabulator-length labels). Very narrow viewports stack via
   `flex-wrap`.

## Tour JSON example

```json
"namingOpportunity": {
  "name": "Reception Desk Naming Opportunity",
  "price": "$150,000",
  "status": "on_sale"
}
```

No `cta` block required for standard behaviour.

## Giftabulator override (Reception Desk pattern)

```json
"namingOpportunity": { "name": "...", "price": "$150,000", "status": "on_sale" },
"cta": {
  "product": "giftabulator",
  "url": "https://client.giftabulatornow.com/give-now?locale=en-CA&calc=..."
}
```

Footer: **Express interest** (secondary, mailto) + **Calculate your gift with
GIFTABULATOR®** (primary).

## Adding a status

1. Extend `NamingOpportunityStatus` in `src/types/tour.ts`.
2. Add entry to `STATUS_CONFIG` in `namingOpportunityStatus.ts` with at least
   two `ctas` entries (`variant`: `primary` | `secondary`).
3. Add CSS modifier in `Badge.css` / `tokens.css` / `hotspots.css` if needed.
