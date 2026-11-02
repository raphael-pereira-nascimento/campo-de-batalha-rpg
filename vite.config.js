import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        'mesa-de-batalha': 'mesa-de-batalha.html',
        'campo-de-batalha': 'campo-de-batalha.html',
        masmorras: 'masmorras.html',
        taverna: 'taverna.html',
        personagens: 'personagens.html',
        arsenal: 'arsenal.html',
        regras: 'regras.html',
        forja: 'forja.html',
        loja: 'loja.html',
        registro: 'registro.html',
        materiais: 'materiais.html',
        equipamentos: 'equipamentos.html',
      },
    },
  },
});
