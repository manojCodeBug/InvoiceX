import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@stellar/freighter-api': path.resolve(__dirname, './src/test/freighterMock.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    server: {
      deps: {
        inline: [
          '@creit.tech/stellar-wallets-kit',
        ],
      },
    },
  },
});
