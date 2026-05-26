# SharePoint Commander Bookmarklet Loader

## 1. Bookmarklet (cache-busted loader)

Paste this directly into a browser bookmark URL/location field:

```text
javascript:(function(){var s=document.createElement('script');s.src='https://raw.githubusercontent.com/micke314/SharePointCommander/dev/sp-commander.js?v='+Date.now();s.onload=function(){console.log('SharePoint Commander loaded. Run: sp_commander()')};document.head.appendChild(s)})();
```

> Current branch target: `dev`. On release, switch the URL path from `/dev/` to `/main/`.

## 2. DevTools console snippet

```js
// SharePoint Commander — load from GitHub
(function() {
  var s = document.createElement('script');
  s.src = 'https://raw.githubusercontent.com/micke314/SharePointCommander/dev/sp-commander.js?v=' + Date.now();
  s.onload = function() { console.log('SharePoint Commander loaded. Run: sp_commander()'); };
  document.head.appendChild(s);
})();
```

## 3. Bookmarklet installation instructions

### Chrome / Edge
1. Show the Bookmarks bar if needed.
2. Right-click the Bookmarks bar.
3. Choose **Add page...**
4. Name it `SharePoint Commander`.
5. Paste the `javascript:` URL above into the URL field.
6. Save, then open SharePoint and click the bookmark.

### Firefox
1. Show the Bookmarks Toolbar if needed.
2. Right-click the toolbar.
3. Choose **New Bookmark...**
4. Name it `SharePoint Commander`.
5. Paste the `javascript:` URL above into the Location field.
6. Save, then open SharePoint and click the bookmark.

## Notes

- `raw.githubusercontent.com` may be blocked by SharePoint CSP in some environments.
- If that happens, host `sp-commander.js` in the SharePoint site's **Site Assets** library and update the loader URL to point there.
- Or use the DevTools console snippet instead.
- The DevTools paste method avoids the bookmark workflow and is the safest fallback when external script hosts are blocked.
