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
  let attempts = 0
  let currentProject
  const INLINE_CODE = /`([^`]+)`/g

  const createElementFromHTML = html => {
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    return template.content.firstChild
  }

  const style = createElementFromHTML(
    `<style>
      .gavin-backtick { display: none }

      code.gavin-inline-code {
        padding: .2em .4em;
        margin: 0;
        font-size: 85%;
        border-radius: 6px;
        background-color: rgba(0,0,0,.25);
      }
    </style>`.replace(/\s/, ' '),
  )

  const highlight = container => {
    if (document.getElementById('srch-input').value.includes('`')) return

    container.querySelectorAll('.content[contenteditable] .innerContentContainer').forEach(item => {
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
  }

  const currentProjectObserver = new MutationObserver(mutationList => {
    if (!mutationList.some(mutation => mutation.attributeName === 'class')) return

    // Update item
    highlight(currentProject)

    // Update parents
    const parents = []
    let lastParent = currentProject

    while ((lastParent = lastParent.parentElement.closest('.project'))) {
      parents.push(lastParent)
    }

    parents.forEach(parent => highlight(parent.querySelector(':scope > .name')))
  })

  const breadcrumbObserver = new MutationObserver(() => {
    highlight(document.querySelector('.page.active'))
  })

  const shiftFocus = event => {
    // Handle previous focused project
    if (currentProject) {
      currentProjectObserver.disconnect()
      highlight(currentProject)
    }

    currentProject = event.target.closest('.project')

    if (!currentProject) return

    currentProjectObserver.observe(currentProject, { attributes: true })
  }

  const waitForActivePage = () => {
    const page = document.querySelector('.page.active')

    if (!page) {
      return ++attempts <= 50 && setTimeout(waitForActivePage, 100)
    }

    highlight(page)

    window.addEventListener('popstate', highlight)
    window.addEventListener('hashchange', highlight)
    page.addEventListener('focusin', shiftFocus)
    breadcrumbObserver.observe(document.querySelector('.breadcrumbs'), { childList: true })
  }

  document.head.appendChild(style)
  waitForActivePage()
})()
