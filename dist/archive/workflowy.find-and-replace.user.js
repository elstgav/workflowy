// ==UserScript==
// @name         WorkFlowy - Find & Replace [ARCHIVED]
// @description  Adds a Find & Replace button to the search input.
// @author       rawbytz and Gavin Elster
// @version      2025.03.08
// @license      MIT
//
// @namespace    https://github.com/elstgav
// @homepageURL  https://github.com/elstgav/workflowy
// @supportURL   https://github.com/elstgav/workflowy/issues
//
// @downloadURL  https://raw.githubusercontent.com/elstgav/workflowy/main/dist/archive/workflowy.find-and-replace.user.js
// @updateURL    https://raw.githubusercontent.com/elstgav/workflowy/main/dist/archive/workflowy.find-and-replace.user.js
//
// @match        https://workflowy.com/*
//
// @grant        none
// @run-at       document-end
// ==/UserScript==

//#region src/scripts/archive/find-and-replace.ts
let searchInput
const findAndReplace = () => {
  const toastMsg = (str, sec = 2, err = false) => {
    WF.showMessage(str, err)
    setTimeout(() => WF.hideMessage(), sec * 1e3)
  }
  const applyToEachItem = (functionToApply, parent) => {
    functionToApply(parent)
    for (const child of parent.getChildren()) applyToEachItem(functionToApply, child)
  }
  const findMatchingItems = (itemPredicate, parent) => {
    const matches = []
    const addIfMatch = (item) => {
      if (itemPredicate(item)) matches.push(item)
    }
    applyToEachItem(addIfMatch, parent)
    return matches
  }
  const editableItemWithVisibleMatch = (item) => {
    const isVisible = WF.completedVisible() || !item.isWithinCompleted()
    return Boolean(
      item.data?.search_result &&
      item.data.search_result.matches &&
      isVisible &&
      !item.isReadOnly(),
    )
  }
  const escapeForRegExp = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')
  const countMatches = (items, rgx) => {
    let matchCount = 0
    items.forEach((item) => {
      const result = item.data?.search_result
      if (!result) return
      if (result.nameMatches) {
        const nameMatch = item.getName().match(rgx)
        if (nameMatch) matchCount += nameMatch.length
      }
      if (result.noteMatches) {
        const noteMatch = item.getNote().match(rgx)
        if (noteMatch) matchCount += noteMatch.length
      }
    })
    return matchCount
  }
  const htmlEscTextForContent = (str) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/>/g, '&gt;')
      .replace(/</g, '&lt;')
      .replace(/\u00A0/g, '&nbsp;')
  const replaceMatches = (items, rgx, replacement) => {
    WF.editGroup(() => {
      items.forEach((item) => {
        const result = item.data?.search_result
        if (!result) return
        if (result.nameMatches)
          WF.setItemName(item, item.getName().replace(rgx, htmlEscTextForContent(replacement)))
        if (result.noteMatches)
          WF.setItemNote(item, item.getNote().replace(rgx, htmlEscTextForContent(replacement)))
      })
    })
    if (replacement === '') {
      WF.clearSearch()
      return
    }
    WF.search(tQuery.replace(findText, replacement))
  }
  const htmlEscText = (str) =>
    str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  function getColors() {
    const p = document.querySelector('.page.active')
    return p
      ? `color:${getComputedStyle(p).color};background:${getComputedStyle(p).backgroundColor};`
      : ''
  }
  const showFindReplaceDialog = (bodyHtml, title, allCount, caseCount, searchValue) => {
    const addButton = (num, name) =>
      `<button type="button" class="btnX" id="btn${num.toString()}">${name}</button>`
    const boxStyle = `#inputBx{${getColors()}width:95%;height:20px;display:block;margin-top:5px;border:1px solid #ccc;border-radius:4px;padding:4px}`
    const btnStyle = `.btnX{font-size:18px;background-color:gray;border:2px solid;border-radius:20px;color:#fff;padding:5px 15px;margin-top:16px;margin-right:16px}.btnX:focus,.btnX:hover{border-color:#c4c4c4;background-color:steelblue}`
    const box = `<div><b>Replace:</b><input value="${htmlEscText(searchValue)}" id="inputBx" type="text" spellcheck="false"></div>`
    const buttons =
      addButton(1, `Replace: All (${allCount})`) +
      addButton(2, `Replace: Match Case (${caseCount})`)
    WF.showAlertDialog(
      `<style>${boxStyle + btnStyle}</style><div>${bodyHtml}</div>${box}<div>${buttons}</div>`,
      title,
    )
    const intervalId = setInterval(() => {
      let inputBx = document.getElementById('inputBx')
      if (inputBx instanceof HTMLInputElement) {
        clearInterval(intervalId)
        const btn1 = document.getElementById('btn1')
        const btn2 = document.getElementById('btn2')
        if (!(btn1 instanceof HTMLButtonElement)) return
        if (!(btn2 instanceof HTMLButtonElement)) return
        inputBx.select()
        inputBx.addEventListener('keyup', (event) => {
          if (event.key === 'Enter') btn1.click()
        })
        btn1.onclick = () => {
          const userInput = inputBx.value
          WF.hideDialog()
          setTimeout(() => {
            replaceMatches(matches, rgx_gi, userInput)
          }, 50)
        }
        btn2.onclick = () => {
          const userInput = inputBx.value
          WF.hideDialog()
          setTimeout(() => {
            replaceMatches(matches, rgx_g, userInput)
          }, 50)
        }
      }
    }, 50)
  }
  const searchQuery = WF.currentSearchQuery()
  if (!searchQuery) {
    toastMsg(
      'Use the searchbox to find. <a href="https://workflowy.com/s/findreplace-bookmark/ynKNSb5dA77p2siT" target="_blank">Click here for more information.</a>',
      3,
      true,
    )
    return
  }
  const tQuery = searchQuery.trim()
  const matches = findMatchingItems(editableItemWithVisibleMatch, WF.currentItem())
  const isQuoted = tQuery.match(/(")(.+)(")/)
  const find = isQuoted ? isQuoted[2] : tQuery.includes(' ') ? null : tQuery
  if (!find) {
    if (
      confirm(
        'The search contains at least one space.\n\n1. Press OK to convert your search to "exact match".\n\n2. Activate Find/Replace again.',
      )
    )
      WF.search(`"${tQuery}"`)
    return
  }
  const findText = find
  const title = 'Find/Replace'
  const modeTxt = isQuoted ? 'Exact Match, ' : 'Single Word/Tag, '
  const compTxt = `Completed: ${WF.completedVisible() ? 'Included' : 'Excluded'}`
  const findTxt = isQuoted ? isQuoted[0] : tQuery
  const body = `<p><b>Mode:</b><br>${modeTxt + compTxt}</p><p><b>Find:</b><br>${htmlEscText(findTxt)}</p>`
  const findRgx = escapeForRegExp(htmlEscTextForContent(findText))
  const rgx_gi = new RegExp(findRgx, 'gi')
  const rgx_g = new RegExp(findRgx, 'g')
  const allCount = countMatches(matches, rgx_gi)
  const caseCount = countMatches(matches, rgx_g)
  if (allCount > 0) showFindReplaceDialog(body, title, allCount, caseCount, findText)
  else WF.showAlertDialog(`${body}<br><br><i>No matches found.</i>`, title)
}
/**
 * Gavin’s additions: ----------------------------------------------------------------------------
 */
