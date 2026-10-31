import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// /api se redirige al backend: el frontend nunca escribe la URL completa.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
