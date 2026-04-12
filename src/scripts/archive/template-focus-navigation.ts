// ==UserScript==
// @name         WorkFlowy Template Button Cursor Fix
// @version      {YYYY.MM.DD}
// @description  Fix cursor navigation when focused on a template button
// @author       Gavin Elster
// @license      MIT
//
// @homepageURL  https://github.com/elstgav/workflowy
// @namespace    https://github.com/elstgav/workflowy
// @supportURL   https://github.com/elstgav/workflowy/issues
//
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @grant        none
// @run-at       document-end

// ==/UserScript==

import type { Item } from '@/workflowy.types'

let prevFocusItem: Item | null = null
let nextFocusItem: Item | null = null

const TEMPLATE_NAME_REGEX = /(?<=^|\s+)#(?:template|use-template:\w+)(?=\b|$)/i

const isTemplateItem = (item: Item) => item.getNameInPlainText().match(TEMPLATE_NAME_REGEX)

const handleFocusOut = () => {
  prevFocusItem = nextFocusItem
  nextFocusItem = null
}

const handleFocusIn = () => {
  nextFocusItem = WF.focusedItem()

  // console.log(
  //   `Switched focus: ${prevFocusItem?.getNameInPlainText() ?? '[not an item]'} → ${
  //     nextFocusItem?.getNameInPlainText() ?? '[not an item]'
  //   }`,
  // )
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (!event.key.startsWith('Arrow')) return

  const selection = window.getSelection()

  // console.log(
  //   `${event.key} pressed: ${prevFocusItem?.getNameInPlainText() ?? '[not an item]'} → ${
  //     nextFocusItem?.getNameInPlainText() ?? '[not an item]'
  //   }`,
  // )

  if (!prevFocusItem) return
  if (selection?.type !== 'Caret') return // Only interested in cursor movement
  if (nextFocusItem) {
    if (prevFocusItem.equals(nextFocusItem)) return // No change in items
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
  let itemAbove: Item | null
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
  } else {
    itemAbove = parent
  }

  if (!itemAbove) return

  WF.editItemName(itemAbove)
}

const moveFocusToItemBelow = () => {
  let itemBelow: Item | null

  if (!prevFocusItem || !WF) return

  // “visible” means “not completed”, not “visible in the DOM”
  const firstChild = prevFocusItem.getVisibleChildren()[0]
  if (firstChild?.getElement()) {
    // Ensure the child is rendered
    itemBelow = firstChild
  }

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

  // HACK: Using timeouts to make sure events fire in correct order across
  // browsers, and after WF has a chance to update .selectedItem().
  page.addEventListener('focusout', () => setTimeout(handleFocusOut, 0))
  page.addEventListener('focusin', () => setTimeout(handleFocusIn, 0))
  page.addEventListener('keydown', (event) => {
    if (!(event instanceof KeyboardEvent)) return
    setTimeout(() => handleKeyDown(event), 20)
  })
})

initializer.observe(document.body, { subtree: true, childList: true })
