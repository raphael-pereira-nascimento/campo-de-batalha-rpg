// Entrada única das páginas standalone (mesa-de-batalha.html etc.).
// Cada HTML declara a página inicial em <meta name="cbr-view" content="...">.
import { boot } from './boot.jsx';

const meta = typeof document !== 'undefined'
  ? document.querySelector('meta[name="cbr-view"]')
  : null;

boot(meta?.content || undefined);
