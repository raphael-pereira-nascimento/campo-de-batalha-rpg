import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initConnection } from './api.js';
import './styles.css';

const rootEl = document.getElementById('root');
rootEl.innerHTML =
  '<p style="font-family: system-ui, sans-serif; padding: 24px; color: #ccc">' +
  '⚔️ Carregando o Campo de Batalha...<br />' +
  '<small>Aguardando o servidor (modo online/offline)...</small></p>';

// Aguarda a sonda de conexão decidir entre modo online e offline.
initConnection().finally(() => {
  createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  // Sinaliza ao guard do index.html que a app montou (desliga o painel
  // anti-tela-branca).
  window.__APP_MOUNTED__ = true;
});

// Registra o service worker apenas em produção (PWA instalável). Usa BASE_URL
// para funcionar tanto na raiz quanto em subpasta (GitHub Pages).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
