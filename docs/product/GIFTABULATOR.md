# Giftabulator®

How **iShare Virtual Tour** links into the Giftabulator product. Tour does not
host Giftabulator itself — it builds outbound URLs / CTAs into the client’s
Giftabulator site.

This doc is the umbrella for Giftabulator integrations. **Give Now** is the
first (and currently only) module wired from naming-opportunity popups. Add new
sections here when other Giftabulator surfaces land (e.g. calculator embed,
campaign deep links).

## Modules

| Module       | Status   | Tour use today                                      |
| ------------ | -------- | --------------------------------------------------- |
| **Give Now** | Shipped  | NO footer secondary CTA → give-now URL with `calc=` |
| _(future)_   | Reserved | Add a section below when a new module ships         |

See also [NAMING.md](./NAMING.md) for NO status CTAs and footer layout.

---

## Give Now

How naming-opportunity (NO) footer links to **GIFTABULATOR®** are built — URL
shape, `calc` prefill, preset defaults, and bounded scaling from NO price.

**Code**

| File                                   | Role                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `src/constants/giftabulatorGiveNow.ts` | Preset, limits, calc resolution, base64 encode                         |
| `src/utils/giftabulatorGiveNowUrl.ts`  | Full URL + query string                                                |
| `src/data/namingOpportunityStatus.ts`  | Calls `buildGiftabulatorGiveNowUrl(tour, naming)` for GT secondary CTA |
| `src/utils/tourClientId.ts`            | `{clientId}` subdomain (`tour.clientId` or `tour.id`)                  |

### URL shape

```
https://{clientId}.giftabulatornow.com/give-now?locale=en-CA&view=result&zoom=100&calc={base64}
```

- **`clientId`** — per-tour subdomain (e.g. `gphospitalfoundation`).
- **`calc`** — base64-encoded JSON (all values are strings). Giftabulator reads
  this on load to prefill the calculator.

#### Example `calc` payload (decoded)

Default Give Now preset anchor (`donation` = 5,000):

```json
{
  "income": "100000",
  "asset": "stock",
  "assetValue": "75000",
  "assetCost": "25000",
  "donation": "5000",
  "pledgePeriod": "5"
}
```

NO at **$150,000** (after bounded scaling):

```json
{
  "income": "150000",
  "asset": "stock",
  "assetValue": "100000",
  "assetCost": "33333",
  "donation": "150000",
  "pledgePeriod": "5"
}
```

### When Give Now URLs are built

1. **Default** — every NO popup with a status-driven footer gets a **secondary**
   GIFTABULATOR® CTA. `namingOpportunity.price` drives `donation` and scaled
   fields. No tour JSON `cta` block required.
2. **Override** — `popup.cta` with `product: "giftabulator"` and a custom `url`
   replaces only the GT link (e.g. hand-tuned `calc=`). Primary status CTA
   unchanged.

```json
"namingOpportunity": { "name": "...", "price": "150000", "status": "open" }
```

Price is parsed with `parseNamingPrice()` — `"$150,000"` and `"150000"` both
work. Invalid or missing price → full default Give Now preset (5,000 donation).

### Preset (`GIFTABULATOR_GIVE_NOW_PRESET`)

Fixed across all Give Now NO links unless noted:

| Field          | Value    | Notes                                        |
| -------------- | -------- | -------------------------------------------- |
| `asset`        | `stock`  | Fixed                                        |
| `pledgePeriod` | `5`      | Fixed                                        |
| `donation`     | `5000`   | Anchor for ratio scaling                     |
| `income`       | `100000` | Scaled + bounded                             |
| `assetValue`   | `75000`  | Scaled + bounded                             |
| `assetCost`    | `25000`  | Scaled + bounded (also tied to `assetValue`) |

Edit constants in `src/constants/giftabulatorGiveNow.ts`.

### Bounded scaling

Linear ratio from the Give Now preset alone over-shoots on large naming prices
(e.g. $150k → income 3M). Flow:

1. **Scale** — `scaled = presetField × (donation / preset.donation)`
2. **Floor** — if `donation ≥ preset.donation`, never below preset field
3. **Ceiling** — per-field caps in `GIFTABULATOR_GIVE_NOW_LIMITS`

#### Income & assetValue

```
floor   = donation >= 5_000 ? presetField : scaled
donationCap = max(presetField, donation × maxFromDonation)   // when set
ceiling = min(scaled, absoluteMax, donationCap)
result  = clamp(scaled, floor, ceiling)
```

#### Asset cost

```
basisRatio = preset.assetCost / preset.assetValue   // 1/3
ceiling    = min(absoluteMax, assetValue × basisRatio)
result     = clamp(scaled, floor, ceiling)
```

#### Limits (`GIFTABULATOR_GIVE_NOW_LIMITS`)

| Field        | `absoluteMax` | `maxFromDonation` | Intent                                        |
| ------------ | ------------- | ----------------- | --------------------------------------------- |
| `income`     | 250,000       | 1× donation       | Major gift: income caps at gift size, not 20× |
| `assetValue` | 100,000       | ⅔× donation       | Stock FMV stays plausible vs gift             |
| `assetCost`  | 50,000        | —                 | Basis capped; also ≤ `assetValue × ⅓`         |

#### Sample outputs

| NO `price` | `donation` | `income` | `assetValue` | `assetCost` |
| ---------- | ---------- | -------- | ------------ | ----------- |
| 5,000      | 5,000      | 100,000  | 75,000       | 25,000      |
| 75,000     | 75,000     | 100,000  | 75,000       | 25,000      |
| 150,000    | 150,000    | 150,000  | 100,000      | 33,333      |

### API (for dev / tests)

```ts
import {
  resolveGiftabulatorGiveNowCalc,
  encodeGiftabulatorCalcParam,
} from '../constants/giftabulatorGiveNow';
import { buildGiftabulatorGiveNowUrl } from '../utils/giftabulatorGiveNowUrl';

const calc = resolveGiftabulatorGiveNowCalc(150_000);
const calcParam = encodeGiftabulatorCalcParam(calc);

const url = buildGiftabulatorGiveNowUrl(
  { id: 't_l01wnq8eh6', clientId: 'gphospitalfoundation' },
  { name: 'Guest Shelter', price: '150000' },
);
```

### Tuning checklist

1. Adjust `GIFTABULATOR_GIVE_NOW_PRESET` for new default Give Now anchor values.
2. Adjust `GIFTABULATOR_GIVE_NOW_LIMITS` if caps feel too high/low for typical
   NO price ranges.
3. Re-check sample Give Now URLs in browser — Giftabulator UI should show
   prefilled fields and a sensible tax result.
4. Per-tour overrides stay in tour JSON `popup.cta.url` until presets are
   confirmed.
