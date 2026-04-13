// ==UserScript==
// @name         Open Link under cursor
// @description  Open links with a key command in WorkFlowy
// @author       Gavin Elster
//
// @grant        none
// @run-at       document-end
// ==/UserScript==

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
