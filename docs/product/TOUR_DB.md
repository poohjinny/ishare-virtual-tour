# iShare Virtual Tour — Product DB v0

**Filename:** `TOUR_DB.md` (Tour product DB design)  
**Status:** Design sketch (2026-08-14) · aligned to Ops **v3**  
**Scope:** iShare Virtual Tour product database only — tables, Ops
provision/license contract, JSON → DB mapping.  
**Shorthand:** “Tour” = iShare Virtual Tour everywhere below.  
**Not in this doc:** Live DDL/migrations, viewer wiring, full Tour Admin UI, Ops
Admin implementation.

Related:

- [FMI-SUITE-OPS-ACCOUNTS-ACCESS.md](../../../fmi-suite-dashboard/docs/FMI-SUITE-OPS-ACCOUNTS-ACCESS.md)
  — thin Ops: client + licenses + empty tenant; Tour adds client invite
  (membership, no roles yet)
- [ROADMAP.md](../ROADMAP.md) Phase 2 — JSONB `draft_json` / `published_json`
  first; normalize scenes/hotspots later
- Viewer contract: `apps/tour-viewer/src/types/publishedTour.ts` (`PublishedTourBundle`),
  `apps/tour-viewer/src/types/tour.ts` (`Tour`)
- API stub: `apps/tour-viewer/src/services/apiTourRepository.ts` (`GET /v1/tours/:id`)

---

## 1. One-line rule

- Ops creates the client, turns the Tour license on, and provisions an empty
  Tour tenant.
- Tour DB owns projects and content.
- FMI staff get full multi-client Tour admin and alone can publish.
- Client users (Ops invite → shared login) may edit their own org’s draft.
- Visitors use view / embed only.
- The public viewer reads published bundles only.

```text
Ops (FMI)
  · client / org_id · Tour license · empty tenant
  · invite first Tour client user (email)
        │
        ▼
Tour product DB
  orgs · license · org_members · tour_projects · tours (JSONB) · …
        │
        ├─► Shared Tour admin login (one URL)
        │     · FMI staff → all clients
        │     · client user → that org’s draft only
        └─► tour.ishare.ca — published bundles (visitors)
```

Suite v3 axes: **① Ops** · **② Product admins/DBs** · **③ product users**
(invite). Tour client access is **membership only** (no roles yet); FMI staff
remain full-access operators.

---

## 2. Boundary — Ops vs Tour DB

| Concern                         | Where               | Notes                                         |
| ------------------------------- | ------------------- | --------------------------------------------- |
| Create / suspend client         | **Ops**             | Tour mirrors `orgs` (read)                    |
| Tour **license** on/off         | **Ops** → Tour API  | Blocks admin + runtime when off; data kept    |
| Empty Tour tenant               | **Ops** → Tour API  | Ensures `orgs` + optional first shell project |
| First client-user invite        | **Ops** → Tour      | Tour-only invite; accept → `org_members`      |
| Further teammates               | **Ops / FMI staff** | v0: client users cannot invite (no roles yet) |
| Display branding (name, logo)   | **Ops** write       | Tour `orgs` read-only mirror                  |
| Generic org contacts            | **Ops** write       | Tour mirrors `orgs.contacts`                  |
| Tour contact override           | **Tour admin**      | `org_tour_settings`; client or FMI            |
| Panoramas, scenes, hotspots, NO | **Tour admin**      | FMI (all) or client (own org **draft**)       |
| **Publish** (go live)           | **FMI staff only**  | Client never pushes public                    |
| Public / embed                  | **Viewer**          | `published_json` only                         |

**Pattern:** Ops enables license + empty room + first client invite. Tour admin
furnishes the room. **Clients edit draft only; FMI publishes** — clients do not
change what visitors see until staff go live.

Ops does **not** store tour content. Tour does **not** overwrite Ops branding
(name / logo / website / generic contacts). Tour may store a contact override
for inquiry CTAs when the Tour desk differs from Ops generic.

---

## 3. Core tables (v0)

JSONB-first per ROADMAP. Opaque ids stay (`t_*`, `s_*`, `no_*`, `h_*`).  
Stable suite key: `org_id` (UUID) — ready before Ops exists (build order: Power
Donor first, Ops later; Tour can seed mirrors locally then sync).

