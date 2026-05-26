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

---

## Diana — Iteration 1 Testing Approach (2026-05-26)
# Diana: Iteration 1 testing approach

**Date:** 2026-05-26T13:53:12.170+02:00
**Author:** Diana (QA / Tester)

## Decisions
- Iteration 1 QA is defined as manual DevTools-console execution only; no test framework, no automation harness, and no live SharePoint API dependency.
- The checklist is organized by user-visible modes first: normal overlay mode, filter mode, and help mode. This makes `Escape` behavior and focus ownership testable as state transitions, not isolated keypresses.
- Focus-trap validation includes explicit focus-steal recovery steps because SharePoint can reclaim focus unexpectedly; passing Tab/Shift+Tab alone is not enough.
- File-open and clipboard checks are validated against mock URLs with normal browser permissions enabled so the team can prove behavior before live-data wiring exists.
- Edge-case coverage is mandatory in Iteration 1: empty list, single-item list, long names, rapid keypresses, and repeated `sp_commander()` calls are part of definition-of-done, not optional regression checks.
- Filter acceptance requires real-time, case-insensitive, partial-name matching and must clear on folder navigation to match the current product scope call.
- `Escape` is tested per mode and must stop propagation to SharePoint so overlay behavior is isolated from underlying page keyboard handling.

## QA Note
If implementation details change, the checklist still stands: any new markup or selectors must preserve the same observable behaviors and allow a human tester to verify them from the browser directly.

## Minerva — Iteration 1 UI Spec (2026-05-26)
# Minerva Iteration 1 UI Spec

**Date:** 2026-05-26T13:53:12.170+02:00  
**Author:** Minerva (UI/UX Engineer)

This is the implementation-ready UI/UX handoff for Vulcan.

## 1) Overlay HTML structure

Inject this exact skeleton and keep the IDs/classes stable so the CSS can be inlined unchanged.

```html
<div id="spc-overlay" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="spc-current-path" aria-describedby="spc-statusbar">
  <div id="spc-pathbar">
    <span class="spc-label">PATH</span>
    <span id="spc-current-path">/Shared Documents</span>
  </div>

  <div id="spc-filterbar" hidden>
    <span class="spc-label">FILTER</span>
    <input
      id="spc-filter-input"
      type="text"
      inputmode="search"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="Type to filter current folder"
      aria-label="Filter current folder"
    />
  </div>

  <ul id="spc-list" role="listbox" aria-label="SharePoint items">
    <li class="spc-row" aria-selected="true">
      <span class="spc-kind spc-kind--folder">[D]</span>
      <span class="spc-name">Documents</span>
      <span class="spc-meta">Folder</span>
    </li>
  </ul>

  <div id="spc-statusbar" role="status" aria-live="polite">
    <span class="spc-status-main">1 item</span>
    <span class="spc-status-meta">↑/↓ move · Enter open · ? help</span>
  </div>

  <section id="spc-help" aria-label="Keyboard help" hidden>
    <h2>Keyboard Help</h2>
    <p>Keyboard is the interface. Mouse is optional and unsupported.</p>
    <dl>
      <dt>↑ / ↓</dt><dd>Move selection</dd>
      <dt>Enter</dt><dd>Open folder or file</dd>
      <dt>Backspace</dt><dd>Go to parent folder</dd>
      <dt>/</dt><dd>Open filter</dd>
      <dt>g</dt><dd>Jump to path</dd>
      <dt>o</dt><dd>Open selected file in new tab</dd>
      <dt>Ctrl+L</dt><dd>Copy selected link</dd>
      <dt>r</dt><dd>Refresh current folder</dd>
      <dt>?</dt><dd>Toggle help</dd>
      <dt>Esc</dt><dd>Close help, filter, or overlay</dd>
    </dl>
  </section>
</div>
```

### Structure rules
- The overlay itself is the primary focus target.
- The file list is not a tab stop; selection is virtual and rendered with `aria-selected`.
- The filter input is only shown during filter mode.
- The help panel is informational only; it does not get its own tab cycle.

## 2) Complete CSS

This exact CSS is written to `/home/micke/hackathon/SharePointCommander/sp-commander.css` and should be inlined by Vulcan.

