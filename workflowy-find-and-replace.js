// ==UserScript==
// @name         WorkFlowy Find & Replace
// @namespace    https://rawbytz.wordpress.com
// @version      2.1
// @description  Find & Replace
// @author       Gavin Elster
// @match        https://workflowy.com/*
// @match        https://*.workflowy.com/*
// @updateUrl    https://github.com/rawbytz/find-replace/blob/master/findReplace.js
// @downloadUrl  https://github.com/rawbytz/find-replace/blob/master/findReplace.js
// @grant        none
// @run-at       document-end

// ==/UserScript==

;(() => {
  let searchInput

  const findAndReplace = () => {
    function toastMsg(str, sec, err) {
      WF.showMessage(str, err)
      setTimeout(WF.hideMessage, (sec || 2) * 1000)
    }

    function applyToEachItem(functionToApply, parent) {
      functionToApply(parent)
      for (let child of parent.getChildren()) {
        applyToEachItem(functionToApply, child)
      }
    }

    function findMatchingItems(itemPredicate, parent) {
      const matches = []
      function addIfMatch(item) {
        if (itemPredicate(item)) {
          matches.push(item)
        }
      }
      applyToEachItem(addIfMatch, parent)
      return matches
    }

    function editableItemWithVisibleMatch(item) {
      const isVisible = WF.completedVisible() || !item.isWithinCompleted()
      return (
        item.data.search_result &&
        item.data.search_result.matches &&
        isVisible &&
        !item.isReadOnly()
      )
    }

    const escapeForRegExp = str => str.replace(/[-\[\]{}()*+?.,\\^$|#]/g, '\\$&')

    function countMatches(items, rgx) {
      let matchCount = 0
      items.forEach(item => {
        let result = item.data.search_result
        if (result.nameMatches) {
          let nameMatch = item.getName().match(rgx)
          if (nameMatch) matchCount += nameMatch.length
        }
        if (result.noteMatches) {
          let noteMatch = item.getNote().match(rgx)
          if (noteMatch) matchCount += noteMatch.length
        }
      })
      return matchCount
    }

    const htmlEscTextForContent = str =>
      str
        .replace(/&/g, '&amp;')
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
        .replace(/\u00A0/g, ' ')

    function replaceMatches(items, rgx, r) {
      WF.editGroup(function () {
        items.forEach(item => {
          let result = item.data.search_result
          if (result.nameMatches)
            WF.setItemName(item, item.getName().replace(rgx, htmlEscTextForContent(r)))
          if (result.noteMatches)
            WF.setItemNote(item, item.getNote().replace(rgx, htmlEscTextForContent(r)))
        })
      })
      r === '' ? WF.clearSearch() : WF.search(tQuery.replace(find, r))
    }

    const htmlEscText = str =>
      str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

    function getColors() {
      const p = document.querySelector('.page.active')
      return p
        ? `color:${getComputedStyle(p).color};background:${getComputedStyle(p).backgroundColor};`
        : ''
    }

    function showFindReplaceDialog(BODY, TITLE, aCount, cCount, searchValue) {
      const addButton = (num, name) =>
        `<button type="button" class="btnX" id="btn${num.toString()}">${name}</button>`
      const boxStyle = `#inputBx{${getColors()}width:95%;height:20px;display:block;margin-top:5px;border:1px solid #ccc;border-radius:4px;padding:4px}`
      const btnStyle = `.btnX{font-size:18px;background-color:steelblue;border:2px solid;border-radius:20px;color:#fff;padding:5px 15px;margin-top:16px;margin-right:16px}.btnX:focus{border-color:#c4c4c4}`
      const box = `<div><b>Replace:</b><input value="${htmlEscText(
        searchValue,
      )}" id="inputBx" type="text" spellcheck="false"></div>`
      const buttons =
        addButton(1, `Replace: All (${aCount})`) + addButton(2, `Replace: Match Case (${cCount})`)
      WF.showAlertDialog(
        `<style>${boxStyle + btnStyle}</style><div>${BODY}</div>${box}<div>${buttons}</div>`,
        TITLE,
      )
      setTimeout(function () {
        let userInput
        const inputBx = document.getElementById('inputBx')
        const btn1 = document.getElementById('btn1')
        const btn2 = document.getElementById('btn2')
        inputBx.select()
        inputBx.addEventListener('keyup', function (event) {
          if (event.key === 'Enter') {
            btn1.click()
          }
        })
        btn1.onclick = function () {
          userInput = inputBx.value
          WF.hideDialog()
          setTimeout(function () {
            replaceMatches(Matches, rgx_gi, userInput)
          }, 50)
        }
        btn2.onclick = function () {
          userInput = inputBx.value
          WF.hideDialog()
          setTimeout(function () {
            replaceMatches(Matches, rgx_g, userInput)
          }, 50)
        }
      }, 100)
    }

    if (!WF.currentSearchQuery()) {
      return void toastMsg(
        'Use the searchbox to find. <a href="https://workflowy.com/s/findreplace-bookmark/ynKNSb5dA77p2siT" target="_blank">Click here for more information.</a>',
        3,
        true,
      )
    }

    const tQuery = WF.currentSearchQuery().trim()
    const Matches = findMatchingItems(editableItemWithVisibleMatch, WF.currentItem())
    const isQuoted = tQuery.match(/(")(.+)(")/)
    const find = isQuoted ? isQuoted[2] : tQuery.includes(' ') ? false : tQuery

    if (find === false) {
      if (
        confirm(
          'The search contains at least one space.\n\n1. Press OK to convert your search to "exact match".\n\n2. Activate Find/Replace again.',
        )
      ) {
        WF.search('"' + tQuery + '"')
      }
      return
    }

    const title = 'Find/Replace'
    const modeTxt = isQuoted ? 'Exact Match, ' : 'Single Word/Tag, '
    const compTxt = `Completed: ${WF.completedVisible() ? 'Included' : 'Excluded'}`
    const findTxt = isQuoted ? isQuoted[0] : tQuery
    const body = `<p><b>Mode:</b><br>${modeTxt + compTxt}</p><p><b>Find:</b><br>${htmlEscText(
      findTxt,
    )}</p>`
    const findRgx = escapeForRegExp(htmlEscTextForContent(find))
    const rgx_gi = new RegExp(findRgx, 'gi')
    const rgx_g = new RegExp(findRgx, 'g')
    const allCount = countMatches(Matches, rgx_gi)
    const caseCount = countMatches(Matches, rgx_g)

    if (allCount > 0) {
      showFindReplaceDialog(body, title, allCount, caseCount, find)
    } else {
      WF.showAlertDialog(`${body}<br><br><i>No matches found.</i>`, title)
    }
  }

  const createElementFromHTML = html => {
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    return template.content.firstChild
  }

  const icon = createElementFromHTML(
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

  const addButton = () => {
    if (document.querySelectorAll('.gavin-find-and-replace-button').length) return

    // Find our elements
    const searchWrapper = searchInput.closest('label').parentElement
    const starButton = searchWrapper.querySelector(
      'svg[width="20"][height="20"][fill="none"]',
    ).parentElement
    const buttonsWrapper = starButton.parentElement

    // Build our button
    const button = starButton.cloneNode(true)
    button.querySelector('svg').replaceWith(icon)
    button.onclick = findAndReplace
    button.title = 'Find & Replace'
    button.classList.add('gavin-find-and-replace-button')

    // TODO: Mobile input has 1px padding, so this breaks
    // // Increase padding for search input
    // const paddingRight = getComputedStyle(searchInput).paddingRight
    // if (!paddingRight.includes('px'))
    //   throw new Error('Gavin: Unable to parse search input padding; doesn’t use px')
    //
    // searchInput.style.paddingRight = `${Number.parseInt(paddingRight) + 30}px`

    // Append the button
    buttonsWrapper.firstChild.before(button)
  }

  const appObserver = new MutationObserver(() => {
    searchInput = document.getElementById('srch-input')

    if (!searchInput) return

    appObserver.disconnect()

    if (!!searchInput.value) {
      // Currently searching
      addButton()
    } else {
      searchInput.addEventListener('keyup', addButton, { once: true })
    }
  })

  document.head.appendChild(style)
  appObserver.observe(document.getElementById('app'), { childList: true })
})()
