# Tour Admin UI

> Practical reuse guide for `apps/admin`. Product data and access:
> [TOUR_DB.md](../product/TOUR_DB.md). Admin authoring assistant:
> [ADMIN_GUIDE.md](./ADMIN_GUIDE.md). Local authoring precursor:
> [DEV_PANEL.md](./DEV_PANEL.md).

## Scope and intent

`apps/admin` is the iShare Virtual Tour CMS for catalog management, authoring,
preview, and eventually FMI-controlled publishing. It is not the public/embed
viewer.

- Admin is function-first. Prefer clear workflows and shared primitives over
  bespoke page chrome.
- Preview tours through the `tour-viewer` iframe. Do not import PSV, Three.js,
  viewer chrome, or viewer styles into Admin.
- Use shadcn/Radix as the primitive layer and the Admin components in
  `src/components` as the product patterns.
- `globals.css` owns baseline tokens and shared recipes. Call sites choose
  semantic variants; they should not reproduce the recipe.

## Surface map

| Surface | Role | Owning pattern |
| --- | --- | --- |
| Sidebar and top header | Persistent navigation, breadcrumbs, Debug, Guide, Account | `AdminChrome`; routes provide breadcrumb context through `AdminShell` |
| Main page | Page identity and vertically separated content sections | `PageMain` + `PageHeader` |
| Catalog | Browse, filter, sort, create, and row actions | Domain table or gallery with `SectionHeader` |
| Workspace | Stable entity identity across peer tabs | `PageChrome` + domain `*WorkspaceHeader` + `WorkspaceTabs` |
| Editor | Structured controls beside a live iframe | `EditorPreviewSplit` or `TourVisualEditor` |
| Authoring drawer | Create or edit one record while retaining page context | `CreateSheet` or shared authoring sheet classes |
| Guide dock | Ongoing help while the page remains usable | `AdminGuideDock`; see [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) |
| Account | Personal identity and session state | `/account` |
| Users | Master-level staff account management | `/users`, `/users/[userId]` |
| Settings | Admin appearance, environment, and debug preferences | `/settings` |

Account, Users, and Settings are deliberately separate. Account describes the
current person/session. Users manages staff access in the master-account
context. Settings configures the Admin environment. Until authentication lands,
Account identity is browser-local development state and Users is a UI-only
preview backed by centralized fixtures.

## Choose the right level

Use these hierarchy levels consistently:

1. `PageHeader` identifies the route.
2. A domain `*WorkspaceHeader` keeps entity identity stable across workspace
   tabs.
3. `SectionHeader` introduces a peer content block.
4. `FormSection` or `CollapsibleFormSection` groups fields inside one save unit.

Do not substitute a Card title for a page or section heading. Domain list
components own their `SectionHeader`; pages pass descriptions and actions rather
than wrapping the list in another heading.

## Component and pattern catalog

The catalog is grouped by job. Prefer a composed Admin pattern before assembling
another version from `components/ui`.

### Shell, pages, and navigation

| What | Use when | Do not use when | Canonical source |
| --- | --- | --- | --- |
| `AdminChrome` | Rendering persistent sidebar/header/Guide chrome | Building route content | `components/admin-chrome.tsx` |
| `AdminShell` | Publishing route breadcrumb context | Adding a second visual shell | `components/admin-shell.tsx` |
| `PageMain` | Every route body; `variant='split'` for a catalog-width preview stage that fills remaining height; `variant='workbench'` for a tool route whose canvas is the content | A nested card or sheet body | `components/page-header.tsx`; `/settings`, `/tours/[tourId]`, `/tours/[tourId]/edit` |
| `PageHeader` | Naming a standalone page or deeper route | A peer section or workspace tab panel | `components/page-header.tsx`; `/account` |
| `PageChrome` | Grouping stable workspace identity, tabs, and lead copy | A standalone catalog page | `components/page-header.tsx`; tour workspace routes |
| `WorkspaceTabs` / `PageLead` | Introducing the active workspace panel | Repeating entity identity or slicing one form | `components/page-header.tsx`; `tour-workspace-header.tsx` |
| Domain `*WorkspaceHeader` | Keeping tour/client title, media, status, and actions stable across tabs | A scene or naming child detail, or the panorama Layout tool | `tour-workspace-header.tsx`, `client-workspace-header.tsx` |
| `SectionHeader` | Introducing a table, gallery, or peer page block | Form subsections | `components/page-header.tsx`; `tour-table.tsx` |
| `PeerSwitcher` | Navigating among same-level tours, clients, scenes, or namings | Selecting a form value | `components/peer-switcher.tsx`, `admin-breadcrumbs.tsx` |

Avoid reinventing route padding, title/action rows, breadcrumb menus, or
workspace identity chrome. `PageHeader` is left identity (media, title,
badges) and right actions, `items-start`.

Ordinary routes are a reading column, so `PageMain` caps their width and gives
sections a generous beat. A `split` route stays in that reading column (same
cap and beat, lead copy stays) but fills the remaining viewport so
`EditorPreviewSplit` can grow — tour Details and the scene child. A workbench
route is not reading material: its canvas should use the display, so
`variant='workbench'` trades the reading cap for width and tightens the
section beat. The variant states only the section gap — the intro pull is
always half of it — so do not re-declare a gap or a pull at a call site. Reach
for workbench when a route's value scales with pixels, not when a page merely
feels full; do not put Details on workbench just to fill height.

### Actions, links, and feedback

| What | Use when | Do not use when | Canonical source |
| --- | --- | --- | --- |
| `Button` | Any button-like action; choose `variant` and `size` by meaning/context | Applying local height, padding, icon size, icon opacity, or tone classes | `components/ui/button.tsx` |
| `HeaderEditButton` | Opening the shared entity editor from workspace chrome | Creating a second Edit trigger implementation | `components/header-edit.tsx` |
| `PendingButton` | Showing progress local to the action that started it | Route navigation or passive loading | `components/pending-button.tsx` |
| `ConfirmDeleteDialog` | Confirming irreversible deletion | Routine authoring or informational prompts | `components/confirm-delete-dialog.tsx` |
| `tableLinkClass` | Linked table cell values — plain at rest, primary + underline on hover | Info-card values | `lib/utils.ts` |
| `titleLinkClass` | A row's primary cell — the table link in heading type | Info-card values | `lib/utils.ts` |
| `cardLinkClass` | Navigable values inside info cards — primary at rest | Table cells or buttons | `lib/utils.ts` |
| Form toast helpers | Reporting the final success/error of a form action | Duplicating the same result below the form | `lib/form-toast.ts` |
| `NavigationProgress` | Link-driven route transitions | Button work or data loading inside a page | `components/navigation-progress.tsx` |

