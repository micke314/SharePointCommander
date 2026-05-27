# Decisions Log

## 2026-05-27 — Playwright Tests & Sortable Columns

### Diana Playwright E2E Repo Created

**From:** Diana (QA / Tester)  
**Date:** 2026-05-27T09:02:11+02:00  
**Status:** ✅ DONE

**New Repo:**
- Local: `/home/micke/hackathon/SharePointCommander-tests/`
- GitHub: https://github.com/micke314/SharePointCommander-tests
- Visibility: Public

**Test Structure:**
```
tests/
  smoke.spec.ts               Overlay lifecycle, Escape regression (BUG-1, BUG-2)
  keyboard-navigation.spec.ts Keyboard shortcuts + End/PageDown off-by-one regression
  file-listing.spec.ts        Parent entry, folder nav, back-nav, live filter
```

**Key Coverage:** End key lands on last item (commit `3fc12ce` regression), Escape closes help/filter correctly, duplicate-launch guard, parent entry display, live filtering.

---

### Vulcan Sortable Columns

**From:** Vulcan (Frontend Engineer)  
**Date:** 2026-05-27T09:05:44+02:00  
**Issue:** #10  
**Status:** ✅ DONE

**Changes:**
- Sort state stored in `State` as `{ column, direction }` (default: name ascending)
- Client-side sorting in `getFilteredItems()` reused by all render paths
- Folders sorted independently from files (folders-first collation)
- Column header click toggles sort direction; active column shows `▲` or `▼`
- Sort resets to name/asc when path changes

---

## 2026-05-27 — User Directive

### Micke Push-Always Directive

**From:** Micke  
**Date:** 2026-05-27T08:45:20+02:00  
**Status:** ✅ DECIDED

Always push to GitHub after commits — no need to ask. Captured for team memory.

---

## 2026-05-26 — Iteration 1 Bug Fixes & Bookmarklet

### Diana Iteration 1 Code Audit Findings

**From:** Diana (QA / Tester)  
**Date:** 2026-05-26T14:01:35.714+02:00

#### 🔴 BUG-1 — ESC closes entire overlay when help panel is open (MUST FIX)

**File:** `sp-commander.js`  
**Function:** `onOverlayKeydown`, `case 'Escape'`  
**Checklist ref:** TC-22, TC-24

**Issue:** ESC should close help panel first when `State.helpVisible` is true. Only if neither filter nor help is active should ESC dismiss the whole overlay.

**Status:** ✅ FIXED by Vulcan

---

#### 🔴 BUG-2 — Focus-steal recovery fails when filter mode is active (MUST FIX)

**File:** `sp-commander.js`  
**Function:** `onOverlayFocusOut`  
**Checklist ref:** TC-7

**Issue:** When focus is stolen externally while the filter input is active, the overlay should recapture focus into the filter input.

**Status:** ✅ FIXED by Vulcan

---

#### 🔴 BUG-3 — External sp-commander.css is incompatible with JS-generated HTML (MUST FIX)

**Files:** `sp-commander.css` vs `sp-commander.js`  
**Checklist ref:** CSS integration audit

**Issue:** CSS uses element IDs and attributes that the JS does not generate. Mismatches include:
- CSS expects `#spc-pathbar`, JS generates `id="spc-path"`
- CSS uses `aria-selected='true'`, JS uses `class="is-selected"`
- CSS uses `.spc-kind--folder`, `.spc-kind--file`, JS uses `class="spc-kind"`

**Status:** ✅ FIXED by Vulcan — Overlay HTML and inline CSS now match Minerva's agreed structure and selectors

---

#### 🟡 BUG-4 — `o` on a folder opens a new tab instead of navigating into it (SHOULD FIX)

**File:** `sp-commander.js`  
**Function:** `openItem()` / `case 'o'` in `onOverlayKeydown`  
**Checklist ref:** TC-14 edge case

**Issue:** Pressing `o` on a folder should navigate into the folder, not open it in a new tab.

**Status:** ✅ FIXED by Vulcan

---

#### 🟡 BUG-5 — `g` with empty input silently navigates to root (SHOULD FIX)

**File:** `sp-commander.js`  
**Function:** `jumpToPath()`  
**Checklist ref:** TC-12

**Issue:** Empty input should be treated as cancellation — no navigation, no view change.

**Status:** ✅ FIXED by Vulcan

---

#### 🟡 BUG-6 — Long name `text-overflow: ellipsis` missing from JS inline styles (SHOULD FIX)

**File:** `sp-commander.js`  
**Function:** inline `<style>` block in `renderOverlay()`  
**Checklist ref:** TC-27

**Issue:** The `.spc-name` selector in the JS inline style does not include `overflow: hidden; text-overflow: ellipsis`. Long file names will overflow visually.

**Status:** Not explicitly mentioned in Vulcan's report, but CSS alignment in BUG-3 resolution likely addressed this.

---

