// ==UserScript==
// @name         WorkFlowy - Focus Fix
// @description  Fix WorkFlowy lost focus
// @author       rawbytz and Gavin Elster
// @version      2026.04.12
// @license      MIT
//
// @namespace    https://github.com/elstgav
// @homepageURL  https://github.com/elstgav/workflowy
// @supportURL   https://github.com/elstgav/workflowy/issues
//
// @downloadURL  https://raw.githubusercontent.com/elstgav/workflowy/main/dist/workflowy.focus-fix.user.js
// @updateURL    https://raw.githubusercontent.com/elstgav/workflowy/main/dist/workflowy.focus-fix.user.js
//
// @match        https://workflowy.com/*
//
// @grant        none
// @run-at       document-end
// ==/UserScript==

//#region src/scripts/focus-fix.ts
const fixFocus = () => {
  const active = document.activeElement?.className
  if (!active || active.includes('searchBoxInput') || active.includes('content')) return
  const matches = document.querySelectorAll(
    '.name.matches .content, .notes.matches .content, .metaMatches .name .content',
  )
  if (matches[0] instanceof HTMLElement) return matches[0].focus()
  const index = WF.currentItem().isMainDocumentRoot() && !WF.currentSearchQuery() ? 2 : 0
  const content = document.getElementsByClassName('content')
  if (content[index] instanceof HTMLElement) content[index].focus()
}
const otherListeners = WFEventListener
window.WFEventListener = (event) => {
  if (event !== 'locationChanged') return
  requestAnimationFrame(fixFocus)
  otherListeners?.(event)
}
const appObserver = new MutationObserver(() => {
  if (!document.querySelector('.page.active')) return
  appObserver.disconnect()
  fixFocus()
})
appObserver.observe(document.body, {
  subtree: true,
  childList: true,
})
//#endregion
