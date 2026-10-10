import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  // Base absoluta: os links públicos de compartilhamento (/share/:id) são abertos
  // em sub-rotas — com base relativa o navegador procura /share/assets/* e o
  // catch-all do servidor devolve HTML (MIME errado → tela branca).
  base: '/',
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