`Button` has two axes — `variant` (rank) and `size`. Call sites pick both from
`buttonVariants`; they do not invent height, padding, icon size, or tone
(`h-10`, `size-[42px]`, `text-muted-foreground`, …).

Rank (`variant`) is semantic:

- default: the main create, save, or edit commitment;
- `outline`: adjacent utility or secondary navigation;
- `ghost`: tertiary chrome and compact controls;
- `destructive`: irreversible work, normally behind confirmation;
- `link`: button behavior that must visually read as an inline link.

Size (`size`) is a pick-list. Labelled and icon-only ranks are paired
(labelled is a half-step taller than the matching square).

| `size` | Use when | Do not |
| --- | --- | --- |
| `default` | Main labelled action in a cluster | Local `h-*` / `px-*` on `Button` |
| `sm` | Compact labelled (dense rows, secondary toolbars) | A second “almost sm” height |
| `xs` | Extra-compact labelled | Mixing `xs` padding onto `sm` |
| `lg` | Rare, larger labelled | Default-plus-two-pixels |
| `icon` / `icon-sm` / `icon-xs` / `icon-lg` | Icon-only; match the labelled rank | A hand-built square or circular control |

Need a new step? Add it in `components/ui/button.tsx` and a row here — not at
the call site.

Use one strong action per cluster. Primary actions include a leading Lucide icon.
Write icons bare and let `buttonVariants` own size, spacing, and tone. Icon-only
buttons require an `aria-label` and normally a Tooltip. They are `Button` with
an `icon*` size — never a hand-built square.

Tone belongs to `buttonVariants`: a `ghost` icon button idles one step down and
returns to full strength on hover, focus, an open menu (`aria-expanded`), or a
pressed toggle (`aria-pressed`), which also carries the primary accent. Filled
variants keep full-strength icons. Do not set `text-muted-foreground`,
`text-primary`, or a background on the button or its icon at a call site; the
only call-site tone decision is choosing the `destructive` variant.

Guide sits next to Debug and follows the same rule: Lucide `Sparkles` in a
plain ghost `icon` button with no tone or chrome at the call site. Idle is the
muted glyph and the open dock reads through `aria-pressed`, which
`buttonVariants` renders as the primary accent. Keep the sidebar's
`symbol_ishare.png` lockup as the product signature, and do not give another
control a custom mark to make it stand out.

Viewer docks / glass / hotspots are a different app:
[COMPONENTS.md](./COMPONENTS.md).

### Forms and authoring

| What | Use when | Do not use when | Canonical source |
| --- | --- | --- | --- |
| `FormField` | Pairing a label with a control and optional supporting copy | Manually stacking Label/control/hint in an ordinary field | `components/form-field.tsx`; `account-profile-form.tsx` |
| `FormDescription` | Explaining a field's normal purpose | Calling out a non-obvious rule or side effect | `components/form-field.tsx` |
| `FormHint` | Explaining a constraint, side effect, persistence rule, or authoring step | Ordinary descriptions, status, or per-call icon alignment | `components/form-field.tsx` |
| `CheckboxField` | An opt-in or independent boolean choice | A persistent system setting | `components/form-field.tsx` |
| `SwitchField` | An on/off preference or system setting | A multi-choice field | `components/form-field.tsx`; `settings-debug-toggle.tsx` |
| `RadioGroup` | One named choice among a small set | Navigation or independent booleans | `components/ui/radio-group.tsx`; authoring panels |
| `FormSection` | A static field group inside a save unit | Page hierarchy | `components/form-field.tsx` |
| `CollapsibleFormSection` | A foldable field group in a long single-save form | Splitting one save into tabs | `components/form-field.tsx`; `tour-editor-panel.tsx` |
| `.admin-form` | Establishing shared form rhythm and control behavior | Tiny inline controls such as Guide composer | `globals.css`; `account-profile-form.tsx` |
| `StickyFormActions` | Closing every standard form with cancel/save actions | A passive display card | `components/form-status.tsx` |
| `InputGroup` | Prefer for Admin text / select-like field chrome that needs a leading kind icon inside the control | Checkboxes, switches, radios, textarea-only rows, pure button rows, shells that already own their border (`FileInput`, `AdminAccentSelect`), or a control whose value already leads with a thumbnail | `components/input-group.tsx`; `account-profile-form.tsx`, `/settings` |
| `FileInput` | Selecting an asset with current/picked-file feedback | A detached native file input and custom preview | `components/file-input.tsx` |
| `BrandFontField` | Choosing a preset/platform/Google brand font | Building another font picker | `components/brand-font-field.tsx` |
| `ColorSwatch` | Showing or controlling a brand color | Hand-rolling a square color sample | `components/color-swatch.tsx` |
| `InfoFieldList` / `InfoField` | Displaying immutable entity details. Preview-adjacent cards use `layout='stack'` (icon + label over the value); compact entity cards stay `inline`. Labels are muted (`text-muted-foreground`); values stay body/foreground | Simulating display values with disabled inputs | `components/form-status.tsx`; workspace details |

A standard create/edit form is one `.admin-form`, optional form sections, and
one `StickyFormActions`. Field copy—labels, descriptions, hints, placeholders,
and options—belongs in `lib/authoring-copy.ts` when it is part of the authoring
contract.

Every submitting form closes the same way: one `StickyFormActions` holding
`FormCancelButton` first and a `PendingButton type='submit'` second, with a
leading Lucide icon on the submit label (`Plus` to create, `Save` to save). This
holds in drawers and in-page cards alike, and for preview-only forms whose
submit just reports that the service is unconnected—a bare `Button` under the
last field is not an alternative. A panel that only displays values submits
nothing, so it keeps a plain `SheetFooter` close action instead.

