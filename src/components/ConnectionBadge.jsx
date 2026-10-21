import { isOffline } from '../api.js';

// Indica claramente onde os dados estão sendo salvos, para o jogador saber se
// a conta/fichas vão para o servidor (online) ou só para este navegador (offline).
export default function ConnectionBadge() {
  const offline = isOffline();
  return (
    <span
      className={offline ? 'conn-badge offline' : 'conn-badge online'}
      title={
        offline
          ? 'Modo offline: conta, fichas e criações ficam salvas apenas neste navegador. Limpar os dados do navegador apaga tudo.'
          : 'Modo online: conta, fichas e criações são salvas no servidor e ficam disponíveis em qualquer dispositivo.'
      }
    >
      {offline ? '● Offline (salvo só neste navegador)' : '● Online (salvo no servidor)'}
    </span>
  );
}