### `orgs` — client mirror (Ops branding + generic contacts)

| Column       | Type        | Notes                                         |
| ------------ | ----------- | --------------------------------------------- |
| `org_id`     | UUID PK     | Same as suite / Ops client id                 |
| `client_id`  | text UNIQUE | URL/assets slug (e.g. `gphospitalfoundation`) |
| `name`       | text        | Display name                                  |
| `website`    | text null   |                                               |
| `logo_url`   | text null   |                                               |
| `contacts`   | jsonb       | Ops generic phones/emails/address             |
| `updated_at` | timestamptz | Last mirror refresh (`org.updated`)           |

**Ops mirror (read-only in Tour):** `name`, `website`, `logo_url`, `contacts`.
Tour never edits these — Ops is SoT; Tour refreshes via sync/webhook.

Until Ops ships, Tour may seed these rows from catalog; once Ops is live, Ops
writes and Tour mirrors.

### `org_tour_settings` — Tour-owned overrides (per org)

Tour product settings that may differ from Ops generic org data. Writable by FMI
staff and that org’s client users.

| Column             | Type        | Notes                                        |
| ------------------ | ----------- | -------------------------------------------- |
| `org_id`           | UUID PK FK  | → `orgs.org_id`                              |
| `contact_override` | jsonb null  | Tour inquiry contact when different from Ops |
| `updated_at`       | timestamptz |                                              |
| `updated_by`       | text null   | Staff or client user id                      |

**Contact resolution** (Express interest / Notify me / Contact us):

1. `org_tour_settings.contact_override` if set
2. else `orgs.contacts` (Ops generic)
3. else platform fallback (`TOUR_CONTACT_US_EMAIL`)

Override exists because the Tour desk may not be the same inbox as the org’s
generic `info@…`. Clear the override to fall back to Ops again.

### `org_licenses` — Tour license flag (Ops-controlled)

One row per org for the Tour product (or a single `tour_licensed` boolean on
`orgs` if preferred — same meaning).

| Column       | Type        | Notes                     |
| ------------ | ----------- | ------------------------- |
| `org_id`     | UUID PK FK  | → `orgs.org_id`           |
| `product`    | text PK     | Always `tour` for this DB |
| `enabled`    | boolean     | Ops license on/off        |
| `updated_at` | timestamptz |                           |

When `enabled = false`: no public serve for that org’s tours; Tour admin blocks
edits for that org (staff may still see read-only). Data retained.

### `org_members` — client access to Tour admin (scoped)

Invite-first membership — stored in **Tour DB** (not shared SQL with Power
Donor). **No roles** for now: any `org_members` row can edit that org’s
**draft** (not publish). Add `role` later only if real permission splits appear
(unlike PD v1).

| Column       | Type        | Notes                         |
| ------------ | ----------- | ----------------------------- |
| `org_id`     | UUID FK     | → `orgs.org_id`; part of PK   |
| `user_id`    | text / UUID | Tour auth user id; part of PK |
| `created_at` | timestamptz |                               |

PK `(org_id, user_id)` — one row per person per org, re-invite is idempotent.
Index on `user_id` for the login gate (§7 step 3).

FMI staff are **not** rows here — see `staff_users` below.

### `staff_users` — FMI operators (no org scope)

Separate from `org_members` on purpose: staff are cross-client, clients are
single-org. If the IdP can carry a Tour-access claim, this table may later
shrink to a claim check; v0 keeps a row so access is auditable.

| Column       | Type        | Notes                                     |
| ------------ | ----------- | ----------------------------------------- |
| `user_id`    | text / UUID | Tour auth user id                         |
| `email`      | text UNIQUE | FMI address                               |
| `tour_admin` | boolean     | `tour_operator` — full multi-client admin |
| `created_at` | timestamptz |                                           |

### `invites` (light)

Tour invites are **Tour’s own** — a PD invite/membership grants no Tour access
and vice versa. Same person invited to both products gets two memberships.

