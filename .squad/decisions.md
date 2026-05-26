# Decisions Log

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
