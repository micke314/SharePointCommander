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
- 2026-05-26T14:01:35.714+02:00 — Completed Iteration 1 static code audit of sp-commander.js against all 28 TCs. Verdict: CONDITIONAL PASS. Core logic (navigation, keyboard dispatch, filter, help, DOM removal) is sound. Three must-fix bugs found: (1) ESC closes entire overlay even when help panel is open — should close help first; (2) focus-steal recovery silently breaks while filter mode is active due to early return in onOverlayFocusOut; (3) external sp-commander.css has completely different element IDs and class names from the JS-generated HTML — the CSS file is dead code against the current implementation.
- 2026-05-26T14:01:35.714+02:00 — The o key on a folder opens a new browser tab with the folder URL rather than navigating into the folder. This is a UX defect (advisory, not crash).
- 2026-05-26T14:01:35.714+02:00 — jumpToPath() with empty string silently navigates to root instead of being a no-op — checklist expects no change or inline error.
- 2026-05-26T14:01:35.714+02:00 — text-overflow: ellipsis for long names only lives in the external CSS, not in the JS inline style block — external CSS being unused means long names overflow visually.
- 2026-05-26T14:05:06.305+02:00 — Vulcan completed all fixes: (1) ESC now closes help first, then filter, then overlay; (2) focus recovery routed to filter input when filter active; (3) overlay HTML/CSS aligned to Minerva spec (element IDs, aria-selected, kind modifiers); (4) o-key navigates folders instead of opening tabs; (5) empty g-input cancels instead of jumping to root. Iteration 1 bug fixes complete.