| Column        | Type             | Notes                         |
| ------------- | ---------------- | ----------------------------- |
| `id`          | text PK          |                               |
| `org_id`      | UUID FK          | Bound to client               |
| `email`       | text             |                               |
| `token`       | text UNIQUE      | One-time accept               |
| `invited_by`  | text             | Ops or FMI staff id (v0 only) |
| `expires_at`  | timestamptz      |                               |
| `accepted_at` | timestamptz null | Accept → `org_members` row    |

One **pending** invite per `(org_id, email)` — re-inviting replaces the token
instead of stacking rows. Accepted and expired rows are kept for audit.

**Who may invite (v0):** Ops or FMI staff only. Client users cannot invite
teammates yet — revisit together with roles.

### `tour_projects` — Tour experience under an org

| Column        | Type             | Notes                                                |
| ------------- | ---------------- | ---------------------------------------------------- |
| `id`          | text PK          | Tour id `t_*` (URL path)                             |
| `org_id`      | UUID FK          | → `orgs.org_id`                                      |
| `status`      | text             | `provisioned` \| `active` \| `disabled` \| `deleted` |
| `visibility`  | text             | `public` \| `unlisted` \| `internal`                 |
| `title`       | text             | Facility / catalog name (one field)                  |
| `category`    | text null        | e.g. Healthcare                                      |
| `viewer_type` | text             | `panorama` (default) \| `model3d`                    |
| `summary`     | text null        | Intro / catalog blurb                                |
| `created_at`  | timestamptz      |                                                      |
| `updated_at`  | timestamptz      |                                                      |
| `disabled_at` | timestamptz null | Project-level disable (optional vs license)          |
| `deleted_at`  | timestamptz null | Soft delete                                          |

Multiple projects per org allowed (same as today’s catalog).

**Title (one field):** Today’s repo sometimes has catalog `name` and tour JSON
`title` as two strings that are almost always the same (e.g. “Ken Sargent
House”). v0 stores a single logical title — no separate `tour_name`.

**Title sync:** `tour_projects.title` is the catalog/list SoT. On every draft
save, copy it into `draft_json.title`. On publish, copy into
`published_json.title`. Do not let JSON and the project row drift.

**Client draft scope (v0):** Client users may edit the full draft payload for
their org (scenes, hotspots, naming copy, summary, visibility-related draft
fields) plus Tour contact override. They cannot publish, invite, disable/ delete
projects, or change Ops-mirrored org branding.

**Empty tenant (Ops):** may mean only `orgs` + `org_licenses.enabled = true`
with **zero** `tour_projects` yet — client user or FMI creates the first project
in Tour admin. Alternatively Ops may create one shell project in the same call.
Prefer **license + org first**, first `tour_projects` when someone opens the
empty experience.

**Status meaning (project)**

| Status        | Runtime                         | Typical cause                        |
| ------------- | ------------------------------- | ------------------------------------ |
| `provisioned` | No public serve until published | Shell just created                   |
| `active`      | Allowed if published + license  | Set by first successful publish      |
| `disabled`    | Block this project’s runtime    | Staff/Ops project disable; data kept |
| `deleted`     | Hidden; recoverable window      | Soft delete                          |

**`provisioned` → `active` is automatic on the first successful publish** (same
transaction as `published_json`). No separate “activate” button. `disabled` and
`deleted` stay manual, and a re-publish never revives them.

Public serve also requires `org_licenses.enabled = true`.

### `tours` — content payload (JSONB)

| Column              | Type             | Notes                                     |
| ------------------- | ---------------- | ----------------------------------------- |
| `tour_id`           | text PK FK       | → `tour_projects.id`                      |
| `draft_json`        | jsonb            | Full `Tour` shape (authoring)             |
| `published_json`    | jsonb null       | Last published `Tour`; null until publish |
| `draft_version`     | int              | Monotonic per save                        |
| `published_version` | int null         | Version copied on publish                 |
| `published_at`      | timestamptz null |                                           |
| `updated_at`        | timestamptz      |                                           |

`draft_json` / `published_json` match `Tour` in `apps/tour-viewer/src/types/tour.ts` after
normalize.

### `publish_log` (optional in v0)

