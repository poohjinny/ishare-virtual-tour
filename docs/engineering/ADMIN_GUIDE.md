# Admin Guide (overview)

> Authoring assistant for **`apps/admin`**. Not the visitor **Tour Guide / Ask
> Guide** in the viewer. UI chrome: [ADMIN_UI.md](./ADMIN_UI.md). Viewer guide
> naming: [NAMING.md](../product/NAMING.md).

---

## Intent

Help FMI staff (and later client authors) **do Admin work** and **learn the
product** without leaving the console.

| Can do (target)                         | Does not do                                    |
| --------------------------------------- | ---------------------------------------------- |
| Answer “how does iShare Virtual Tour…?” | Replace forms / tables as the primary UI       |
| Guide CRUD workflows (create tour, …)   | Run unchecked writes without confirmation      |
| Jump to the right Admin screen          | Embed PSV / Three / viewer Tour Guide chrome   |
| Summarize catalog context when asked    | Share the viewer Ask Guide API / prompts as-is |

**Sibling products:** same chat metaphor as Tour Guide, **separate** system
prompt, tools, and UI. Prefer Admin **shadcn** for the panel; extract shared
bits later only if both apps need the same thin client (streaming, markdown).

---

## Phases (grow as we go)

1. **Shell (now)** — Header toggle + right **dock** + mock replies (showcase /
   layout). Open state persists in `localStorage`.
2. **Read / navigate** — Find tours & clients; deep-link to Admin routes.
3. **Write with confirm** — Propose CRUD; user confirms before API calls.
4. **Product Q&A** — Curated docs / FAQ about iShare Virtual Tour (not full
   viewer runtime RAG).

Details (tool list, prompts, auth) land in this doc when each phase starts —
keep this file an **overview**, not a full design dump.

---

## UI placement

- Entry: Admin header **Guide** toggle (Debug when enabled).
- Identity: Lucide `Sparkles` on the header toggle and the dock header tile.
  The toggle is the same header ghost `icon` button as Debug. Rank, size, and
  open-state tone live in [ADMIN_UI.md](./ADMIN_UI.md) (`Button`, Guide) — this
  file does not restyle it.
- Panel: right **dock** beside page content — not a modal Sheet. Workspace stays
  usable while chatting. Drag the left edge to resize (`288`–`512`px),
  double-click it to reset; width persists in `localStorage`. Resize handle is
  desktop-only.
- Toggling animates the dock **width** (200ms `ease-out`). The panel keeps its
  own width and is pinned to the rail's left edge, so it slides in from
  **off-screen** rather than folding shut, and content never reflows
  mid-transition. A drag drops the transition (`data-resizing`) to track the
  pointer 1:1.
- Boot state: the dock defaults to open at a default width, so SSR would paint
  it wrong for anyone who closed or resized it — it would animate shut (or snap
  to size) on hydration. `src/lib/admin-guide-dock.ts` holds the contract: a
  pre-hydration script in the root layout stamps `data-guide-dock` and
  `--guide-dock-width` on `<html>` from `localStorage`, and the toggle/resize
  write paths keep both in sync. The rail reads the width from that property (no
  inline style), and the collapsed rule in `globals.css` stays **unlayered** so
  it outranks the Tailwind width utility.
- Composer: same field as the viewer Tour Guide input — single-line input with
  mic + send **inside** the field and no separator border above it — but Admin
  chrome, not the viewer's glass capsule. Composer icon buttons pick `Button`
  from [ADMIN_UI.md](./ADMIN_UI.md); they are not a second size system.
- Voice input: `useSpeechToText` (`src/hooks/use-speech-to-text.ts`) is a
  trimmed port of the viewer hook (no audio level meter). Dictation fills the
  field and sending stays explicit; the mic is hidden when the browser has no
  Web Speech API.
- Debug fixtures: **Debug → Guide scenarios** loads showcase conversations and
  opens the dock. Scenarios live in `src/lib/admin-guide-scenarios.ts`; they are
  session-only and never represent live Guide output. Action tips may include
  `[label](/path)` links rendered by `guide-message-body.tsx` (in-app routes
  only). An action URL may carry a form intent; for example `/tours?create=tour`
  opens Add tour and `/tours/[tourId]?edit=tour` opens Edit tour. Closing the
  Sheet removes the query.
- CRUD responses may attach a compact review artifact. Shell cards cover **Tour
  draft** (create) and **Tour update** (edit) in `guide-message-artifact.tsx`.
  They do not call the API yet; the canonical full form remains the final
  authoring surface until confirmed writes are implemented.
- Typed questions reuse the same fixtures: `matchAdminGuideReply()` scores
  keyword overlap against every scenario question and returns that turn's
  answer, artifact, and follow-up chips (`ADMIN_GUIDE_STARTERS` seeds the
  opening chips). One fixture source for both Debug and the composer.
- Thread behaviour mirrors the viewer Tour Guide: `useThreadAutoscroll` ports
  the stick-to-bottom rules (follow while near the bottom, stop when the reader
  scrolls up, always follow a new user turn, skip the pin on large card growth),
  and `ThreadScrollToBottom` is the same jump-to-latest control with the 96px
  show threshold.
- The mock turn is paced to read like a real assistant: thinking dots
  (`GuideThinkingIndicator`), word-by-word reveal with a caret, and a Stop
  control in the composer. Reduced motion resolves the answer at once.
- Forms stay in **Sheets**; Guide is a companion rail, not an authoring drawer.

Implementation: `apps/admin/src/components/admin-guide-panel.tsx`
(`AdminGuideTrigger` + `AdminGuideDock`).

---

## Related

| Document                          | Role                                  |
| --------------------------------- | ------------------------------------- |
| [ADMIN_UI.md](./ADMIN_UI.md)      | Admin visual spec (Button, chrome)    |
| [NAMING.md](../product/NAMING.md) | Tour Guide vs other “guide” wording   |
| [ROADMAP.md](../ROADMAP.md)       | Phase 2 Admin / auth sequencing       |
