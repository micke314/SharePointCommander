# Vulcan — Ctrl+L URL format fixes

**From:** Vulcan (Frontend Engineer)  
**Date:** 2026-05-27T09:41:35.048+02:00  
**Status:** ✅ DONE

## Decision

For `Ctrl+L`, copied links now mirror browser-opening behavior for files:
- **Files** copy as `window.location.origin + item.url + '?web=1'`
- **Folders** copy as `window.location.origin + item.url`
- **Parent** entries copy as the absolute parent folder URL with no `?web=1`

## Why

`?web=1` is needed for file links so SharePoint opens Office documents in the browser instead of downloading them. Folder and parent links do not need that suffix, and the status bar now uses the fixed message `Link copied` to avoid overlay resize from long URLs.