Audit only — nothing in the read path depends on it. Ship it when publish gets a
real UI; `tours.published_version` + `published_at` cover the basics.

| Column         | Type        | Notes                      |
| -------------- | ----------- | -------------------------- |
| `id`           | bigserial   |                            |
| `tour_id`      | text FK     |                            |
| `version`      | int         | Equals `published_version` |
| `published_at` | timestamptz |                            |
| `published_by` | text null   | FMI operator id / email    |
| `note`         | text null   | Optional                   |

### `assets` (light index, optional in v0)

Binaries on blob/CDN; rows track references. Not needed while asset paths stay
conventional (`/assets/{clientId}/…`) inside the tour JSON — add this table when
uploads move to blob storage and need cleanup / orphan detection.

| Column        | Type        | Notes                                       |
| ------------- | ----------- | ------------------------------------------- |
| `id`          | text PK     | Opaque or storage key                       |
| `tour_id`     | text FK     |                                             |
| `kind`        | text        | `panorama` \| `scene_thumb` \| `model` \| … |
| `storage_key` | text        | Object path                                 |
| `url`         | text        | Public or signed URL                        |
| `created_at`  | timestamptz |                                             |

### Access overview (staff + client users)

See **§7** — staff publish; clients draft + contact override only.

---

## 4. Ops provision → empty Tour tenant / shell

Tour provision does **not** require panoramas or naming content.

### Ops may send

| Field         | Required | Notes                                   |
| ------------- | -------- | --------------------------------------- |
| `org_id`      | yes      | Upsert Tour `orgs` mirror               |
| `client_id`   | yes\*    | Slug; \*or derive once from Ops account |
| `license`     | yes      | `tour` enabled true/false               |
| `name` / logo | no       | Display branding → `orgs` mirror        |
| `title`       | no       | If creating a first shell project       |
| `category`    | no       |                                         |
| `viewer_type` | no       | Default `panorama`                      |
| `visibility`  | no       | Default `unlisted` until ready          |
| `summary`     | no       |                                         |

### Tour DB writes (minimal empty tenant)

1. Upsert `orgs`.
2. Upsert `org_licenses` (`product = tour`, `enabled` from Ops).
3. **Optional same call:** insert `tour_projects` (`provisioned`) + shell
   `tours.draft_json` with `published_json = null`.
4. **Optional:** create `invites` row (email) — accept creates `org_members`.
   This is a **Tour** invite; a PD invite for the same person does not grant
   Tour access.

If step 3 is skipped, client user or FMI creates the first project in Tour admin
after login / invite accept.

### Shell `draft_json` (when a project is created)

```json
{
  "id": "t_…",
  "title": "…",
  "clientId": "…",
  "viewerType": "panorama",
  "firstScene": "s_shell",
  "scenes": {
    "s_shell": {
      "id": "s_shell",
      "title": "Untitled place",
      "defaultView": { "yaw": 0, "pitch": 0, "zoom": 0 },
      "hotspots": []
    }
  }
}
```

Placeholder `s_shell` (or generated `s_*`) so `firstScene` resolves. No public
`shell: true` on `Tour` — use `tour_projects.status` + null `published_json`.

Until first **publish**, viewer must not serve the project (`published_json`
null → 404 / not listed).

---

## 5. JSON mapping (today → v0)

| Today (repo)                       | Tour DB                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| `apps/tour-viewer/tours/catalog.json` → `clients[]` | `orgs` (+ branding mirror) + `org_licenses`                |
| `clients[].tours[]`                | `tour_projects` (+ catalog fields)                         |
| `apps/tour-viewer/tours/{tourId}.json`              | `tours.draft_json` (authoring)                             |
| Built/deployed public tour JSON    | `tours.published_json`                                     |
| `PublishedTourBundle`              | API: `published_json` + meta from `tour_projects` + `orgs` |
| `apps/tour-viewer/assets/{clientId}/…`              | Paths in tour JSON; optional `assets` index later          |

**Viewer rule:** `GET /v1/tours/:id` returns `PublishedTourBundle` from
`published_json` only when:

- `org_licenses.enabled` for Tour,
- `tour_projects.status` allow-list (typically `active`),
- not soft-deleted,
- `published_json` present.

