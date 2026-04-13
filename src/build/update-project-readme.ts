import { readFileSync, writeFileSync } from 'node:fs'

import { orderBy, partition } from 'es-toolkit'

import { PROJECT_README_PATH } from '@/build/helpers'
import { OutputFile, OutputFiles } from '@/build/OutputFiles'

const ACTIVE_LIST_REGEX =
  /(?<open><!-- ACTIVE_LIST -->)(?<contents>.*)(?<close><!-- \/ACTIVE_LIST -->)/ms
const ARCHIVED_LIST_REGEX =
  /(?<open><!-- ARCHIVED_LIST -->)(?<contents>.*)(?<close><!-- \/ARCHIVED_LIST -->)/ms

export const updateProjectREADME = () => {
  OutputFiles.update()

  let READMEcontent = readFileSync(PROJECT_README_PATH, 'utf8')

  const [activeFiles, archivedFiles] = partition(OutputFiles.files, (file) => !file.isArchived)
  const matchers: [RegExp, OutputFile[]][] = [
    [ACTIVE_LIST_REGEX, activeFiles],
    [ARCHIVED_LIST_REGEX, archivedFiles],
  ]

  for (const [matcher, files] of matchers) {
    const entries = orderBy(files, [(file) => file.metadata.name], ['asc'])
      .map((file) =>
        [
          `- [${file.metadata.name}](${file.metadata.downloadUrl})  `,
          `  ${file.metadata.description}`,
        ].join('\n'),
      )
      .join('\n\n')
    READMEcontent = READMEcontent.replace(matcher, `$<open>\n\n${entries}\n\n$<close>`)
  }

  writeFileSync(PROJECT_README_PATH, READMEcontent)
}
