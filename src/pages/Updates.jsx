import { useMemo, useState } from 'react';

const UPDATES = [
  {
    id: '2026-11-23-sucos-laranja-teste',
    data: '23/11/2026',
    titulo: 'Sucos de Laranja de teste no Último Copo',
    tipo: 'Teste',
    resumo: 'Adição de três bebidas de teste na taverna Último Copo, com preços provisórios e comportamento isolado.',
    adicionado: [
      'Suco de Laranja Natural (Comum): +15% da Vida máxima, recuperação instantânea.',
      'Suco de Laranja Revigorante (Especial): +30% Vida máx., +15% Mana máx.; buffs +5% resistência física, +5% resistência a venenos, +5% velocidade por 3 turnos.',
      'Suco de Laranja Imperial (Premium): +40% Vida máx., +25% Mana máx.; buffs +10% resistência física, +10% resistência mágica, +10% velocidade, +5% dano físico, +5% dano mágico por 5 turnos.',
      'Barra de pesquisa na Taverna para localizar bebidas/comidas pelo nome ou descrição.',
    ],
    mudancas: [
      'Exibição dos cards da Taverna passou a mostrar categoria/qualidade, duração dos buffs e rótulo de preço de teste quando aplicável.',
      'Regras dos sucos de teste: recuperação por % do máximo, sem ultrapassar máximo, buffs de suco não acumulam entre si (novo substitui anterior), uso em combate consome a ação e duração em turnos de combate.',
    ],
  },
  {
    id: '2026-11-18-vibranium',
    data: '18/11/2026',
    titulo: 'Vibranium: ficha numérica e sistema de PE',
    tipo: 'Sistema',
    resumo: 'Implementação inicial do Vibranium com absorção cinética e Pontos de Energia (PE).',
    adicionado: [
      'Ficha numérica do Vibranium em materiais (qualidade Perfeita, raridade Mítica, 100 Ouros/kg).',
      'Sistema de PE: 60 PE/kg (Perfeito), absorção de 25% do dano cinético efetivo abatendo o dano sofrido.',
      'Capacidades por categoria: armadura 720, lâmina 120, impacto 240, fogo 300, acessório 30, mágico 90, golem 600 PE (núcleo).',
      'Exibição de PE máximo/absorção no preview da Forja e barra de PE na batalha quando aplicável.',
    ],
    mudancas: [
      'Combate: absorção cinética aplicada apenas a dano físico, com sobrecarga/trincas conforme regras aprovadas.',
      'Peças craftadas com Vibranium passam a guardar a configuração de PE da peça.',
    ],
  },
  {
    id: '2026-11-16-status-testes',
    data: '16/11/2026',
    titulo: 'Correção de teste de status',
    tipo: 'Correção',
    resumo: 'Ajuste no teste de dados para refletir os status válidos do projeto.',
    adicionado: [],
    mudancas: [
      'Teste de status atualizado para considerar os 10 status válidos (8 básicos + podridao + contaminacaoPandemica).',
    ],
  },
];

function Tag({ children }) {
  return <span className="tavern-tag" style={{ marginRight: 6, marginBottom: 6, display: 'inline-block' }}>{children}</span>;
}

export default function Updates({ onBack }) {
  const [busca, setBusca] = useState('');

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return UPDATES;
    return UPDATES.filter((u) => {
      const texto = [
        u.data, u.titulo, u.tipo, u.resumo,
        ...(u.adicionado || []),
        ...(u.mudancas || []),
      ].join(' ').toLowerCase();
      return texto.includes(q);
    });
  }, [busca]);

  return (
    <main className="page updates-page">
      <header className="topbar">
        <div>
          <h1>📰 Atualizações</h1>
          <span className="player-name">O que foi adicionado e o que mudou no site</span>
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
        <div className="tavern-head" style={{ marginBottom: 16 }}>
          <label style={{ flex: 1 }}>
            <span className="muted small">Pesquisar atualização</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: suco, vibranium, correção..."
              style={{ width: '100%' }}
            />
          </label>
        </div>

        {filtradas.length === 0 ? (
          <p className="muted">Nenhuma atualização encontrada para essa pesquisa.</p>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filtradas.map((u) => (
              <section key={u.id} className="tavern-card" style={{ display: 'block' }}>
                <div className="tavern-card-head" style={{ marginBottom: 8 }}>
                  <span className="tavern-card-icon" aria-hidden="true">🗞️</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block' }}>{u.titulo}</strong>
                    <div className="muted small">{u.data}</div>
                  </div>
                  <Tag>{u.tipo}</Tag>
                </div>
                <p className="tavern-card-desc" style={{ marginBottom: 12 }}>{u.resumo}</p>

                {u.adicionado?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1em' }}>Adicionado</h3>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {u.adicionado.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {u.mudancas?.length > 0 && (
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1em' }}>Mudanças</h3>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {u.mudancas.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
