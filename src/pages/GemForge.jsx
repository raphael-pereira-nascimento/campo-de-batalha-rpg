import { useMemo, useState } from 'react';
import {
  gemas,
  getGemaById,
  verificarFusao,
  efeitosParaLista,
} from '../game/gems.js';
import GemPolisher from '../components/GemPolisher.jsx';

const RARITY_GLOW = {
  'Incomum': '#3ddc84',
  'Rara': '#4a90e2',
  'Épica': '#7c5cff',
  'Mítica': '#ff5c8a',
  'Lendário': '#ffd166',
};

const FUSION_ICONS = {
  obsidiana: '🪨',
  agataDeFogo: '🔥',
  rubi: '❤️‍🔥',
  pedraDeSangue: '🩸',
};

const DEFAULT_ICON = '💎';

function GemaSlot({ label, gema, onSelect, onDrop, onClear, compat }) {
  return (
    <div className={`forge-slot ${gema ? 'filled' : ''}`}>
      <div className="forge-slot-label">
        <span>{label}</span>
        {gema && <button className="forge-clear" onClick={onClear} title="Remover">✕</button>}
      </div>
      <div
        className={`forge-dropzone ${gema ? 'has-gem' : 'empty'} ${compat === false ? 'incompat' : ''}`}
        onClick={() => document.getElementById(`forge-select-${label.toLowerCase().includes('a') ? 'a' : 'b'}`)?.focus()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData('text/gem-id');
          if (id) onSelect(id);
        }}
      >
        {gema ? (
          <>
            <span className="forge-gem-icon">{FUSION_ICONS[gema.id] || DEFAULT_ICON}</span>
            <span className="forge-gem-name">{gema.nome}</span>
            <span className="forge-gem-rarity" style={{ color: RARITY_GLOW[gema.raridade] || '#fff' }}>
              {gema.raridade}
            </span>
            <span className={`forge-estado ${gema.estado === 'bruta' ? 'bruta' : 'polida'}`}>
              {gema.estado === 'bruta' ? '⛓ Bruta' : '✨ Polida'}
            </span>
          </>
        ) : (
          <>
            <span className="forge-drop-icon">🗡️</span>
            <span className="forge-drop-hint">Arraste uma gema aqui ou selecione abaixo</span>
          </>
        )}
      </div>
      <select
        id={`forge-select-${label.toLowerCase().includes('a') ? 'a' : 'b'}`}
        className="forge-select"
        value={gema?.id || ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">— Escolher {label} —</option>
        {gemas.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome} ({g.estado === 'bruta' ? 'Bruta' : 'Polida'})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function GemForge({ onBack }) {
  const [gemaAId, setGemaAId] = useState('');
  const [gemaBId, setGemaBId] = useState('');

  // Cópias mutáveis das gemas disponíveis (para o polimento refletir o novo
  // estado) + saldo de ouro/mana do jogador.
  const [disponiveis, setDisponiveis] = useState(() => gemas.map((g) => ({ ...g })));
  const [ouro, setOuro] = useState(1000);
  const [mana, setMana] = useState(500);
  // Jogador de demonstração com a profissão Lapidador (para exibir os bônus).
  const jogador = { profissao: 'Lapidador' };
  const [polindoGema, setPolindoGema] = useState(null);

  const gemaA = useMemo(() => getGemaById(gemaAId), [gemaAId]);
  const gemaB = useMemo(() => getGemaById(gemaBId), [gemaBId]);

  const resultado = useMemo(() => verificarFusao(gemaA, gemaB), [gemaA, gemaB]);

  const handleDragStart = (id) => (e) => {
    e.dataTransfer.setData('text/gem-id', id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Persiste a mudança de estado após o polimento no inventário local.
  const handleEstadoChange = (id, estadoNovo) => {
    setDisponiveis((prev) => prev.map((g) => (g.id === id ? { ...g, estado: estadoNovo } : g)));
  };

  const aviso = (() => {
    if (!gemaA || !gemaB) return null;
    if (resultado.bruta) {
      return { tipo: 'erro', msg: '⚠️ Pedras brutas precisam ser polidas antes de serem fundidas!' };
    }
    if (resultado.instavel || !resultado.ok) {
      return { tipo: 'aviso', msg: 'Fusão Instável: Custo de Mana triplicado e 50% de chance de destruir as gemas' };
    }
    return null;
  })();

  const preview = resultado.ok ? resultado.resultado : null;
  const custoEstavel = preview?.custoManaTotal ?? null;
  // Em fusão instável o custo é triplicado e as gemas podem ser destruídas.
  const custoInstavel = gemaA && gemaB ? (gemaA.custoFusaoMana + gemaB.custoFusaoMana) * 3 : 0;

  return (
    <div className="page forge-page">
      <header className="topbar">
        <div>
          <h1>🔮 Forja de Gemas</h1>
          <span className="player-name">Fusão alquímica de pedras preciosas</span>
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
        <div className="forge-intro">
          <p>
            Combine duas pedras <strong>polidas e compatíveis</strong> na forja mágica.
            O custo da fusão é pago <strong>exclusivamente em Mana</strong>.
          </p>
        </div>

        {/* Inventário simplificado (gemas disponíveis) — arrastáveis */}
        <div className="forge-inventory">
          <h3>💎 Pedras disponíveis <span className="muted">(clique para polir)</span></h3>
          <div className="forge-gem-pool">
            {disponiveis.map((g) => (
              <div
                key={g.id}
                className={`forge-pool-gem ${g.estado === 'bruta' ? 'is-bruta' : ''}`}
                draggable
                onDragStart={handleDragStart(g.id)}
                onClick={() => {
                  // Clique abre o polidor para pedras políveis; caso contrário,
                  // usa a pedra na forja (preenchendo o próximo slot livre).
                  if (['bruta', 'lapidada', 'polido'].includes(g.estado)) {
                    setPolindoGema(g);
                  } else if (!gemaA) setGemaAId(g.id);
                  else if (!gemaB) setGemaBId(g.id);
                }}
                title={['bruta', 'lapidada', 'polido'].includes(g.estado) ? 'Clique para polir' : 'Clique para usar na fusão'}
                style={{ borderColor: RARITY_GLOW[g.raridade] || 'var(--border)' }}
              >
                <span>{FUSION_ICONS[g.id] || DEFAULT_ICON}</span>
                <strong>{g.nome}</strong>
                <small>{g.raridade} · {g.estado === 'bruta' ? '⛓ Bruta' : g.estado === 'lapidada' ? '🔷 Lapidada' : g.estado === 'polido' ? '✨ Polida' : g.estado === 'perfeita' ? '🌟 Perfeita' : '💥 Destruída'}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Slots A e B */}
        <div className="forge-slots">
          <GemaSlot
            label="Gema A"
            gema={gemaA}
            onSelect={setGemaAId}
            onClear={() => setGemaAId('')}
          />
          <div className="forge-fusion-glyph">🔥</div>
          <GemaSlot
            label="Gema B"
            gema={gemaB}
            onSelect={setGemaBId}
            onClear={() => setGemaBId('')}
          />
        </div>

        {/* Alertas */}
        {aviso && (
          <div className={`forge-alert ${aviso.tipo === 'erro' ? 'forge-alert-red' : 'forge-alert-yellow'}`}>
            {aviso.msg}
          </div>
        )}

        {!gemaA || !gemaB ? (
          <div className="forge-empty">
            <p className="muted">Selecione Gema A e Gema B para verificar a fusão.</p>
          </div>
        ) : !resultado.ok ? (
          <div className="forge-instavel-panel">
            <h3>⚠️ Fusão Instável</h3>
            <div className="forge-instavel-row">
              <span className="forge-instavel-key">Custo de Mana (triplicado)</span>
              <span className="forge-instavel-val mana">⚡ {custoInstavel}</span>
            </div>
            <div className="forge-instavel-row">
              <span className="forge-instavel-key">Chance de destruir as gemas</span>
              <span className="forge-instavel-val perigo">50%</span>
            </div>
            <p className="muted">Essa combinação não forma uma receita conhecida. Prossiga por sua conta e risco.</p>
          </div>
        ) : (
          <div className="forge-preview">
            <div className="forge-preview-glow">
              <span className="forge-preview-icon">🔥</span>
            </div>
            <h3 className="forge-preview-title">Fusão Estável</h3>
            <div className="forge-result-name" style={{ color: RARITY_GLOW[preview.raridade] || '#fff' }}>
              {preview.nome}
            </div>
            <div className="forge-result-rarity">{preview.raridade}</div>

            <div className="forge-cost">
              <span className="forge-cost-label">Custo da Fusão</span>
              <span className="forge-cost-value mana">⚠️ Custo: {custoEstavel} de Mana</span>
            </div>

            <div className="forge-effects">
              <h4>Novos Efeitos</h4>
              <div className="forge-ef-list">
                {efeitosParaLista(preview.efeitos).map((ef, i) => (
                  <div key={i} className={`forge-ef-row ${ef.tipo === 'debuff' ? 'debuff' : 'buff'}`}>
                    {ef.tipo === 'debuff' ? '❌' : '✨'}
                    <span>{ef.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="forge-desc">{preview.descricao}</p>
          </div>
        )}
      </div>

      {/* Polidor de pedras — abre ao clicar numa gema polível */}
      {polindoGema && (
        <GemPolisher
          gema={polindoGema}
          ouro={ouro}
          mana={mana}
          jogador={jogador}
          onOuroChange={setOuro}
          onManaChange={setMana}
          onEstadoChange={handleEstadoChange}
          onPolirFalhaProtegida={(gemaId, manaConsumida) => {
            // Falha protegida: a pedra não degrada; apenas o mana é consumido.
            console.log(`Lapidador protegeu ${gemaId}; mana consumido: ${manaConsumida}`);
          }}
          onClose={() => setPolindoGema(null)}
        />
      )}
    </div>
  );
}
