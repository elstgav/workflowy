// ==UserScript==
// @name         WorkFlowy External Links Fix
// @version      1.0
// @description  Ensure external links open with default native behavior. (e.g. open in the default
//               browser when running as a web app).
// @author       Gavin Elster
// @match        https://workflowy.com/*
// @grant        none
// @run-at       document-end

// ==/UserScript==

;(function () {
  const originalOpen = window.open
  const externalLink = document.createElement('a')

  externalLink.id = 'userscript--external-link-fix'
  externalLink.style.display = 'none'
  externalLink.target = '_blank'

  document.body.appendChild(externalLink)

  /** @type {typeof window.open} */
  const openLinksNatively = (...args) => {
    const url = String(args[0])

    if (args.length > 2 || url.includes('workflowy.com') || !url.startsWith('http'))
      return originalOpen(...args)

    externalLink.href = url
    externalLink.click()

    return null
  }

  window.open = openLinksNatively
})()
