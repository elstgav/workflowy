import path from 'node:path'

import { defineConfig } from 'tsdown'

import { postBuild, preBuild, userscriptHeaderPlugin } from '@/build-processing'

export default defineConfig({
  entry: ['src/scripts/**/*.ts'],

  platform: 'browser',
  target: 'esnext',

  copy: [{ from: 'src/workflowy.css', rename: 'workflowy.user.css' }],
  hooks: {
    'build:prepare': preBuild,
    'build:done': postBuild,
  },
  plugins: [userscriptHeaderPlugin],

  clean: true,
  hash: false,

  outputOptions: {
    entryFileNames: ({ name }: { name: string }) => {
      const dir = path.posix.dirname(name)
      const base = path.posix.basename(name)

      return path.posix.join(dir, `workflowy.${base}.user.js`)
    },
  },
})
