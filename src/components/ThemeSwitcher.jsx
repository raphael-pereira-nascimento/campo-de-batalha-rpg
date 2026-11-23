import { useEffect, useRef, useState } from 'react';
import { TEMAS, temaAtual, salvarTema, observarTema } from '../theme.js';

// Montado no boot, fora do App: aparece nas 13 páginas sem repetir o botão
// em cada topbar. Fixed no canto, com alvo de toque confortável no mobile.
export default function ThemeSwitcher() {
  const [aberto, setAberto] = useState(false);
  const [tema, setTema] = useState(() => temaAtual());
  const ref = useRef(null);

  useEffect(() => observarTema(setTema), []);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => {
      if (!ref.current || !ref.current.contains(e.target)) setAberto(false);
    };
    const esc = (e) => {
      if (e.key === 'Escape') setAberto(false);
    };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const escolher = (id) => {
    setTema(salvarTema(id));
    setAberto(false);
  };

  return (
    <div className="theme-switcher" ref={ref}>
      {aberto && (
        <div className="theme-menu" role="menu" aria-label="Escolher estilo visual">
          <strong className="theme-menu-title">🎨 Estilo do site</strong>
          {TEMAS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={tema === t.id}
              className={tema === t.id ? 'theme-option ativo' : 'theme-option'}
              onClick={() => escolher(t.id)}
            >
              {t.nome}
              {tema === t.id && <span aria-hidden="true"> ✓</span>}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="theme-switcher-btn"
        aria-label="Escolher estilo visual"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        🎨
      </button>
    </div>
  );
}
