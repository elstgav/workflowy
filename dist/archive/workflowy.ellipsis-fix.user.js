// ==UserScript==
// @name         WorkFlowy Ellipsis Fix
// @version      2026.4.11
// @description  Fix the ability to type an ellipsis character (…) in WorkFlowy
// @author       Gavin Elster
// @license      MIT
//
// @homepageURL  https://github.com/elstgav/workflowy
// @namespace    https://github.com/elstgav/workflowy
// @supportURL   https://github.com/elstgav/workflowy/issues
// @downloadURL  https://raw.githubusercontent.com/elstgav/workflowy/main/dist/archive/workflowy.ellipsis-fix.user.js
// @updateURL    https://raw.githubusercontent.com/elstgav/workflowy/main/dist/archive/workflowy.ellipsis-fix.user.js
//
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @grant        none
// @run-at       document-end

// ==/UserScript==

//#region src/scripts/archive/ellipsis-fix.ts
// @license      MIT
const handleKeyDown = (event) => {
  if (event.key !== '…') return
  event.preventDefault()
  document.execCommand('insertText', false, '…')
}
document.addEventListener('keydown', handleKeyDown)
//#endregion
