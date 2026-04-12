// ==UserScript==
// @name         WorkFlowy - Open Link under cursor
// @version      {YYYY.MM.DD}
// @description  Open links with a key command in WorkFlowy
// @author       Gavin Elster
// @license      MIT
//
// @homepageURL  https://github.com/elstgav/workflowy
// @namespace    https://github.com/elstgav/workflowy
// @supportURL   https://github.com/elstgav/workflowy/issues
//
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
//
// @grant        none
// @run-at       document-end

// ==/UserScript==

'use strict'

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (!(event.ctrlKey && event.key === '.')) return

  const selection = window.getSelection()

  if (selection?.type !== 'Caret') return

  let possibleLink: Node | null = selection.getRangeAt(0).commonAncestorContainer

  // Cursor is at start of line (before a possible link element)
  if (selection.anchorOffset === 0 && possibleLink instanceof HTMLElement) {
    const firstNode = possibleLink.querySelector('.innerContentContainer')?.childNodes[0]
    possibleLink = firstNode ?? possibleLink
  }

  if (possibleLink instanceof HTMLElement) possibleLink = possibleLink.closest('a')
  if (!(possibleLink instanceof HTMLAnchorElement)) return

  event.preventDefault()
  possibleLink.click()
})
