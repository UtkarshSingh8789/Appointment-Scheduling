import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
<<<<<<< HEAD
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-hot-toast'],
          'query-vendor': ['@tanstack/react-query', 'axios', 'zustand'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-vendor': ['date-fns', 'dayjs'],
        },
      },
    },
  },
=======
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
  server: {
    port: 3000,
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://127.0.0.1:8000',
=======
        target: 'http://localhost:8000',
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
        changeOrigin: true,
      },
    },
  },
});