const createElementFromHTML = (html) => {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  const element = template.content.firstChild
  if (!(element instanceof Element)) throw new Error('Gavin: Unable to create element')
  return element
}
const findAndReplaceIcon = createElementFromHTML(
  `<svg width="16" height="14" viewBox="151.06 159 449.9 435"><path d="M387.84 302.6c3.316 3.316 8.05 5.21 12.785 5.21s9.473-1.894 12.785-5.21a18.005 18.005 0 0 0 0-25.574l-21.785-21.785h118.87v138.76c0 9.945 8.05 17.996 17.996 17.996 9.945 0 17.996-8.05 17.996-17.996l.008-157.23c0-9.945-8.051-17.996-17.996-17.996h-137.34l21.785-21.785a18.005 18.005 0 0 0 0-25.574 18.005 18.005 0 0 0-25.574 0l-52.094 52.566a18.005 18.005 0 0 0 0 25.574zM294.55 290.76v-107.5c0-9.945-8.05-17.996-17.996-17.996h-107.5c-9.945 0-17.996 8.05-17.996 17.996v107.5c0 9.945 8.05 17.996 17.996 17.996h107.5c9.945 0 17.996-8.05 17.996-17.996zm-35.992-18.469h-71.039v-71.039h71.039zM364.16 449.41c-7.102-7.102-18.941-7.102-26.047 0a18.005 18.005 0 0 0 0 25.574l21.785 21.785h-118.87v-138.29c0-9.945-8.05-17.996-17.996-17.996-9.945 0-17.996 8.05-17.996 17.996v156.75c0 9.945 8.05 17.996 17.996 17.996h137.34L338.11 555.01a18.005 18.005 0 0 0 0 25.574c3.316 3.316 8.05 5.21 12.785 5.21 4.734 0 9.473-1.894 12.785-5.21l53.043-53.043c3.316-3.316 5.21-8.05 5.21-12.785s-1.894-9.473-5.21-12.785zM582.96 443.25h-107.5c-9.945 0-17.996 8.05-17.996 17.996v107.5c0 9.945 8.05 17.996 17.996 17.996h107.5c9.945 0 17.996-8.05 17.996-17.996v-107.5c0-9.945-8.05-17.996-17.996-17.996zm-18.469 107.5h-71.039v-71.039h71.039z" fill="currentColor"></path></svg>`,
)
const style = createElementFromHTML(
  `<style>
      #srch-input[value=""] ~ div .gavin-find-and-replace-button {
        display: none
      }
      #srch-input {
        padding-right: 6.2em;
        text-overflow: ellipsis;
      }
    </style>`.replace(/\s/, ' '),
)
const addFindAndReplaceButton = () => {
  if (document.querySelectorAll('.gavin-find-and-replace-button').length) return
  if (!searchInput) return
  try {
    const searchWrapper = searchInput.closest('label')?.parentElement
    if (!(searchWrapper instanceof HTMLDivElement)) throw new Error('Missing search wrapper')
    const starButton = searchWrapper.querySelector(
      'svg[width="20"][height="20"][fill="none"]',
    )?.parentElement
    if (!(starButton instanceof HTMLButtonElement)) throw new Error('Missing star button')
    const buttonsWrapper = starButton.parentElement
    if (!(buttonsWrapper instanceof HTMLDivElement)) throw new Error('Missing button wrapper')
    const button = starButton.cloneNode(true)
    if (!(button instanceof HTMLButtonElement)) throw new Error('Unable to clone button')
    button.querySelector('svg')?.replaceWith(findAndReplaceIcon)
    button.onclick = findAndReplace
    button.title = 'Find & Replace'
    button.classList.add('gavin-find-and-replace-button')
    buttonsWrapper.firstChild?.before(button)
  } catch (error) {
    console.error('Gavin: Unable to add find and replace button', error)
  }
}
const appObserver = new MutationObserver(() => {
  const nextSearchInput = document.getElementById('srch-input')
  searchInput = nextSearchInput instanceof HTMLInputElement ? nextSearchInput : null
  if (!searchInput?.value) return
  appObserver.disconnect()
  requestAnimationFrame(addFindAndReplaceButton)
})
document.head.appendChild(style)
appObserver.observe(document.body, {
  subtree: true,
  childList: true,
})
//#endregion
