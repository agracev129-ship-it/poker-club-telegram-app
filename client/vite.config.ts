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
    minify: 'esbuild', // Минификация включена для уменьшения размера файлов
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