Draft is never public: readable only by FMI staff or an `org_members` row for
that org (see §7).

`GET /v1/catalog` joins projects + orgs where visibility/status/license allow
public intro cards — same product rules as today’s catalog visibility.

---

## 6. License, toggle, delete

Align with Ops v3 (license on/off; thin Ops). Project-level controls stay in
Tour for authoring hygiene.

| Action                  | Where     | Effect                                          |
| ----------------------- | --------- | ----------------------------------------------- |
| **License off**         | Ops       | `org_licenses.enabled = false`; keep data       |
| **License on**          | Ops       | Re-enable runtime for published active projects |
| **Suspend client**      | Ops       | Sent as license off — no separate org flag      |
| **Project disable**     | Tour/Ops  | `tour_projects.status = disabled`; retain data  |
| **Soft delete project** | Tour/Ops  | `status = deleted`; recoverable window          |
| **Hard delete**         | Confirmed | Remove rows + assets; PIPEDA / offboarding      |

**One kill switch:** Tour has no `orgs.suspended` column. Suspending a client in
Ops arrives as `license.tour.changed → enabled = false`, so there is a single
gate to check everywhere. Add an org-level status only if Ops ever needs suspend
and unlicensed to look different inside Tour.

Provision calls should be transactional: no orphan `tour_projects` without
`tours` when a shell is requested.

---

## 7. Access — FMI staff + client users

Today’s `?dev=1` Dev panel is the **UI prototype** for Tour admin. Production
uses one **shared Tour admin login URL** (no login deep link). After login,
authorization decides the scope.

### Who

| Actor           | Tour treatment                                           |
| --------------- | -------------------------------------------------------- |
| **FMI staff**   | Full multi-client admin + **publish**                    |
| **Client user** | Ops invite → `org_members` — **draft** for that org only |
| Public visitors | Viewer / embed only — no admin                           |

Staff are not copied into every org as fake members. Client users are not
`staff_users` rows. Client members are equal for now (no owner / admin / member
roles).

Publish is FMI-only. Clients may edit the full draft and Tour contact override;
they never flip `published_json`. After the first go-live, client draft saves do
**not** change the public viewer until staff **re-publish**.

Tour access is granted by a **Tour** invite only. A PD owner is not a Tour
editor unless separately invited here — the products keep separate DBs and
separate memberships (shared IdP later is fine).

Ops “Tour license” = org may use Tour. Login still requires
`staff_users.tour_admin` or an `org_members` row; license gates edit/runtime for
that org.

### Login (one URL)

```text
https://…/login   (shared Tour admin entry — exact host TBD)
  → IdP / email magic / password (product choice)
  → if staff → multi-client home
  → if org member → that org’s tour list only
```

Ops **invite link** is not the standing login URL. It is a one-time accept URL
that binds `email` → `org_id`, then the user uses the same shared `/login`
afterward.

Optional later: Ops “Open Tour admin” convenience link with `org_id` focus for
staff — not required for client users.

### Happy path (client user)

```text
1. Ops: create client → enable Tour → provision empty tenant
2. Ops: invite editor@hospital.org (Tour invite)
3. User accepts → signup/login → member of that org
4. User edits draft + optional Tour contact override
5. FMI staff reviews → Publish → public viewer updates
6. Later: client edits draft again → public unchanged until FMI re-publishes
7. FMI staff login → all clients; can support any org
```

### Gate after login

1. Authenticate user.
2. If `staff_users.tour_admin` → allow all licensed orgs (full admin + publish).
3. Else load `org_members` for user → allow only those `org_id`s (**draft** +
   contact override; **reject publish**).
4. Per org: require `org_licenses.enabled` for Tour before edit; if off → block
   or read-only + “enable in Ops”.
5. Public viewer never uses this session.

### Relationship to Dev panel

| Now                          | Later                                     |
| ---------------------------- | ----------------------------------------- |
| `?dev=1` unlocks authoring   | Authenticated Tour admin (`/login`)       |
| Clients / Tours / Scene tabs | Staff: multi-client home; Client: one org |
| Local JSON + `/__dev/api`    | Tour DB draft/publish APIs                |

