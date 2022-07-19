// ==UserScript==
// @name         WorkFlowy Focus Fix
// @namespace    https://rawbytz.wordpress.com
// @version      2.4
// @description  Fix WorkFlowy lost focus
// @author       rawbytz
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @updateUrl    https://github.com/rawbytz/focus-fix/raw/master/focusFix.user.js
// @downloadUrl  https://github.com/rawbytz/focus-fix/raw/master/focusFix.user.js
// @grant        none
// @run-at       document-end

// ==/UserScript==

;(function () {
  function fixFocus() {
    const active = document.activeElement.className

    if (active.includes('searchBoxInput') || active.includes('content')) return

    const matches = document.querySelectorAll(
      '.name.matches .content, .notes.matches .content, .metaMatches .name .content',
    )

    if (matches.length > 0) return void matches[0].focus()

    // home name [0] and note [1] are "hidden"
    const index = WF.currentItem().isMainDocumentRoot() && !WF.currentSearchQuery() ? 2 : 0
    const content = document.getElementsByClassName('content')

    if (content.length > 0) content[index].focus()
  }

  const otherListeners = WFEventListener
  window.WFEventListener = event => {
    if (event !== 'locationChanged') return
    requestAnimationFrame(fixFocus)

    otherListeners(event)
  }

  const appObserver = new MutationObserver(() => {
    const page = document.querySelector('.page.active')

    if (!page) return

    fixFocus()
    appObserver.disconnect()
  })

  appObserver.observe(document.getElementById('app'), { childList: true })
})()
