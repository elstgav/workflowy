import { readFileSync } from 'node:fs'

import { stripIndent } from 'proper-tags'
import { type UserConfig } from 'tsdown'

import { versionForToday } from '@/build/versioning'
import { REPO_RAW_BASE_URL } from '@/constants'

const USERSCRIPT_BLOCK = /^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==\s*/m
const AUTHOR = /^[\s/]*@author.*$/m

export const generateUserscriptHeader: UserConfig['plugins'] = {
  name: 'userscript-header',
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue
      if (!chunk.facadeModuleId) continue

      const sourceText = readFileSync(chunk.facadeModuleId, 'utf8')
      const sourceHeader = sourceText.match(USERSCRIPT_BLOCK)?.[0].trimEnd()

      if (!sourceHeader) return

      const header = sourceHeader.replace(AUTHOR, (authorLine) =>
        stripIndent`
          ${authorLine}
          // @version      ${versionForToday()}
          // @license      MIT
          //
          // @namespace    https://github.com/elstgav
          // @homepageURL  https://github.com/elstgav/workflowy
          // @supportURL   https://github.com/elstgav/workflowy/issues
          //
          // @downloadURL  ${REPO_RAW_BASE_URL}/dist/${chunk.fileName}
          // @updateURL    ${REPO_RAW_BASE_URL}/dist/${chunk.fileName}
          //
          // @match        https://workflowy.com/*
        `.trim(),
      )

      if (!header) continue

      chunk.code = `${header}\n\n${chunk.code}`
    }
  },
}
