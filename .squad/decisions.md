# Squad Decisions

## Active Decisions

No decisions recorded yet.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
# Jupiter: Iteration Plan & Architectural Decisions
**Date:** 2026-05-26T13:46:07.758+02:00
**Author:** Jupiter (Lead / Product Owner)

---

## Architecture Decision

`sp-commander.js` is a single self-contained IIFE. Internally it is organized into five clearly-separated sections in this order: **Config → State → API → Render → Bootstrap**. Config holds all constants (default root, key bindings, cache TTL). State is a single plain `AppState` object (no class, no proxy) — flat, predictable, easy to inspect in DevTools. API is a pure-function module that takes a path, returns a Promise of normalized items, and knows nothing about the DOM. Render takes the current AppState and does a full targeted DOM swap of the file list — no diffing library, just replacing `.spc-list` innerHTML, which is fast enough for directory sizes under ~2,000 items. Keyboard handling is a single `keydown` listener on the overlay element (not `document`) that dispatches a command string to a `handleCommand(cmd, state)` function — this keeps all key→action mapping in one readable table.

**State shape:**
```js
const state = {
  currentPath: '',
  items: [],         // [{name, type:'folder'|'file', serverRelativeUrl}]
  selected: 0,
  filterText: '',
  filterActive: false,
  loading: false,
  error: null,
  cache: new Map(),  // path → {items, timestamp}
  siteUrl: '',
  webUrl: ''
};
```

---

## Technical Decisions (Locked)

| # | Decision | Choice | Reason |
|---|----------|--------|--------|
| 1 | File structure | Single IIFE, internal section order: Config → State → API → Render → Bootstrap | Bookmarklet-compatible; no bundler needed; DevTools paste works as-is |
| 2 | State management | Plain `AppState` object, mutated directly, full re-render on change | Zero framework overhead; trivial to debug; sufficient for single-panel MVP |
| 3 | DOM strategy | Single overlay div injected once; only `.spc-list` innerHTML is replaced on navigation | Avoids full repaint; keeps focus trap stable |
| 4 | API response format | `Accept: application/json;odata=nometadata` + `$select=Name,FileLeafRef,ServerRelativeUrl,FSObjType` on all calls | Minimal payload; no metadata noise |
| 5 | Cache key | Normalized server-relative URL (lowercase, trailing slash stripped) | Consistent hits regardless of how path is assembled |
| 6 | Keyboard dispatch | Single `keydown` listener → `handleCommand(cmd)` switch — no library | Predictable, auditable, zero dependencies |

---

## Iteration Plan

### Iteration 1: Core Scaffold
**Goal:** Overlay renders with keyboard focus trap, shows a hardcoded/static file list, all key bindings respond correctly.
**Who:** Minerva, Vulcan, Diana

**Delivers:**
- Full-screen overlay (dark terminal theme) injected into SharePoint DOM
- Static file list rendered with folder/file type indicators
- ↑/↓ selection with visual highlight
- ESC closes overlay; Enter/Backspace log to console (stubs)
- `?` shows key binding help panel
- `/` opens filter input (filters static list client-side)
- Focus trap: Tab cycles within overlay only
- Diana's Iteration 1 test checklist

**Done when:**
- Overlay opens via `sp_commander()` call in DevTools console
- ↑/↓ moves selection; selected row is visually distinct
- ESC dismisses overlay completely (no DOM remnants)
- `/` opens filter input; typing filters visible rows instantly
- Escape from filter returns to list with selection preserved
- `?` renders all key bindings; ESC/`?` again closes it
- Tab key does not escape the overlay
- No SharePoint page interaction occurs

---

### Iteration 2: Live Data
**Goal:** Real SharePoint folder listing, navigation, file open, and copy link — all working from a live SharePoint page.
**Who:** Mercury, Janus, Vulcan, Mars, Diana

