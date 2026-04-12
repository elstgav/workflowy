// ==UserScript==
// @name         WorkFlowy - Open Link under cursor
// @description  Open links with a key command in WorkFlowy
// @author       Gavin Elster
// @version      2026.4.11
// @license      MIT
//
// @namespace    https://github.com/elstgav
// @homepageURL  https://github.com/elstgav/workflowy
// @supportURL   https://github.com/elstgav/workflowy/issues
//
// @downloadURL  https://raw.githubusercontent.com/elstgav/workflowy/main/dist/workflowy.open-link-under-cursor.user.js
// @updateURL    https://raw.githubusercontent.com/elstgav/workflowy/main/dist/workflowy.open-link-under-cursor.user.js
//
// @match        https://workflowy.com/*
//
// @grant        none
// @run-at       document-end
// ==/UserScript==

//#region src/scripts/open-link-under-cursor.ts
document.addEventListener('keydown', (event) => {
  if (!(event.ctrlKey && event.key === '.')) return
  const selection = window.getSelection()
  if (selection?.type !== 'Caret') return
  let possibleLink = selection.getRangeAt(0).commonAncestorContainer
  if (selection.anchorOffset === 0 && possibleLink instanceof HTMLElement)
    possibleLink =
      possibleLink.querySelector('.innerContentContainer')?.childNodes[0] ?? possibleLink
  if (possibleLink instanceof HTMLElement) possibleLink = possibleLink.closest('a')
  if (!(possibleLink instanceof HTMLAnchorElement)) return
  event.preventDefault()
  possibleLink.click()
})
//#endregion