### Avoid

- Requiring a special deep-link URL just to log in day-to-day
- Mixing Power Donor `/login` with Tour admin auth (separate products; may share
  IdP later, not the same app session by default)
- Editing panoramas inside Ops
- Giving client users cross-org access
- Inventing Tour client roles before a real permission split exists

---

## 8. Inter-product events (pointers only)

| Event                     | Direction          | Tour interest                  |
| ------------------------- | ------------------ | ------------------------------ |
| `org.updated`             | Ops → Tour         | Refresh `orgs` mirror          |
| `license.tour.changed`    | Ops → Tour         | Update `org_licenses`          |
| `naming.status_changed`   | GT ↔ Tour (later)  | NO status inside draft/publish |
| `tour.interest_expressed` | Tour → Power Donor | Express interest webhook       |

No cross-product SQL. Tour `org_members` / invites are **Tour’s** tables. Power
Donor keeps its own membership DB.

---

## 9. Out of scope (v0)

- Normalized `scenes` / `hotspots` / `naming_opportunities` tables (Phase 3)
- Client roles (`owner` / `admin` / `member`) — add only if needed later
- Domain auto-join / per-client login vanity URLs
- Analytics store; DB-backed Ask Guide pack; GT status sync job
- Running Postgres / ORM / prod `VITE_TOUR_API_URL` in this design pass
- Replacing Dev panel JSON authoring in this pass (auth + DB come first)
- Single suite login app shared with Power Donor (optional later)

---

## 10. Decisions

| Topic            | Choice                                                         |
| ---------------- | -------------------------------------------------------------- |
| Suite alignment  | Ops v3: license + empty tenant; plus Tour client invite        |
| Content storage  | JSONB `draft_json` / `published_json` first                    |
| Org data         | Ops writes branding; Tour mirror + `client_id` slug            |
| License          | `org_licenses` gated for runtime + edit                        |
| Empty tenant     | Org + license required; first project optional at provision    |
| Public reads     | Published bundle only                                          |
| Client Tour CMS  | Draft only — client edits draft; FMI publishes                 |
| Contacts         | Ops generic in `orgs.contacts`; Tour override in settings      |
| Title            | `tour_projects.title` SoT; sync into draft/publish JSON        |
| Client draft     | Full draft OK; no publish / invite / project kill              |
| Republish        | Draft saves leave public stale until FMI re-publishes          |
| Client roles     | None for now; membership only; add later if needed             |
| Login            | One shared Tour admin URL; invite is one-time bind             |
| FMI staff        | `staff_users.tour_admin` — full multi-client access            |
| Client user      | Ops invite → `org_members` — that org only                     |
| Invites          | Tour-only (PD membership grants nothing); Ops/FMI invite in v0 |
| Draft access     | Staff or that org’s members — never public                     |
| Activation       | First successful publish flips `provisioned` → `active`        |
| Suspend          | License off only; no `orgs.suspended` column                   |
| Optional in v0   | `assets`, `publish_log` — add when uploads / audit need them   |
| Ids              | Opaque `t_*` / `s_*` / `no_*` / `h_*`                          |
| Build order note | Keep `org_id` stable; Ops can attach later via provision/sync  |

---

## 11. Next engineering steps

Checklist only:

1. Postgres DDL matching §3: `orgs`, `org_licenses`, `org_tour_settings`,
   `org_members`, `staff_users`, `invites`, `tour_projects`, `tours` (`assets` /
   `publish_log` optional).
2. Seed one real tour: `catalog.json` + `apps/tour-viewer/tours/t_l01wnq8eh6.json` → `orgs` +
   license + `tour_projects` + draft/published JSONB.
3. `GET /v1/tours/:id` → `PublishedTourBundle` (+ license checks); wire
   `ApiTourRepository`.
4. Provision API: upsert org + license (+ optional shell) + client invite.
5. Admin save draft (staff + client); **publish / re-publish = staff only**.
6. Shared `/login`: replace `?dev=1`; staff = full list; client = org-scoped
   draft.
7. Later: normalize scenes/hotspots; more client invites; roles only if needed.
