// Entrada do harness de navegador. Importa os testes e publica o resultado em
// window.__TESTES__ para ser lido pelas ferramentas do navegador.
import { executarTestes } from './vitest-shim.js';
import './materials.test.js';
import './materialComposition.test.js';
import './materialSchema.test.js';
import './materialCatalog.test.js';
import './podridao.test.js';

executarTestes().then((resumo) => {
  window.__TESTES__ = resumo;
  const saida = document.getElementById('saida');
  if (saida) saida.textContent = JSON.stringify(resumo, null, 2);
});
