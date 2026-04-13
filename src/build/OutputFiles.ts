import { execSync } from 'node:child_process'
import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs'

import {
  AUTHOR_TAG_REGEX,
  DESCRIPTION_TAG_REGEX,
  DOWNLOAD_URL_TAG_REGEX,
  METADATA_REGEX,
  NAME_TAG_REGEX,
  ROOT_DIR,
  VERSION_TAG_REGEX,
  versionForToday,
} from '@/build/helpers'

export class OutputFile {
  readonly snapshot: string

  constructor(readonly path: string) {
    this.snapshot = this.contents
  }

  get contents() {
    return readFileSync(this.path, 'utf8')
  }

  get metadata() {
    const metadata = this.contents.match(METADATA_REGEX)?.groups?.metadata

    return {
      name: metadata?.match(NAME_TAG_REGEX)?.groups?.name,
      description: metadata?.match(DESCRIPTION_TAG_REGEX)?.groups?.description,
      author: metadata?.match(AUTHOR_TAG_REGEX)?.groups?.author,
      version: metadata?.match(VERSION_TAG_REGEX)?.groups?.version,
      downloadUrl: metadata?.match(DOWNLOAD_URL_TAG_REGEX)?.groups?.downloadUrl,
    }
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

  get hasChanged() {
    if (!this.snapshot) return true

    const withoutVersion = (text: string) => text.replace(VERSION_TAG_REGEX, '')
    return withoutVersion(this.contents) === withoutVersion(this.snapshot)
  }

  replace(newContents: string | ((prevContents: string) => string)) {
    writeFileSync(
      this.path,
      typeof newContents === 'string' ? newContents : newContents(this.contents),
    )
  }

  resetIfUnchanged() {
    if (!this.hasChanged) return
    this.replace(this.snapshot)
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
      cssFile.replace((contents) =>
        contents.replace(VERSION_TAG_REGEX, `$<tag>${versionForToday()}\n`),
      )
    })
  }

  restoreDatesIfUnchanged() {
    this.#files.forEach((file) => file.resetIfUnchanged())
  }
}

export const OutputFiles = new OutputFilesSingleton()
