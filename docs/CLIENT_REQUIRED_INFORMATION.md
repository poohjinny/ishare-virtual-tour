# Client required information — virtual tour intake

> **Audience:** Sales / client success — use this as the master checklist when
> onboarding a new client tour from **first conversation through launch**.  
> **Not for 3D production specs** — see
> [ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md) for what our modeling
> team delivers to engineering.

---

## How this fits the pipeline

```text
1. Client intake (this document)
      ↓
2. 3D architect models spaces + renders panoramas
      ↓  [ARCHITECT_DELIVERABLES.md]
3. Engineering wires tour JSON, hotspots, AI knowledge, QA
      ↓
4. Client review → publish → embed on client site
```

**Rule of thumb:** If it answers _who the client is_, _what the story is_, or
_what donors should do_, collect it here. If it answers _what the room looks
like in 360°_ or _where the camera stands_, the architect handles it (with
client sign-off on scope).

---

## Quick intake checklist

Copy this into an email or shared doc and tick items off with the client.

| #   | Section                                                        | Required?                   |
| --- | -------------------------------------------------------------- | --------------------------- |
| 1   | [Organization & contacts](#1-organization--contacts)           | **Required**                |
| 2   | [Tour scope & naming](#2-tour-scope--naming)                   | **Required**                |
| 3   | [Scene list & visitor journey](#3-scene-list--visitor-journey) | **Required**                |
| 4   | [Scene copy (descriptions)](#4-scene-copy-descriptions)        | **Required**                |
| 5   | [Branding](#5-branding)                                        | **Required**                |
| 6   | [Naming opportunities](#6-naming-opportunities)                | If applicable               |
| 7   | [General info hotspots](#7-general-info-hotspots)              | Optional                    |
| 8   | [Floor plan](#8-floor-plan)                                    | Optional                    |
| 9   | [Immersive audio](#9-immersive-audio)                          | Optional                    |
| 10  | [Launch & embed](#10-launch--embed)                            | **Required** before go-live |
| 11  | [Approvals & legal](#11-approvals--legal)                      | **Required** before go-live |

---

## 1. Organization & contacts

Stored in `tours/catalog.json` under the client record. One client can have
multiple tours (e.g. hospital + inpatient wing campaign).

| Field                                 | Required    | Example                                | Notes                                               |
| ------------------------------------- | ----------- | -------------------------------------- | --------------------------------------------------- |
| Legal / display organization name     | Yes         | Queensway Carleton Hospital Foundation | Used in Help, Share, mailto CTAs                    |
| Public website URL                    | Yes         | `https://qchfoundation.ca`             | Drives `clientId` convention (hostname without TLD) |
| Primary contact email                 | Yes         | `info@qchfoundation.ca`                | Naming-opportunity mailto, Help                     |
| Phone                                 | Recommended | `613-721-4731`                         | Help / Share panels                                 |
| Phone label                           | Optional    | Telephone, Toll free                   | Use when multiple numbers                           |
| Fax                                   | Optional    |                                        |                                                     |
| Mailing address                       | Recommended | Full postal address                    | Help panel                                          |
| Single point of contact (name + role) | Recommended |                                        | Internal — not in app today                         |

**Ask the client:**

- Who receives **donor interest** emails from naming opportunities?
- Is there a **communications** contact for copy approval?
- Is there an **IT / web** contact for embed on their site?

---

## 2. Tour scope & naming

| Field                    | Required    | Example                           | Notes                                    |
| ------------------------ | ----------- | --------------------------------- | ---------------------------------------- |
| Tour / campaign title    | Yes         | Med/Surg Inpatient                | Facility or project name in Explore      |
| Tour category            | Yes         | Healthcare                        | From platform list (see below)           |
| Product display name     | Optional    | `{Client} Virtual Tour`           | Defaults from organization name          |
| Public visibility        | Yes         | `public` / `unlisted` / `private` | See [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) |
| Featured on iShare intro | Optional    | yes / no                          | Portfolio gallery only                   |
| Target go-live date      | Recommended |                                   |                                          |
| Primary audience         | Recommended | Major donors, board, public       | Shapes copy tone                         |

**Categories (current platform):** Healthcare, Education, Culture, Sporting
Venues, International Aid, Social Services, Tourism.

**Naming hierarchy** (what appears where):
[PRODUCT_NAMING.md](./PRODUCT_NAMING.md)

---

## 3. Scene list & visitor journey

We need a **complete list of spaces** the donor should visit, in plain language.
Engineering and the architect turn this into scenes and navigation.

| Per scene                         | Required      | Example                                   |
| --------------------------------- | ------------- | ----------------------------------------- | ---------------------------- |
| Scene title (visitor-facing)      | Yes           | Reception Centre                          |
| Short internal id slug            | Optional      | `reception-centre`                        | We can derive from title     |
| One-line purpose                  | Yes           | Main welcome desk and visitor orientation |
| Included in v1?                   | Yes           | yes / phase 2                             |                              |
| Connected to (which other scenes) | Yes           | Overview, Inpatient Suites                | Drives nav arrows            |
| Suggested **start scene**         | Yes           | Overview                                  | Usually aerial or main lobby |
| Naming opportunity in this scene? | If applicable | yes — which wall/element                  |                              |

**Deliverable format:** Table or spreadsheet — see
[template below](#intake-template-scene-list).

**Client does not need to supply:** yaw/pitch/zoom, hotspot coordinates, or
panorama files (architect → engineering).

---

## 4. Scene copy (descriptions)

Each scene has a **description** used in Explore, AI knowledge, and search.

| Field                             | Required    | Guidance                                      |
| --------------------------------- | ----------- | --------------------------------------------- |
| Scene description (2–4 sentences) | Yes         | Donor-facing, warm, specific to what they see |
| Pronunciation / preferred terms   | Optional    | e.g. official facility names                  |
| Facts the AI should know          | Recommended | 3–5 bullets per important scene               |
| FAQs                              | Recommended | 2–4 per scene for Virtual Tour Guide          |
| Suggested questions (chips)       | Optional    | e.g. “Tell me about the reception area”       |

**Tone:** Fundraising and stewardship — help donors imagine impact, not a
clinical spec sheet.

**Stored as:** `tours/{tourId}-knowledge.json` (we can draft from client copy).

---

## 5. Branding

| Asset               | Required    | Format                      | Notes                     |
| ------------------- | ----------- | --------------------------- | ------------------------- |
| Logo (full color)   | Yes         | PNG, transparent background | Nav, splash, panels       |
| Logo alt text       | Yes         | Plain language              | Accessibility             |
| Primary brand color | Yes         | Hex e.g. `#007078`          | Buttons, accents, nav     |
| Favicon             | Recommended | ICO or PNG                  | Browser tab; can use logo |
| Secondary colors    | Optional    |                             | Not required for v1       |

**Do not use** low-resolution social avatars for the main logo.

---

## 6. Naming opportunities

Required when the tour supports **capital campaign / naming** CTAs. Each NO is
one anchored panel in the panorama.

| Field                                  | Required | Example                                      | Notes                                                    |
| -------------------------------------- | -------- | -------------------------------------------- | -------------------------------------------------------- |
| Legal / display name                   | Yes      | Inpatient Bed Rooms Naming Opportunity       |                                                          |
| Campaign price                         | Yes\*    | `25000` or `$25,000`                         | \*Not required for `sold`                                |
| Status                                 | Yes      | `on_sale`, `reserved`, `coming_soon`, `sold` | See [NAMING_OPPORTUNITIES.md](./NAMING_OPPORTUNITIES.md) |
| Body copy (2–4 short paragraphs)       | Yes      | Stewardship story                            | Supports line breaks                                     |
| Scene where it appears                 | Yes      | Inpatient Suites                             |                                                          |
| Physical anchor (what donor is naming) | Yes      | Bed bay area, reception desk                 | For architect camera + hotspot                           |
| Video URL                              | Optional | Synthesia / YouTube embed                    |                                                          |
| Hero / popup image                     | Optional |                                              |                                                          |
| Custom CTA override                    | Optional |                                              | Rare — discuss with product                              |

**Statuses and donor CTAs (primary):**

| Status      | Donor sees                    |
| ----------- | ----------------------------- |
| On sale     | Express your interest         |
| Reserved    | Speak with our team           |
| Coming soon | Notify me                     |
| Sold        | Support our mission (website) |

**Client must confirm:** Prices and availability are **approved for public
display** before launch.

---

## 7. General info hotspots

Optional **non-fundraising** info points (ℹ️ icon) — history, programs, plaques.

| Field                   | Required                                  |
| ----------------------- | ----------------------------------------- |
| Title                   | Yes                                       |
| Body (short)            | Yes                                       |
| Scene                   | Yes                                       |
| Anchored panel vs modal | Optional — default anchored for long copy |

---

## 8. Floor plan

Optional minimap in the lower-left of the tour.

| Field                                        | Required       | Notes                                                             |
| -------------------------------------------- | -------------- | ----------------------------------------------------------------- |
| Floor plan artwork                           | Yes if minimap | SVG preferred                                                     |
| Pixel width × height                         | Yes            | Match SVG viewBox                                                 |
| Dot position per scene (`x`, `y`, `heading`) | Yes            | Engineering places after panoramas exist — client can mark up PDF |

Architect may supply the SVG; engineering maps scene dots. See
[ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md#floor-plan).

---

## 9. Immersive audio

Optional ambient background music during the tour.

| Field                                                        | Required       |
| ------------------------------------------------------------ | -------------- |
| Licensed audio track(s) or approval to use platform playlist | Yes if enabled |
| Volume preference                                            | Optional       |

**Client must confirm** they have rights to any custom music.

---

## 10. Launch & embed

| Item                                    | Required                             |
| --------------------------------------- | ------------------------------------ |
| Page(s) where tour will be embedded     | Yes                                  |
| iframe allowed? (CSP / X-Frame-Options) | Confirm with client IT               |
| iframe `allow="fullscreen"` on embed    | Required for control-pill fullscreen |
| Preferred URL slug                      | Recommended — `/{tourId}/{sceneId}`  |
| Analytics / UTM requirements            | Optional                             |
| Post-launch content owner               | Yes — who updates NO status/prices?  |

**Embed flag:** `?embed=1` for minimal chrome on client sites —
[EMBED.md](./EMBED.md).

---

## 11. Approvals & legal

| Item                                                     | Required before launch |
| -------------------------------------------------------- | ---------------------- |
| Written approval of all public copy                      | Yes                    |
| Written approval of naming prices and statuses           | Yes                    |
| Image / video / music rights                             | Yes                    |
| Privacy — contact email published in app                 | Acknowledge            |
| Accessibility review (if client requires WCAG statement) | As per contract        |

---

## Intake template — scene list

Copy for the client:

```markdown
| #   | Scene name       | In v1? | Start here? | Connects to      | NO in scene?              | Notes           |
| --- | ---------------- | ------ | ----------- | ---------------- | ------------------------- | --------------- |
| 1   | Overview         | yes    | yes         | Main Entrance, … | no                        | Aerial / campus |
| 2   | Reception Centre | yes    |             | Overview, …      | yes — Reception Centre NO |                 |
```

---

## Intake template — naming opportunities

```markdown
| Scene            | NO name                                | Status  | Price (CAD) | Short description for approval | Video?         |
| ---------------- | -------------------------------------- | ------- | ----------- | ------------------------------ | -------------- |
| Inpatient Suites | Inpatient Bed Rooms Naming Opportunity | on_sale | 25,000      | …                              | Synthesia link |
```

---

## What we create internally (client does not deliver)

| Item                                     | Owner                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `tourId`, `clientId`, URL paths          | Engineering                                                             |
| Panorama renders (WebP)                  | 3D architect → [ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md) |
| Hotspot coordinates (yaw / pitch / zoom) | Engineering (with `?dev=1` tuning)                                      |
| `tours/{tourId}.json`                    | Engineering                                                             |
| `tours/{tourId}-knowledge.json`          | Engineering (from client copy)                                          |
| Scene thumbnails                         | Engineering                                                             |
| Catalog registration                     | Engineering                                                             |

---

## Related documents

| Document                                                 | Purpose                                 |
| -------------------------------------------------------- | --------------------------------------- |
| [ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md) | 3D team → engineering handoff           |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)                     | URLs, catalog visibility, JSON overview |
| [NAMING_OPPORTUNITIES.md](./NAMING_OPPORTUNITIES.md)     | NO statuses and CTAs                    |
| [PRODUCT_NAMING.md](./PRODUCT_NAMING.md)                 | Display names in the app                |
| [assets/README.md](../assets/README.md)                  | Where files land in the repo            |
