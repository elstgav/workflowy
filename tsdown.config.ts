/// <reference types="node" />

import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const SCRIPTS_DIR = path.join(ROOT_DIR, 'src', 'scripts')
const STYLESHEET_SOURCE_PATH = path.join(ROOT_DIR, 'src', 'workflowy.css')
const STYLESHEET_OUTPUT_BASENAME = 'workflowy.user.css'
const STYLESHEET_OUTPUT_PATH = path.join(DIST_DIR, STYLESHEET_OUTPUT_BASENAME)
const REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/elstgav/workflowy/main'
const USERSCRIPT_HEADER_PATTERN = /^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==\s*/m
const VERSION_PATTERN = /^(\s*(\/\/)?\s*@version\s+)\{YYYY\.MM\.DD\}$/m
const SUPPORT_URL_PATTERN = /^(\s*\/\/\s*@supportURL\s+.+)$/m
const CURRENT_VERSION = (() => {
  const now = new Date()
  return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`
})()

const listTypeScriptEntries = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return listTypeScriptEntries(entryPath)
      if (entry.isFile() && entry.name.endsWith('.ts')) return [entryPath]
      return []
    })
    .sort((left, right) => left.localeCompare(right))

const toPosixPath = (filePath: string) => filePath.split(path.sep).join(path.posix.sep)

const toRelativeScriptPath = (filePath: string) => path.relative(SCRIPTS_DIR, filePath)

const toOutputStem = (relativeScriptPath: string) => {
  const directory = path.dirname(relativeScriptPath)
  const basename = path.basename(relativeScriptPath, '.ts')
  const filename = `workflowy.${basename}.user`
  return directory === '.' ? filename : path.posix.join(toPosixPath(directory), filename)
}

const toDownloadUrl = (relativeScriptPath: string) =>
  `${REPO_RAW_BASE_URL}/dist/${toOutputStem(relativeScriptPath)}.js`

const toOutputPath = (entryName: string) => path.join(DIST_DIR, `${entryName}.js`)

const replaceUserscriptVersion = (header: string) =>
  header.replace(VERSION_PATTERN, `$1${CURRENT_VERSION}`)

const replaceUserstyleVersion = (sourceText: string) =>
  sourceText.replace(VERSION_PATTERN, `$1${CURRENT_VERSION}`)

const injectDownloadUrls = (header: string, relativeScriptPath: string) => {
  const downloadUrl = toDownloadUrl(relativeScriptPath)
  return header.replace(
    SUPPORT_URL_PATTERN,
    `$1\n// @downloadURL  ${downloadUrl}\n// @updateURL    ${downloadUrl}`,
  )
}

const createUserscriptHeader = (scriptPath: string) => {
  const sourceText = readFileSync(scriptPath, 'utf8')
  const headerMatch = sourceText.match(USERSCRIPT_HEADER_PATTERN)
  if (!headerMatch) throw new Error(`Missing userscript metadata block in ${scriptPath}`)

  const relativeScriptPath = toRelativeScriptPath(scriptPath)
  const header = injectDownloadUrls(
    replaceUserscriptVersion(headerMatch[0].trimEnd()),
    relativeScriptPath,
  )

  return `${header}\n`
}

const rewriteBuiltUserscripts = () => {
  for (const [entryName, scriptPath] of Object.entries(SCRIPT_ENTRIES)) {
    const outputPath = toOutputPath(entryName)
    const outputText = readFileSync(outputPath, 'utf8')
    const rewrittenBody = outputText.replace(USERSCRIPT_HEADER_PATTERN, '').trimStart()
    const rewrittenOutput = `${createUserscriptHeader(scriptPath)}\n${rewrittenBody}`

    writeFileSync(outputPath, rewrittenOutput)
  }
}

const rewriteCopiedStylesheet = () => {
  const stylesheet = readFileSync(STYLESHEET_OUTPUT_PATH, 'utf8')
  writeFileSync(STYLESHEET_OUTPUT_PATH, replaceUserstyleVersion(stylesheet))
}

const rewriteOutputs = () => {
  rewriteBuiltUserscripts()
  rewriteCopiedStylesheet()
  execSync('pnpm fmt dist')
}

const SCRIPT_PATHS = listTypeScriptEntries(SCRIPTS_DIR)
const SCRIPT_ENTRIES: Record<string, string> = Object.fromEntries(
  SCRIPT_PATHS.map((scriptPath) => [toOutputStem(toRelativeScriptPath(scriptPath)), scriptPath]),
)

export default defineConfig({
  copy: [
    {
      from: STYLESHEET_SOURCE_PATH,
      rename: () => STYLESHEET_OUTPUT_BASENAME,
      to: DIST_DIR,
    },
  ],
  dts: false,
  entry: SCRIPT_ENTRIES,
  hash: false,
  hooks: { 'build:done': rewriteOutputs },
  outputOptions: { entryFileNames: '[name].js' },
  platform: 'browser',
  target: 'esnext',
})
