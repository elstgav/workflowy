import { defineConfig, type OxfmtConfig } from 'oxfmt'
import type { OmitIndexSignature } from 'type-fest'

export default defineConfig({
  semi: false,
  singleQuote: true,
} as const satisfies OmitIndexSignature<OxfmtConfig>)
