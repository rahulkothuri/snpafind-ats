import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load environment variables
config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    setupFiles: ['dotenv/config'],
  },
});
