// ==UserScript==
// @name         Inline Code Formatting
// @description  Adds inline code formatting to WorkFlowy (e.g. `code`).
// @author       Gavin Elster
//
// @grant        none
// @run-at       document-end
// ==/UserScript==

/**
 * ============================== !!DEPRECATED!! ===============================
 * This script is no longer maintained and is kept for archival purposes only.
 * WorkFlowy has implemented a native code block feature, so this script is no
 * longer necessary.
 *
 * SEE: https://blog.workflowy.com/code-blocks-inline-code-quotes-strikethrough/
 * =============================================================================
 */

import { WFEventListener } from '@/workflowy.types'

let currentBullet: Element | null = null
let page: HTMLDivElement | null = null

const INLINE_CODE = /`([^`]+)`/g
const MANGLED_BACKTICK_ANCHOR_TAGS = /<\/a><a [^>]+ href="([^"]+)">`<\/a><a [^>]+ href="(\1)">/g

const createElementFromHTML = (html: string) => {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstChild
}

const style = createElementFromHTML(
  `<style>
      span.gavin-backtick {
        font-size: 0;
        line-height: 0;
      }

      code.gavin-inline-code {
        padding: .2em .4em;
        background-color: rgba(0,0,0,.25);
        border-radius: 6px;
        margin: 0;
        font-size: 85%;
        line-height: 1;
      }
    </style>`.replaceAll(/[\s\n]+/g, ' '),
)

const highlight = (container: ParentNode | null) => {
  if (!container) return
  const searchInput = document.getElementById('srch-input') as HTMLInputElement | null
  if (searchInput?.value?.includes('`')) return

  container.querySelectorAll('.content[contenteditable] .innerContentContainer').forEach((item) => {
    if (!(item instanceof HTMLElement)) return

    requestAnimationFrame(() => {
      if (
        !item.textContent ||
        item.innerHTML.includes('</code>') ||
        !item.textContent.match(INLINE_CODE)
      )
        return

      // Handle mangled link wrapping
      if ((item.innerHTML.match(MANGLED_BACKTICK_ANCHOR_TAGS)?.length ?? 0) >= 2) {
        item.innerHTML = item.innerHTML.replaceAll(MANGLED_BACKTICK_ANCHOR_TAGS, '`')
      }

      item.innerHTML = item.innerHTML.replaceAll(
        INLINE_CODE,
        '<span class="gavin-backtick">`</span><code class="gavin-inline-code">$1</code><span class="gavin-backtick">`</span>',
      )
    })
  })
}

const currentBulletRoot = () =>
  currentBullet?.closest('.project.root > .children > .project') ?? null
const currentFocusRoot = () =>
  document.querySelector('.project.root > .children > .project:focus-within')

const currentBulletObserver = new MutationObserver((mutationList) => {
  const firstMutation = mutationList[0]
  if (!firstMutation || !(firstMutation.target instanceof Element)) return

  const prevOpen = firstMutation.oldValue?.includes('open') ?? false
  const nowOpen = firstMutation.target.classList.contains('open')
  const toggled = prevOpen !== nowOpen

  if (toggled) highlight(currentFocusRoot())
})

const onFocusIn = (event: FocusEvent) => {
  // Handle previous focused bullet
  if (currentBullet) {
    currentBulletObserver.disconnect()
    highlight(currentBulletRoot())
  }

  currentBullet = event.target instanceof Element ? event.target.closest('.project') : null

  if (!currentBullet) return

  currentBulletObserver.observe(currentBullet, {
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true,
  })
}

const existingListeners = window.WFEventListener
const onWFEvent: WFEventListener = (event) => {
  existingListeners?.(event)

  switch (event) {
    case 'indent':
    case 'outdent':
    case 'operation--bulk_create':
    case 'operation--bulk_move':
    case 'operation--delete': {
      const focusRoot = currentFocusRoot()

      if (currentBullet === focusRoot) {
        highlight(page)
      } else {
        highlight(currentFocusRoot())
        if (!focusRoot?.contains(currentBullet)) highlight(currentBulletRoot())
      }

      highlight(page)
      break
    }

    case 'locationChanged': {
      highlight(page)
      break
    }

    // Ignored events
    case 'edit':
    case 'operation--edit':
    case 'zoomedIn':
    case 'zoomedOut':
    default: {
      break
    }
  }
}

const appObserver = new MutationObserver(() => {
  page = document.querySelector('.page.active')

  if (!page) return

  appObserver.disconnect()

  highlight(page)
  page.addEventListener('focusin', onFocusIn)
  window.WFEventListener = onWFEvent
})

if (style) document.head.appendChild(style)
appObserver.observe(document.body, { subtree: true, childList: true })
