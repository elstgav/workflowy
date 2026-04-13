import { type TsdownHooks, type UserConfig } from 'tsdown'

import { OutputFiles } from '@/build/file-classes'

import { generateFileREADMEs } from './generate-file-readmes'
import { generateUserscriptHeader } from './plugins/generate-userscript-header'
import { updateProjectREADME } from './update-project-readme'

export const preBuild: TsdownHooks['build:prepare'] = () => {
  OutputFiles.update()
}

export const postBuild: TsdownHooks['build:done'] = () => {
  OutputFiles.updateCSSVersions()
  OutputFiles.formatFiles()
  OutputFiles.restoreDatesIfUnchanged()
  generateFileREADMEs()
  updateProjectREADME()
}

export const plugins: UserConfig['plugins'][] = [
  // oxfmt-multiline
  generateUserscriptHeader,
]
