import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { format } from 'date-fns'

export const METADATA_REGEX =
  /^(?<header>\/\/ ==UserScript==|\/\* ==UserStyle==)$(?<metadata>.*?)^(?<footer>\/\/ ==\/UserScript==|==\/UserStyle== \*\/)$/ms

export const NAME_TAG_REGEX =
  /^(?<tag>[\s/]*@name\s+)(?<prefix>WorkFlowy - )?(?<name>.+?)(?<archived> \[ARCHIVED\])?$\n/m
export const DESCRIPTION_TAG_REGEX = /^(?<tag>[\s/]*@description\s+)(?<description>.+?)$\n/m
export const AUTHOR_TAG_REGEX = /^(?<tag>[\s/]*@author\s+)(?<author>.+?)$\n/m
export const LICENSE_TAG_REGEX = /^(?<tag>[\s/]*@license\s+)(?<license>.+?)$\n/m
export const VERSION_TAG_REGEX = /^(?<tag>[\s/]*@version\s+)(?<version>.+?)$\n/m
export const DOWNLOAD_URL_TAG_REGEX = /^(?<tag>[\s/]*@downloadURL\s+)(?<downloadUrl>.+?)$\n/m

export const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url))
export const SRC_DIR = path.join(ROOT_DIR, 'src')

export const PROJECT_README_PATH = path.join(ROOT_DIR, 'README.md')

export const REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/elstgav/workflowy/main'

export const versionForToday = () => format(new Date(), 'yyyy.MM.dd')
