import { execSync } from 'node:child_process'
import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs'

import { type OutputChunk as RolldownOutputChunk } from 'rolldown'

import {
  AUTHOR_TAG_REGEX,
  DESCRIPTION_TAG_REGEX,
  METADATA_REGEX,
  NAME_TAG_REGEX,
  REPO_RAW_BASE_URL,
  ROOT_DIR,
  VERSION_TAG_REGEX,
  versionForToday,
} from '@/build/helpers'

class ScriptFile {
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

  get isREADME() {
    return this.path.endsWith('README.md')
  }

  get metadata() {
    const metadata = this.contents.match(METADATA_REGEX)?.groups?.metadata

    return {
      name: metadata?.match(NAME_TAG_REGEX)?.groups?.name,
      description: metadata?.match(DESCRIPTION_TAG_REGEX)?.groups?.description,
      author: metadata?.match(AUTHOR_TAG_REGEX)?.groups?.author,
      version: metadata?.match(VERSION_TAG_REGEX)?.groups?.version,
    }
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

export class OutputChunk extends ScriptFile {
  readonly chunk: RolldownOutputChunk
  readonly sourcePath: string

  constructor(chunk: RolldownOutputChunk) {
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

export class OutputFile extends ScriptFile {
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

class OutputFilesSingleton {
  #files: OutputFile[] = []

  get files() {
    return this.#files
  }

  get cssFiles() {
    return this.#files.filter((file) => file.isCSS)
  }

  formatFiles() {
    execSync('pnpm fmt dist', { cwd: ROOT_DIR })
  }

  update() {
    const latestDistFilePaths = globSync('dist/**/*', { cwd: ROOT_DIR }).filter((file) =>
      statSync(file).isFile(),
    )
    this.#files = latestDistFilePaths.map((path) => new OutputFile(path))
  }

  updateCSSVersions() {
    this.cssFiles.forEach((cssFile) => {
      cssFile.contents = cssFile.contents.replace(VERSION_TAG_REGEX, `$<tag>${versionForToday()}\n`)
    })
  }

  restoreDatesIfUnchanged() {
    this.#files.forEach((file) => file.resetIfUnchanged())
  }
}

export const OutputFiles = new OutputFilesSingleton()
