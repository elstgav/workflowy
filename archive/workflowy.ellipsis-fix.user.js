// ==UserScript==
// @name         WorkFlowy Ellipsis Fix
// @version      1.0
// @description  Fix the ability to type an ellipsis character (…) in WorkFlowy
// @author       Gavin Elster
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @grant        none
// @run-at       document-end

// ==/UserScript==

;(() => {
  'use strict'

  /** @param {KeyboardEvent} event */
  function handleKeyDown(event) {
    if (event.key !== '…') return

    event.preventDefault()
    // window.WF.insertText('…')
    document.execCommand('insertText', false, '…')
  }

  document.addEventListener('keydown', handleKeyDown)
})()
