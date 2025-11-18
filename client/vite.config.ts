import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Оставляем console для отладки
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: undefined, // Отключаем автоматическое разделение на чанки
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});