### Vulcan Iteration 1 — Bug Fixes Summary

**From:** Vulcan (Frontend Engineer)  
**Date:** 2026-05-26T14:05:06.305+02:00

**Deliverables:**
- Fixed 3 must-fix bugs (BUG-1, BUG-2, BUG-3)
- Fixed 2 advisories (BUG-4, BUG-5)
- Generated BOOKMARKLET.md with javascript: URI and install instructions

**Changes Made:**
- Esc now closes filter first, then help, and only closes the overlay when neither mode is active.
- Focus-steal recovery now routes focus back to the active control so filter typing is preserved.
- Overlay HTML and inline CSS now match agreed structure and selectors.
- `o` on folders now navigates into the folder instead of opening a new tab.
- Empty `g` input now cancels instead of jumping to root.

---

## 2026-05-26 — Bookmarklet & API Integration

### Jupiter CSP-Safe Bookmarklet Loader Pattern

**From:** Jupiter (Lead / Product Owner)  
**Date:** 2026-05-26T14:18:11.792+02:00  
**Status:** ✅ DECIDED

#### Problem

SharePoint Online bookmarklet loader was being blocked by Content Security Policy (CSP):

```
Loading the script 'https://raw.githubusercontent.com/...' violates the following 
Content Security Policy directive: "script-src ... 'unsafe-eval' ..."
```

**Root cause:** The original pattern used `document.createElement('script')` with an external `src=`, which is blocked by SharePoint's `script-src` CSP directive even though the domain is trusted.

#### Decision: Fetch + Eval Pattern

Replace the script-tag injection pattern with `fetch()` + `eval()`:

```javascript
fetch('https://raw.githubusercontent.com/.../sp-commander.js?v='+Date.now())
  .then(function(r){return r.text()})
  .then(function(t){eval(t)})
  .catch(function(e){console.error('Load failed:',e)})
```

#### Why This Works

1. **CSP Compatibility:** SharePoint Online's CSP allows `'unsafe-eval'`, which permits `eval()` and `new Function()` constructs.
2. **Cross-Origin Fetch:** `raw.githubusercontent.com` sends `Access-Control-Allow-Origin: *` headers, allowing fetch from any origin.
3. **Execution Context:** The fetched script executes in the same context as the page, so all globals (including the SharePoint REST API references) remain accessible.

#### Changes

- **BOOKMARKLET.md § 1:** Updated bookmarklet `javascript:` URI from script-tag to fetch+eval.
- **BOOKMARKLET.md § 2:** Updated DevTools console snippet to match.
- **Both locations:** Added brief explanation of why this pattern works.

#### No Tradeoffs

- No additional dependencies or external resources required.
- Execution semantics identical to previous approach (same-origin eval).
- Installation instructions unchanged — users paste the same type of code.
- Fallback notes (Site Assets hosting) remain valid if GitHub is also blocked.

#### Scope Impact

None — this is a tooling fix. The sp-commander.js payload remains identical.

---

### Vulcan Real SharePoint REST API Integration

**From:** Vulcan (Frontend Engineer)  
**Date:** 2026-05-26T14:37:39.230+02:00  
**Status:** ✅ DECIDED

#### Context

The bookmarklet is injected into a live SharePoint page and benefits from same-origin fetch — no OAuth, no CORS, no tokens needed. The session cookie handles auth automatically.

#### Decisions

##### 1. SPContext resolved once at module init

`window._spPageContextInfo` is read once into a frozen `SPContext` object at IIFE startup. All API calls derive their base URL from `SPContext.webAbsoluteUrl` so sub-sites work correctly without recomputing paths.

##### 2. Two-tier path model

| State.path | Fetch strategy |
|---|---|
| equals `webServerRelativeUrl` | `/_api/web/lists?$filter=BaseTemplate eq 101` — list all document libraries |
| any deeper path | `GetFolderByServerRelativeUrl()` — parallel Folders + Files requests |

This gives a natural "site root" landing page before diving into a library.

##### 3. Parallel Folders + Files fetch

Folder contents use `Promise.all()` over two endpoints so both requests fly simultaneously. Folders are merged first (NC convention), `Forms` system folder filtered out.

##### 4. In-memory cache (Map)

`Cache` is a plain `Map` keyed by server-relative path. `loadPath()` checks the cache before fetching. `refreshItems()` explicitly calls `Cache.delete(path)` before re-fetching to ensure a clean reload on `r`.

##### 5. Starting path detection

On `launch()`, the app reads URL query params:
1. `?id=` (modern SP library view)
2. `?RootFolder=` (classic view)
3. Fallback: `SPContext.webServerRelativeUrl`

This means the commander opens in the folder the user is already browsing — minimal friction.

##### 6. Graceful non-SP fallback

If `_spPageContextInfo` is absent, `SPContext` falls back to `window.location.origin` / `/`. The first API call will fail and the error handler shows `"Not a SharePoint page — API unavailable"` in the status bar. The overlay still renders so the user sees a clear message.

