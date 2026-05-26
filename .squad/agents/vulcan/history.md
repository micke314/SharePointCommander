## Learnings

- 2026-05-26T13:53:12.170+02:00 — Kept the scaffold as a single IIFE with one overlay-level `keydown` dispatcher so focus stays trapped without touching `document` listeners.
- 2026-05-26T13:53:12.170+02:00 — Mock navigation reuses the same static dataset but rewrites child URLs from the current path, which keeps folder/file behavior testable before live SharePoint API wiring exists.
- 2026-05-26T13:53:12.170+02:00 — Limited repeat DOM churn to `#spc-list` innerHTML updates while path, status, filter, and help are patched surgically on existing nodes.
- 2026-05-26T14:09:31.683+02:00 — A GitHub-hosted bookmarklet loader should stay as a single-line `javascript:` IIFE with `Date.now()` cache busting, while the DevTools variant can stay readable and include a load confirmation.

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
