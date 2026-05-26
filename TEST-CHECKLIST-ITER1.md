# Iteration 1 Test Checklist

**Date:** 2026-05-26T13:53:12.170+02:00
**Scope:** Static mock-data validation only. No SharePoint API calls should occur during these tests.

## Test Notes
- Run every test from a SharePoint page with DevTools open.
- Use `sp_commander()` to launch the overlay.
- Allow pop-ups and clipboard access before testing `o`, `Enter` on files, and `Ctrl+L`.
- When a test says “save the overlay root”, inspect the visible overlay in Elements and store it as a DevTools temporary variable so DOM-removal checks can use `temp1.isConnected`.
- Preferred mock fixture for Iteration 1 root view: at least 2 folders, at least 2 files, one file named `onboarding-guide.docx`, and at least one nested folder level for Backspace / path-jump checks.

### TC-1: Launch overlay from DevTools
**Setup:** SharePoint page is loaded; overlay is not open.
**Steps:** 1. In DevTools Console, run `sp_commander()`. 2. Observe the page immediately after execution.
**Expected:** A single SharePoint Commander overlay appears without page reload; the file list renders from static mock data; no SharePoint page action is triggered underneath.
**Edge cases:** Run from a library page and a non-library page; launch while the page has an input or link focused.

### TC-2: Prevent duplicate overlay instances
**Setup:** Overlay is already open from TC-1.
**Steps:** 1. Run `sp_commander()` again in DevTools Console. 2. Compare the UI before and after the second call. 3. In Elements, confirm only one visible overlay root exists.
**Expected:** No second overlay is created; focus stays with the existing overlay; the UI does not stack, flicker, or duplicate key handling.
**Edge cases:** Call `sp_commander()` twice quickly; call again while help panel or filter mode is open.

### TC-3: Keyboard focus is captured on open
**Setup:** Overlay is closed.
**Steps:** 1. Focus a SharePoint control behind the future overlay. 2. Run `sp_commander()`. 3. Press `ArrowDown` once without clicking anywhere inside the overlay.
**Expected:** The overlay receives keyboard control immediately; the visible selection moves on the first keypress; underlying SharePoint controls do not react.
**Edge cases:** Open after clicking browser chrome, after focusing a page search box, and after scrolling the page.

### TC-4: Tab stays trapped inside the overlay
**Setup:** Overlay is open; save the overlay root in Elements if useful.
**Steps:** 1. Press `Tab` repeatedly until focus has cycled through all visible interactive elements in the overlay. 2. Keep pressing `Tab` 3 more times.
**Expected:** Focus never escapes to the SharePoint page, browser page content, or address bar; focus cycles only within overlay controls.
**Edge cases:** Repeat with help panel open and with filter input open.

### TC-5: Shift+Tab stays trapped inside the overlay
**Setup:** Overlay is open.
**Steps:** 1. Press `Shift+Tab` repeatedly from the currently focused overlay element. 2. Continue past the first focusable element.
**Expected:** Reverse tab order wraps within the overlay only; focus never lands on SharePoint controls behind the overlay.
**Edge cases:** Repeat from the filter input and from the last focusable control in the help panel.

### TC-6: Clicking outside does not lose keyboard control
**Setup:** Overlay is open.
**Steps:** 1. Click outside the visible panel but within the page area behind it. 2. Press `ArrowDown`. 3. Press `?`.
**Expected:** Keyboard control remains with the overlay or is immediately restored to it; selection still moves; help panel still opens; underlying SharePoint page does not respond.
**Edge cases:** Click page header, left navigation, and blank page space behind the overlay.

### TC-7: SharePoint focus-steal recovery works
**Setup:** Overlay is open.
**Steps:** 1. In DevTools Console, run `document.body.focus()` or focus a known SharePoint input using `document.querySelector('input,button,a')?.focus()`. 2. Without clicking the overlay, press `ArrowDown`. 3. Optionally press `Tab` once after the simulated steal.
**Expected:** The overlay regains active keyboard control fast enough that navigation still works; focus does not remain stranded on SharePoint elements.
**Edge cases:** Repeat while filter mode is active and while help panel is active; repeat after dismissing a SharePoint toast or dialog if available.

### TC-8: Arrow navigation moves visual selection
**Setup:** Overlay is open at a mock list with at least 3 items.
**Steps:** 1. Note the currently highlighted row. 2. Press `ArrowDown` twice. 3. Press `ArrowUp` once.
**Expected:** The visual highlight advances one row per down keypress and moves back one row per up keypress; only one row is selected at a time.
**Edge cases:** Hold the key briefly; repeat after opening and closing help.

