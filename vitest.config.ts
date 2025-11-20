import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['spec/config/setup.js'],
    include: ['**/*.spec.js']
  }
})