Delete is not a form action and does not belong in `StickyFormActions` or beside
Save. Put it last in the entity's row or compact action menu and guard it with
`ConfirmDeleteDialog`. When an editor is the entity's only management surface,
use a clearly separated danger section after the save controls instead.

An immutable identifier is metadata, not a disabled field. Read-only environment
values may remain read-only controls when selection/copying is useful.

### Tables, status, and summary

| What | Use when | Do not use when | Canonical source |
| --- | --- | --- | --- |
| Domain table | Rendering a catalog with domain-aware columns/actions | Creating a generic table abstraction before domains align | `tour-table.tsx`, `client-table.tsx`, `scene-manage-panel.tsx`, `naming-manager.tsx` |
| `SortableHead` | A client-sortable column | Reimplementing sort arrow/state per table | `components/sortable-head.tsx` |
| `TableFilterDropdown` | Multi-select catalog filters | Filtering to one entity from a growing list | `components/table-filter-dropdown.tsx` |
| `Select` in the section action row | Narrowing a catalog to one owning entity | A short fixed enum that reads better as checkboxes | `components/ui/select.tsx`; `tour-table.tsx` client filter |
| `TableEmptyState` | Empty catalog or no filter matches | Bare muted text in a table row | `components/table-empty-state.tsx` |
| Shared table class recipes | Media, badge, actions, and compact semantic columns | Copying width/padding recipes into each table | `lib/utils.ts` |
| `Badge` | Compact entity metadata or a short state | Sentences, unavailable notices, empty values, or setup guidance | `components/ui/badge.tsx` |
| Domain status badges | Visibility, license, category, naming, viewer, hotspot, or staff role/status semantics | Selecting colors at the call site | `components/status-badges.tsx` |
| `StatCardGrid` / `StatCard` | Real summary counts and categorical rollups | Invented vanity metrics or one-off chart chrome | `components/stat-card.tsx`; `/overview` |
| Existing chart components | Share-of-total or ranked categorical data | Time series without product data or a new chart dependency | `donut-chart.tsx`, `distribution-chart.tsx` |

Lists own their heading, filters, empty state, sorting, and row actions. Keep
filters before Add in the section action row. Disable manual ordering while a
filter changes the visible set.

Table links read as plain text at rest and only reveal themselves on hover, with
the theme color and an underline. A row's primary cell opens the entity through
`titleLinkClass` — a `Link` when the entity has a page, a button when it opens a
sheet. Other linked cell values, such as contact or external addresses, use
`tableLinkClass`; unlinked values stay plain text with a muted leading icon.
`cardLinkClass` is primary at rest and belongs to info cards, not table cells. Do
not write per-table underline, hover, or tone classes.

Filter shape follows the question being asked. Short fixed enums—visibility,
viewer type, category—stay multi-select inside `TableFilterDropdown`. Picking
one owning entity, such as the Tours client filter, is a `Select` with an
“All …” option beside the Filter button, hidden when only one entity is
available.

Badges are entity metadata, not general notices. Use body/meta copy,
`FormDescription`, or `FormHint` for unavailable services and explanatory
sentences. Missing values remain muted text.

### Sheets, menus, dock, and media

| What | Use when | Do not use when | Canonical source |
| --- | --- | --- | --- |
| `CreateSheet` | Creating a catalog record from a section action | A long-lived companion panel | `components/create-panel-shell.tsx` |
| Authoring sheet classes | Any create/edit drawer not covered by `CreateSheet` | Repeating drawer width/padding at call sites | `AUTHORING_SHEET_CLASS`, `AUTHORING_SHEET_BODY_CLASS` |
| `DropdownMenu` | Row or compact chrome actions | Form selection or persistent navigation | `components/ui/dropdown-menu.tsx`; domain tables |
| `.admin-menu-scroll` | Capping a floating list (dropdown, select, submenu) and scrolling it | Page chrome, Guide dock body, or a second `max-h-*` at a call site | `globals.css` (`--admin-dropdown-max-height`); `dropdown-menu.tsx`, `select.tsx` |
| `AlertDialog` | A short irreversible decision | Long forms | `ConfirmDeleteDialog` |
| `Tooltip` | Labelling an icon-only control or decoding an unclear short label | Repeating visible prose | `components/ui/tooltip.tsx` |
| `AdminGuideDock` | Ongoing assistance beside active work | An authoring Sheet or replacement form | `components/admin-guide-panel.tsx` |
| `AssetImage` | Viewer-hosted media with loading/fallback behavior | Raw images for baked viewer assets | `components/asset-image.tsx` |
| `BrandedAvatar`, `MediaThumb`, `OptionThumb` | Known logo/thumb presentation jobs | Repeating image shells, or person identity (use `PersonAvatar`) | `components/branded-avatar.tsx` |
| `PersonAvatar` | Staff/user identity — always a circle; initials when the photo is missing or fails | Client logos or tour thumbs | `components/branded-avatar.tsx` |
| `mediaLabelClass` | Pairing that media with a label in a menu or select (`gap-2.5`) | Table cells, identity headers, crumb trail chips, or glyph rows that keep the primitive `gap-2` | `lib/utils.ts`; `peer-switcher.tsx`, `SceneOptionLabel` |
| `breadcrumbMediaLabelClass` | Same pairing on a breadcrumb trail chip (`gap-2`) | Open menus, selects, or `PeerSwitcher` list rows | `lib/utils.ts`; `admin-chrome.tsx`, `peer-switcher.tsx` crumb trigger |
| `colorLabelClass` | Pairing a `ColorSwatch` with its hex/label (`gap-1`) | Media+label rows (`mediaLabelClass` / breadcrumb chips) | `lib/utils.ts`; tour Branding, client Color |

Sheets are temporary task surfaces. Dialogs are short blocking decisions. The
Guide is persistent companion context. Choose by job, even when all three occur
on the same route.

## Behavioral rules

### Navigation and dropdowns

