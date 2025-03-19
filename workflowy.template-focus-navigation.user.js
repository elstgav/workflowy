// ==UserScript==
// @name         WorkFlowy Template Button Cursor Fix
// @version      1.0
// @description  Fix cursor navigation when focused on a template button
// @author       Gavin Elster
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @grant        none
// @run-at       document-end

// ==/UserScript==

/** @import { ExtensionsAPI, Item } from './workflowy.types' */

;(() => {
  'use strict'

  /** @type {ExtensionsAPI} */
  let WF
  /** @type {Item | null} */
  let prevFocusItem = null
  /** @type {Item | null} */
  let nextFocusItem = null

  const TEMPLATE_NAME_REGEX = /(?<=^|\s+)#(?:template|use-template:\w+)(?=\b|$)/i

  const isTemplateItem = (/** @type {Item} */ item) =>
    item.getNameInPlainText().match(TEMPLATE_NAME_REGEX)

  function handleFocusOut() {
    prevFocusItem = nextFocusItem
    nextFocusItem = null
  }

  function handleFocusIn() {
    nextFocusItem = WF.focusedItem()

    console.log(
      `Switched focus: ${prevFocusItem?.getNameInPlainText() ?? '[not an item]'} → ${
        nextFocusItem?.getNameInPlainText() ?? '[not an item]'
      }`,
    )
  }

  /** @param {KeyboardEvent} event */
  function handleKeyDown(event) {
    if (!event.key.startsWith('Arrow')) return

    const selection = window.getSelection()

    console.log(
      `${event.key} pressed: ${prevFocusItem?.getNameInPlainText() ?? '[not an item]'} → ${
        nextFocusItem?.getNameInPlainText() ?? '[not an item]'
      }`,
    )

    if (!prevFocusItem) return
    if (selection?.type !== 'Caret') return // Only interested in cursor movement
    if (nextFocusItem) {
      if (prevFocusItem.equals(nextFocusItem)) return // No change in items
      if (isTemplateItem(nextFocusItem)) {
        // // The incoming focused item might be a template item, in which case focus it
        // setTimeout(highlightTemplateButtonIfFocused, 0)
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
    /** @type {Item | null | undefined} */
    let itemAbove

    if (!prevFocusItem) return

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
    /** @type {Item | null | undefined} */
    let itemBelow

    if (!prevFocusItem) return

    // “visible” means “not completed”, not “visible in the DOM”
    const firstChild = prevFocusItem.getVisibleChildren()[0]
    if (firstChild?.getElement()) {
      // Ensure the child is rendered
      itemBelow = firstChild
    }

    itemBelow ??= prevFocusItem.getNextVisibleSibling()
    itemBelow ??= prevFocusItem.getParent()?.getNextVisibleSibling()

    if (!itemBelow) return

    WF.editItemName(itemBelow)
    const anchor = document.getSelection()?.anchorNode ?? null
    document.getSelection()?.setPosition(anchor, 0)
  }

  const initializer = new MutationObserver(() => {
    const page = /** @type {HTMLDivElement} */ (document.querySelector('.page.active'))

    if (!page && !window.WF) return

    initializer.disconnect()

    WF = window.WF

    prevFocusItem = WF.focusedItem()
    nextFocusItem = WF.focusedItem()

    // HACK: Using timeouts to make sure events fire in correct order across
    // browsers, and after WF has a chance to update .selectedItem().
    page.addEventListener('focusout', () => setTimeout(handleFocusOut, 0))
    page.addEventListener('focusin', () => setTimeout(handleFocusIn, 0))
    page.addEventListener('keydown', event => setTimeout(() => handleKeyDown(event), 20))
  })

  initializer.observe(document.body, { subtree: true, childList: true })
})()
