(function() {
  'use strict';

  // Config
  const Config = {
    version: '0.1.0-scaffold',
    overlayId: 'spc-overlay',
    listId: 'spc-list',
    pathId: 'spc-path',
    statusId: 'spc-status',
    filterId: 'spc-filter',
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
      listEl.innerHTML = '<div class="spc-row spc-empty">  No matching items</div>';
      renderStatusBar();
      return;
    }

    listEl.innerHTML = items.map(function(item, index) {
      const isSelected = index === State.selectedIndex;
      const marker = isSelected ? '&gt;' : '&nbsp;';
      const kind = item.type === 'folder' ? '[D]' : '[F]';
      return '' +
        '<div class="spc-row' + (isSelected ? ' is-selected' : '') + '" data-index="' + index + '">' +
          '<span class="spc-marker">' + marker + '</span>' +
          '<span class="spc-kind">' + kind + '</span>' +
          '<span class="spc-name">' + escapeHtml(item.name) + '</span>' +
        '</div>';
    }).join('');

    renderStatusBar();
  }

  function renderPathBar() {
    const pathEl = document.getElementById(Config.pathId);
    if (!pathEl) {
      return;
    }
    pathEl.textContent = 'PATH: ' + State.path;
  }

  function renderStatusBar() {
    const statusEl = document.getElementById(Config.statusId);
    if (!statusEl) {
      return;
    }

    const total = State.items.length;
    const visible = getFilteredItems().length;
    const filterPart = State.filter ? ' · ' + visible + '/' + total + ' match' + (visible === 1 ? '' : 'es') + ' for "' + State.filter + '"' : ' · ' + total + ' item' + (total === 1 ? '' : 's');
    const messagePart = State.statusMessage ? ' · ' + State.statusMessage : '';

    statusEl.textContent = 'v' + Config.version + filterPart + messagePart;
  }

  function renderHelpPanel() {
    const helpEl = document.getElementById(Config.helpId);
    if (!helpEl) {
      return;
    }
    helpEl.hidden = !State.helpVisible;
  }

  function renderFilter() {
    const inputEl = document.getElementById(Config.filterId);
    if (!inputEl) {
      return;
    }

    inputEl.value = State.filter;
    inputEl.hidden = !State.filterActive;
  }

  function renderOverlay() {
    let overlayEl = getOverlay();

    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.id = Config.overlayId;
      overlayEl.tabIndex = -1;
      overlayEl.innerHTML = '' +
        '<style>' +
          '#' + Config.overlayId + ' {' +
            '--spc-bg: #1a1a1a;' +
            '--spc-fg: #d4d4d4;' +
            '--spc-accent: #569cd6;' +
            '--spc-selected: #264f78;' +
            'position: fixed;' +
            'inset: 24px;' +
            'z-index: ' + Config.zIndex + ';' +
            'display: flex;' +
            'flex-direction: column;' +
            'gap: 12px;' +
            'padding: 16px;' +
            'background: var(--spc-bg);' +
            'color: var(--spc-fg);' +
            'border: 1px solid var(--spc-accent);' +
            'border-radius: 8px;' +
            'box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);' +
            'font: 14px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;' +
          '}' +
          '#' + Config.overlayId + ' * { box-sizing: border-box; }' +
          '#' + Config.overlayId + ':focus { outline: 2px solid var(--spc-accent); outline-offset: 2px; }' +
          '#' + Config.overlayId + ' .spc-header {' +
            'display: flex;' +
            'justify-content: space-between;' +
            'align-items: center;' +
            'gap: 12px;' +
            'padding-bottom: 8px;' +
            'border-bottom: 1px solid rgba(255,255,255,0.12);' +
          '}' +
          '#' + Config.overlayId + ' .spc-filter {' +
            'width: 100%;' +
            'padding: 8px 10px;' +
            'background: #111;' +
            'color: var(--spc-fg);' +
            'border: 1px solid rgba(255,255,255,0.18);' +
            'border-radius: 4px;' +
          '}' +
          '#' + Config.overlayId + ' .spc-list {' +
            'flex: 1;' +
            'overflow: auto;' +
            'padding: 8px 0;' +
            'border: 1px solid rgba(255,255,255,0.08);' +
            'border-radius: 4px;' +
            'background: rgba(255,255,255,0.02);' +
          '}' +
          '#' + Config.overlayId + ' .spc-row {' +
            'display: grid;' +
            'grid-template-columns: 18px 40px minmax(0, 1fr);' +
            'gap: 8px;' +
            'padding: 4px 10px;' +
            'white-space: nowrap;' +
          '}' +
          '#' + Config.overlayId + ' .spc-row.is-selected {' +
            'background: var(--spc-selected);' +
            'color: #fff;' +
          '}' +
          '#' + Config.overlayId + ' .spc-row.spc-empty {' +
            'display: block;' +
            'padding: 8px 10px;' +
            'opacity: 0.75;' +
          '}' +
          '#' + Config.overlayId + ' .spc-help {' +
            'padding: 10px;' +
            'border: 1px solid rgba(255,255,255,0.12);' +
            'border-radius: 4px;' +
            'background: rgba(255,255,255,0.03);' +
          '}' +
          '#' + Config.overlayId + ' .spc-help-grid {' +
            'display: grid;' +
            'grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));' +
            'gap: 6px 16px;' +
          '}' +
          '#' + Config.overlayId + ' .spc-status {' +
            'padding-top: 8px;' +
            'border-top: 1px solid rgba(255,255,255,0.12);' +
            'color: var(--spc-accent);' +
          '}' +
        '</style>' +
        '<div class="spc-header">' +
          '<div><strong>' + Config.title + '</strong></div>' +
          '<div id="' + Config.pathId + '"></div>' +
        '</div>' +
        '<input id="' + Config.filterId + '" class="spc-filter" type="text" spellcheck="false" autocomplete="off" placeholder="Filter items..." hidden />' +
        '<div id="' + Config.listId + '" class="spc-list"></div>' +
        '<div id="' + Config.helpId + '" class="spc-help" hidden>' +
          '<div class="spc-help-grid">' +
            '<div>↑ / ↓ — Move selection</div>' +
            '<div>Enter — Open folder / file</div>' +
            '<div>Backspace — Go to parent</div>' +
            '<div>ESC — Close filter / overlay</div>' +
            '<div>/ — Filter current list</div>' +
            '<div>g — Jump to path</div>' +
            '<div>o — Open selected item</div>' +
            '<div>Ctrl+L — Copy selected URL</div>' +
            '<div>r — Refresh mock data</div>' +
            '<div>? — Toggle help</div>' +
          '</div>' +
        '</div>' +
        '<div id="' + Config.statusId + '" class="spc-status"></div>';

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
    overlayEl.focus();
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
      inputEl.hidden = true;
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
    if (nextPath === null) {
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
    if (!overlayEl || State.filterActive) {
      return;
    }
    if (event.relatedTarget && overlayEl.contains(event.relatedTarget)) {
      return;
    }
    window.setTimeout(function() {
      const activeOverlay = getOverlay();
      if (activeOverlay && !State.filterActive) {
        activeOverlay.focus();
      }
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
          const overlayEl = getOverlay();
          if (overlayEl) {
            overlayEl.focus();
          }
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
      case 'O':
        event.preventDefault();
        openItem(getSelectedItem());
        break;
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