- Sidebar and header remain mounted in the root layout.
- One `SidebarTrigger` opens the sidebar, and it sits at the far left of the
  header before the breadcrumbs. It collapses and expands the desktop rail and
  opens the mobile sheet; do not add a second trigger inside the sidebar. It is
  an ordinary ghost icon button and matches Debug, Guide, and Account at the
  other end of the header, so it takes no tone or size overrides. Account is
  always the far-right action and uses its avatar inside the same icon-button
  footprint, one half step (`size-7.5`) above the glyph rank so the filled disc
  balances its outline siblings instead of floating inside the square. A
  vertical `Separator`
  divides the trigger from the breadcrumbs so the two do not read as one cluster.
  It is a full-height hairline that meets the header's bottom border: leave the
  primitive's `data-vertical:self-stretch` alone and never give it a height,
  because a definite height opts out of that stretch and leaves a stub hanging
  from the top edge. The rule carries `mr-2` so the breadcrumbs clear it by the
  same optical gap the trigger's own padding gives on the other side.
- The sidebar header is shadcn's brand lockup: a rounded tile centering the
  iShare mark, then the `.type-brand` title over a muted `Admin` line. The tile
  is outline only — a faint `sidebar-border` edge and no fill behind the
  transparent mark, primary or neutral.
- Every menu row reads as an optional leading icon, then the label, then any
  trailing affordance: check, submenu chevron, or shortcut. The Account menu is
  the canonical icon-and-label row; Debug adds trailing checks and submenu
  chevrons.
- Give a row a leading icon whenever its action or entity has a clear glyph —
  row actions, account destinations, toast fixtures, viewport modes, device
  presets and their frame groups, Duplicate options that name a domain entity
  (namings, placements, child scenes), preview debug flags, and filter values,
  which carry the same glyph as the badge they name. A debug flag names the
  fixture it forces — a not-found screen, a load-error overlay, a held splash —
  so it reads as an action like any other row; keep those glyphs in one keyed
  map beside the menu, as `DEBUG_FLAG_ICONS` and the toast fixtures do, rather
  than picking one per row. Leave a row label-only when a glyph would be
  invented rather than recognised.
- A filter value's glyph comes from `lib/semantic-icons.ts`, the icon
  counterpart to `semantic-colors.ts`: a section declares which vocabulary its
  values belong to and `TableFilterDropdown` resolves each row from that map,
  so a menu row, a badge, and a chart legend cannot pick different glyphs for
  the same value. Add the value to the map rather than passing an icon from a
  call site.
- Selection is a trailing check mark on the selected row, never a radio row and
  never a checkbox box: an unselected row shows nothing in the trailing slot,
  the same as a `Select` or `PeerSwitcher` row.
  `DropdownMenuCheckboxItem` is the one control for both an exclusive choice
  and a multi-select group; multi-select is the same control with more than one
  row checked, and only the caller's selection logic differs — an exclusive
  group keeps one row `checked` and re-applies its value on select, a
  multi-select group toggles each row on its own.
- Icon-to-label spacing and row padding belong to the shared dropdown item
  styles (`gap-2`). A media + label row is a half-step wider:
  `mediaLabelClass` (`gap-2.5`) after `PersonAvatar`, `BrandedAvatar`, or
  `OptionThumb`, including `PeerSwitcher` menu rows that pair the same
  combo. Breadcrumb trail chips use `breadcrumbMediaLabelClass` (`gap-2`).
  Wrap that pair in the matching class; do not change the primitive
  default, which also serves Edit/Delete glyph rows.
- Floating menus share one height-and-scroll recipe. `--admin-dropdown-max-height`
  (`24rem`, the same cap as toast / PeerSwitcher width) and the remaining
  viewport, whichever is smaller. Overflow uses `.ishare-scrollbar` — the thin
  bar already on the main column, Guide panel, sheets, and authoring forms.
  `DropdownMenuContent`, `DropdownMenuSubContent`, and `SelectContent` apply
  `.admin-menu-scroll` plus `.ishare-scrollbar`; call sites do not add `max-h-*`,
  `overflow-*`, or a second scrollbar recipe. Keep keyboard scrolling: do not
  leave a long list on `overflow: hidden` without a max-height. Admin has no
  Combobox or Command palette yet; a new one takes those two classes rather than
  a local rem. The bar's visual source is Guide / main chrome, not the dock's
  layout — dock behavior stays in [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).
- Same-level peer navigation uses links in `PeerSwitcher`, not a Select.
- The sidebar carries the primary admin destinations: Overview, the Tours and
  Clients catalogs, and master-level Users. Tours and Clients are collapsible
  groups, and their rows are folds rather than links: the whole row, chevron
  included, only opens and closes the group. Each fold leads with `All tours` /
  `All clients` — the catalog page itself — then lists that catalog's entities,
  each linking to its own page. The entities come from `lib/tour-catalog.ts`,
  the same source the catalog tables read, so the rail cannot list something
  the pages do not have, and the preview limit caps how many the fold shows.
- Those destinations sit in the unlabelled Overview row, the `Catalog` group
  (Tours and Clients), and the separate `Admin` group (Users). Users remains
  visible while local development treats every current identity as Master;
  role-gate the row when authentication lands. Settings lives in the header
  Account menu rather than competing with the primary navigation.
- Rail spacing is the grouping: the gap between groups is wide and rows inside
  one stack flush, so a section reads as a block. The sidebar primitives own
  both — `SidebarContent` plus each `SidebarGroup`'s padding for the wide beat,
  no gap on `SidebarMenu` or `SidebarMenuSub` so fold items keep their group's
  density, and a one-step bottom margin on `SidebarGroupLabel` so the label sits
  with the rows it names. Do not set per-call gaps or label margins in
  `app-sidebar.tsx`, and keep the label's box plus margin equal to the offset
  the collapsed rail pulls back so the icon rail loses it whole.
- Every top-level nav row is one height and padding, links and folds alike, from
  the default `SidebarMenuButton` size. Fold items sit a half-step tighter in
  `SidebarMenuSubButton`, so the level below reads as lighter without cramping.
  Do not re-height or re-pad a row per call site.
