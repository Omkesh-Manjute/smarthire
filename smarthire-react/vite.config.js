import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('@remix-run')) {
              return 'vendor-react';
            }
            if (id.includes('firebase') || id.includes('idb')) {
              return 'vendor-firebase';
            }
            if (id.includes('pdfjs-dist') || id.includes('pdf-parse') || id.includes('mammoth')) {
              return 'vendor-docs';
            }
            const pkgName = id.toString().split('node_modules/')[1].split('/')[0].replace(/^@/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            return `vendor-${pkgName}`;
          }
        }
      }
    }
  }
})
