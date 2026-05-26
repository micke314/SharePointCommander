## Learnings

- 2026-05-26T13:53:12.170+02:00 — Keep exactly one durable tab stop in the overlay: `#spc-overlay`. The only temporary exception is the filter input while filter mode is active.
- 2026-05-26T13:53:12.170+02:00 — Use sticky path and status bars inside the inset overlay so the file list stays visually dominant without losing orientation.
- 2026-05-26T13:53:12.170+02:00 — Treat help as a modal information sheet, not a second interaction model; ESC must always unwind help → filter → overlay in that order.

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
