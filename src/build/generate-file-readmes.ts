import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { Eta } from 'eta'

import { OutputFiles } from '@/build/file-classes'
import { SRC_DIR } from '@/build/helpers'

const eta = new Eta({ views: path.join(SRC_DIR, 'templates') })

export const generateFileREADMEs = () => {
  for (const file of OutputFiles.files) {
    const srcREADMEPath = path.join(SRC_DIR, file.path.replace('dist/', ''), '../README.md')
    const srcREADME = existsSync(srcREADMEPath) ? readFileSync(srcREADMEPath, 'utf8').trim() : ''

    writeFileSync(
      path.join(file.path, '../README.md'),
      eta.render('./FILE_README.md.eta', { file, srcREADME }) + '\n',
    )
  }
}
