// ==UserScript==
// @name         WorkFlowy Template Button Cursor Fix
// @version      2026.4.11
// @description  Fix cursor navigation when focused on a template button
// @author       Gavin Elster
// @license      MIT
//
// @homepageURL  https://github.com/elstgav/workflowy
// @namespace    https://github.com/elstgav
// @supportURL   https://github.com/elstgav/workflowy/issues
// @downloadURL  https://raw.githubusercontent.com/elstgav/workflowy/main/dist/archive/workflowy.template-focus-navigation.user.js
// @updateURL    https://raw.githubusercontent.com/elstgav/workflowy/main/dist/archive/workflowy.template-focus-navigation.user.js
//
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @grant        none
// @run-at       document-end

// ==/UserScript==

//#region src/scripts/archive/template-focus-navigation.ts
let prevFocusItem = null
let nextFocusItem = null
const TEMPLATE_NAME_REGEX = /(?<=^|\s+)#(?:template|use-template:\w+)(?=\b|$)/i
const isTemplateItem = (item) => item.getNameInPlainText().match(TEMPLATE_NAME_REGEX)
const handleFocusOut = () => {
  prevFocusItem = nextFocusItem
  nextFocusItem = null
}
const handleFocusIn = () => {
  nextFocusItem = WF.focusedItem()
}
const handleKeyDown = (event) => {
  if (!event.key.startsWith('Arrow')) return
  const selection = window.getSelection()
  if (!prevFocusItem) return
  if (selection?.type !== 'Caret') return
  if (nextFocusItem) {
    if (prevFocusItem.equals(nextFocusItem)) return
    if (isTemplateItem(nextFocusItem)) {
      nextFocusItem.getElement()?.querySelector('button')?.focus()
      return
    }
  }
  if (!isTemplateItem(prevFocusItem)) return
  prevFocusItem.getElement()?.blur()
  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      return moveFocusToItemAbove()
    case 'ArrowDown':
    case 'ArrowRight':
      return moveFocusToItemBelow()
    default:
      return
  }
}
const moveFocusToItemAbove = () => {
  let itemAbove
  if (!prevFocusItem || !WF) return
  const prevSibling = prevFocusItem.getPreviousVisibleSibling()
  const parent = prevFocusItem.getParent()
  if (prevSibling) {
    itemAbove = prevSibling
    let children = itemAbove.getVisibleChildren()
    while (children.length >= 0) {
      const lastChild = children.at(-1)
      if (!lastChild?.getElement()) break
      itemAbove = lastChild
      children = itemAbove.getVisibleChildren()
    }
  } else itemAbove = parent
  if (!itemAbove) return
  WF.editItemName(itemAbove)
}
const moveFocusToItemBelow = () => {
  let itemBelow
  if (!prevFocusItem || !WF) return
  const firstChild = prevFocusItem.getVisibleChildren()[0]
  if (firstChild?.getElement()) itemBelow = firstChild
  itemBelow ??= prevFocusItem.getNextVisibleSibling()
  itemBelow ??= prevFocusItem.getParent()?.getNextVisibleSibling() ?? null
  if (!itemBelow) return
  WF.editItemName(itemBelow)
  const anchor = document.getSelection()?.anchorNode ?? null
  document.getSelection()?.setPosition(anchor, 0)
}
const initializer = new MutationObserver(() => {
  const page = document.querySelector('.page.active')
  if (!page || !window.WF) return
  initializer.disconnect()
  prevFocusItem = WF.focusedItem()
  nextFocusItem = WF.focusedItem()
  page.addEventListener('focusout', () => setTimeout(handleFocusOut, 0))
  page.addEventListener('focusin', () => setTimeout(handleFocusIn, 0))
  page.addEventListener('keydown', (event) => {
    if (!(event instanceof KeyboardEvent)) return
    setTimeout(() => handleKeyDown(event), 20)
  })
})
initializer.observe(document.body, {
  subtree: true,
  childList: true,
})
//#endregion
