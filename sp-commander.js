(function() {
  'use strict';

  // Config
  const Config = {
    version: '0.1.0-scaffold',
    overlayId: 'spc-overlay',
    pathBarId: 'spc-pathbar',
    pathId: 'spc-current-path',
    filterBarId: 'spc-filterbar',
    filterId: 'spc-filter-input',
    listId: 'spc-list',
    statusId: 'spc-statusbar',
    helpId: 'spc-help',
    title: 'SharePoint Commander',
    rootPath: '/',
    zIndex: 2147483647,
  };

  const MOCK_ITEMS = [
    { name: 'Annual Reports', type: 'folder', url: '/Shared Documents/Annual Reports' },
    { name: 'Contracts', type: 'folder', url: '/Shared Documents/Contracts' },
    { name: 'HR Policies', type: 'folder', url: '/Shared Documents/HR Policies' },
    { name: 'budget-2024.xlsx', type: 'file', url: '/Shared Documents/budget-2024.xlsx' },
    { name: 'onboarding-guide.docx', type: 'file', url: '/Shared Documents/onboarding-guide.docx' },
    { name: 'org-chart.pptx', type: 'file', url: '/Shared Documents/org-chart.pptx' },
    { name: 'README.md', type: 'file', url: '/Shared Documents/README.md' },
  ];

  // State
  const State = {
    items: [],
    selectedIndex: 0,
    filter: '',
    filterActive: false,
    path: '/',
    helpVisible: false,
    statusMessage: '',
  };

  // API stub
  const Api = {
    listItems: function(path) {
      const nextPath = Api.normalizePath(path);
      const items = nextPath === Config.rootPath
        ? MOCK_ITEMS.slice()
        : MOCK_ITEMS.map(function(item) {
            return {
              name: item.name,
              type: item.type,
              url: Api.joinPath(nextPath, item.name),
            };
          });

      return Promise.resolve(items);
    },

    normalizePath: function(path) {
      if (!path || path === '/') {
        return Config.rootPath;
      }

      let normalized = String(path).trim();
      if (!normalized) {
        return Config.rootPath;
      }
      if (normalized.charAt(0) !== '/') {
        normalized = '/' + normalized;
      }
      normalized = normalized.replace(/\/{2,}/g, '/');
      normalized = normalized.replace(/\/$/, '');
      return normalized || Config.rootPath;
    },

    joinPath: function(base, name) {
      const normalizedBase = Api.normalizePath(base);
      if (normalizedBase === Config.rootPath) {
        return '/' + String(name).replace(/^\/+/, '');
      }
      return normalizedBase + '/' + String(name).replace(/^\/+/, '');
    },

    getParentPath: function(path) {
      const normalized = Api.normalizePath(path);
      if (normalized === Config.rootPath) {
        return Config.rootPath;
      }
      const parts = normalized.split('/').filter(Boolean);
      parts.pop();
      return parts.length ? '/' + parts.join('/') : Config.rootPath;
    },
  };

  // Render
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function(char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function getOverlay() {
    return document.getElementById(Config.overlayId);
  }

  function focusActiveTarget() {
    if (State.filterActive) {
      const inputEl = document.getElementById(Config.filterId);
      if (inputEl) {
        inputEl.focus();
        return;
      }
    }

    const overlayEl = getOverlay();
    if (overlayEl) {
      overlayEl.focus();
    }
  }

  function getFilteredItems() {
    if (!State.filter) {
      return State.items.slice();
    }

    const needle = State.filter.toLowerCase();
    return State.items.filter(function(item) {
      return item.name.toLowerCase().indexOf(needle) !== -1;
    });
  }

  function clampSelection(items) {
    if (!items.length) {
      State.selectedIndex = 0;
      return;
    }
    if (State.selectedIndex < 0) {
      State.selectedIndex = items.length - 1;
      return;
    }
    if (State.selectedIndex >= items.length) {
      State.selectedIndex = 0;
    }
  }

  function getSelectedItem() {
    const items = getFilteredItems();
    clampSelection(items);
    return items[State.selectedIndex] || null;
  }

  function renderList() {
    const listEl = document.getElementById(Config.listId);
    if (!listEl) {
      return;
    }

    const items = getFilteredItems();
    clampSelection(items);

    if (!items.length) {
      listEl.innerHTML = '<li class="spc-empty">No matching items</li>';
      renderStatusBar();
      return;
    }

    listEl.innerHTML = items.map(function(item, index) {
      const isSelected = index === State.selectedIndex;
      const kindLabel = item.type === 'folder' ? '[D]' : '[F]';
      const kindClass = item.type === 'folder' ? 'spc-kind--folder' : 'spc-kind--file';
      const meta = item.type === 'folder' ? 'Folder' : 'File';
      return '' +
        '<li class="spc-row" role="option" aria-selected="' + (isSelected ? 'true' : 'false') + '" data-index="' + index + '">' +
          '<span class="spc-kind ' + kindClass + '">' + kindLabel + '</span>' +
          '<span class="spc-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="spc-meta">' + meta + '</span>' +
        '</li>';
    }).join('');

    renderStatusBar();
  }

  function renderPathBar() {
    const pathEl = document.getElementById(Config.pathId);
    if (!pathEl) {
      return;
    }
    pathEl.textContent = State.path;
  }

  function renderStatusBar() {
    const statusEl = document.getElementById(Config.statusId);
    if (!statusEl) {
      return;
    }

    const total = State.items.length;
    const visible = getFilteredItems().length;
    const summary = State.filter
      ? visible + '/' + total + ' match' + (visible === 1 ? '' : 'es') + ' for "' + State.filter + '"'
      : total + ' item' + (total === 1 ? '' : 's');
    const main = State.statusMessage ? summary + ' · ' + State.statusMessage : summary;
    const meta = 'v' + Config.version + ' · ↑/↓ move · Enter open · ? help';

    statusEl.innerHTML = '' +
      '<span class="spc-status-main">' + escapeHtml(main) + '</span>' +
      '<span class="spc-status-meta">' + escapeHtml(meta) + '</span>';
  }

  function renderHelpPanel() {
    const helpEl = document.getElementById(Config.helpId);
    if (!helpEl) {
      return;
    }
    helpEl.hidden = !State.helpVisible;
  }

  function renderFilter() {
    const filterBarEl = document.getElementById(Config.filterBarId);
    const inputEl = document.getElementById(Config.filterId);
    if (!filterBarEl || !inputEl) {
      return;
    }

    filterBarEl.hidden = !State.filterActive;
    inputEl.value = State.filter;
  }

  function renderOverlay() {
    let overlayEl = getOverlay();

    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.id = Config.overlayId;
      overlayEl.tabIndex = -1;
      overlayEl.setAttribute('role', 'dialog');
      overlayEl.setAttribute('aria-modal', 'true');
      overlayEl.setAttribute('aria-labelledby', Config.pathId);
      overlayEl.setAttribute('aria-describedby', Config.statusId);
      overlayEl.innerHTML = `
        <style>
          #spc-overlay,
          #spc-overlay * {
            box-sizing: border-box;
          }

          #spc-overlay {
            --spc-z: ${Config.zIndex};
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
        </style>
        <div id="${Config.pathBarId}">
          <span class="spc-label">PATH</span>
          <span id="${Config.pathId}"></span>
        </div>
        <div id="${Config.filterBarId}" hidden>
          <span class="spc-label">FILTER</span>
          <input id="${Config.filterId}" type="text" inputmode="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type to filter current folder" aria-label="Filter current folder" />
        </div>
        <ul id="${Config.listId}" role="listbox" aria-label="SharePoint items"></ul>
        <div id="${Config.statusId}" role="status" aria-live="polite"></div>
        <section id="${Config.helpId}" aria-label="Keyboard help" hidden>
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
        </section>`;

      overlayEl.addEventListener('keydown', onOverlayKeydown);
      overlayEl.addEventListener('focusout', onOverlayFocusOut);

      const inputEl = overlayEl.querySelector('#' + Config.filterId);
      inputEl.addEventListener('input', onFilterInput);

      (document.body || document.documentElement).appendChild(overlayEl);
    }

    renderPathBar();
    renderFilter();
    renderHelpPanel();
    renderList();
    focusActiveTarget();
  }

  function renderAll() {
    renderPathBar();
    renderFilter();
    renderHelpPanel();
    renderList();
  }

  // Bootstrap
  function setStatus(message) {
    State.statusMessage = message || '';
    renderStatusBar();
  }

  function clearFilter() {
    State.filter = '';
    State.filterActive = false;
    const inputEl = document.getElementById(Config.filterId);
    if (inputEl) {
      inputEl.value = '';
    }
    const filterBarEl = document.getElementById(Config.filterBarId);
    if (filterBarEl) {
      filterBarEl.hidden = true;
    }
  }

  function activateFilter() {
    State.filterActive = true;
    renderFilter();
    const inputEl = document.getElementById(Config.filterId);
    if (inputEl) {
      inputEl.focus();
      inputEl.select();
    }
    setStatus('Filter mode');
  }

  function onFilterInput(event) {
    State.filter = event.target.value;
    State.selectedIndex = 0;
    renderList();
  }

  function moveSelection(step) {
    const items = getFilteredItems();
    if (!items.length) {
      State.selectedIndex = 0;
      renderList();
      return;
    }

    State.selectedIndex = (State.selectedIndex + step + items.length) % items.length;
    renderList();
  }

  function openItem(item) {
    if (!item) {
      setStatus('No item selected');
      return;
    }
    window.open(item.url, '_blank', 'noopener');
    setStatus('Opened ' + item.name);
  }

  function copySelectedUrl() {
    const item = getSelectedItem();
    if (!item) {
      setStatus('No item selected');
      return;
    }
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      setStatus('Clipboard API unavailable');
      return;
    }

    navigator.clipboard.writeText(item.url).then(function() {
      setStatus('Copied ' + item.url);
    }).catch(function() {
      setStatus('Clipboard write failed');
    });
  }

  function closeOverlay() {
    const overlayEl = getOverlay();
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
    }
  }

  function resetNavigationState() {
    clearFilter();
    State.selectedIndex = 0;
  }

  function loadPath(path, options) {
    const settings = options || {};
    const nextPath = Api.normalizePath(path);

    if (settings.clearFilter) {
      resetNavigationState();
    }

    State.path = nextPath;
    setStatus(settings.message || 'Loading mock items');
    renderAll();

    return Api.listItems(nextPath).then(function(items) {
      State.items = items;
      clampSelection(getFilteredItems());
      setStatus(settings.successMessage || 'Loaded ' + items.length + ' items');
      renderAll();
    }).catch(function() {
      setStatus('Failed to load items');
      renderAll();
    });
  }

  function navigateToSelected() {
    const item = getSelectedItem();
    if (!item) {
      setStatus('No item selected');
      return;
    }

    if (item.type === 'folder') {
      loadPath(item.url, {
        clearFilter: true,
        message: 'Opening ' + item.name,
        successMessage: 'Entered ' + item.name,
      });
      return;
    }

    openItem(item);
  }

  function goToParent() {
    const parentPath = Api.getParentPath(State.path);
    if (parentPath === State.path) {
      setStatus('Already at root');
      return;
    }

    loadPath(parentPath, {
      clearFilter: true,
      message: 'Going to parent',
      successMessage: 'Moved to ' + parentPath,
    });
  }

  function jumpToPath() {
    const nextPath = window.prompt('Jump to path', State.path);
    if (nextPath === null || nextPath.trim() === '') {
      return;
    }

    loadPath(nextPath, {
      clearFilter: true,
      message: 'Jumping to path',
      successMessage: 'Jumped to ' + Api.normalizePath(nextPath),
    });
  }

  function refreshItems() {
    loadPath(State.path, {
      clearFilter: false,
      message: 'Refreshing',
      successMessage: 'Refreshed ' + State.path,
    });
  }

  function toggleHelp() {
    State.helpVisible = !State.helpVisible;
    renderHelpPanel();
    setStatus(State.helpVisible ? 'Help open' : 'Help closed');
  }

  function onOverlayFocusOut(event) {
    const overlayEl = getOverlay();
    if (!overlayEl) {
      return;
    }
    if (event.relatedTarget && overlayEl.contains(event.relatedTarget)) {
      return;
    }
    window.setTimeout(function() {
      if (!getOverlay()) {
        return;
      }
      focusActiveTarget();
    }, 0);
  }

  function onOverlayKeydown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      if (State.filterActive) {
        const inputEl = document.getElementById(Config.filterId);
        if (inputEl) {
          inputEl.focus();
        }
      } else {
        const overlayEl = getOverlay();
        if (overlayEl) {
          overlayEl.focus();
        }
      }
      return;
    }

    if (State.filterActive && event.key !== 'Escape') {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        moveSelection(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveSelection(1);
        break;
      case 'Enter':
        event.preventDefault();
        navigateToSelected();
        break;
      case 'Backspace':
        event.preventDefault();
        goToParent();
        break;
      case 'Escape':
        event.preventDefault();
        if (State.filterActive) {
          clearFilter();
          setStatus('Filter cleared');
          renderAll();
          focusActiveTarget();
        } else if (State.helpVisible) {
          State.helpVisible = false;
          renderHelpPanel();
          setStatus('Help closed');
          focusActiveTarget();
        } else {
          closeOverlay();
        }
        break;
      case '/':
        if (!event.shiftKey) {
          event.preventDefault();
          activateFilter();
        }
        break;
      case 'g':
      case 'G':
        event.preventDefault();
        jumpToPath();
        break;
      case 'o':
      case 'O': {
        event.preventDefault();
        const item = getSelectedItem();
        if (item && item.type === 'folder') {
          navigateToSelected();
        } else {
          openItem(item);
        }
        break;
      }
      case 'r':
      case 'R':
        event.preventDefault();
        refreshItems();
        break;
      case '?':
        event.preventDefault();
        toggleHelp();
        break;
      case 'l':
      case 'L':
        if (event.ctrlKey) {
          event.preventDefault();
          copySelectedUrl();
        }
        break;
      default:
        break;
    }
  }

  function launch() {
    if (document.getElementById(Config.overlayId)) {
      return;
    }

    State.items = MOCK_ITEMS.slice();
    State.selectedIndex = 0;
    State.filter = '';
    State.filterActive = false;
    State.path = Config.rootPath;
    State.helpVisible = false;
    State.statusMessage = 'Ready';
    renderOverlay();
  }

  window.sp_commander = launch;
})();
