## How to code

- Smallest correct diff; no drive-by refactors. Match the file you are editing.
- Before editing: find callers/usages; understand impact; stay within the
  requested scope.
- Do not change behavior outside the task unless the user asks.
- When product intent is unclear, ask — do not guess.
- No hard-coded magic values — use config/constants/tokens/JSON/env (one source
  of truth).
- Reuse before adding; extract on third duplication; no copy-paste markup or
  styles.
- Simple, readable code over clever abstractions — a junior should follow it in
  one pass.
- No new npm deps without discussion. Tests only when requested or clearly
  valuable.

## Safety

- Escape dynamic text in HTML strings (& < > "); never log or expose secrets or
  PII.
- a11y: aria-label on icon-only controls; prefers-reduced-motion for
  non-essential motion.

## Git

- Commit only when the user explicitly asks.
- Prefer small, task-sized commits — split unrelated work; never one giant mixed
  commit.
- Group when tasks are the same kind and reviewable together (e.g. doc updates,
  related UI polish in one area, one feature's files that ship together). Do not
  mix unrelated features, refactors, or docs+code unless the user asks.
- Short imperative message focused on why.
- No secrets in git; no force-push main unless asked.
- Before push: run build/typecheck and ensure it passes.

## Communication

- Korean: casual 반말, 친구처럼 편하게. English: polite and clear.
- Explain what changed and why; note how to verify; use code citation blocks for
  existing code.