### TC-9: Selection wraps at list boundaries
**Setup:** Overlay is open on a list with at least 2 items.
**Steps:** 1. Move selection to the last visible item. 2. Press `ArrowDown`. 3. Move selection to the first visible item. 4. Press `ArrowUp`.
**Expected:** Moving past the last item wraps to the first; moving above the first wraps to the last; no blank or missing selection state appears.
**Edge cases:** Repeat while a filter reduces the list to 2 items.

### TC-10: Enter on a folder updates the mock path
**Setup:** Overlay is open on a list containing at least one mock folder.
**Steps:** 1. Select a visible folder. 2. Press `Enter`. 3. Observe the path display and item list.
**Expected:** The path display updates to the selected folder path; the list changes to that folder’s mock contents; selection resets to a valid item in the new list.
**Edge cases:** Enter the first folder, last folder, and a folder with a long name.

### TC-11: Backspace navigates to the parent path
**Setup:** Overlay is open inside a nested mock folder reached from TC-10.
**Steps:** 1. Note the current path. 2. Press `Backspace` once. 3. If still nested, press `Backspace` again.
**Expected:** Each press moves up exactly one mock path level; the parent folder list is restored; no error occurs at root.
**Edge cases:** Press `Backspace` at root; press repeatedly in quick succession.

### TC-12: `g` jumps to a mock path
**Setup:** Overlay is open; know one valid mock path that is not the current path.
**Steps:** 1. Press `g`. 2. In the prompt, enter a valid mock path. 3. Confirm the prompt. 4. Repeat with an invalid or empty value.
**Expected:** A valid path updates the displayed path and list contents immediately; invalid or empty input does not crash the overlay and should leave the current view unchanged or show a clear inline error/status.
**Edge cases:** Enter root path, nested path, path with trailing slash, and mixed-case path text.

### TC-13: `r` refreshes the current mock view
**Setup:** Overlay is open on any mock folder.
**Steps:** 1. Note the current path and selected item. 2. Press `r`. 3. Observe the list and status area.
**Expected:** The current view refreshes without closing the overlay, without API/network traffic, and without corrupting selection state; the same mock folder remains visible after refresh.
**Edge cases:** Refresh at root, in a nested folder, with filter inactive, and immediately after `g` navigation.

### TC-14: `o` opens the selected file in a new tab
**Setup:** Overlay is open on a list containing at least one mock file; pop-ups are allowed.
**Steps:** 1. Select a file. 2. Press `o`. 3. Observe browser tab behavior and the opened URL.
**Expected:** A new tab opens for the selected mock file URL; the original overlay stays open in the original tab unless browser security blocks pop-ups, in which case the failure is visible and understandable.
**Edge cases:** Test on the first visible file and last visible file; press `o` on a folder and verify it does not incorrectly open a file URL.

### TC-15: Enter on a file opens the file in a new tab
**Setup:** Overlay is open on a mock file.
**Steps:** 1. Select a file. 2. Press `Enter`. 3. Observe browser tab behavior and URL.
**Expected:** `Enter` on a file opens the same destination that `o` opens; the action is not mistaken for folder navigation.
**Edge cases:** Compare result with `o`; repeat after filtering to a single file result.

### TC-16: `Ctrl+L` copies the selected file link
**Setup:** Overlay is open on a mock file; clipboard access is allowed.
**Steps:** 1. Select a file. 2. Press `Ctrl+L`. 3. In DevTools Console, run `await navigator.clipboard.readText()` if permission allows. 4. Paste into a safe text field if needed.
**Expected:** The clipboard contains the selected file URL; the overlay remains open; no browser location bar focus steals the shortcut.
**Edge cases:** Try on a folder selection, on a file with spaces in the name, and immediately after moving selection.

### TC-17: `/` opens filter mode and focuses the input
**Setup:** Overlay is open on a list with multiple items.
**Steps:** 1. Press `/`. 2. Type a single character. 3. Observe where the text appears.
**Expected:** Filter mode opens immediately; the filter input receives focus; typed characters go into the filter input, not to SharePoint or the browser.
**Edge cases:** Trigger from root, nested folder, and after closing help.

### TC-18: Filtering is real-time, case-insensitive, and partial-match based
**Setup:** Filter mode is open on a list containing `onboarding-guide.docx` or another file containing `doc`.
**Steps:** 1. Type `doc`. 2. Clear and type `DOC`. 3. Clear and type a partial substring from the middle of a visible item name.
**Expected:** Visible rows update as each character is typed; matching is case-insensitive; partial names match; `onboarding-guide.docx` remains visible for `doc`.
**Edge cases:** Filter to 0 results; filter to 1 result; filter text with spaces or punctuation.

### TC-19: ESC exits filter mode only and clears the filter
**Setup:** Filter mode is active with a non-empty filter value.
**Steps:** 1. Confirm the list is filtered. 2. Press `Escape` once. 3. Press `ArrowDown`.
**Expected:** The filter input closes; the full unfiltered list returns; keyboard control returns to normal overlay navigation; the overlay itself stays open.
**Edge cases:** Press `Escape` when the filter is already empty; repeat from a 0-result filter state.

