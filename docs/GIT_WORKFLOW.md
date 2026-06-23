# Git workflow — commit & push guidelines

> How we push changes to GitHub for **iShare Virtual Tour**.  
> Goal: small, reviewable commits that map **one task = one commit** (or one
> PR).

---

## Golden rule

**Do not push one giant commit** that mixes unrelated work (e.g. NO panel CSS +
fullscreen + explore hover + docs). Split by **logical task** so `git log` and
PR review stay readable.

---

## What counts as one task?

A task is a single user-visible fix or feature, or one cohesive refactor:

| ✅ One commit                                        | ❌ Split or combine differently                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| Fix NO panel body whitespace                         | NO panel fix + navbar fullscreen in same commit                   |
| Default viewer controls ON + localStorage preference | Controls default only vs persistence (ok together — same feature) |
| Explore directory item hover colors                  | Unrelated Help panel copy                                         |
| Add `docs/PERFORMANCE.md`                            | Performance doc + unrelated component refactor                    |
| Custom fullscreen targeting `.viewer-area`           | Fullscreen + FAB tooltip labels (separate if unrelated)           |

When in doubt: **if you would describe it as two bullet points in a PR summary,
use two commits.**

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

| Prefix              | Use for                  |
| ------------------- | ------------------------ |
| `Add`               | New feature, file, or UI |
| `Fix`               | Bug fix                  |
| `Polish` / `Update` | UX/CSS copy tweaks       |
| `Docs`              | Documentation only       |
| `Refactor`          | Behavior unchanged       |

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

| Task                       | Files                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| Anchored NO panel sizing   | `glass-panels-layer.css`, `tourGlassPanelHtml.ts`, `anchoredPanelPosition.ts`, `infoPanelMarker.ts` |
| Fullscreen overlay         | `tourFullscreenNavbarButton.ts`, `PanoramaViewer.tsx`, `TourPage.tsx`, `psv-layer.css`             |
| Viewer controls preference | `useViewerControlsVisible.ts`, `viewerControlsPreference.ts`, `TourPage.tsx`                    |
| Explore directory UX       | `TourNavFloat.tsx`, `tourNavFloatVariants.ts`, `tourNavActions.ts`                              |
| Shared UI primitive        | `ui/Badge.*`, `badgeVariants.ts`, `badgeClasses.ts` + consumers in same task only                  |

---

## Checklist before every push

- [ ] `npm run build` passes
- [ ] Each commit is one task (review `git log` on branch)
- [ ] No secrets (`.env`, keys, credentials)
- [ ] No accidental debug-only changes unless behind `?dev=1`
- [ ] Commit message describes **why**, not only file names

---

## End-of-session push (still split commits)

When you finish a long session — or say **“push everything”** — **do not**
squash into one commit. Push **multiple task commits**, then one `git push`.

### Workflow

1. `git status` — list changed files.
2. **Group by task** (see table below). If a group needs two PR bullets, split
   further.
3. For each group: `git add <only those files>` → `git commit -m "…"` → repeat.
4. `git log --oneline -10` — confirm each line is one task.
5. `npm run build` once (after last commit, or after each commit when risky).
6. `git push origin HEAD`.

**Never** use `git add -A` / `git add .` for a multi-task session unless every
staged file truly belongs to the **same** task.

### Suggested split order

Commit in this order when a session touched several areas (dependencies first,
docs last):

1. **Routing / data contracts** — `tourPaths.ts`, loaders, catalog JSON
2. **Feature UI** — page or panel for one user-visible outcome
3. **Shared primitives** — new `ui/*`, hooks used by multiple features (same
   task if introduced together)
4. **Feature consumers** — wire shared UI into intro, explore, etc. (one commit
   per surface if large)
5. **Polish / UX** — CSS-only follow-ups for one surface
6. **Docs only** — `docs/*`, README (no src changes mixed in)

---

## Anti-pattern: mixed mega-commit

**Bad** (real example — do not repeat):

```
Add tour-not-found routing, shared tab UI, and docs consolidation.
```

One commit mixed:

- Unknown tour URL → 404 page
- `SegmentedTabs` / `SegmentedTabPanel` shared components
- Intro gallery preview loader + category tabs
- Catalog visibility rules
- Docs: delete MVP_PLAN, add PRODUCT_SPEC
- Asset renames

**Better** — six commits, same session:

```
Add unknown tour routing and TourNotFound page.
Add shared preview hero skeleton for gallery and nav preview.
Add SegmentedTabs with sliding indicator and panel transition.
Polish client intro category filters and gallery layout.
Update tour catalog visibility and public listing rules.
Docs: split PRODUCT_SPEC and PROJECT_CONTEXT; trim ROADMAP overlap.
```

Reviewers and `git bisect` can target one change. `git log` stays a task list.

---

## Agent & AI assistant checklist

**Read this section before any `git commit` or `git push`**, even when the user
only says “push” or “commit”.

| Step | Action                                                                    |
| ---- | ------------------------------------------------------------------------- |
| 1    | Read [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) golden rule                     |
| 2    | Run `git status` and `git diff --stat`                                    |
| 3    | Propose **commit groups** (file list per group) in chat before committing |
| 4    | Stage **per group** — never default to `git add -A` for multi-topic work  |
| 5    | One imperative sentence per commit message; build after risky groups      |
| 6    | Show `git log --oneline` for new commits, then push                       |

If the user insists on a **single** commit, warn once that it breaks repo
guidelines, then follow their explicit instruction.

Linked from [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) — **Before every
push**.

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
