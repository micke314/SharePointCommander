## Learnings

- 2026-05-27T07:10:33Z — Implemented sortable columns (name/size/date) with folder-first sorting, click-to-toggle headers (▲/▼), and reset on navigation. Version bumped to 0.3.12. Commit 325a86a. Closes #10.
- 2026-05-26T13:53:12.170+02:00 — Kept the scaffold as a single IIFE with one overlay-level `keydown` dispatcher so focus stays trapped without touching `document` listeners.
- 2026-05-26T13:53:12.170+02:00 — Mock navigation reuses the same static dataset but rewrites child URLs from the current path, which keeps folder/file behavior testable before live SharePoint API wiring exists.
- 2026-05-26T13:53:12.170+02:00 — Limited repeat DOM churn to `#spc-list` innerHTML updates while path, status, filter, and help are patched surgically on existing nodes.
- 2026-05-26T14:05:06.305+02:00 — Matched the injected overlay markup to Minerva's CSS contract (`#spc-pathbar`, `#spc-filterbar`, `#spc-statusbar`, `aria-selected`, kind modifiers) so the inlined styles and DOM stay locked together.
- 2026-05-26T14:05:06.305+02:00 — Focus recovery must return to the active control, not just the overlay root: in filter mode the input gets focus back, while Esc now unwinds filter → help → overlay in the right order.
- 2026-05-26T14:09:31.683+02:00 — A GitHub-hosted bookmarklet loader should stay as a single-line `javascript:` IIFE with `Date.now()` cache busting, while the DevTools variant can stay readable and include a load confirmation.
- 2026-05-27T09:41:35.048+02:00 — `Ctrl+L` should copy a browser-openable absolute URL: append `?web=1` only for files, keep folders/parent on their plain server-relative path, and keep the status text short so the NC overlay width stays stable.

## Project Context (Day 1)

**Project:** SharePoint Commander (Read-Only)
**Requested by:** Mikael Eriksson
**Tech stack:** Vanilla JS, browser APIs, SharePoint REST API (same-origin)
**Deliverables:** sp-commander.js, bookmarklet snippet, DevTools IIFE, README, demo script, backlog

**Key constraints:**
- Browser-injected JS overlay — no backend, no OAuth, no external calls
- All requests via `/_api/web/...` using existing SharePoint session cookies
- Read-only: list, navigate, open, copy link — no write operations
- Zero external dependencies

**Inspired by:** Norton Commander, Altap Salamander, terminal file navigators

**Team:** Jupiter (Lead), Minerva (UI/UX), Vulcan (Frontend), Mercury (API), Janus (Performance), Diana (QA), Mars (Security), Fides (Docs), Scribe, Ralph
- 2026-05-26T14:29:31.616+02:00 — NC redesign: replaced all CSS variables with flat NC palette (#0000AA bg, #55FFFF cyan borders, #000055 header/filter, #000000 status). Eliminated gradients, border-radius, and box-shadow blur — NC is sharp and flat.
- 2026-05-26T14:29:31.616+02:00 — Added #spc-fnbar as a 5th grid row (auto) below the status bar; static HTML injected in renderOverlay() template, keyed via Config.fnBarId.
- 2026-05-26T14:29:31.616+02:00 — Selected row now uses solid #55FFFF bg / #000000 text (NC highlight bar) instead of the previous left-border inset approach.
- 2026-05-26T14:29:31.616+02:00 — renderPathBar() now wraps path in NC-style [ ] brackets.
- 2026-05-26T14:29:31.616+02:00 — Row height tightened to 1.4rem with 0.1rem vertical padding — NC panels are dense and tabular, not spacious.
- 2026-05-26T14:37:39.230+02:00 — SPContext is resolved once at module init from window._spPageContextInfo; all API calls use webAbsoluteUrl as base so sub-sites work without any path arithmetic.
- 2026-05-26T14:37:39.230+02:00 — Site-root view (path === webServerRelativeUrl) lists document libraries via /_api/web/lists with BaseTemplate eq 101 filter; deeper paths use GetFolderByServerRelativeUrl with parallel Folders + Files fetches merged folders-first.
- 2026-05-26T14:37:39.230+02:00 — Cache (Map keyed by server-relative path) short-circuits repeated navigation; refresh explicitly deletes the entry before re-fetching.
- 2026-05-26T14:37:39.230+02:00 — Starting path is detected from ?id= or ?RootFolder= URL params (modern/classic SP library views), falling back to webServerRelativeUrl so the tool always opens in context.
