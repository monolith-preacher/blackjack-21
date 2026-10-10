import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
