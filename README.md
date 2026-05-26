# SharePoint Commander

A keyboard-first file navigator for SharePoint Online, inspired by classic dual-panel file managers like Norton Commander. It runs entirely in the browser as a bookmarklet — no install, no app registration, no backend.

![Norton Commander style overlay with blue panels, cyan borders, and file listing](https://raw.githubusercontent.com/micke314/SharePointCommander/dev/screenshot.png)

---

## How it works

SharePoint Commander injects a lightweight JavaScript overlay into any SharePoint page. It uses the browser's existing authenticated session to call the SharePoint REST API (`/_api/...`) directly — no OAuth, no tokens, no external services.

```
Browser (SharePoint page)
   └─ Injected JS overlay
         └─ fetch("/_api/web/...")
               └─ SharePoint REST API (authenticated via session cookie)
```

---

## Setup

### Option 1 — Bookmarklet (recommended)

1. Copy the snippet below.
2. Create a new browser bookmark.
3. Paste the snippet as the bookmark URL/location.
4. Name it **SharePoint Commander**.
5. Navigate to any SharePoint page and click the bookmark.

```text
javascript:(function(){fetch('https://raw.githubusercontent.com/micke314/SharePointCommander/dev/sp-commander.js?v='+Date.now(),{cache:'no-store'}).then(function(r){return r.text()}).then(function(t){eval(t);sp_commander()}).catch(function(e){console.error('SP Commander load failed:',e)})})();
```

**Chrome / Edge:** Right-click the bookmarks bar → *Add page* → paste into the URL field.  
**Firefox:** Right-click the bookmarks toolbar → *New Bookmark* → paste into the Location field.

> **Why fetch+eval?** SharePoint's Content Security Policy blocks external `<script>` tags but permits `unsafe-eval`. This pattern fetches the script as plain text and evaluates it within the page context — the only approach that works without hosting on a SharePoint-approved CDN.

---

### Option 2 — DevTools console

Open the browser DevTools console on any SharePoint page and paste:

```js
fetch('https://raw.githubusercontent.com/micke314/SharePointCommander/dev/sp-commander.js?v='+Date.now(),{cache:'no-store'})
  .then(r => r.text())
  .then(t => { eval(t); sp_commander(); })
  .catch(e => console.error('Load failed:', e));
```

---

### Option 3 — Self-hosted (if GitHub is blocked)

If `raw.githubusercontent.com` is blocked by your tenant's CSP, upload `sp-commander.js` to a SharePoint **Site Assets** library and update the URL in the bookmarklet to point there.

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move selection |
| `Enter` | Open folder / open file in new tab |
| `Backspace` | Go to parent folder |
| `ESC` | Close overlay |
| `/` | Filter files in current folder |
| `g` | Jump to any path |
| `o` | Open selected file in new tab |
| `Ctrl+L` | Copy link to selected item |
| `r` | Refresh current folder |
| `?` | Toggle keyboard help |
| `F1` / `1` | Toggle keyboard help |
| `F5` / `5` | Refresh |
| `F7` / `7` | Toggle filter |
| `F10` / `10` | Close overlay |

---

## Mouse support

- **Single click** — select an item
- **Double click** — open folder or file

---

## Navigation

- Starts in the current SharePoint folder (detected from the page URL).
- The `..` entry at the top of every folder navigates to the parent.
- At the top level, all document libraries in the current site are listed.
- Backspace or clicking `..` always goes up one level.

---

## Limitations

- **Read-only.** No upload, delete, rename, or move.
- **Same site only.** Cannot navigate across site collections.
- **No search.** Filter is client-side within the current folder only.
- **No preview.** Files open in a new tab via SharePoint's viewer.

---

## Development

The entire application is a single self-contained IIFE in `sp-commander.js`. No build step, no dependencies.

```bash
git clone https://github.com/micke314/SharePointCommander.git
# edit sp-commander.js
# test by loading via DevTools console on a SharePoint page
```

Active development happens on the `dev` branch. The bookmarklet above points to `dev`. Switch the URL from `/dev/` to `/main/` for a stable release target.

---

## Version

Current version: `0.2.8`