```css
#spc-overlay,
#spc-overlay * {
  box-sizing: border-box;
}

#spc-overlay {
  --spc-z: 999999;
  --spc-overlay-inset: 2rem;
  --spc-radius: 0.65rem;
  --spc-gap: 0.75rem;
  --spc-pad-x: 1rem;
  --spc-pad-y: 0.75rem;
  --spc-row-pad-x: 1rem;
  --spc-row-pad-y: 0.5rem;
  --spc-font-size: 1rem;
  --spc-line-height: 1.4;
  --spc-bg: #1a1a1a;
  --spc-panel: #202225;
  --spc-panel-strong: #16181b;
  --spc-panel-muted: #24282d;
  --spc-border: #343a40;
  --spc-text: #eceff4;
  --spc-text-dim: #9aa4b2;
  --spc-text-muted: #6f7a88;
  --spc-path: #8fbcff;
  --spc-folder: #7bd88f;
  --spc-file: #ffd479;
  --spc-accent: #5fb3ff;
  --spc-accent-strong: #7cc4ff;
  --spc-selected-bg: #26374a;
  --spc-selected-border: #5fb3ff;
  --spc-selected-text: #f8fbff;
  --spc-status-bg: #141619;
  --spc-status-text: #d8dee9;
  --spc-help-backdrop: rgba(5, 7, 10, 0.72);
  position: fixed;
  inset: var(--spc-overlay-inset);
  z-index: var(--spc-z);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: var(--spc-gap);
  padding: 1rem;
  background: linear-gradient(180deg, rgba(31, 33, 37, 0.98) 0%, rgba(19, 21, 24, 0.98) 100%);
  border: 0.08rem solid var(--spc-border);
  border-radius: var(--spc-radius);
  box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.45);
  color: var(--spc-text);
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: var(--spc-font-size);
  line-height: var(--spc-line-height);
  outline: none;
  overflow: hidden;
}

#spc-overlay[hidden],
#spc-overlay [hidden] {
  display: none !important;
}

#spc-pathbar,
#spc-statusbar,
#spc-filterbar,
#spc-help {
  border: 0.08rem solid var(--spc-border);
  border-radius: 0.45rem;
}

#spc-pathbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.75em;
  min-height: 2.75rem;
  padding: var(--spc-pad-y) var(--spc-pad-x);
  background: var(--spc-panel-strong);
  color: var(--spc-text);
  white-space: nowrap;
}

#spc-pathbar .spc-label {
  flex: 0 0 auto;
  color: var(--spc-text-dim);
  letter-spacing: 0.08em;
}

#spc-current-path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--spc-path);
}

#spc-filterbar {
  position: sticky;
  top: 3.6rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.75em;
  min-height: 2.75rem;
  padding: 0.55rem var(--spc-pad-x);
  background: var(--spc-panel);
}

#spc-filterbar .spc-label {
  flex: 0 0 auto;
  color: var(--spc-accent-strong);
}

#spc-filter-input {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--spc-text);
  font: inherit;
  outline: none;
}

#spc-filter-input::placeholder {
  color: var(--spc-text-muted);
  opacity: 1;
}

#spc-list {
  position: relative;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: auto;
  border: 0.08rem solid var(--spc-border);
  border-radius: 0.45rem;
  background: var(--spc-bg);
}

#spc-list:focus {
  outline: none;
}

#spc-list .spc-empty,
#spc-list .spc-error,
#spc-list .spc-loading {
  padding: 1rem;
  color: var(--spc-text-dim);
}

#spc-list .spc-error {
  color: #ff8f8f;
}

.spc-row {
  display: grid;
  grid-template-columns: 1.5em auto minmax(0, 1fr);
  align-items: baseline;
  gap: 0.75em;
  min-height: 2.25rem;
  padding: var(--spc-row-pad-y) var(--spc-row-pad-x);
  border-bottom: 0.08rem solid rgba(255, 255, 255, 0.04);
  color: var(--spc-text);
}

.spc-row:last-child {
  border-bottom: 0;
}

.spc-row::before {
  content: ' ';
  color: var(--spc-accent-strong);
  font-weight: 700;
}

.spc-row[aria-selected='true'] {
  background: var(--spc-selected-bg);
  color: var(--spc-selected-text);
  box-shadow: inset 0.18rem 0 0 var(--spc-selected-border);
}

.spc-row[aria-selected='true']::before {
  content: '>';
}

.spc-kind {
  font-weight: 700;
  letter-spacing: 0.03em;
}

.spc-kind--folder {
  color: var(--spc-folder);
}

.spc-kind--file {
  color: var(--spc-file);
}

.spc-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spc-meta {
  justify-self: end;
  color: var(--spc-text-muted);
}

#spc-statusbar {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
  min-height: 2.5rem;
  padding: 0.55rem var(--spc-pad-x);
  background: var(--spc-status-bg);
  color: var(--spc-status-text);
}

#spc-statusbar .spc-status-main {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

#spc-statusbar .spc-status-meta {
  flex: 0 0 auto;
  color: var(--spc-text-dim);
}

#spc-help {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  width: min(44rem, calc(100% - 4rem));
  max-height: calc(100% - 6rem);
  overflow: auto;
  padding: 1.25rem;
  background: var(--spc-panel);
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
}

#spc-help::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background: var(--spc-help-backdrop);
}

#spc-help h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--spc-accent-strong);
}

#spc-help p {
  margin: 0 0 0.75rem;
  color: var(--spc-text-dim);
}

#spc-help dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1rem;
  margin: 0;
}

#spc-help dt {
  color: var(--spc-file);
  font-weight: 700;
}

#spc-help dd {
  margin: 0;
  color: var(--spc-text);
}

@media (max-width: 48rem) {
  #spc-overlay {
    --spc-overlay-inset: 1rem;
    padding: 0.75rem;
  }

  .spc-row {
    grid-template-columns: 1.25em auto minmax(0, 1fr);
    gap: 0.5em;
  }

  #spc-statusbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

## 3) Keyboard model spec

Implement as a single `keydown` switch on the overlay root. Only the active mode changes behavior.

| Key | Event | Action | Notes |
|-----|-------|--------|-------|
| `ArrowUp` | `keydown` | Move selection up by 1 visible row | `preventDefault()`; no-op at first row |
| `ArrowDown` | `keydown` | Move selection down by 1 visible row | `preventDefault()`; no-op at last row |
| `Home` | `keydown` | Move selection to first visible row | Edge key for long folders |
| `End` | `keydown` | Move selection to last visible row | Edge key for long folders |
| `Enter` | `keydown` | Open selected folder, or open selected file | `preventDefault()` always |
| `Backspace` | `keydown` | Navigate to parent folder | Always `preventDefault()` to block browser Back |
| `Escape` | `keydown` | Close help, else close filter, else close overlay | Strict unwind order |
| `/` | `keydown` | Open filter mode | Hidden filter bar becomes visible; focus input |
| `?` | `keydown` | Toggle help panel | Same key closes help when already open |
| `g` | `keydown` | Jump to path prompt | Ignore while filter input has focus |
| `o` | `keydown` | Open selected file in new tab | No-op on folders |
| `Ctrl+L` | `keydown` | Copy selected item link | `preventDefault()` to block browser location bar |
| `r` | `keydown` | Refresh current folder | Re-fetch current path; keep selection if possible |
| `Tab` | `keydown` | Trap focus inside overlay | Never let focus escape to SharePoint |
| `Shift+Tab` | `keydown` | Trap focus inside overlay | Same as Tab; reverse cycling is suppressed |
| Any printable key in filter mode | `keydown` / input | Update filter text | Filtering updates on every keystroke |
| `ArrowUp` in filter input | `keydown` | Move selection up without leaving filter mode | Overlay handles navigation while filter stays visible |
| `ArrowDown` in filter input | `keydown` | Move selection down without leaving filter mode | Same as above |
| `Enter` in filter input | `keydown` | Open current filtered selection | If there is no visible item, no-op |
| `Backspace` in filter input | `keydown` | Delete text only | Do not navigate to parent while input has text focus |
| Unhandled key when overlay is focused | `keydown` | Ignore | Do not mutate state or bubble into SharePoint shortcuts |

### Command priority
1. If help is open, only `Escape`, `?`, `Tab`, and `Shift+Tab` should do anything.
2. If filter is open, typing edits filter text; navigation keys still move the highlighted result.
3. In base list mode, all navigation and command keys work from the overlay root.

## 4) Focus trap design

### Open behavior
- Before opening, capture `document.activeElement` as `previousFocus` for restore-on-close.
- After injecting the DOM, call `overlay.focus({ preventScroll: true })`.
- Initial mode is list mode, so focus belongs on `#spc-overlay`, not on any row.

