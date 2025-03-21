/**
 * ============================== !!DEPRECATED!! ===============================
 * This script is no longer maintained and is kept for archival purposes only.
 * WorkFlowy has implemented a native code block feature, so this script is no
 * longer necessary.
 *
 * SEE: https://blog.workflowy.com/code-blocks-inline-code-quotes-strikethrough/
 * ============================================================================
 */

// ==UserScript==
// @name         WorkFlowy Inline Code Formatting
// @version      1.0
// @author       Gavin Elster
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

// @ts-nocheck - Deprecated script

;(() => {
  let currentBullet
  let page

  const INLINE_CODE = /`([^`]+)`/g
  const MANGLED_BACKTICK_ANCHOR_TAGS = /<\/a><a [^>]+ href="([^"]+)">`<\/a><a [^>]+ href="(\1)">/g

  const createElementFromHTML = html => {
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

  const highlight = container => {
    if (!container) return
    if (document.getElementById('srch-input').value.includes('`')) return

    container.querySelectorAll('.content[contenteditable] .innerContentContainer').forEach(item => {
      requestAnimationFrame(() => {
        if (
          !item.textContent ||
          item.innerHTML.includes('</code>') ||
          !item.textContent.match(INLINE_CODE)
        )
          return

        // Handle mangled link wrapping
        if (item.innerHTML.match(MANGLED_BACKTICK_ANCHOR_TAGS)?.length >= 2) {
          item.innerHTML = item.innerHTML.replaceAll(MANGLED_BACKTICK_ANCHOR_TAGS, '`')
        }

        item.innerHTML = item.innerHTML.replaceAll(
          INLINE_CODE,
          '<span class="gavin-backtick">`</span><code class="gavin-inline-code">$1</code><span class="gavin-backtick">`</span>',
        )
      })
    })
  }

  const currentBulletRoot = () => currentBullet?.closest('.project.root > .children > .project')
  const currentFocusRoot = () =>
    document.querySelector('.project.root > .children > .project:focus-within')

  const currentBulletObserver = new MutationObserver(mutationList => {
    const prevOpen = mutationList[0].oldValue.includes('open')
    const nowOpen = mutationList[0].target.classList.contains('open')
    const toggled = prevOpen !== nowOpen

    if (toggled) highlight(currentFocusRoot())
  })

  const onFocusIn = event => {
    // Handle previous focused bullet
    if (currentBullet) {
      currentBulletObserver.disconnect()
      highlight(currentBulletRoot())
    }

    currentBullet = event.target.closest('.project')

    if (!currentBullet) return

    currentBulletObserver.observe(currentBullet, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
    })
  }

  const existingListeners = window.WFEventListener
  const onWFEvent = event => {
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
          if (!focusRoot.contains(currentBullet)) highlight(currentBulletRoot())
        }
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

  document.head.appendChild(style)
  appObserver.observe(document.body, { subtree: true, childList: true })
})()
