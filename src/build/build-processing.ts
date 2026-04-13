import { type TsdownHooks, type UserConfig } from 'tsdown'

import { OutputFiles } from '@/build/OutputFiles'

import { generateUserscriptHeader } from './plugins/generate-userscript-header'
import { updateProjectREADME } from './update-project-readme'

export const preBuild: TsdownHooks['build:prepare'] = () => {
  OutputFiles.update()
}

export const postBuild: TsdownHooks['build:done'] = () => {
  OutputFiles.updateCSSVersions()
  OutputFiles.formatFiles()
  OutputFiles.restoreDatesIfUnchanged()
  updateProjectREADME()
}

export const plugins: UserConfig['plugins'][] = [
  // oxfmt-multiline
  generateUserscriptHeader,
]
