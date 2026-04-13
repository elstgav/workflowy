// ==UserScript==
// @name         Ellipsis Fix
// @description  Fix the ability to type an ellipsis character (`…`) in WorkFlowy
// @author       Gavin Elster
//
// @grant        none
// @run-at       document-end
// ==/UserScript==

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key !== '…') return

  event.preventDefault()
  // window.WF.insertText('…')
  document.execCommand('insertText', false, '…')
}

document.addEventListener('keydown', handleKeyDown)
