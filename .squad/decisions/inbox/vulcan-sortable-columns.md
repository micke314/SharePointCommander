# Vulcan — Sortable Columns

- **Date:** 2026-05-27T09:05:44+02:00
- **Agent:** Vulcan
- **Issue:** #10

## Summary

Implemented sortable columns directly in `sp-commander.js` by storing sort UI state on `State` as `sortColumn` and `sortDirection`, defaulting to name ascending.

## Decisions

1. **Sort state location**
   - Stored sort state in the main UI state object so every render path can read one authoritative `{ column, direction }` equivalent.
   - Reset sort to `name/asc` when folder navigation changes `State.path`.

2. **Sort pipeline**
   - Applied client-side sorting inside `getFilteredItems()` so both normal and filtered renders reuse the same ordered list.
   - Added `sortItems(items)` plus column-specific value extraction for name, size, and modified date.

3. **Folder-first behavior**
   - Split incoming items into folders and files, sort each group independently, then concatenate folders before files.
   - For size sorting, folders use `itemCount` when available and `0` otherwise; files use byte length.

4. **Header interaction**
   - Re-rendered the column header from state and wired click delegation on the header container.
   - Clicking the active column toggles asc/desc; clicking a new sortable column starts at ascending.
   - Active sort column shows `▲` or `▼`.
