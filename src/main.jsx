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
});

// Registra o service worker apenas em produção (PWA instalável).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
