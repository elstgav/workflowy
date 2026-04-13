import { fileURLToPath } from 'node:url'

import { format } from 'date-fns'

export const USERSCRIPT_METADATA_REGEX = /^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==\s*/m
export const AUTHOR_LINE_REGEX = /^(?<tag>[\s/]*@author\s+)(?<author>\S+).*$\n/m
export const VERSION_REGEX = /^(?<tag>[\s/]*@version\s+)(?<version>\S+).*$\n/m

export const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url))

export const REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/elstgav/workflowy/main'

export const versionForToday = () => format(new Date(), 'yyyy.MM.dd')
