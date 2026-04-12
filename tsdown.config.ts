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

const USERSCRIPT_HEADER_PATTERN = /^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==\s*/m
const VERSION_LINE_PATTERN = /^(?<tag>[\s/]*@version\s+)(?<version>\S+.*)$/m
const AUTHOR_PATTERN = /^[\s/]*@author.*$/m

const TODAY_VERSION = format(new Date(), 'yyyy.MM.dd')

const previousOutputs = new Map<string, string>()

const outputPaths = () =>
  globSync('dist/**/*', { cwd: ROOT_DIR })
    .map((file) => path.join(ROOT_DIR, file))
    .filter((file) => statSync(file).isFile())

const preBuild: TsdownHooks['build:prepare'] = () => {
  previousOutputs.clear()

  for (const outputPath of outputPaths()) {
    previousOutputs.set(outputPath, readFileSync(outputPath, 'utf8'))
  }
}

const postBuild: TsdownHooks['build:done'] = () => {
  execSync('pnpm fmt dist', { cwd: ROOT_DIR })

  const withoutVersion = (text: string) => text.replace(VERSION_LINE_PATTERN, '')

  for (const outputPath of outputPaths()) {
    const before = previousOutputs.get(outputPath)
    const after = (() => {
      const contents = readFileSync(outputPath, 'utf8')

      if (outputPath.endsWith('.css')) {
        return contents.replace(VERSION_LINE_PATTERN, `$<tag>${TODAY_VERSION}`)
      }

      return contents
    })()

    writeFileSync(
      outputPath,
      before && withoutVersion(before) === withoutVersion(after) ? before : after,
    )
  }
}

const userscriptHeaderPlugin: UserConfig['plugins'] = {
  name: 'userscript-header',
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue
      if (!chunk.facadeModuleId) continue

      const sourceText = readFileSync(chunk.facadeModuleId, 'utf8')
      const sourceHeader = sourceText.match(USERSCRIPT_HEADER_PATTERN)?.[0].trimEnd()

      if (!sourceHeader) return

      const header = sourceHeader.replace(AUTHOR_PATTERN, (authorLine) =>
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
