(function() {
  'use strict';

  // Config
  const Config = {
    version: '0.3.6',
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

  // SharePoint context — available on any SP page via _spPageContextInfo
  const SPContext = (function() {
    const ctx = window._spPageContextInfo || {};
    return {
      webAbsoluteUrl: (ctx.webAbsoluteUrl || ctx.siteAbsoluteUrl || window.location.origin).replace(/\/$/, ''),
      webServerRelativeUrl: (ctx.webServerRelativeUrl || ctx.serverRelativeUrl || '/').replace(/\/$/, '') || '/',
    };
  })();

  const Cache = new Map();

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

  // API — real SharePoint REST calls, same-origin
  const Api = {
    siteUrl: SPContext.webAbsoluteUrl,
    webRoot: SPContext.webServerRelativeUrl,

    listItems: function(path) {
      const normalized = Api.normalizePath(path);
      if (normalized === Api.webRoot) {
        return Api.listLibraries();
      }
      return Api.listFolderContents(normalized);
    },

    listLibraries: function() {
      const url = Api.siteUrl + '/_api/web/lists' +
        '?$filter=BaseTemplate eq 101 and Hidden eq false' +
        '&$select=Title,RootFolder/ServerRelativeUrl' +
        '&$expand=RootFolder' +
        '&$orderby=Title';
      return Api._fetch(url).then(function(data) {
        return (data.value || []).map(function(lib) {
          return {
            name: lib.Title,
            type: 'folder',
            url: lib.RootFolder.ServerRelativeUrl,
            size: null,
            modified: null,
          };
        });
      });
    },

    listFolderContents: function(path) {
      const encodedPath = encodeURIComponent(path.replace(/'/g, "''"));
      const base = Api.siteUrl + '/_api/web/GetFolderByServerRelativeUrl(\'' + encodedPath + '\')';

      const foldersUrl = base + '/Folders?$select=Name,ServerRelativeUrl,ItemCount,TimeLastModified&$orderby=Name';
      const filesUrl   = base + '/Files?$select=Name,ServerRelativeUrl,Length,TimeLastModified,ModifiedBy/Title&$expand=ModifiedBy&$orderby=Name';

      return Promise.all([Api._fetch(foldersUrl), Api._fetch(filesUrl)]).then(function(results) {
        const folders = (results[0].value || [])
          .filter(function(f) { return f.Name !== 'Forms'; })
          .map(function(f) {
            return {
              name: f.Name,
              type: 'folder',
              url: f.ServerRelativeUrl,
              size: null,
              itemCount: f.ItemCount != null ? Number(f.ItemCount) : null,
              modified: f.TimeLastModified || null,
              modifiedBy: null,
            };
          });

        const files = (results[1].value || []).map(function(f) {
          return {
            name: f.Name,
            type: 'file',
            url: f.ServerRelativeUrl,
            size: f.Length != null ? Number(f.Length) : null,
            itemCount: null,
            modified: f.TimeLastModified || null,
            modifiedBy: (f.ModifiedBy && f.ModifiedBy.Title) ? f.ModifiedBy.Title : null,
          };
        });

        return folders.concat(files);
      });
    },

    _fetch: function(url) {
      return fetch(url, {
        headers: { 'Accept': 'application/json;odata=nometadata' },
        credentials: 'same-origin',
      }).then(function(resp) {
        if (!resp.ok) {
          throw new Error('HTTP ' + resp.status + ' — ' + url);
        }
        return resp.json();
      });
    },

    normalizePath: function(path) {
      if (!path || path === '/') {
        return Api.webRoot;
      }

      let normalized = String(path).trim();
      if (!normalized) {
        return Api.webRoot;
      }
      if (normalized.charAt(0) !== '/') {
        normalized = '/' + normalized;
      }
      normalized = normalized.replace(/\/{2,}/g, '/');
      normalized = normalized.replace(/\/$/, '');
      return normalized || Api.webRoot;
    },

    joinPath: function(base, name) {
      const normalizedBase = Api.normalizePath(base);
      if (normalizedBase === Api.webRoot) {
        return Api.webRoot + '/' + String(name).replace(/^\/+/, '');
      }
      return normalizedBase + '/' + String(name).replace(/^\/+/, '');
    },

    getParentPath: function(path) {
      const normalized = Api.normalizePath(path);
      if (normalized === Api.webRoot) {
        return Api.webRoot;
      }
      const lastSlash = normalized.lastIndexOf('/');
      if (lastSlash <= 0) {
        return Api.webRoot;
      }
      const parent = normalized.substring(0, lastSlash);
      if (!parent || parent === Api.webRoot || parent.length < Api.webRoot.length) {
        return Api.webRoot;
      }
      return parent;
    },
  };

  // Render
  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      var d = new Date(isoStr);
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    } catch (e) {
      return '';
    }
  }

  function formatModifiedBy(name) {
    if (!name) return '';
    return name.length > 22 ? name.slice(0, 21) + '…' : name;
  }

  function formatSize(bytes) {
    if (bytes == null) return '';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2).replace(/\.?0+$/, '') + 'G';
    if (bytes >= 1048576)    return (bytes / 1048576).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (bytes >= 1024)       return (bytes / 1024).toFixed(2).replace(/\.?0+$/, '') + 'K';
    return bytes + 'B';
  }

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

  var PARENT_ITEM = { type: 'parent', name: '..', url: null };

  function getFilteredItems() {
    if (!State.filter) {
      return State.items.slice();
    }

    const needle = State.filter.toLowerCase();
    return State.items.filter(function(item) {
      return item.name.toLowerCase().indexOf(needle) !== -1;
    });
  }

  function getDisplayItems() {
    const items = getFilteredItems();
    if (State.filter) {
      return items;
    }
    const parentPath = Api.getParentPath(State.path);
    if (parentPath !== State.path) {
      return [PARENT_ITEM].concat(items);
    }
    return items;
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
    const items = getDisplayItems();
    clampSelection(items);
    return items[State.selectedIndex] || null;
  }

  function renderList() {
    const listEl = document.getElementById(Config.listId);
    if (!listEl) {
      return;
    }

    const items = getDisplayItems();
    clampSelection(items);

    if (!items.length) {
      listEl.innerHTML = '<li class="spc-empty">No matching items</li>';
      renderStatusBar();
      return;
    }

    listEl.innerHTML = items.map(function(item, index) {
      const isSelected = index === State.selectedIndex;
      const kindClass = item.type === 'folder' ? 'spc-kind--folder'
                      : item.type === 'parent' ? 'spc-kind--parent'
                      : 'spc-kind--file';
      const countCell = item.type === 'folder' && item.itemCount != null
        ? escapeHtml(String(item.itemCount))
        : item.type === 'file' && item.size != null
          ? escapeHtml(formatSize(item.size))
          : '';
      const dateCell  = (item.type !== 'parent' && item.modified)
        ? escapeHtml(formatDate(item.modified))
        : '';
      const byCell    = (item.type !== 'parent' && item.modifiedBy)
        ? escapeHtml(formatModifiedBy(item.modifiedBy))
        : '';
      return '' +
        '<li class="spc-row ' + kindClass + '" role="option" aria-selected="' + (isSelected ? 'true' : 'false') + '" data-index="' + index + '">' +
          '<span class="spc-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="spc-meta-count">' + countCell + '</span>' +
          '<span class="spc-meta-date">' + dateCell + '</span>' +
          '<span class="spc-meta-by">' + byCell + '</span>' +
        '</li>';
    }).join('');

    listEl.querySelectorAll('.spc-row').forEach(function(row) {
      row.addEventListener('click', function() {
        State.selectedIndex = parseInt(row.dataset.index, 10);
        renderList();
        focusActiveTarget();
      });
      row.addEventListener('dblclick', function() {
        State.selectedIndex = parseInt(row.dataset.index, 10);
        navigateToSelected();
      });
    });

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
    const meta = 'v' + Config.version + ' · ↑/↓ move · Home/End · PgUp/PgDn · Enter open · ? help';

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
            grid-template-rows: auto auto auto minmax(0, 1fr) auto auto;
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

          #spc-colheader {
            grid-row: 3;
            display: grid;
            grid-template-columns: 1.2em minmax(0, 1fr) calc(10em + 50px) 10em calc(11em + 200px);
            gap: 0.5em;
            padding: 0.15rem 0.5rem;
            background: #000055;
            border-bottom: 1px solid #55FFFF;
            color: #55FFFF;
            font-weight: bold;
            user-select: none;
          }

          #spc-colheader .spc-ch-name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          #spc-colheader .spc-ch-count,
          #spc-colheader .spc-ch-date,
          #spc-colheader .spc-ch-by {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          #spc-colheader .spc-ch-count {
            text-align: right;
          }

          #spc-colheader .spc-ch-date,
          #spc-colheader .spc-ch-by {
            text-align: left;
            padding-left: 0.3em;
          }

          #spc-list {
            grid-row: 4;
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
            grid-template-columns: 1.2em minmax(0, 1fr) calc(10em + 50px) 10em calc(11em + 200px);
            align-items: center;
            gap: 0.5em;
            min-height: 1.4rem;
            padding: 0.1rem 0.5rem;
            border-bottom: 1px solid rgba(85, 255, 255, 0.1);
            color: #FFFFFF;
            cursor: pointer;
            user-select: none;
          }

          .spc-row:hover:not([aria-selected='true']) {
            background: rgba(85, 255, 255, 0.12);
          }

          .spc-row:last-child {
            border-bottom: 0;
          }

          .spc-kind--parent .spc-name {
            color: #AAAAAA;
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

          .spc-meta-count,
          .spc-meta-date,
          .spc-meta-by {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #55FFFF;
          }

          .spc-meta-count {
            text-align: right;
          }

          .spc-meta-date,
          .spc-meta-by {
            padding-left: 0.3em;
          }

          .spc-row[aria-selected='true'] .spc-meta-count,
          .spc-row[aria-selected='true'] .spc-meta-date,
          .spc-row[aria-selected='true'] .spc-meta-by {
            color: #000055;
          }

          .spc-meta {
            justify-self: end;
            color: #55FFFF;
          }

          #spc-statusbar {
            grid-row: 5;
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
            grid-row: 6;
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
        <div id="spc-colheader" aria-hidden="true">
          <span></span>
          <span class="spc-ch-name">Name</span>
          <span class="spc-ch-count"># / Size</span>
          <span class="spc-ch-date">Modified</span>
          <span class="spc-ch-by">By</span>
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

    if (step === -Infinity) {
      State.selectedIndex = 0;
    } else if (step === Infinity) {
      State.selectedIndex = items.length - 1;
    } else if (Math.abs(step) === 1) {
      // ArrowUp/Down: clamp at boundaries (no wrap)
      State.selectedIndex = Math.max(0, Math.min(items.length - 1, State.selectedIndex + step));
    } else {
      // PageUp/PageDown: clamp at boundaries
      State.selectedIndex = Math.max(0, Math.min(items.length - 1, State.selectedIndex + step));
    }
    renderList();
    scrollSelectedIntoView();
  }

  function scrollSelectedIntoView() {
    const list = document.getElementById('spc-list');
    const selected = list && list.querySelector('[aria-selected="true"]');
    if (!list || !selected) return;

    const listRect = list.getBoundingClientRect();
    const itemRect = selected.getBoundingClientRect();

    if (itemRect.bottom > listRect.bottom) {
      // Item is below visible area — scroll down just enough
      list.scrollTop += itemRect.bottom - listRect.bottom;
    } else if (itemRect.top < listRect.top) {
      // Item is above visible area — scroll up just enough
      list.scrollTop -= listRect.top - itemRect.top;
    }
    // If item is fully visible, do nothing
  }

  function openItem(item) {
    if (!item) {
      setStatus('No item selected');
      return;
    }
    // Append ?web=1 for files so SharePoint opens them in the browser (Office Online)
    // rather than triggering a download. Folders are never passed here.
    const openUrl = window.location.origin + item.url + '?web=1';
    window.open(openUrl, '_blank', 'noopener');
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

    navigator.clipboard.writeText(window.location.origin + item.url).then(function() {
      setStatus('Copied ' + window.location.origin + item.url);
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
    setStatus(settings.message || 'Loading...');
    renderAll();

    if (!settings.refresh && Cache.has(nextPath)) {
      State.items = Cache.get(nextPath);
      clampSelection(getFilteredItems());
      setStatus(settings.successMessage || 'Loaded ' + State.items.length + ' items');
      renderAll();
      return Promise.resolve();
    }

    return Api.listItems(nextPath).then(function(items) {
      Cache.set(nextPath, items);
      State.items = items;
      clampSelection(getFilteredItems());
      setStatus(settings.successMessage || 'Loaded ' + items.length + ' items');
      renderAll();
    }).catch(function(err) {
      const msg = (window._spPageContextInfo === undefined)
        ? 'Not a SharePoint page — API unavailable'
        : 'Failed to load: ' + (err && err.message ? err.message : 'unknown error');
      State.items = [];
      setStatus(msg);
      renderAll();
    });
  }

  function navigateToSelected() {
    const item = getSelectedItem();
    if (!item) {
      setStatus('No item selected');
      return;
    }

    if (item.type === 'parent') {
      goToParent();
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
    Cache.delete(State.path);
    loadPath(State.path, {
      refresh: true,
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
      case 'Home':
        event.preventDefault();
        moveSelection(-Infinity);
        break;
      case 'End':
        event.preventDefault();
        moveSelection(Infinity);
        break;
      case 'PageUp': {
        event.preventDefault();
        const listUp = document.getElementById('spc-list');
        const firstRowUp = listUp && listUp.querySelector('.spc-row');
        const pageSizeUp = (listUp && firstRowUp)
          ? Math.max(1, Math.floor(listUp.clientHeight / firstRowUp.offsetHeight))
          : 10;
        moveSelection(-pageSizeUp);
        break;
      }
      case 'PageDown': {
        event.preventDefault();
        const listDn = document.getElementById('spc-list');
        const firstRowDn = listDn && listDn.querySelector('.spc-row');
        const pageSizeDn = (listDn && firstRowDn)
          ? Math.max(1, Math.floor(listDn.clientHeight / firstRowDn.offsetHeight))
          : 10;
        moveSelection(pageSizeDn);
        break;
      }
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

    // Detect starting path: URL param 'id' → 'RootFolder' → SP web root
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const paramRf = params.get('RootFolder');
    let startPath = Api.webRoot;
    if (paramId && paramId.charAt(0) === '/') {
      startPath = paramId;
    } else if (paramRf && paramRf.charAt(0) === '/') {
      startPath = paramRf;
    }

    State.items = [];
    State.selectedIndex = 0;
    State.filter = '';
    State.filterActive = false;
    State.path = Api.normalizePath(startPath);
    State.helpVisible = false;
    State.statusMessage = 'Loading...';
    renderOverlay();
    loadPath(State.path, { message: 'Loading...' });
  }

  window.sp_commander = launch;
})();
