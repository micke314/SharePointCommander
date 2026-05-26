## Learnings

- 2026-05-26T13:53:12.170+02:00 — Iteration 1 quality gates must be executable by a human tester directly from the browser DevTools console, with no framework and no live API dependency.
- 2026-05-26T13:53:12.170+02:00 — Focus ownership is a first-class acceptance area on SharePoint pages: Tab trapping, outside-click recovery, and manual focus-steal simulation all need explicit checklist coverage.
- 2026-05-26T13:53:12.170+02:00 — Edge cases define done for the overlay MVP: empty lists, single-item lists, duplicate launches, long names, and rapid keypresses must be tested before Iteration 1 can pass.
- 2026-05-26T13:53:12.170+02:00 — Mode-specific `Escape` behavior is critical: filter closes first, help closes first, and only normal mode may dismiss the overlay, without leaking the keypress to SharePoint.

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
