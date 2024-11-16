// ==UserScript==
// @name         WorkFlowy External Links Fix
// @version      1.0
// @description  Ensure external links are respecting Fluid whitelist settings
// @author       Gavin Elster
// @match        https://workflowy.com/*
// @grant        none
// @run-at       document-end

// ==/UserScript==

;(function () {
  const originalOpen = window.open
  const externalLink = document.createElement('a')

  function openLinksNatively(...args) {
    const [url, target] = args

    if (args.length > 2) return originalOpen(...args)

    externalLink.href = url
    externalLink.target = target

    return externalLink.click()
  }

  window.open = openLinksNatively
})()