**Delivers:**
- Context capture on launch (siteUrl, webUrl, initial path from current page URL)
- Folder listing via `/_api/web/GetFolderByServerRelativeUrl(...)` with correct `$select`
- Navigate into folders (Enter) and back out (Backspace)
- Open file in new tab (`o` or Enter on file)
- Copy server-relative URL to clipboard (`Ctrl+L`)
- `r` forces refresh (bypasses cache)
- `g` prompts for manual path jump
- In-memory cache (`Map<path, {items, timestamp}>`, 5 min TTL)
- Spinner/loading state during fetch
- Error display for 403, 404, network failures
- Mars security review sign-off
- Diana's Iteration 2 test checklist

**Done when:**
- Launching from a SharePoint library page opens that library folder
- Launching from a non-library page opens `Shared Documents` with a visible fallback notice
- Enter on a folder navigates into it; path bar updates
- Backspace navigates to parent; at root, Backspace does nothing (no crash)
- Enter / `o` on a file opens it in a new tab
- `Ctrl+L` writes file URL to clipboard; status bar confirms
- Revisiting a folder within TTL shows cached data with no network call (verify via DevTools Network tab)
- `r` triggers a fresh fetch; cache entry is updated
- 403 response shows `Error: 403 Forbidden (access denied)` in status bar; overlay stays open
- No requests go to any non-`/_api/` origin

---

### Iteration 3: Polish + Packaging
**Goal:** Filter refinement, robust error handling, bookmarklet, README, demo script — ready to ship.
**Who:** Vulcan, Fides, Diana, Jupiter (acceptance)

**Delivers:**
- Filter (`/`) working against live data (not just static mock)
- Filter persists across navigations within same session (cleared on folder change — this is a scope call)
- Status bar shows item count and filter match count
- Bookmarklet snippet (URL-encoded IIFE)
- DevTools IIFE snippet (copy-paste ready)
- README: usage, key bindings, known limitations
- Demo script: step-by-step with expected outcomes
- Backlog document: prioritized improvements
- Final Diana full regression checklist

**Done when:**
- Bookmarklet executes correctly on a SharePoint page (tested in Chrome and Edge)
- DevTools snippet executes without errors
- `/` filter on a live folder filters instantly with no additional API calls
- README covers all three launch methods
- Demo script can be executed start-to-finish without referring to any other doc
- All Iteration 1 + 2 acceptance criteria still pass (regression)

---

## Scope Calls (Jupiter Decisions)

1. **Filter clears on folder navigation** — simpler, correct, no stale-filter confusion.
2. **Single panel MVP only** — two-panel is a stretch goal, explicitly out of scope for all three iterations.
3. **No virtual scrolling in MVP** — directories under 2,000 items render fine with innerHTML swap; add to backlog.
4. **No persistent preferences in Iteration 1** — localStorage for UI prefs is allowed but deferred to Iteration 3 if time permits.
5. **`g` uses `prompt()` for path input** — simplest correct implementation; no custom input widget complexity.

---

## Risks

1. **SharePoint tenant path variance** — `/_api/web/GetFolderByServerRelativeUrl` requires a correctly encoded server-relative URL. Different tenants and sub-sites have different web-relative roots. Context capture must correctly resolve `webUrl` vs `siteUrl` or navigation will silently land in the wrong library. Mercury must test against at least two path structures.

2. **Bookmarklet CSP blocking** — Some SharePoint tenants enforce a strict Content Security Policy that blocks injected `<script>` tags or `javascript:` bookmarklets. The bookmarklet must be a pure `javascript:` URI with no external script load — it must be entirely self-contained. Mars must verify this during Iteration 3.

3. **Focus trap fragility on SharePoint DOM changes** — SharePoint pages run their own JS that may steal focus (e.g., notifications, live persona cards). The overlay's `keydown` handler must be on the overlay div with `tabindex="-1"`, not on `document`, and focus must be programmatically restored if lost. Vulcan must account for this in Iteration 1.
