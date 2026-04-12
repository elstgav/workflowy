// ==UserScript==
// @name         WorkFlowy Ellipsis Fix
// @version      {YYYY.MM.DD}
// @description  Fix the ability to type an ellipsis character (…) in WorkFlowy
// @author       Gavin Elster
// @license      MIT
//
// @homepageURL  https://github.com/elstgav/workflowy
// @namespace    https://github.com/elstgav
// @supportURL   https://github.com/elstgav/workflowy/issues
//
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @grant        none
// @run-at       document-end

// ==/UserScript==

'use strict'

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key !== '…') return

  event.preventDefault()
  // window.WF.insertText('…')
  document.execCommand('insertText', false, '…')
}

document.addEventListener('keydown', handleKeyDown)
