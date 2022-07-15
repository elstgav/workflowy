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
  function findAndReplace() {
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
    `<svg width="18" height="18" viewBox="0 0 521.92 521.92"><path d="M230.088 104.839c0-4.422 1.732-8.589 4.862-11.715l88.428-88.425c6.253-6.265 17.17-6.265 23.424 0 6.461 6.455 6.461 16.97 0 23.431l-60.153 60.142h87.337c73.737 0 133.726 59.988 133.726 133.726 0 69.604-69.771 124.74-118.015 129.321-6.703.018-14.865-5.68-12.88-18.914 2.418-8.559 19.252-12.359 20.292-12.602 44.337-10.48 77.467-50.301 77.467-97.806 0-55.467-45.123-100.59-100.59-100.59H286.66l60.142 60.154c6.461 6.454 6.461 16.964 0 23.424-6.266 6.271-17.171 6.254-23.424 0l-88.428-88.431a16.458 16.458 0 0 1-4.862-11.715zm2.223 245.858h-46.849l49.812 49.811h-87.331c-55.473 0-100.596-45.129-100.596-100.59 0-16.248 3.975-31.521 10.894-45.075-1.132-2.896-2.196-5.798-3.121-8.677-3.047-9.481-4.688-19.305-5.612-29.241-20.555 22.325-35.299 51.081-35.299 82.993 0 73.743 59.988 133.731 133.729 133.731h87.331l-60.151 60.142c-6.452 6.455-6.452 16.965 0 23.431 6.254 6.266 17.171 6.266 23.424 0l88.438-88.431a16.463 16.463 0 0 0 4.853-11.709c0-4.428-1.732-8.589-4.853-11.722l-54.669-54.663zm75.498-68.683c12.105-16.42 19.843-35.051 23.33-54.296-14.098-11.106-26.941-23.933-38.261-37.569 4.374 28-4.008 57.612-25.54 79.146-35.813 35.813-94.079 35.813-129.883 0-35.816-35.813-35.816-94.076 0-129.883 21.092-21.101 49.925-29.43 77.416-25.629 1.782-14.333 6.345-28.105 17.803-35.979-40.202-10.485-92.249 3.127-122.979 33.857-51.107 51.104-51.107 134.275 0 185.391 46.388 46.388 119.099 50.52 170.363 12.72L444.772 474.48c7.661 7.673 20.091 7.673 27.758 0 7.66-7.66 7.66-20.084 0-27.75L307.809 282.014z" stroke="none" fill="currentColor"/></svg>`,
  )

  const style = createElementFromHTML(
    `<style>#srch-input[value=""] ~ div .gavin-find-and-replace-button { display: none }</style>`,
  )

  const addButton = event => {
    const searchInput = event.target

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

    // Increase padding for search input
    const paddingRight = getComputedStyle(searchInput).paddingRight
    if (!paddingRight.includes('px'))
      throw new Error('Gavin: Unable to parse search input padding; doesn’t use px')

    searchInput.style.paddingRight = `${Number.parseInt(paddingRight) + 30}px`

    // Append the button
    buttonsWrapper.firstChild.before(button)
    document.head.appendChild(style)
  }

  let attempts = 0

  const waitForActivePage = () => {
    const searchInput = document.getElementById('srch-input')

    if (!searchInput) {
      return ++attempts <= 5 && setTimeout(waitForActivePage, 300)
    }

    searchInput.addEventListener('keyup', addButton, { once: true })
  }

  waitForActivePage()
})()
