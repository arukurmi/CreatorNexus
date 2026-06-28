import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  // Transform component JSX/TSX without @vitejs/plugin-react (avoids the
  // Node 20.12 native-binding issue); React 19 uses the automatic runtime.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    // happy-dom instead of jsdom — jsdom has a broken transitive ESM dep on this Node.
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
