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
    fnBarId: 'spc-fnbar',
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
      const kindClass = item.type === 'folder' ? 'spc-kind--folder' : 'spc-kind--file';
      return '' +
        '<li class="spc-row ' + kindClass + '" role="option" aria-selected="' + (isSelected ? 'true' : 'false') + '" data-index="' + index + '">' +
          '<span class="spc-name">' + escapeHtml(item.name) + '</span>' +
        '</li>';
    }).join('');

    renderStatusBar();
  }

  function renderPathBar() {
    const pathEl = document.getElementById(Config.pathId);
    if (!pathEl) {
      return;
    }
    pathEl.textContent = '[' + (State.path || '/') + ']';
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
            position: fixed;
            inset: var(--spc-overlay-inset);
            z-index: var(--spc-z);
            display: grid;
            grid-template-rows: auto auto minmax(0, 1fr) auto auto;
            gap: 0;
            padding: 0;
            background: #0000AA;
            border: 3px solid #55FFFF;
            border-radius: 0;
            box-shadow: 4px 4px 0 #000033;
            color: #FFFFFF;
            font-family: "Courier New", Consolas, monospace;
            font-size: 1rem;
            line-height: 1.4;
            outline: none;
            overflow: hidden;
          }

          #spc-overlay[hidden],
          #spc-overlay [hidden] {
            display: none !important;
          }

          #spc-pathbar {
            position: sticky;
            top: 0;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 0.75em;
            min-height: 1.8rem;
            padding: 0.2rem 0.75rem;
            background: #000055;
            border-bottom: 1px solid #55FFFF;
            border-radius: 0;
            color: #FFFFFF;
            white-space: nowrap;
          }

          #spc-pathbar .spc-label {
            flex: 0 0 auto;
            color: #55FFFF;
            letter-spacing: 0.08em;
          }

          #spc-current-path {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #FFFFFF;
          }

          #spc-filterbar {
            position: sticky;
            top: 1.8rem;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 0.75em;
            min-height: 1.8rem;
            padding: 0.15rem 0.75rem;
            background: #000055;
            border-bottom: 1px solid #55FFFF;
            border-radius: 0;
          }

          #spc-filterbar .spc-label {
            flex: 0 0 auto;
            color: #55FFFF;
          }

          #spc-filter-input {
            flex: 1 1 auto;
            min-width: 0;
            margin: 0;
            padding: 0;
            border: 0;
            background: transparent;
            color: #FFFFFF;
            font: inherit;
            outline: none;
          }

          #spc-filter-input::placeholder {
            color: #55FFFF;
            opacity: 0.6;
          }

          #spc-list {
            position: relative;
            min-height: 0;
            margin: 0;
            padding: 0;
            list-style: none;
            overflow: auto;
            border: 0;
            border-radius: 0;
            background: #0000AA;
          }

          #spc-list:focus {
            outline: none;
          }

          #spc-list .spc-empty,
          #spc-list .spc-error,
          #spc-list .spc-loading {
            padding: 0.5rem 0.75rem;
            color: #55FFFF;
          }

          #spc-list .spc-error {
            color: #FF5555;
          }

          .spc-row {
            display: grid;
            grid-template-columns: 1.2em minmax(0, 1fr);
            align-items: center;
            gap: 0.5em;
            min-height: 1.4rem;
            padding: 0.1rem 0.5rem;
            border-bottom: 1px solid rgba(85, 255, 255, 0.1);
            color: #FFFFFF;
          }

          .spc-row:last-child {
            border-bottom: 0;
          }

          .spc-row::before {
            content: ' ';
            color: #55FFFF;
          }

          .spc-row[aria-selected='true'] {
            background: #55FFFF;
            color: #000000;
          }

          .spc-row[aria-selected='true']::before {
            content: '>';
            color: #000000;
          }

          .spc-row[aria-selected='true'] .spc-name {
            color: #000000;
          }

          .spc-row[aria-selected='true'] .spc-meta {
            color: #000055;
          }

          .spc-kind--folder .spc-name {
            color: #55FFFF;
          }

          .spc-kind--file .spc-name {
            color: #FFFFFF;
          }

          .spc-name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .spc-meta {
            justify-self: end;
            color: #55FFFF;
          }

          #spc-statusbar {
            position: sticky;
            bottom: 0;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1em;
            min-height: 1.6rem;
            padding: 0.15rem 0.75rem;
            background: #000000;
            border-top: 1px solid #55FFFF;
            border-radius: 0;
            color: #55FFFF;
          }

          #spc-statusbar .spc-status-main {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          #spc-statusbar .spc-status-meta {
            flex: 0 0 auto;
            color: #FFFF55;
          }

          #spc-fnbar {
            display: flex;
            gap: 0;
            background: #000000;
            color: #FFFFFF;
            font-size: 0.85em;
            padding: 0.1rem 0;
            border-top: 1px solid #333333;
          }

          #spc-fnbar span {
            flex: 1;
            text-align: center;
            padding: 0 0.25rem;
          }

          #spc-fnbar b {
            background: #55FFFF;
            color: #000000;
            padding: 0 0.2rem;
            font-weight: normal;
          }

          #spc-help {
            position: absolute;
            inset: 50% auto auto 50%;
            transform: translate(-50%, -50%);
            z-index: 3;
            width: min(44rem, calc(100% - 4rem));
            max-height: calc(100% - 6rem);
            overflow: auto;
            padding: 1rem;
            background: #0000AA;
            border: 2px solid #55FFFF;
            border-radius: 0;
            color: #FFFFFF;
          }

          #spc-help::before {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -1;
            background: rgba(0, 0, 68, 0.85);
          }

          #spc-help h2 {
            margin: 0 0 0.75rem;
            font-size: 1rem;
            color: #55FFFF;
          }

          #spc-help p {
            margin: 0 0 0.75rem;
            color: #AAAAFF;
          }

          #spc-help dl {
            display: grid;
            grid-template-columns: max-content 1fr;
            gap: 0.5rem 1rem;
            margin: 0;
          }

          #spc-help dt {
            color: #FFFF55;
            font-weight: 700;
          }

          #spc-help dd {
            margin: 0;
            color: #FFFFFF;
          }

          @media (max-width: 48rem) {
            #spc-overlay {
              --spc-overlay-inset: 0.5rem;
            }

            .spc-row {
              grid-template-columns: 1.2em minmax(0, 1fr);
              gap: 0.4em;
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
        <div id="${Config.fnBarId}" aria-hidden="true">
          <span><b>1</b>Help</span>
          <span><b>3</b>View</span>
          <span><b>5</b>Refresh</span>
          <span><b>7</b>Filter</span>
          <span><b>10</b>Quit</span>
        </div>
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
