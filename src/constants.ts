import { fileURLToPath } from 'node:url'

export const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
export const REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/elstgav/workflowy/main'
