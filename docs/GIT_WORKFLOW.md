# Git workflow — commit & push guidelines

> How we push changes to GitHub for **iShare Virtual Tour**.  
> Goal: small, reviewable commits that map **one task = one commit** (or one PR).

---

## Golden rule

**Do not push one giant commit** that mixes unrelated work (e.g. NO panel CSS + fullscreen +
explore hover + docs). Split by **logical task** so `git log` and PR review stay readable.

---

## What counts as one task?

A task is a single user-visible fix or feature, or one cohesive refactor:

| ✅ One commit | ❌ Split or combine differently |
| ------------- | ------------------------------- |
| Fix NO panel body whitespace | NO panel fix + navbar fullscreen in same commit |
| Default viewer controls ON + localStorage preference | Controls default only vs persistence (ok together — same feature) |
| Explore directory item hover colors | Unrelated Help panel copy |
| Add `docs/PERFORMANCE.md` | Performance doc + unrelated component refactor |
| Custom fullscreen targeting `.viewer-area` | Fullscreen + FAB tooltip labels (separate if unrelated) |

When in doubt: **if you would describe it as two bullet points in a PR summary, use two commits.**

---

## Recommended workflow

### 1. Before coding

- Know the task scope (ticket, chat, or self-note).
- If scope grows, **stop and commit what’s done**, then start the next task.

### 2. While working

```bash
git status
git diff
```

Stage **only files for the current task**:

```bash
git add src/components/TourGlassPanel.css src/viewer/anchoredPanelPosition.ts
```

Avoid `git add .` until you are sure everything in the tree belongs to one task.

### 3. Commit message format

Match existing repo style — **one short imperative sentence**, period at end:

```
Fix anchored NO panel gap below body content.
```

```
Default viewer controls to visible and persist preference in localStorage.
```

```
Add explore nav item hover styles and GIT_WORKFLOW guidelines.
```

Optional body for non-obvious context:

```
Fix anchored NO panel gap below body content.

Use [data-info-panel] selectors and sync marker height to rendered panel
so the 32px hotspot gap stays correct after content-height sizing.
```

**Prefixes** (use when helpful, not required):

| Prefix | Use for |
| ------ | ------- |
| `Add` | New feature, file, or UI |
| `Fix` | Bug fix |
| `Polish` / `Update` | UX/CSS copy tweaks |
| `Docs` | Documentation only |
| `Refactor` | Behavior unchanged |

### 4. Push

After **one or more task commits** on your branch:

```bash
git push origin HEAD
```

For a feature branch:

```bash
git push -u origin feature/short-description
```

**Do not** `git push --force` to `main` unless explicitly agreed.

---

## Task split examples (this project)

Typical split for a large session:

1. `Fix NO/info anchored panel content-height and marker gap.`
2. `Add custom fullscreen on viewer-area with navbar icon polish.`
3. `Default viewer controls on and persist toggle in localStorage.`
4. `Add tour nav FAB tooltips and explore item hover styles.`
5. `Add Help contact block and FMI tour support details.`
6. `Docs: add PERFORMANCE backlog and GIT_WORKFLOW.`

Each commit should **build** (`npm run build`) at that point when possible.

---

## Files often touched together (keep in one commit)

| Task | Files |
| ---- | ----- |
| Anchored NO panel sizing | `TourGlassPanel.css`, `tourGlassPanelHtml.ts`, `anchoredPanelPosition.ts`, `infoPanelMarker.ts` |
| Fullscreen overlay | `tourFullscreenNavbarButton.ts`, `PanoramaViewer.tsx`, `TourPage.tsx`, `layout.css` |
| Viewer controls preference | `useViewerControlsVisible.ts`, `viewerControlsPreference.ts`, `TourPage.tsx` |
| Explore directory UX | `TourNavFloat.tsx`, `TourNavFloat.css`, `tourNavActions.ts` |
| Shared UI primitive | `ui/Badge.*`, `Badge.css`, `badgeClasses.ts` + consumers in same task only |

---

## Checklist before every push

- [ ] `npm run build` passes
- [ ] Each commit is one task (review `git log` on branch)
- [ ] No secrets (`.env`, keys, credentials)
- [ ] No accidental debug-only changes unless behind `?dev=1`
- [ ] Commit message describes **why**, not only file names

---

## PRs (optional)

When opening a PR, list commits or summarize by task:

```markdown
## Summary
- Fix NO panel body whitespace and marker gap
- Viewer controls default ON + localStorage
- Explore nav hover: black text, theme icons

## Test plan
- [ ] Open Parking Lot NO — no gap under body
- [ ] Toggle controls, refresh — preference kept
- [ ] Explore → hover location / NO items
```

See [README.md](./README.md) for other docs.
