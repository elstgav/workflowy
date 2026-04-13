import { readFileSync } from 'node:fs'

import { stripIndent } from 'proper-tags'
import { type UserConfig } from 'tsdown'

import {
  AUTHOR_TAG_REGEX,
  METADATA_REGEX,
  REPO_RAW_BASE_URL,
  versionForToday,
} from '@/build/helpers'

export const generateUserscriptHeader: UserConfig['plugins'] = {
  name: 'userscript-header',
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue
      if (!chunk.facadeModuleId) continue

      const sourceText = readFileSync(chunk.facadeModuleId, 'utf8')
      const sourceMetadata = sourceText.match(METADATA_REGEX)?.[0].trimEnd()

      if (!sourceMetadata) return

      const header = sourceMetadata.replace(
        AUTHOR_TAG_REGEX,
        (authorLine) =>
          stripIndent`
          ${authorLine.trim()}
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
        `,
      )

      if (!header) continue

      chunk.code = `${header}\n\n${chunk.code}`
    }
  },
}
