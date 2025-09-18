import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    testTimeout: 10000,
    reporters: ['verbose']
  },
  resolve: {
    alias: {
      '@': './lib'
    }
  }
});
