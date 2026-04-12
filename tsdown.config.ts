/// <reference types="node" />

import { execSync } from 'node:child_process'
import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { format } from 'date-fns'
import { stripIndent } from 'proper-tags'
import { defineConfig, type TsdownHooks, type UserConfig } from 'tsdown'

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url))

const REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/elstgav/workflowy/main'

const USERSCRIPT_BLOCK = /^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==\s*/m
const VERSION = /^(?<tag>[\s/]*@version\s+)(?<version>\S+.*)$\n/m
const AUTHOR = /^[\s/]*@author.*$/m

const TODAY_VERSION = format(new Date(), 'yyyy.MM.dd')

const previousOutputs = new Map<string, string>()

const distFilePaths = () =>
  globSync('dist/**/*', { cwd: ROOT_DIR }).filter((file) => statSync(file).isFile())

const preBuild: TsdownHooks['build:prepare'] = () => {
  previousOutputs.clear()

  for (const outputPath of distFilePaths()) {
    previousOutputs.set(outputPath, readFileSync(outputPath, 'utf8'))
  }
}

const postBuild: TsdownHooks['build:done'] = () => {
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

const userscriptHeaderPlugin: UserConfig['plugins'] = {
  name: 'userscript-header',
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue
      if (!chunk.facadeModuleId) continue

      const sourceText = readFileSync(chunk.facadeModuleId, 'utf8')
      const sourceHeader = sourceText.match(USERSCRIPT_BLOCK)?.[0].trimEnd()

      if (!sourceHeader) return

      const header = sourceHeader.replace(AUTHOR, (authorLine) =>
        stripIndent`${authorLine}
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
        `.trimEnd(),
      )

      if (!header) continue

      chunk.code = `${header}\n\n${chunk.code}`
    }
  },
}

export default defineConfig({
  entry: ['src/scripts/**/*.ts'],

  platform: 'browser',
  target: 'esnext',

  copy: [{ from: 'src/workflowy.css', to: 'dist/', rename: 'workflowy.user.css' }],
  hooks: {
    'build:prepare': preBuild,
    'build:done': postBuild,
  },
  plugins: [userscriptHeaderPlugin],

  clean: true,
  hash: false,

  outputOptions: {
    entryFileNames: ({ name }: { name: string }) => {
      const dir = path.posix.dirname(name)
      const base = path.posix.basename(name)

      return path.posix.join(dir, `workflowy.${base}.user.js`)
    },
  },
})
