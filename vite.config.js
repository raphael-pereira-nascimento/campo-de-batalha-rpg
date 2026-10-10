import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  // Base configurável por ambiente:
  //  - Local e Render servem na raiz → base '/'.
  //  - GitHub Pages serve em subpasta (/campo-de-batalha-rpg/) e o workflow
  //    define VITE_BASE. Base absoluta na raiz quebrava o Pages (assets 404 →
  //    tela branca); base relativa quebrava as sub-rotas /share/:id.
  base: process.env.VITE_BASE || '/',
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
