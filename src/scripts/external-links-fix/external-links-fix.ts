// ==UserScript==
// @name         External Links Fix
// @description  When running WorkFlowy as a web app, ensures external links open in your default browser (vs. staying in the web app).
// @author       Gavin Elster
//
// @grant        none
// @run-at       document-end
// ==/UserScript==

const externalLink = document.createElement('a')

externalLink.id = 'userscript--external-link-fix'
externalLink.style.display = 'none'
externalLink.target = '_blank'

document.body.appendChild(externalLink)

document.addEventListener(
  'click',
  (event) => {
    if (!(event.target instanceof HTMLAnchorElement)) return
    if (event.target.href.includes('workflowy.com')) return
    if (!event.target.href.startsWith('http')) return

    externalLink.href = event.target.href
    externalLink.click()
    event.stopPropagation()
  },
  true,
)
