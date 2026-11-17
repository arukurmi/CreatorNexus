import { configDefaults, defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    // happy-dom instead of jsdom — jsdom has a broken transitive ESM dep on this Node.
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
