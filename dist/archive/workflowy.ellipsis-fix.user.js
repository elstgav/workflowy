// ==UserScript==
// @name         WorkFlowy Ellipsis Fix
// @description  Fix the ability to type an ellipsis character (…) in WorkFlowy
// @author       Gavin Elster
// @version      2025.03.07
// @license      MIT
//
// @namespace    https://github.com/elstgav
// @homepageURL  https://github.com/elstgav/workflowy
// @supportURL   https://github.com/elstgav/workflowy/issues
//
// @downloadURL  https://raw.githubusercontent.com/elstgav/workflowy/main/dist/archive/workflowy.ellipsis-fix.user.js
// @updateURL    https://raw.githubusercontent.com/elstgav/workflowy/main/dist/archive/workflowy.ellipsis-fix.user.js
//
// @match        https://workflowy.com/*
//
// @grant        none
// @run-at       document-end
// ==/UserScript==

//#region src/scripts/archive/ellipsis-fix.ts
const handleKeyDown = (event) => {
  if (event.key !== '…') return
  event.preventDefault()
  document.execCommand('insertText', false, '…')
}
document.addEventListener('keydown', handleKeyDown)
//#endregion
