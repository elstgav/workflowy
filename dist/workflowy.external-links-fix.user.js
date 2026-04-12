// ==UserScript==
// @name         WorkFlowy - External Links Fix
// @version      2026.4.11
// @description  Ensure external links open with default native behavior. (e.g. open in the default
//               browser when running as a web app).
// @author       Gavin Elster
// @license      MIT
//
// @homepageURL  https://github.com/elstgav/workflowy
// @namespace    https://github.com/elstgav
// @supportURL   https://github.com/elstgav/workflowy/issues
// @downloadURL  https://raw.githubusercontent.com/elstgav/workflowy/main/dist/workflowy.external-links-fix.user.js
// @updateURL    https://raw.githubusercontent.com/elstgav/workflowy/main/dist/workflowy.external-links-fix.user.js
//
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
//
// @grant        none
// @run-at       document-end

// ==/UserScript==

//#region src/scripts/external-links-fix.ts
// @license      MIT
const externalLink = document.createElement('a')
externalLink.id = 'userscript--external-link-fix'
externalLink.style.display = 'none'
externalLink.target = '_blank'
document.body.appendChild(externalLink)
document.addEventListener(
  'click',
  (event) => {
    if (!(event.target instanceof HTMLAnchorElement)) return
    if (event.target.href.includes('workflowy.com')) return
    if (!event.target.href.startsWith('http')) return
    externalLink.href = event.target.href
    externalLink.click()
    event.stopPropagation()
  },
  true,
)
//#endregion
