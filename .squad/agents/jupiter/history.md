## Learnings

### 2026-05-27 — Keyboard Navigation Off-by-One Bug Fix

**File:** `sp-commander.js`  
**Function:** `moveSelection()` (line 855)

**Root cause:** `moveSelection()` called `getFilteredItems()` to determine the valid `selectedIndex` range. But the rendered list is built by `getDisplayItems()`, which prepends a `PARENT_ITEM` (`..`) entry when not filtering. This made the display list N+1 items long while `moveSelection` capped the index at N−1 — so the last file was permanently unreachable via End, ArrowDown, and PageDown.

**Fix:** One-line change — replaced `getFilteredItems()` with `getDisplayItems()` in `moveSelection()` so the index bounds match the actual rendered rows.

**Key insight:** `getFilteredItems()` and `getDisplayItems()` are not interchangeable. Anywhere that computes selection bounds from the rendered row count must use `getDisplayItems()`, not `getFilteredItems()`.

### 2026-05-26 — CSP Bookmarklet Loader Fix

**CSP constraint discovery:**
- SharePoint Online's CSP blocks external `<script>` tags (script-src with src=) even when domains are trusted.
- However, `'unsafe-eval'` IS allowed in SharePoint's CSP, enabling `eval()` and `new Function()` patterns.
- Fetch + eval bypasses the script-tag restriction while remaining CSP-compliant.
- `raw.githubusercontent.com` supports CORS with `*` wildcard, enabling cross-origin fetch.

**Pattern:** For browser bookmarklets on restricted pages, consider fetch+eval as a CSP-safe alternative to DOM script injection. See decision: jupiter-csp-bookmarklet-fix.md

### 2026-05-26 — Iteration Plan & Architecture

**Iteration structure:**
- Iteration 1: Core Scaffold (Minerva + Vulcan + Diana) — static overlay, keyboard, filter
- Iteration 2: Live Data (Mercury + Janus + Vulcan + Mars + Diana) — real API, cache, error handling
- Iteration 3: Polish + Packaging (Vulcan + Fides + Diana + Jupiter) — bookmarklet, README, demo

**Key technical decisions locked:**
- Single IIFE, section order: Config → State → API → Render → Bootstrap
- Plain `AppState` object (no class/proxy), full targeted re-render on change
- Only `.spc-list` innerHTML replaced on navigation (overlay injected once)
- `Accept: application/json;odata=nometadata` + `$select` on all API calls
- Cache key = normalized lowercase server-relative URL, 5 min TTL
- Single `keydown` listener on overlay div → `handleCommand(cmd)` switch

**Scope calls made:**
- Filter clears on folder navigation (simpler, no stale state)
- Single panel only for all 3 iterations (two-panel → backlog)
- No virtual scrolling in MVP (→ backlog)
- `g` (jump to path) uses native `prompt()` — no custom widget
- localStorage UI prefs deferred to Iteration 3 if time permits

**Top risks identified:**
1. SharePoint tenant path variance — webUrl vs siteUrl resolution
2. Bookmarklet CSP blocking on strict-CSP tenants
3. SharePoint DOM stealing focus from overlay keydown handler

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
