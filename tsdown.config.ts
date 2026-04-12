/// <reference types="node" />

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
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
const VERSION_LINE_PATTERN = /^(\s*(?:(?:\/\/)|(?:\/\*))?\s*@version\s+)(\S+)(.*)$/m
const SUPPORT_URL_PATTERN = /^(\s*\/\/\s*@supportURL\s+.+)$/m
const VERSION_PLACEHOLDER = '{YYYY.MM.DD}'
const VERSION_SENTINEL = '__VERSION__'
const TODAY_VERSION = (() => {
  const now = new Date()
  return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`
})()
const PREVIOUS_OUTPUT_TEXTS = new Map<string, string>()

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

const readTextIfExists = (filePath: string) =>
  existsSync(filePath) ? readFileSync(filePath, 'utf8') : null

const replaceVersion = (text: string, version: string) => {
  if (!VERSION_LINE_PATTERN.test(text)) {
    throw new Error(`Missing @version directive in ${text.slice(0, 120)}`)
  }

  return text.replace(VERSION_LINE_PATTERN, `$1${version}$3`)
}

const normalizeVersion = (text: string) => replaceVersion(text, VERSION_SENTINEL)

const normalizeVersionOrNull = (text: string) =>
  VERSION_LINE_PATTERN.test(text) ? replaceVersion(text, VERSION_SENTINEL) : null

const getVersion = (text: string) => text.match(VERSION_LINE_PATTERN)?.[2] ?? null

const getReusableVersion = (text: string | undefined) => {
  if (text == null) return null

  const version = getVersion(text)
  return version == null || version === VERSION_PLACEHOLDER ? null : version
}

const injectDownloadUrls = (header: string, relativeScriptPath: string) => {
  const downloadUrl = toDownloadUrl(relativeScriptPath)
  return header.replace(
    SUPPORT_URL_PATTERN,
    `$1\n// @downloadURL  ${downloadUrl}\n// @updateURL    ${downloadUrl}`,
  )
}

const createUserscriptHeader = (scriptPath: string, version: string) => {
  const sourceText = readFileSync(scriptPath, 'utf8')
  const headerMatch = sourceText.match(USERSCRIPT_HEADER_PATTERN)
  if (!headerMatch) throw new Error(`Missing userscript metadata block in ${scriptPath}`)

  const relativeScriptPath = toRelativeScriptPath(scriptPath)
  const header = replaceVersion(
    injectDownloadUrls(headerMatch[0].trimEnd(), relativeScriptPath),
    version,
  )

  return `${header}\n`
}

const rewriteBuiltUserscripts = () => {
  const changedOutputPaths: string[] = []

  for (const [entryName, scriptPath] of Object.entries(SCRIPT_ENTRIES)) {
    const outputPath = toOutputPath(entryName)
    const outputText = readFileSync(outputPath, 'utf8')
    const rewrittenBody = outputText.replace(USERSCRIPT_HEADER_PATTERN, '').trimStart()
    const normalizedOutput = `${createUserscriptHeader(scriptPath, VERSION_SENTINEL)}\n${rewrittenBody}`
    const previousOutputText = PREVIOUS_OUTPUT_TEXTS.get(outputPath)
    const previousNormalizedOutput =
      previousOutputText == null ? null : normalizeVersionOrNull(previousOutputText)
    const outputChanged =
      previousNormalizedOutput == null || previousNormalizedOutput !== normalizedOutput

    if (outputChanged) changedOutputPaths.push(outputPath)

    const version = outputChanged
      ? TODAY_VERSION
      : (getReusableVersion(previousOutputText) ?? TODAY_VERSION)
    if (!version) throw new Error(`Missing previous version for ${outputPath}`)

    writeFileSync(outputPath, `${createUserscriptHeader(scriptPath, version)}\n${rewrittenBody}`)
  }

  return changedOutputPaths
}

const rewriteCopiedStylesheet = () => {
  const stylesheet = readFileSync(STYLESHEET_OUTPUT_PATH, 'utf8')
  const previousOutputText = PREVIOUS_OUTPUT_TEXTS.get(STYLESHEET_OUTPUT_PATH)
  const normalizedOutput = normalizeVersion(stylesheet)
  const previousNormalizedOutput =
    previousOutputText == null ? null : normalizeVersionOrNull(previousOutputText)
  const outputChanged =
    previousNormalizedOutput == null || previousNormalizedOutput !== normalizedOutput
  const version = outputChanged
    ? TODAY_VERSION
    : (getReusableVersion(previousOutputText) ?? TODAY_VERSION)

  if (!version) throw new Error(`Missing previous version for ${STYLESHEET_OUTPUT_PATH}`)

  writeFileSync(STYLESHEET_OUTPUT_PATH, replaceVersion(stylesheet, version))

  return outputChanged ? [STYLESHEET_OUTPUT_PATH] : []
}

const snapshotPreviousOutputs = () => {
  PREVIOUS_OUTPUT_TEXTS.clear()

  for (const entryName of Object.keys(SCRIPT_ENTRIES)) {
    const outputPath = toOutputPath(entryName)
    const outputText = readTextIfExists(outputPath)
    if (outputText != null) PREVIOUS_OUTPUT_TEXTS.set(outputPath, outputText)
  }

  const stylesheet = readTextIfExists(STYLESHEET_OUTPUT_PATH)
  if (stylesheet != null) PREVIOUS_OUTPUT_TEXTS.set(STYLESHEET_OUTPUT_PATH, stylesheet)
}

const formatOutputs = (outputPaths: string[]) => {
  if (outputPaths.length === 0) return

  execFileSync(
    'pnpm',
    ['fmt', ...outputPaths.map((outputPath) => path.relative(ROOT_DIR, outputPath))],
    {
      cwd: ROOT_DIR,
    },
  )
}

const rewriteOutputs = () => {
  const changedOutputPaths = [...rewriteBuiltUserscripts(), ...rewriteCopiedStylesheet()]
  formatOutputs(changedOutputPaths)
  snapshotPreviousOutputs()
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
  hooks: {
    'build:done': rewriteOutputs,
    'build:prepare': snapshotPreviousOutputs,
  },
  outputOptions: { entryFileNames: '[name].js' },
  platform: 'browser',
  target: 'esnext',
})
