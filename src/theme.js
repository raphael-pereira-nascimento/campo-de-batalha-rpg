// Preferência visual do jogador. Vale para as 13 páginas porque o boot é
// compartilhado entre index.html e os HTMLs standalone. Nenhuma regra de jogo
// muda aqui: são só tokens de cor aplicados via `data-theme` no <html>.

export const TEMAS = [
  { id: 'escuro', nome: '🌙 Escuro', meta: '#0f1220' },
  { id: 'claro', nome: '☀️ Claro', meta: '#eef1fb' },
  { id: 'pergaminho', nome: '📜 Pergaminho', meta: '#efe2c4' },
  { id: 'contraste', nome: '◑ Alto contraste', meta: '#000000' },
];

const CHAVE = 'cbr_theme';
const PADRAO = 'escuro';

export function temaAtual() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return TEMAS.some((t) => t.id === salvo) ? salvo : PADRAO;
  } catch {
    return PADRAO;
  }
}

// Aplica antes do React montar para evitar flash de tema claro/escuro.
export function aplicarTema(id) {
  const tema = TEMAS.find((t) => t.id === id) || TEMAS[0];
  document.documentElement.dataset.theme = tema.id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', tema.meta);
  return tema.id;
}

export function salvarTema(id) {
  const tema = TEMAS.find((t) => t.id === id) || TEMAS[0];
  try {
    localStorage.setItem(CHAVE, tema.id);
  } catch {
    /* preferência não persistida (modo privado): tema ainda aplica nesta aba */
  }
  // Outros HTMLs abertos em abas da mesma origem acompanham a escolha.
  try {
    localStorage.setItem('cbr_theme_event', `${Date.now()}:${tema.id}`);
  } catch {
    /* ignorado */
  }
  return aplicarTema(tema.id);
}

export function observarTema(callback) {
  const handler = (e) => {
    if (e.key === CHAVE) callback(aplicarTema(e.newValue || PADRAO));
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