- "Workspace" is a context, not a sidebar section: it means one tour or client
  is open. Its surfaces (Details, Scenes, Namings, and the client's Tours)
  belong to the page's workspace tab bar and are never mirrored in the rail.
  The panorama Layout tool is a standalone tool route (`/tours/[tourId]/edit`), not
  a workspace tab.
- The accent-washed row is the current page and nothing else. In a catalog
  group that page is always a fold item — `All tours` on the catalog page, the
  entity on its own pages — and an active row also thickens to medium. The wash
  is a soft `sidebar-accent` tint rather than the filled token, and hover is a
  fainter tint of it, so hovering another row never out-reads the current page.
  Both weights and both tints live in the shared `SidebarMenuButton` and
  `SidebarMenuSubButton` styles — do not re-emphasise an active row per call
  site. Both also use `font-heading` (Google Sans Flex) so fold items match
  top-level nav; do not override the face per call site. The fold row above it
  is a control, so it never washes; it only goes medium while its own fold is
  open — being inside the section is not emphasis — and its chevron carries the
  open state. That chevron idles as a quiet `.icon-inline` mark like the row's
  leading icon and turns `sidebar-primary` while open: the accent a row that
  never fills is allowed.
- Landing inside a tour or client opens that group so the rail shows where the
  user is; leaving again leaves the reader's own toggle alone.
- Rows animate their hover and active colors over 200ms and drop the animation
  under `prefers-reduced-motion`.
- The collapsed icon rail keeps the top-level rows and their tooltips; group labels,
  chevrons, and folds hide with the labels. A catalog row there expands the
  rail onto its own open fold instead of toggling a fold nobody can see.
- Collapsing and expanding the rail is one 200ms ease-out beat shared by the
  rail width, the rows, the group labels, the brand lockup, the fold chevrons,
  and the header trigger icon — which cross-fades between its open and close
  marks rather than swapping — so nothing snaps a frame ahead of the moving
  edge. Text that leaves
  with the labels shrinks and fades rather than switching to `hidden`. A drag
  on the resize handle still drops the transition so the edge tracks the
  pointer, and `prefers-reduced-motion` makes the whole swap instant.
- Catalog folds in the rail run on the shared `--admin-fold-*-ms` beat, so a
  group opening in the sidebar reads like a section opening in a save form.
- The expanded rail is one width, and only two things change it: the reader
  resizing it, and collapsing to the icon rail. It is never sized from its
  content, so opening a fold or landing on a long tour name cannot move it —
  rows truncate instead. `lib/admin-sidebar-rail.ts` owns that contract: one
  default, one minimum, and one maximum that is the same ceiling for every
  drag, arrow key, and `End`. Collapsed keeps its own `--sidebar-width-icon`.
  Do not reintroduce a hug width, a per-state cap, or a measured ceiling.
- A resized rail persists per browser, so SSR cannot know it. Like the Guide
  dock, a boot script stamps the stored width on `<html>` before first paint
  and `globals.css` carries the same default as the no-script fallback; the
  rail must keep sizing off that custom property so landing never jumps.
- A workspace tab changes the panel, not the stable entity header.
- Primary tabs name a workspace surface. Secondary tabs divide a panel beneath
  that surface. Do not use tabs to divide one save form.
- Dropdown navigation must close cleanly on route changes. Keep menu state and
  link behavior in the shared dropdown/peer components rather than adding
  route-specific delays. The shared `DropdownMenu` owns its open state and
  closes on pathname change, which chrome and editor menus need because they
  stay mounted across navigations; do not re-add per-menu close effects.
- The viewer iframe must not steal focus from open Admin menus. Keep that
  interaction in shared preview/menu handling.

### Forms

- Keep one save boundary visually and behaviorally clear.
- Prefer `InputGroup` whenever a field is ordinary text or select-like chrome
  and a leading icon (or similar in-chrome accessory) helps say what kind of
  value it holds. Canonical compose is `FormField` → `InputGroup icon={…}` →
  `Input` (or another single-line control). Copy from
  `components/input-group.tsx`; Account name/email and Settings Viewer URL /
  Authoring source paths are the reference call sites. The shared
  `[data-slot='input-group']` recipe owns icon tone (`.icon-inline`) and the
  control's left inset — today for a direct `[data-slot='input']` child. Do not
  absolute-position icons or invent left padding at the call site; if another
  control needs the same lead, extend the recipe in `globals.css`.
- Do not wrap `CheckboxField`, `SwitchField`, `RadioGroup`, textarea-only
  fields, or pure action rows in `InputGroup`. Controls that already paint
  their own field shell (`FileInput`, `AdminAccentSelect`) stay as those
  shells instead of nesting an `InputGroup`.
- One leading mark per control: do not stack a Lucide lead and a thumbnail in
  the same slot. A Select whose options carry their own mark repeats the
  selected option inside its trigger, so that mark already leads the field and
  the `InputGroup` icon becomes a second, colliding lead — scene pickers using
  `SceneOptionLabel` are the case that made this rule, and it holds the same
  way when the mark is a per-option Lucide (Theme, the Users Role select).
  Wrap a Select in `InputGroup` only when its options are plain text. Media
  that leads a control also has to fit a 32px control: pick a thumb size that
  does (`OptionThumb size='xs'`), do not let it overhang the field chrome.
- Use placeholders for examples, formats, or fallback behavior; descriptions
  for ordinary purpose; hints only for exceptional guidance.
- Do not repeat placeholder copy below the control.
- Fix spacing and hint alignment in the shared form component or `.admin-form`,
  never with per-call nudges.
- Keep authoring field order aligned with the viewer Dev panel for the same
  record where practical.
- Progress stays on `PendingButton`; completion goes through the shared toast
  helpers.

Compact Guide review artifacts are intentional preview surfaces, not canonical
authoring forms. They may compose primitives more tightly, but the full Sheet
remains the source of truth for writes.

### Row actions and status

Use a `DropdownMenu` for catalog and list row actions. Put every row action in
that menu; do not park a labelled sibling (`Preview`, `Open`) beside the kebab.
Catalog row overflow is a vertical kebab (`MoreVertical`); a horizontal
ellipsis is not the row trigger. The actions column is end-aligned and narrow
(`tableActionsCellClass`) so the kebab hugs the row’s right edge; do not make
it sticky. Keep the kebab on catalog rows even when the reader cannot edit, so
View details and Open stay available; gate Edit, Duplicate, Move, and Delete.

Canonical order:

1. **Open** — View details when the entity has a page, then Open live / Open
   website / Open preview / Open layout when those destinations exist.
2. **Transform** — Duplicate, Move up/down, and other domain actions that already
   have an API.
3. **Edit** — the authoring surface (sheet or layout tool), last among ordinary
   actions. Omit it when that surface is the same destination as View details.
4. **Delete** — last, `variant='destructive'`, behind `ConfirmDeleteDialog`,
   separated from the rest. Do not add separators merely because an action opens
   a different component.

Do not invent Archive, Duplicate, or other verbs without a backend. Tour
Unlisted visibility is the stand-in for archive; there is no tour/client/user
or hotspot duplicate API.

| Entity | View details | Open | Duplicate | Move | Edit | Delete |
| --- | --- | --- | --- | --- | --- | --- |
| Tour | workspace | Open live tour; Open layout (panorama only) | — | — | metadata sheet | yes |
| Client | workspace | Open website when set | — | — | sheet | yes |
| User | `/users/[id]` | — | — | — | sheet | yes (UI-only) |
| Scene catalog | scene page | Open preview; Open layout (panorama only) | yes | yes | — | yes |
| Scene editor list | scene page | Open preview | yes | yes | omit (already in the layout) | yes |
| Naming | naming page | — | yes | — | omit (on-page Edit on the detail page) | yes |
| Hotspot | — | — | — | — | sheet | yes |

Outbound Open labels — same destination, paired names; headers stay short,
kebabs keep the verb:

- **Live** (header) and **Open live tour** (kebab) are the published tour
  viewer (`https://tour.ishare.ca/{tourId}`). Tour-level only. Keep **Live** on
  the Details header; do not add Live to every kebab.
- **Preview** (header) and **Open preview** (kebab) are the scene-scoped
  authoring viewer (`buildAdminPreviewUrl` with the current or row scene) in a
  **new tab**. Use these on scene/layout surfaces; they are not a synonym for
  Live. The in-page iframe split heading is also **Preview** (`PREVIEW_PANE_COPY`)
  — same word, in-page not new tab. Do not lengthen the pane to “Viewer preview”.
- **Open website** is the client’s site — do not rename it. **Layout** (header,
  Overview gallery) and **Open layout** (kebab) are panorama `/edit`, not meta
  Edit. Header short labels are **Live**, **Preview**, **Layout**; kebab verbs
  stay **Open live tour**, **Open preview**, **Open layout**.
- Do not put the same destination on both the header and the kebab of the same
  page. Catalog kebab Open jumps from a list; header Open is for the record
  you are on. Detail pages keep the header control.

- Rows with an action menu open that same controlled `DropdownMenu` on
  right-click, at the pointer rather than under the kebab, through
  `useTableRowActionMenu`. Reuse the one menu; do not copy its items into a
  second context menu, and keep the visible trigger for click and keyboard.
- Menu rows own their icon spacing. Write icons bare and let the shared
  `DropdownMenuItem` set gap, size, and tone; the Account menu is the canonical
  row and Select rows match it. Do not set a gap or icon size at a call site.
- Check rows and submenu triggers keep a taller, top-aligned rhythm so two-line
  option copy stays readable, with the leading icon — and the trigger's chevron —
  sitting on the first line beside the label rather than centering against the
  hint below it. That is the one deliberate exception.
- Plain status words use domain badges. Add a Tooltip only when the short label
  is coded or unclear.
- Reuse semantic color mappings from `semantic-colors.ts` and
  `status-badges.tsx`, and semantic glyphs from `semantic-icons.ts`; do not
  select arbitrary colors or icons in domain call sites.

### Account, Users, and Settings

- The header Account avatar is the single persistent entry point for personal
  destinations at every breakpoint. Its menu links to Account and Settings,
  followed by Sign out; the sidebar has no duplicate Account footer or
  top-level Settings row.
- `/account` owns identity (name, email, phone), role/session explanation, and
  browser-local development identity until auth exists. Phone is part of the
  local identity model and Account form; the compact Account menu header stays
  name + role badge + email only.
- `/users` owns master-level staff account management. It stays visible while
  local development treats the current identity as Master, and must be
  master-gated when real roles and authentication land. It is the `Users` row
  in the sidebar's separate `Admin` group, not a personal Account-menu item.
  The catalog name links to `/users/[userId]`, whose durable detail layout owns
  identity, contact, access, assignment, and audit surfaces. Invite stays a
  short catalog sheet; detail editing is on-page. The user detail header
  follows the workspace header recipe (avatar, PeerSwitcher title, role/status,
  labeled Edit) without workspace tabs. Staff identity marks — breadcrumb
  chip, PeerSwitcher rows, catalog column, and detail header — use circular
  `PersonAvatar`. Missing or failed photos keep the same circle with initials;
  do not use the logo tile (`BrandedAvatar`) or leave an empty gap.
  Placeholder rows, invites, edits, and deletes must not pretend to persist.
- Staff roles use the shared `StaffRoleBadge` everywhere they are displayed:
  Master uses info, Editor uses accent, and Viewer uses secondary treatment.
- `/settings` owns appearance, environment connection details, and Debug
  preferences.
- Appearance includes browser-local theme mode and primary-color accent
  preferences; both apply immediately without a server save. The two fields
  share one persistence hint under the pair and sit side by side once the card
  is wide enough for both.
- The accent picker is one field, not labelled option cards: the swatch row is
  the control on the left, the checked color's name is the field value on the
  right, and the field label names the group instead of targeting one option.
  Each swatch is a radio with the color's name, checked reads as a ring plus a
  check mark, and the field border carries focus.
- Authentication or environment availability is explanatory copy, not a Badge.
- Shared form fields still apply on Settings: read-only environment values use
  `FormField` + `InputGroup` with a leading kind icon, and Appearance controls
  follow the same prefer-`InputGroup` rule when they are ordinary field-like
  chrome (for example a Theme select with a leading kind icon). Specialized
  Appearance shells such as `AdminAccentSelect` keep their own border instead.

### Catalogs and workspaces

- Catalog pages browse and act across entities. Workspace pages keep one
  entity's identity stable while tabs switch tasks.
- A naming is a tour child, never a top-level Admin entity. The naming catalog
  links to `/tours/[tourId]/namings/[namingId]`. Scene and naming child details
  follow the user detail pattern: `PageHeader` + breadcrumbs, no tour workspace
  tabs. The panorama Layout tool is the same kind of tool route (`Tours > {tour} >
  Layout`), not a workspace tab and not inside Scene detail. The scene child is
  `SceneEditorPanel` (`Settings` | `Hotspots`) beside preview; hotspot
  create/edit lives in that Hotspots tab and the panorama Layout inspector —
  not a separate Manage hotspots route or catalog CTA. The naming child owns
  opportunity, donor, and placement read sections, plus
  on-page edit via the header Edit toggle (same recipe as user detail — not a
  sheet, not an always-on form). Sheets remain appropriate for create,
  duplicate, and delete confirmation. Catalog rows omit Edit because View
  details goes to that page.
- Tour and client workspace headers own their Edit and external-link actions
  across all peer tabs. Tour headers also own **Live**; panorama tour headers
  also own **Layout** (`outline`), distinct from filled **Edit** (meta
  sheet). In-workspace catalogs put **Add …** on the table `SectionHeader`
  (Filter → create), not the entity header: client Tours has **Add tour** with
  the client locked; `/tours` still lets you pick a client.
- Info cards contain fields only when the page header already supplies identity.
- Linked values use `cardLinkClass`; empty values use the standard muted
  placeholder.
- Viewer media URLs come from `admin-media.ts` / `viewer-url.ts` and render
  through the shared media components.

### Panorama layout

The Layout tool is panorama-only. It is a tool route
(`/tours/[tourId]/edit`) with `PageHeader` + breadcrumbs, not a workspace tab.
Model3d tours have no **Layout** control; `/edit` still redirects to
`/scenes`. Layout tool header = **Preview** (new tab) + **Close**. Close
returns to the screen that opened Layout (`?from=`), and falls back to tour
Details when `from` is missing or invalid. Scene details is not a header
action (row kebab View details remains).

- Panorama Details header **Layout** (`outline`, next to filled **Edit**
  for the meta sheet) goes to `/tours/[id]/edit`. Scene detail **Layout**
  goes to `/edit?scene=` with `from` for that scene page. Scenes row kebab
  **Open layout** (panorama) goes to `/edit?scene=` with `from` for the Scenes list.
  Tours catalog and client Tours tab: **Edit** always opens the meta sheet;
  **Open layout** (panorama only) goes to `/edit`. Overview gallery cards
  jump to the same `/edit` from **Layout** (panorama only) beside Scenes and
  Namings; they have no kebab. Model3d cards omit it. Close from those
  catalog entries is Details.
- The Scenes list is catalog navigation for both viewer types: its primary cell
  opens the scene detail page. A panorama row never jumps straight into Layout
  from its title.

- The viewer is the hero of this route, so the layout spends space on it. The
  page runs as a `workbench` with a tool `PageHeader` (no workspace tabs, no
  lead — the canvas is the content), the
  preview card runs `compact` (heading **Preview**, no explanatory description,
  and the surrounding stage owns the height), and the side columns are capped so
  every extra pixel lands on the viewer instead of stretching a panel of forms.
  Tour Details and Scene child splits use the same in-page heading **Preview**.
  That pane title is the iframe column; header **Preview** still opens a new tab.
- The three columns share one chrome: `sm` cards on the same padding step, one
  gap, and headers that reserve the height of a `sm` action button so the scene
  list, the viewer, and the inspector start on the same line whether or not a
  header carries an action. A count belongs beside the thing it counts, not in a
  card description line that only exists to hold it.
- The stage is a definite height: it fills the `workbench` under the tool
  `PageHeader`, not a `min-height` floor or a `100svh` guess. The columns
  scroll inside it, so a long scene list or an open hotspot inspector cannot
  stretch the row and leave the viewer as a tall black box. Tour Details and
  the scene child do the same fill under workspace chrome / the scene header
  via `variant='split'` (catalog width, default beat) — not workbench.
- Inspector groups all wear the same box, glyph, and heading row; a row inside a
  group carries a tint rather than a border of its own, because the card is
  already the frame. The column keeps the form tokens without the frame the
  `admin-form` recipe would draw around them.
- A row action menu stays inline. A menu that appeared under the selected scene
  grew that row and shifted the list on every selection.
- Scenes and Inspector fold away from one editor toolbar above the columns, and
  that toolbar is also where the work-mode hint and the single save status live.
  Do not give a pane its own status badge or hint bar; a second copy is what
  made the surface feel boxed in. A folded pane keeps its box hidden rather than
  unmounting, because the inspector is what listens for panorama clicks while a
  hotspot is selected.
- Pane names come from one map shared by the mobile tabs and the desktop fold
  toggles, so a pane cannot be called two things at two breakpoints.
- Keep the live viewer in the iframe; Admin owns scene lists, inspectors, and
  structured saves.
- Scene switches should preserve the running viewer where supported instead of
  replaying its load experience.
- Data changes still trigger the explicit preview reload path when the viewer
  must rebuild.
- Authoring operations go through `tourAuthoringRepository`; components should
  not depend directly on the eventual draft/publish adapter.

Do not broaden a panorama Layout change into model3d behavior without an
explicit product decision.

### Motion and accessibility

- Honor `prefers-reduced-motion` for chart fills, list FLIP, tab indicators, and
  non-essential transitions.
- Do not animate tab content remounts.
- Route progress is for navigation; skeletons are for page data; pending buttons
  are for actions.
- Passive loading UI waits before it appears. The route skeleton and the
  navigation bar share one reveal delay from `lib/loading-timing.ts`, so a
  navigation that lands first shows nothing at all. Wrap a new route
  `loading.tsx` in `loadingRevealProps`; do not draw a skeleton or bar
  immediately, and do not hold real content back to keep one on screen.
- Action-local progress stays immediate: the user just clicked, so
  `PendingButton` responds without a delay.
- Icon-only controls require accessible names. Preserve Radix/shadcn focus and
  keyboard behavior when composing primitives.

## Tokens and ownership

| Source | Owns |
| --- | --- |
| `app/globals.css` | Theme mapping, semantic colors, type roles, form rhythm, shared CSS recipes |
| `components/ui/*` | shadcn/Radix primitives and their variants |
| `lib/authoring-copy.ts` | Authoring labels, descriptions, hints, placeholders, options |
| `lib/semantic-colors.ts` + `status-badges.tsx` | Meaning-to-color mapping |
| `lib/semantic-icons.ts` | Meaning-to-glyph mapping for badges, menus, and filters |
| `lib/admin-media.ts` + `lib/viewer-url.ts` | Viewer-origin asset and preview URLs |
| `lib/form-toast.ts` | Standard completion feedback |
| `lib/admin-routes.ts` | Route construction and authoring destinations |
| `lib/workspace-nav.ts` | Tour/client workspace surfaces shared by the workspace tab bars |
| `lib/tour-authoring-repository.ts` | UI-facing authoring operations |
| `lib/utils.ts` | `cn` and shared link/table/`mediaLabelClass` / `breadcrumbMediaLabelClass` / `colorLabelClass` recipes |
| `lib/chart-motion.ts` | Shared chart timing and easing |
| `lib/admin-sidebar-rail.ts` | Sidebar rail width bounds, persistence, and boot property |
| `lib/admin-accent.ts` + `--admin-accent-*` | Accent ids, storage/boot contract, and the paint each accent shows in a picker |
| `lib/loading-timing.ts` | Reveal delay for route skeletons and navigation progress |

Type roles are `.type-display`, `.type-heading`, `.type-title`, `.type-eyebrow`,
`.type-label`, `.type-body`, and `.type-meta`. Use the role instead of recreating
a font-size, weight, and color bundle. Card heading is `.type-eyebrow` on
`CardTitle` (`text-xs`, uppercase, `tracking-widest`, `font-semibold`, `text-foreground/80`) — including Layout
`Card size="sm"` columns, which share the same `CardTitle`. Do not apply
eyebrow to page titles (`.type-display` / `PageHeader`). `.type-title` remains
for list and non-card headings. InfoField labels are muted body
(`text-muted-foreground`); values stay body/foreground.
`.type-brand` is the sidebar brand lockup title, a
half-step above this app's `text-sm`. `.icon-inline` is for label-adjacent
marks in text rows, not buttons — including the leading icon an `InputGroup`
puts inside field chrome. Icons that only introduce a value read one step below
the text they sit with: field leads, Select rows, and the Select chevron all
carry `text-muted-foreground/70` from their shared component, never per call
site.

The semantic palette is the source of truth for charts and status badges.
Primary green remains the strong product accent; success, warning, info, and
destructive communicate meaning. Do not encode meaning with a one-off utility
color.

## Customization policy

The Admin app is the current seed for a shared FMI dashboard baseline:

```text
shadcn/ui primitives
  → Admin baseline tokens and composed patterns
  → thin product-specific overrides
```

Prefer, in order:

1. an existing composed component;
2. an existing primitive variant;
3. a baseline semantic token or shared recipe;
4. a product token;
5. local styling for a genuinely local layout need.

Do not add a parallel button/input/table system, port viewer glass styling, or
introduce another UI kit. Extract a shared package when a second real product
consumes the baseline, not before.

## Route and product notes

Current route families:

- `/overview`: visual client/tour summary;
- `/clients` and `/clients/[clientId]/*`: client catalog and workspace;
- `/tours` and `/tours/[tourId]/*`: tour catalog, workspace, scenes, naming
  child details, and panorama layout;
- `/users` and `/users/[userId]`: staff catalog and UI-only staff detail;
- `/account`: identity/session;
- `/settings`: Admin preferences and environment.

Local authoring currently reads viewer catalog/config data and saves through the
development Admin proxy. Auth, organization scoping, draft/publish, richer asset
tools, and advanced model3d authoring remain later phases. Preserve repository
and payload boundaries so those backend changes do not require UI rewrites.

## Maintenance rule

**When adding or meaningfully customizing an Admin UI component or reusable
pattern, update this document in the same change.**

Before finishing:

1. Identify the job and confirm an existing component or variant does not
   already own it.
2. Document when to use it, when not to use it, and one canonical source.
3. Put reusable visual behavior in the component/token, not in documentation as
   a measurement recipe.
4. Check a canonical existing screen for drift. Fix a small clear drift in the
   same scoped change or record the exception.
5. Remove stale guidance when behavior changes.

## Engineering conventions

| Topic | Rule |
| --- | --- |
| App root | `apps/admin` |
| Path alias | `@/*` → `apps/admin/src/*` |
| Root scripts | `dev:admin`, `build:admin`, `lint:admin` |
| Branding | Product: iShare Virtual Tour; console: Tour Admin |
| Secrets | Never commit live keys or populated environment files |

Viewer-type isolation rules apply to viewer work. Admin must not import or
restyle viewer layers.

## Related docs

| Document | Role |
| --- | --- |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | Admin authoring assistant behavior and dock implementation |
| [COMPONENTS.md](./COMPONENTS.md) | Viewer chrome / glass / hotspot pick-list (not Admin) |
| [DEV_PANEL.md](./DEV_PANEL.md) | Local authoring UI and payload parity |
| [ROADMAP.md](../ROADMAP.md) | Phase and route architecture |
| [TOUR_DB.md](../product/TOUR_DB.md) | Organizations, access, draft/publish |
| [TECH_STACK.md](./TECH_STACK.md) | Why Viewer and Admin remain separate |
| [NAMING.md](../product/NAMING.md) | Product and UI naming |
| [apps/admin/README.md](../../apps/admin/README.md) | Run and build commands |