##### 7. Absolute URLs for copy-link

`Ctrl+L` now copies `window.location.origin + item.url` (absolute) rather than the bare server-relative path, making the URL directly pasteable.

---

## 2026-05-27 — Keyboard Navigation & Path Encoding

### Jupiter Keyboard Navigation Off-by-One Fix

**From:** Jupiter (Lead / Product Owner)  
**Date:** 2026-05-27T08:37:51.394+02:00  
**Status:** ✅ Resolved — fix applied in commit `3fc12ce`

#### Problem

Keyboard navigation could not select the **last file** in the file list.
End, ArrowDown, and PageDown all stopped at the next-to-last row.

#### Root Cause

`moveSelection()` in `sp-commander.js` called `getFilteredItems()` to
determine the valid `selectedIndex` range (lines 855–875).

However, the actual rendered list is built by `getDisplayItems()`, which
prepends a `PARENT_ITEM` (`..` entry, type `'parent'`) when not filtering
and a parent directory exists. This means:

- `getFilteredItems()` → N items (indices 0 to N−1)
- `getDisplayItems()` → N+1 items (indices 0 to N, where 0 = `..`)

`moveSelection` capped `selectedIndex` at `N−1`, so index `N` (the last
file) was never reachable via End, ArrowDown, or PageDown.

#### Fix

**File:** `sp-commander.js`, `moveSelection()`, line 855  
**Change:** One line — replace `getFilteredItems()` with `getDisplayItems()`

```js
// Before (bug)
const items = getFilteredItems();

// After (fix)
const items = getDisplayItems();
```

#### Rationale

`getFilteredItems()` returns only `State.items` (filtered by search term).
`getDisplayItems()` returns the full renderable list including the `..`
parent entry. Any code that computes selection bounds or row indices for
**rendered rows** must use `getDisplayItems()`, not `getFilteredItems()`.

The `clampSelection()` calls after loading new folder data continue to
use `getFilteredItems()` — that is correct, since they reset a potentially
stale index and do not need to account for the `..` row (which is not
stored in `State.items`).

#### Non-Negotiable Constraints Upheld

- No new external dependencies
- No write operations added
- Minimal surgical change — single line modified

---

### Mercury Folder Path Encoding & Sorting (v2)

**From:** Mercury (Integrations Engineer)  
**Date:** 2026-05-26  
**Status:** ✅ DECIDED

#### Decision

- In `listFolderContents()`, escape embedded single quotes first, then URL-encode each path segment before building `GetFolderByServerRelativeUrl('<path>')` so spaces are preserved as `%20` without encoding `/` separators.
- Do not rely on the browser to encode spaces after the URL is constructed, because SharePoint's OData parser can treat `%20` inside the quoted literal as literal text and return HTTP 400.
- Remove `$orderby=Name` from both folder and file REST queries when using `$expand`, and sort the returned folder/file arrays by name on the client instead for better tenant compatibility.

---

### Vulcan Norton Commander Visual Redesign

**From:** Vulcan (Frontend Engineer)  
**Date:** 2026-05-26T14:29:31.616+02:00  
**Status:** ✅ Done

#### What Was Done

Replaced the dark-theme modern UI in `sp-commander.js` with a faithful Norton Commander visual identity.

##### CSS Changes
- **Palette:** `#0000AA` panel blue, `#55FFFF` cyan borders/accents, `#000055` header/filter bars, `#000000` status+fnbar, `#FFFF55` meta highlight
- **Removed:** all CSS custom properties (`--spc-*`), gradients, `border-radius`, blurred `box-shadow`
- **Added:** `3px solid #55FFFF` overlay frame (simulates NC double-line box border), `4px 4px 0` flat offset shadow
- **Font:** `"Courier New", Consolas, monospace` — NC monospace feel
- **Row density:** `min-height: 1.4rem`, `padding: 0.1rem 0.5rem` — dense tabular rows like NC
- **Selection:** solid `#55FFFF` background + `#000000` text (NC highlight bar, not a left-border inset)
- **Folders:** `#55FFFF` cyan names; files: `#FFFFFF` white — mirrors NC color coding
- **Grid:** changed from 4 rows to 5 rows (`auto auto minmax(0,1fr) auto auto`) to accommodate fnbar

##### HTML Template Changes
- Added `#spc-fnbar` static element (after status bar) with NC-style function key labels
- Each key number uses `#55FFFF bg / #000000 text` badge; labels are white on black

##### JS Changes
- Added `fnBarId: 'spc-fnbar'` to `Config`
- `renderPathBar()` now wraps path in `[ ]` brackets (NC path display convention)

#### Rationale

The previous design used a modern dark-theme aesthetic (rounded corners, gradients, blue accent text). Norton Commander's identity is built on flat solid colours, tight monospace rows, and a distinctive blue/cyan palette — none of which were present. This redesign closes that gap while keeping all existing functionality intact.
