import { useMemo, useState } from 'react';
import { MATERIAL_LIST } from '../game/materials.js';
import {
  MATERIAL_CATEGORIAS,
  MATERIAL_QUALIDADES,
  MATERIAL_RARIDADES,
  filtrarMateriais,
  ordenarMateriais,
} from '../game/materialRules.js';
import MaterialCard from '../components/MaterialCard.jsx';
import MaterialDetails from '../components/MaterialDetails.jsx';
import MaterialComposition from '../components/MaterialComposition.jsx';

const CATEGORIAS_FILTRO = Object.entries(MATERIAL_CATEGORIAS)
  .filter(([, info]) => !info.oculto);

const FAIXAS_PRECO = [
  { id: 'todas', nome: 'Qualquer preço' },
  { id: 'ate-1', nome: 'Até 1 Ouro/kg', max: 1000 },
  { id: 'ate-10', nome: 'Até 10 Ouros/kg', max: 10000 },
  { id: 'ate-50', nome: 'Até 50 Ouros/kg', max: 50000 },
  { id: 'acima-50', nome: 'Acima de 50 Ouros/kg', min: 50001 },
];

export default function Materiais({ onBack }) {
  const [aba, setAba] = useState('catalogo');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [qualidade, setQualidade] = useState('todas');
  const [raridade, setRaridade] = useState('todas');
  const [faixaPreco, setFaixaPreco] = useState('todas');
  const [ordenacao, setOrdenacao] = useState('nome');
  const [materialAberto, setMaterialAberto] = useState(null);

  const faixa = FAIXAS_PRECO.find((item) => item.id === faixaPreco) || FAIXAS_PRECO[0];

  const resultados = useMemo(() => {
    const filtrados = filtrarMateriais(MATERIAL_LIST, {
      busca,
      categoria,
      qualidade,
      raridade,
      precoMin: faixa.min,
      precoMax: faixa.max,
    });
    return ordenarMateriais(filtrados, ordenacao);
  }, [busca, categoria, qualidade, raridade, faixa, ordenacao]);

  const limparFiltros = () => {
    setBusca('');
    setCategoria('todas');
    setQualidade('todas');
    setRaridade('todas');
    setFaixaPreco('todas');
    setOrdenacao('nome');
  };

  const filtrosAtivos = busca || categoria !== 'todas' || qualidade !== 'todas'
    || raridade !== 'todas' || faixaPreco !== 'todas' || ordenacao !== 'nome';

  return (
    <div className="page">
      <header className="topbar">
        <h1>📦 Materiais</h1>
        <button className="ghost" onClick={onBack}>← Voltar</button>
      </header>

      <div className="content">
        <p className="subtitle">
          Catálogo de minérios, metais, materiais especiais e mágicos usados na forja.
          Qualidade e raridade são classificações diferentes.
        </p>

        <div className="material-abas">
          <button
            type="button"
            className={aba === 'catalogo' ? '' : 'ghost'}
            onClick={() => setAba('catalogo')}
          >
            Catálogo
          </button>
          <button
            type="button"
            className={aba === 'composicao' ? '' : 'ghost'}
            onClick={() => setAba('composicao')}
          >
            Composição
          </button>
        </div>

        {aba === 'catalogo' ? (
          <>
            <div className="material-filtros">
              <input
                type="search"
                placeholder="Buscar por nome ou apelido..."
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                aria-label="Buscar material"
              />

              <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)} aria-label="Filtrar por categoria">
                <option value="todas">Todas as categorias</option>
                {CATEGORIAS_FILTRO.map(([chave, info]) => (
                  <option key={chave} value={chave}>{info.icone} {info.plural}</option>
                ))}
              </select>

              <select value={raridade} onChange={(evento) => setRaridade(evento.target.value)} aria-label="Filtrar por raridade">
                <option value="todas">Qualquer raridade</option>
                {Object.entries(MATERIAL_RARIDADES).map(([chave, info]) => (
                  <option key={chave} value={chave}>{info.nome}</option>
                ))}
                <option value="pendente">Pendente</option>
              </select>

              <select value={qualidade} onChange={(evento) => setQualidade(evento.target.value)} aria-label="Filtrar por qualidade">
                <option value="todas">Qualquer qualidade</option>
                {Object.entries(MATERIAL_QUALIDADES).map(([chave, info]) => (
                  <option key={chave} value={chave}>{info.nome}</option>
                ))}
                <option value="pendente">Pendente</option>
              </select>

              <select value={faixaPreco} onChange={(evento) => setFaixaPreco(evento.target.value)} aria-label="Filtrar por preço">
                {FAIXAS_PRECO.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </select>

              <select value={ordenacao} onChange={(evento) => setOrdenacao(evento.target.value)} aria-label="Ordenar">
                <option value="nome">Nome (A–Z)</option>
                <option value="preco-asc">Preço (menor)</option>
                <option value="preco-desc">Preço (maior)</option>
                <option value="raridade">Raridade</option>
                <option value="qualidade">Qualidade</option>
              </select>

              {filtrosAtivos && (
                <button type="button" className="ghost" onClick={limparFiltros}>
                  Limpar filtros
                </button>
              )}
            </div>

            <p className="muted material-resultado-info">
              {resultados.length} de {MATERIAL_LIST.length} materiais
            </p>

            {resultados.length === 0 ? (
              <div className="empty">
                <p>Nenhum material encontrado com esses filtros.</p>
                <button type="button" className="ghost" onClick={limparFiltros}>Limpar filtros</button>
              </div>
            ) : (
              <div className="material-grid">
                {resultados.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onSelect={setMaterialAberto}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="panel">
            <MaterialComposition materiais={MATERIAL_LIST} />
          </div>
        )}
      </div>

      {materialAberto && (
        <MaterialDetails material={materialAberto} onClose={() => setMaterialAberto(null)} />
      )}
    </div>
  );
}
