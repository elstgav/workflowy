import { execSync } from 'node:child_process'
import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs'

import { type OutputChunk } from 'rolldown'

import {
  AUTHOR_TAG_REGEX,
  DESCRIPTION_TAG_REGEX,
  LICENSE_TAG_REGEX,
  METADATA_REGEX,
  NAME_TAG_REGEX,
  REPO_RAW_BASE_URL,
  ROOT_DIR,
  VERSION_TAG_REGEX,
  versionForToday,
} from '@/build/helpers'

class BaseScriptFile {
  protected _contents: string

  constructor(
    readonly path: string,
    contents: string,
  ) {
    this._contents = contents
  }

  get contents() {
    return this._contents
  }

  get isArchived() {
    return this.path.includes('/archive/')
  }

  get isCSS() {
    return this.path.endsWith('.css')
  }

  get isJavaScript() {
    return this.path.endsWith('.js')
  }

  get metadata() {
    const metadata = this.contents.match(METADATA_REGEX)?.groups?.metadata

    return {
      name: metadata?.match(NAME_TAG_REGEX)?.groups?.name,
      description: metadata?.match(DESCRIPTION_TAG_REGEX)?.groups?.description,
      author: metadata?.match(AUTHOR_TAG_REGEX)?.groups?.author,
      license: metadata?.match(LICENSE_TAG_REGEX)?.groups?.license,
      version: metadata?.match(VERSION_TAG_REGEX)?.groups?.version,
    }
  }

  get displayName() {
    if (!this.metadata.name) return undefined

    return `WorkFlowy - ${this.metadata.name}${this.isArchived ? ' [ARCHIVED]' : ''}`
  }

  get permalink() {
    return `${REPO_RAW_BASE_URL}/dist/${this.path.replace('dist/', '')}`
  }
}

export type OutputChunkReplacer = ({
  contents,
  sourceContents,
}: {
  contents: string
  sourceContents: string
}) => string

export class BuildChunk extends BaseScriptFile {
  readonly chunk: OutputChunk
  readonly sourcePath: string

  constructor(chunk: OutputChunk) {
    const path = chunk.fileName
    const sourcePath = chunk.facadeModuleId ?? ''
    const sourceContents = readFileSync(sourcePath, 'utf8')

    super(path, sourceContents)

    this.chunk = chunk
    this.sourcePath = sourcePath
  }

  get contents() {
    return this.chunk.code
  }

  set contents(contents: string) {
    this.chunk.code = contents
  }

  get isArchived() {
    return this.sourcePath.includes('/archive/')
  }

  get sourceContents() {
    return this._contents
  }
}

export class OutputScript extends BaseScriptFile {
  readonly snapshot: string

  constructor(readonly path: string) {
    super(path, '')
    this.snapshot = this.contents
  }

  get contents() {
    return readFileSync(this.path, 'utf8')
  }

  set contents(contents: string) {
    writeFileSync(this.path, contents)
  }

  get hasChanged() {
    if (!this.snapshot) return true

    const withoutVersion = (text: string) => text.replace(VERSION_TAG_REGEX, '')
    return withoutVersion(this.contents) === withoutVersion(this.snapshot)
  }

  resetIfUnchanged() {
    if (!this.hasChanged) return
    this.contents = this.snapshot
  }
}

class OutputScriptsSingleton {
  #files: OutputScript[] = []

  get files() {
    return this.#files
  }

  formatFiles() {
    execSync('pnpm fmt dist', { cwd: ROOT_DIR })
  }

  update() {
    const latestDistFilePaths = globSync('dist/**/*.{js,css}', { cwd: ROOT_DIR }).filter((file) =>
      statSync(file).isFile(),
    )
    this.#files = latestDistFilePaths.map((path) => new OutputScript(path))
  }

  updateCSSVersions() {
    const cssFiles = this.#files.filter((file) => file.isCSS)

    cssFiles.forEach((cssFile) => {
      cssFile.contents = cssFile.contents.replace(VERSION_TAG_REGEX, `$<tag>${versionForToday()}\n`)
    })
  }

  restoreDatesIfUnchanged() {
    this.#files.forEach((file) => file.resetIfUnchanged())
  }
}

export const OutputFiles = new OutputScriptsSingleton()
