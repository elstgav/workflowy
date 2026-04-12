import { defineConfig, type OxlintConfig } from 'oxlint'
import type { OmitIndexSignature } from 'type-fest'

export default defineConfig({
  env: { browser: true },
  globals: { WF: 'readonly' },
  options: {
    typeAware: true,
    typeCheck: true,
  },
  rules: {
    'capitalized-comments': 'off',
    curly: 'off',
    'func-names': 'off',
    'func-style': 'off',
    'max-statements': 'off',
    'no-magic-numbers': 'off',
    'no-ternary': 'off',
    'sort-keys': 'off',
    'unicorn/prefer-global-this': 'off',
  },
  ignorePatterns: ['dist/**', 'node_modules/**'],
} as const satisfies OmitIndexSignature<OxlintConfig>)
