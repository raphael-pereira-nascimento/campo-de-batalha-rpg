import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  // Base relativa: funciona no GitHub Pages, em servidos locais e atrás de proxies
  // (caminhos absolutos quebravam o build com "tela branca" fora do subpath esperado).
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
}));