### TC-20: Filter state clears when navigating to a new folder
**Setup:** Apply a filter in a folder that still leaves at least one visible folder result.
**Steps:** 1. While filtered, select a visible folder. 2. Press `Enter`. 3. Inspect the new folder view.
**Expected:** Navigation succeeds; the new folder opens; the previous folder’s filter text is cleared in the new location so the new folder list is shown in its normal default state.
**Edge cases:** Repeat after a `g` jump and after returning with `Backspace`.

### TC-21: `?` shows the help panel with all key bindings
**Setup:** Overlay is open.
**Steps:** 1. Press `?`. 2. Read the help panel contents.
**Expected:** The help panel becomes visible and lists every Iteration 1 binding: `↑`, `↓`, `Enter`, `Backspace`, `ESC`, `/`, `g`, `o`, `Ctrl+L`, `r`, and `?`.
**Edge cases:** Open help from root, nested folder, and immediately after using `r`.

### TC-22: Help panel closes cleanly and matches actual behavior
**Setup:** Help panel is open.
**Steps:** 1. Press `Escape`. 2. Re-open help with `?`. 3. Spot-check each listed key binding against actual behavior using quick manual checks.
**Expected:** `Escape` closes only the help panel and returns to overlay navigation; the listed bindings match what the overlay actually does; no undocumented or misleading binding appears.
**Edge cases:** Close help with `?` again if supported; verify help does not trap the overlay in an unusable state.

### TC-23: ESC in normal mode closes the overlay and removes it from the DOM
**Setup:** Overlay is open in normal mode; save the overlay root as `temp1` before closing.
**Steps:** 1. Press `Escape`. 2. Verify the overlay is no longer visible. 3. In DevTools Console, run `temp1.isConnected` if saved.
**Expected:** The overlay closes completely; its root node is detached from the DOM; keyboard input returns to the page only after the overlay has closed.
**Edge cases:** Close from root, nested folder, and immediately after refresh.

### TC-24: ESC does not leak through to SharePoint page behavior
**Setup:** Overlay is open; underlying SharePoint page has a visible control or navigation state that would react to `Escape` if it received it.
**Steps:** 1. Note the current SharePoint page state. 2. Press `Escape` in normal mode, filter mode, and help mode in separate runs. 3. Compare the underlying page state after each run.
**Expected:** `Escape` affects only SharePoint Commander according to the current mode; it does not trigger SharePoint navigation, dismiss unrelated page UI, or move page focus underneath.
**Edge cases:** Repeat while a SharePoint dialog, menu, or toast is present if available.

### TC-25: Empty list state behaves safely
**Setup:** Reach a mock path that intentionally contains 0 items, or use a filter that produces 0 visible results.
**Steps:** 1. Observe the empty state. 2. Press `ArrowUp`, `ArrowDown`, `Enter`, `Backspace`, `/`, and `Escape`.
**Expected:** The UI shows a stable empty-state message or empty list without crashing; selection does not become invalid; `Backspace`, `/`, and `Escape` still work sensibly.
**Edge cases:** Empty state caused by navigation vs empty state caused by filtering.

### TC-26: Single-item list behaves correctly
**Setup:** Reach a mock folder or filter state with exactly 1 visible item.
**Steps:** 1. Press `ArrowDown`. 2. Press `ArrowUp`. 3. Activate the item with `Enter` or `o` as appropriate.
**Expected:** Selection remains valid on the single item; wrap behavior does not create a blank selection; activation still works.
**Edge cases:** Repeat once with the single item as a folder and once as a file.

### TC-27: Very long file names remain readable and usable
**Setup:** Open a mock folder containing at least one long file or folder name.
**Steps:** 1. Select the long-name item. 2. Observe row rendering, path/status areas, and help/filter interactions. 3. Try opening or navigating the selected long-name item.
**Expected:** The long name does not break layout; text is either truncated cleanly or wrapped intentionally; the selected row remains identifiable and operable.
**Edge cases:** Long name with spaces, punctuation, and multi-segment path depth.

### TC-28: Rapid keypress spam does not corrupt UI state
**Setup:** Overlay is open on a non-empty list.
**Steps:** 1. Hold `ArrowDown` briefly. 2. Quickly press `ArrowUp`, `?`, `Escape`, `/`, and `Escape` in succession. 3. Repeat with `Backspace` and `r` where valid.
**Expected:** The overlay stays responsive; exactly one mode is active at a time; selection, path, and visible panels remain internally consistent; no duplicate overlays or stuck states appear.
**Edge cases:** Repeat immediately after re-opening the overlay; repeat while filtered.