### Tab and Shift+Tab
- `Tab` and `Shift+Tab` are never allowed to leave the overlay.
- In list mode and help mode: `preventDefault()` and immediately keep focus on `#spc-overlay`.
- In filter mode: `preventDefault()` and keep focus on `#spc-filter-input`.
- Do not create a multi-element tab loop. This UI should feel like a terminal pane, not a form.

### SharePoint focus theft
- Listen for `focusout` on `#spc-overlay`.
- If the overlay is still mounted and the next focused element is outside `#spc-overlay`, queue a refocus on the active surface:
  - filter mode → `#spc-filter-input.focus({ preventScroll: true })`
  - otherwise → `#spc-overlay.focus({ preventScroll: true })`
- Use `setTimeout(..., 0)` or `queueMicrotask` so the browser completes the stray focus transition first, then yank focus back.
- Do not refocus if the overlay is in the middle of closing.

### ESC handling and propagation
- Handle `Escape` on the overlay listener in the capture phase so child focus targets cannot leak it.
- Always call `preventDefault()`, `stopPropagation()`, and `stopImmediatePropagation()` for `Escape` while the overlay is open.
- `Escape` unwind order is fixed:
  1. Close help panel if open.
  2. Else close filter bar and restore overlay focus.
  3. Else close the overlay and restore `previousFocus` if it is still connected.

