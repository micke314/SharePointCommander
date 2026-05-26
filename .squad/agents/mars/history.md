## Learnings

*(No learnings recorded yet — this will grow as I work.)*

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
