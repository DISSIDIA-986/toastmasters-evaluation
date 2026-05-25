import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    // Ensure auth helpers have a secret in every test run.
    env: { COOKIE_SECRET: 'test-cookie-secret-at-least-16-chars', ADMIN_PASSWORD: 'hunter2' },
  },
  resolve: {
    // Mirror the tsconfig "@/*" path alias so route handlers import cleanly.
    alias: { '@': resolve(__dirname, 'src') },
  },
});
