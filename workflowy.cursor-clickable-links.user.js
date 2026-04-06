// ==UserScript==
// @name         WorkFlowy - Open Links shortcut
// @version      1.0
// @description  Open links with a key command in WorkFlowy
// @author       Gavin Elster
// @license      MIT
//
// @homepageURL  https://github.com/elstgav/workflowy
// @supportURL   https://github.com/elstgav/workflowy/issues
// @downloadURL  https://raw.githubusercontent.com/elstgav/workflowy/main/workflowy.cursor-clickable-links.user.js
// @updateURL    https://raw.githubusercontent.com/elstgav/workflowy/main/workflowy.cursor-clickable-links.user.js
//
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
//
// @grant        none
// @run-at       document-end

// ==/UserScript==

;(() => {
  'use strict'

  /** @param {KeyboardEvent} event */
  const handleKeyDown = (event) => {
    const ctrlAltDown = event.ctrlKey && event.key === '.'

    if (!ctrlAltDown) return

    const selection = window.getSelection()

    if (selection?.type !== 'Caret') return

    let possibleLink = selection.getRangeAt(0).commonAncestorContainer

    // Cursor is at start of line (before a possible link element)
    if (selection.anchorOffset === 0 && possibleLink instanceof HTMLElement) {
      const firstNode = possibleLink?.querySelector('.innerContentContainer')?.childNodes[0]
      possibleLink = firstNode ?? possibleLink
    }

    let parentSearch = 0

    while (!(possibleLink instanceof HTMLAnchorElement) && parentSearch < 3) {
      possibleLink = /** @type {HTMLElement} */ (possibleLink.parentElement)
      parentSearch++
    }

    if (!(possibleLink instanceof HTMLAnchorElement)) return

    event.preventDefault()
    possibleLink.click()
  }

  document.addEventListener('keydown', handleKeyDown)
})()
