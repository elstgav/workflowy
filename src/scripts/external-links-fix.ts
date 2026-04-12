// ==UserScript==
// @name         WorkFlowy - External Links Fix
// @description  Ensure external links open with default native behavior. (e.g.
//               open in the default browser when running as a web app).
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
