import { stripIndent } from 'proper-tags'
import { type UserConfig } from 'tsdown'

import { OutputChunk } from '@/build/file-classes'
import { AUTHOR_TAG_REGEX, METADATA_REGEX, NAME_TAG_REGEX, versionForToday } from '@/build/helpers'

export const generateUserscriptHeader: UserConfig['plugins'] = {
  name: 'userscript-header',
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue
      if (!chunk.facadeModuleId) continue

      const outputChunk = new OutputChunk(chunk)
      const sourceMetadata = outputChunk.sourceContents.match(METADATA_REGEX)?.[0].trimEnd()

      if (!sourceMetadata) continue

      const header = sourceMetadata
        .replace(
          NAME_TAG_REGEX,
          `$<tag>WorkFlowy - $<name>${outputChunk.isArchived ? ' [ARCHIVED]' : ''}\n`,
        )
        .replace(
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
              // @downloadURL  ${outputChunk.permalink}
              // @updateURL    ${outputChunk.permalink}
              //
              // @match        https://workflowy.com/*
            `,
        )

      if (!header) continue

      outputChunk.contents = `${header}\n\n${outputChunk.contents}`
    }
  },
}
