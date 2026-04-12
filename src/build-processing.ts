/// <reference types="node" />

import { execSync } from 'node:child_process'
import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { format } from 'date-fns'
import { stripIndent } from 'proper-tags'
import { type TsdownHooks, type UserConfig } from 'tsdown'

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))

const REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/elstgav/workflowy/main'

const USERSCRIPT_BLOCK = /^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==\s*/m
const VERSION = /^(?<tag>[\s/]*@version\s+)(?<version>\S+.*)$\n/m
const AUTHOR = /^[\s/]*@author.*$/m

const TODAY_VERSION = format(new Date(), 'yyyy.MM.dd')

const previousOutputs = new Map<string, string>()

const distFilePaths = () =>
  globSync('dist/**/*', { cwd: ROOT_DIR }).filter((file) => statSync(file).isFile())

export const preBuild: TsdownHooks['build:prepare'] = () => {
  previousOutputs.clear()

  for (const outputPath of distFilePaths()) {
    previousOutputs.set(outputPath, readFileSync(outputPath, 'utf8'))
  }
}

export const postBuild: TsdownHooks['build:done'] = () => {
  execSync('pnpm fmt dist', { cwd: ROOT_DIR })

  const withoutVersion = (text: string) => text.replace(VERSION, '')

  for (const [outputPath, before] of previousOutputs) {
    const after = (() => {
      const contents = readFileSync(outputPath, 'utf8')

      if (outputPath.endsWith('.css')) {
        return contents.replace(VERSION, `$<tag>${TODAY_VERSION}\n`)
      }

      return contents
    })()

    const isSameAsBefore = before && withoutVersion(before) === withoutVersion(after)

    writeFileSync(outputPath, isSameAsBefore ? before : after)
  }
}

export const userscriptHeaderPlugin: UserConfig['plugins'] = {
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
          // @version      ${TODAY_VERSION}
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