## 5) Filter UX spec

### Trigger
- `/` enters filter mode from list mode.
- If help is open, `/` does nothing until help is closed.

### Placement and appearance
- The filter bar appears directly below the path bar.
- It uses the same monospace system and terminal styling as the rest of the overlay.
- The label is `FILTER`; the input has no visible chrome beyond the shared bar container.

### Behavior
- On open, show `#spc-filterbar`, clear any stale input value from the previous session state for that folder, and focus `#spc-filter-input`.
- Filtering is client-side and runs on every keystroke via the input event.
- Match against the current folder dataset only; no API calls.
- Use case-insensitive substring matching against item name.
- Preserve sort order while filtering; only visibility changes.
- After each filter update:
  - if the current selection is still visible, keep it;
  - otherwise move selection to the first visible row;
  - if no rows match, show an empty-state row and keep selection index at `-1`.

### ESC in filter mode
- `Escape` closes filter mode, clears the filter text, restores the full current-folder list, and returns focus to `#spc-overlay`.
- Selection should remain on the item that was selected before filter mode opened, if that item still exists in the folder.

### Folder navigation rule
- Filter state does **not** persist across folder navigation.
- On entering a new folder or going to parent:
  - hide the filter bar,
  - clear the filter text,
  - render the unfiltered dataset for the destination folder,
  - focus `#spc-overlay`.
- This follows Jupiter's scope call: clear on folder navigation to avoid stale-filter confusion.

## UX decisions locked for Iteration 1
- One durable tab stop only: the overlay root.
- Path bar at top, file list in the middle, status bar at bottom. Never bury the list.
- Help is modal-looking but non-interactive; it exists to teach keys, not trap more focus.
- Selection is visual and virtual; rows are not clickable controls.
- Filter is transient command mode, not a persistent sidebar state.

## Vulcan — Iteration 1 Implementation Decisions (2026-05-26)
# Vulcan Iteration 1 Implementation Decisions

- **Date:** 2026-05-26T13:53:12.170+02:00
- **Agent:** Vulcan

## Decisions

1. `sp-commander.js` is implemented as one self-contained IIFE and exposes only `window.sp_commander` for DevTools launch.
2. Keyboard handling is centralized on the overlay root element with `tabindex="-1"`; the filter input relies on event bubbling so no second key dispatcher is needed.
3. Iteration 1 uses the locked `MOCK_ITEMS` dataset at root and derives deeper mock URLs from the current path so Enter, Backspace, `g`, `o`, `r`, and `Ctrl+L` can be exercised without SharePoint REST calls.
4. Rendering keeps the overlay shell stable after first injection and only replaces `#spc-list` innerHTML for list redraws; path, status, help, and filter visibility update in place.
5. Escape behavior is split by mode: in filter mode it clears and hides the filter, otherwise it closes the overlay and removes it from the DOM.
