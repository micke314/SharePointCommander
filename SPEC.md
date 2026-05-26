# ✅ “SharePoint Commander (Read‑Only)”

## 🧭 Mission

You are a coordinated **AI agent Scrum team** tasked with designing and implementing a **keyboard-first file navigation interface** for SharePoint Online.

The solution must:

* Run **inside the browser on a SharePoint page**
* Provide a **fast, terminal-like navigation experience**
* Be **read-only**
* Require **no Azure AD / Entra app registration**
* Use the user’s **existing authenticated session (cookies)**

The goal is to create a **high-performance alternative UI** inspired by:

* Norton Commander
* Altap Salamander
* Terminal file navigation tools

***

# 🧠 Key Concept (Critical Understanding)

This solution is **not a traditional web app**.

It is:

* A **browser-injected client**
* Running **in the context of SharePoint**
* Using **same-origin REST API calls**

Architecture:

```
Browser (SharePoint page)
   ↓
Injected JS overlay
   ↓
fetch("/_api/web/...")
   ↓
SharePoint REST API
   ↓
Authenticated via existing session cookies
```

There is:

* ❌ No OAuth
* ❌ No backend
* ❌ No external API calls

***

# ⚠️ Non-Negotiable Constraints

## Authentication & Security

* DO NOT implement authentication
* DO NOT use tokens, secrets, API keys
* DO NOT call external services
* All requests must be **same-origin** (`/_api/...`)
* Respect user permissions strictly

## Data Handling

* Do not exfiltrate data
* Do not log file contents by default
* No persistent storage except safe UI preferences (e.g., localStorage)

## Scope

* ✅ Read-only operations ONLY:
  * List folders/files
  * Navigate
  * Open files
  * Copy links

* ❌ No write operations:
  * No upload
  * No delete
  * No rename
  * No move/copy

***

# 🎯 Product Requirements

## 1. Launch Mechanisms

Must support:

1. DevTools (paste into console)
2. Bookmarklet (primary UX)
3. Optional extension (future)

### Startup Context Capture (Required)

On launch (especially via bookmarklet), the app must capture SharePoint page context before first render and resolve an initial navigation path.

Required captured context (best effort):

* Site absolute URL
* Web server-relative URL
* Current page URL
* Initial folder path (if inferable)
* Library name or ID (if inferable)

Fallback behavior:

* If the initial folder cannot be resolved, start at configured default root (for example: Shared Documents)
* Show a non-blocking status message indicating fallback occurred

Privacy constraints for captured context:

* Keep in memory only for runtime session
* Do not transmit externally
* Do not persist or log by default

Acceptance criteria:

* Launching from a library folder page opens that folder directly
* Launching from a non-library page opens default root without crashing
* User can override start location immediately via `g` (jump to path)

***

## 2. UI Requirements

### Overlay

* Full-screen-ish overlay (inset margins)
* Dark theme (terminal-like)
* Must trap keyboard focus
* No dependency on SharePoint DOM

### Layout

Single panel (MVP):

```
[ PATH: Shared Documents/... ]

> [D] Folder1
  [D] Folder2
  [F] file1.txt
  [F] file2.docx

[ Status bar ]
```

***

## 3. Keyboard Model (Critical UX)

| Key       | Action                  |
| --------- | ----------------------- |
| ↑ / ↓     | Move selection          |
| Enter     | Open folder / open file |
| Backspace | Go to parent            |
| ESC       | Close overlay           |
| `/`       | Filter/search           |
| `g`       | Jump to path            |
| `o`       | Open file in new tab    |
| `Ctrl+L`  | Copy link               |
| `r`       | Refresh                 |
| `?`       | Show help               |

Must feel:

* Instant
* Predictable
* Zero mouse interaction

***

## 4. API Usage

Use SharePoint REST endpoints:

* Folder listing:

```
/_api/web/GetFolderByServerRelativeUrl('<path>')
```

Guidelines:

* Use `?$select=` to limit payload
* Use `Accept: application/json;odata=nometadata`
* Handle pagination if needed
* Never fetch unnecessary metadata

***

## 5. Performance Requirements (Very Important)

### MUST implement:

* In-memory caching (`Map<path, data>`)
* Instant navigation for cached paths
* Background refresh (optional)

### SHOULD implement:

* Prefetch next likely folders
* Avoid unnecessary DOM re-renders

Target:

* Cached navigation: \~instant
* Fresh fetch: fast but non-blocking UI

***

## 6. Search / Filtering

* Triggered by `/`
* Must be **client-side**
* Instant filtering on current dataset
* Escape exits filter

***

## 7. Error Handling

Overlay must never crash.

Show clear errors:

* HTTP errors
* Permission errors (403)
* Invalid paths

Example:

```
Error: 403 Forbidden (access denied)
```

***

## 8. Outputs / Deliverables

### Code

* `sp-commander.js` (main file)
* Bookmarklet snippet
* DevTools-ready snippet (IIFE)

### Documentation

* README:
  * How to run
  * Keybindings
  * Known limitations

### Demo script

* Step-by-step demo
* Show performance advantage

### Backlog

* List of improvements
* Prioritized for future work

***

# 🤖 Team Structure (Agentic Approach)

Use **specialized AI agents** (NOT one general agent).

## Roles

### Product Owner

* Defines backlog
* Writes acceptance criteria

### UI/UX Agent

* Keyboard model
* Layout
* Overlay usability

### Frontend Engineer

* Rendering
* Event handling
* State management

### API Engineer

* REST calls
* Data mapping
* Error handling

### Performance Engineer

* Caching strategy
* Prefetch logic
* Optimization

### QA / Test Agent

* Validates every change
* Defines test checklist

### Security Agent

* Ensures no data leakage
* Verifies compliance with constraints

### Documentation Agent

* README
* Demo instructions

***

## Working Model

* Work in short iterations
* Each iteration produces:
  * Working code
  * Demoable feature
* QA validates every change before acceptance
* Maintain backlog continuously

***

# 🧪 Initial User Stories

### US1: Launch

User can open overlay via DevTools or bookmarklet  
→ Overlay appears and captures keyboard

### US2: Navigate

User can move through directories without reload  
→ Enter opens, Backspace goes up

### US3: Open file

User can open selected file instantly  
→ Opens in new tab

### US4: Copy link

User copies link with shortcut  
→ Clipboard updated

### US5: Filter

User filters files within current directory  
→ Instant results

### US6: Performance

User revisits folders instantly  
→ Cache used

***

# 🚀 Stretch Goals (If Time Allows)

* Two-panel layout
* Virtual scrolling for huge directories
* Favorites / bookmarks
* Recent history
* File preview (text only)

***

# 🧩 Definition of Done

The solution is done when:

* It runs via bookmarklet or DevTools
* Navigation is keyboard-only
* No page reloads occur
* Performance feels “instant”
* No security violations
* Demo can be executed smoothly

***

# 💬 Final Instruction to Team

Focus on:

* Simplicity
* Speed
* Keyboard-first UX

Avoid:

* Overengineering
* External dependencies
* Any authentication logic

***

