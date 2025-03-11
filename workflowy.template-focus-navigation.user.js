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

/** @import { Item } from './workflowy.types' */

;(() => {
  'use strict'

  const WF = window.WF
  let prevFocusItem = WF.focusedItem()
  let nextFocusItem = WF.focusedItem()

  /** @param {Item} item */
  const isTemplateItem = item => item.getNameInPlainText().endsWith(' #template')

  function handleFocusOut() {
    prevFocusItem = nextFocusItem
    nextFocusItem = null
  }

  function handleFocusIn() {
    nextFocusItem = WF.focusedItem()
  }

  /** @param {KeyboardEvent} event */
  function handleKeyDown(event) {
    if (!event.key.startsWith('Arrow')) return

    const selection = window.getSelection()

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

    /** @type {Item | null | undefined} */
    let newFocusItem

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft': {
        if ((newFocusItem = prevFocusItem.getPreviousVisibleSibling())) {
          let children = newFocusItem.getVisibleChildren()

          while (children.length >= 0) {
            const lastChild = children.at(-1)

            if (!lastChild?.getElement()) break

            newFocusItem = lastChild
            children = newFocusItem.getVisibleChildren()
          }
        } else {
          newFocusItem = prevFocusItem.getParent()
        }

        if (!newFocusItem) break

        WF.editItemName(newFocusItem)

        break
      }

      case 'ArrowDown':
      case 'ArrowRight': {
        const firstChild = prevFocusItem.getVisibleChildren()[0]
        newFocusItem = firstChild?.getElement() && firstChild
        newFocusItem ??= prevFocusItem.getNextVisibleSibling()
        newFocusItem ??= prevFocusItem.getParent()?.getNextVisibleSibling()

        if (!newFocusItem) break

        WF.editItemName(newFocusItem)
        const anchor = document.getSelection()?.anchorNode ?? null
        document.getSelection()?.setPosition(anchor, 0)

        break
      }

      default:
        return
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('focusout', handleFocusOut)
  document.addEventListener('focusin', handleFocusIn)
})()
