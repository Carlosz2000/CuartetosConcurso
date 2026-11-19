import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: '/login.html'
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'landing.html'),
        login: resolve(__dirname, 'login.html'),
        admin: resolve(__dirname, 'admin.html'),
        profesor: resolve(__dirname, 'profesor.html'),
        representante: resolve(__dirname, 'representante.html'),
        jurado: resolve(__dirname, 'jurado.html'),
        cronograma: resolve(__dirname, 'cronograma.html')
      }
    }
  }
});