// ==UserScript==
// @name         WorkFlowy Inline Code Formatting
// @version      1.0
// @author       Gavin Elster
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

;(() => {
  let currentProject
  const INLINE_CODE = /`([^`]+)`/g

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

  const highlight = (container = document.querySelector('.page.active')) => {
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

        item.innerHTML = item.innerHTML.replaceAll(
          INLINE_CODE,
          '<span class="gavin-backtick">`</span><code class="gavin-inline-code">$1</code><span class="gavin-backtick">`</span>',
        )
      })
    })
  }

  const currentProjectRoot = () => currentProject?.closest('.project.root > .children > .project')
  const currentFocusRoot = () =>
    document.querySelector('.project.root > .children > .project:focus-within')

  const currentProjectObserver = new MutationObserver(mutationList => {
    const prevOpen = mutationList[0].oldValue.includes('open')
    const nowOpen = mutationList[0].target.classList.contains('open')
    const toggled = prevOpen !== nowOpen

    if (toggled) highlight(currentFocusRoot())
  })

  const onFocusIn = event => {
    // Handle previous focused project
    if (currentProject) {
      currentProjectObserver.disconnect()
      highlight(currentProjectRoot())
    }

    currentProject = event.target.closest('.project')

    if (!currentProject) return

    currentProjectObserver.observe(currentProject, {
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

        if (currentProject === focusRoot) {
          highlight()
        } else {
          highlight(currentFocusRoot())
          if (!focusRoot.contains(currentProject)) highlight(currentProjectRoot())
        }
      }

      case 'locationChanged': {
        highlight()
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
    const page = document.querySelector('.page.active')

    if (!page) return

    highlight()
    page.addEventListener('focusin', onFocusIn)
    window.WFEventListener = onWFEvent

    appObserver.disconnect()
  })

  document.head.appendChild(style)
  appObserver.observe(document.getElementById('app'), { childList: true })
})()
