import { useState, useMemo } from 'react';
import {
  MATERIAIS, getMateriaisPorTipo, getMaterialById,
} from '../game/materials.js';
import {
  EQUIPAMENTOS, getEquipamentosPorTipo, getEquipamentoById,
  EQUIP_TIPO, ARMA_SUBCATEGORIA, EQUIP_RARITY,
} from '../game/equipments.js';
import {
  craftarEquipamento, calcularAtributosEquipamento, calcularCustoFabricacao,
  podeUsarFerroEstigio, aplicarHonrineo,
} from '../game/forge.js';
import { api } from '../api.js';

const RARITY_COLOR = {
  comum: '#9aa0c0',
  incomum: '#3ddc84',
  rara: '#4a90e2',
  epica: '#7c5cff',
  lendaria: '#ffd166',
};

const TIPO_LABEL = {
  arma: '⚔️ Armas',
  armadura: '🛡️ Armaduras',
  acessorio: '💍 Acessórios',
  cajado: '🔮 Cajados',
  varinha: '✨ Varinha',
  grimorio: '📖 Grimório',
  orbe: '🔮 Orbe',
  catalisador: '⚗️ Catalisador',
};

export default function Forge({ onBack, player, characters, walletCents, onWalletChange, onRefresh }) {
  const [tipoSelecionado, setTipoSelecionado] = useState('arma');
  const [equipId, setEquipId] = useState(null);
  [, ] = useState(null); // materialPrimarioId, materialSecundarioId
  const [materialPrimarioId, setMaterialPrimarioId] = useState(null);
  const [materialSecundarioId, setMaterialSecundarioId] = useState(null);
  [, ] = useState([]); // gemasSlotadas
  const [gemasSlotadas, setGemasSlotadas] = useState([]);
  [, ] = useState(null); // personagemSelecionado
  const [personagemSelecionado, setPersonagemSelecionado] = useState(null);
  [, ] = useState(null); // resultado
  const [resultado, setResultado] = useState(null);
  [, ] = useState(''); // mensagem
  const [mensagem, setMensagem] = useState('');

  const equipamentosDisponiveis = useMemo(() =>
    getEquipamentosPorTipo(tipoSelecionado), [tipoSelecionado]);

  const materiaisDisponiveis = useMemo(() => {
    if (tipoSelecionado === 'arma') {
      // Armas usam minérios e metais
      return [...getMateriaisPorTipo('minerio'), ...getMateriaisPorTipo('metal')];
    }
    if (tipoSelecionado === 'armadura') {
      return [...getMateriaisPorTipo('minerio'), ...getMateriaisPorTipo('metal')];
    }
    // Acessórios e mágicos usam pedras e metais preciosos
    return [...getMateriaisPorTipo('pedra'), ...getMateriaisPorTipo('metal').filter(m => m.raridade !== 'comum')];
  }, [tipoSelecionado]);

  const equipSelecionado = equipId ? getEquipamentoById(equipId) : null;
  const matPrimario = materialPrimarioId ? getMaterialById(materialPrimarioId) : null;
  const matSecundario = materialSecundarioId ? getMaterialById(materialSecundarioId) : null;
  const personagem = personagemSelecionado
    ? characters.find(c => c.id === personagemSelecionado)
    : null;

  const preview = useMemo(() => {
    if (!equipSelecionado) return null;
    return calcularAtributosEquipamento(
      equipId,
      materialPrimarioId,
      materialSecundarioId,
      gemasSlotadas,
    );
  }, [equipSelecionado, equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas]);

  const custoTotal = useMemo(() => {
    if (!equipSelecionado) return 0;
    return calcularCustoFabricacao(
      equipId,
      materialPrimarioId,
      materialSecundarioId,
      gemasSlotadas,
    );
  }, [equipSelecionado, equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas]);

  const podeCraftar = walletCents >= custoTotal && !!equipSelecionado && !!materialPrimarioId;

  const verificarFerroEstigio = useMemo(() => {
    if (!materialPrimarioId && !materialSecundarioId) return null;
    if (materialPrimarioId === 'ferroEstigio' || materialSecundarioId === 'ferroEstigio') {
      return podeUsarFerroEstigio(personagem);
    }
    return null;
  }, [materialPrimarioId, materialSecundarioId, personagem]);

  const handleCraftar = async () => {
    if (!podeCraftar) {
      setMensagem('Não há recursos suficientes para craftar.');
      return;
    }
    if (verificarFerroEstigio && !verificarFerroEstigio.podeUsar) {
      setMensagem(verificarFerroEstigio.motivo);
      return;
    }

    const resultadoCraft = craftarEquipamento(
      equipId,
      materialPrimarioId,
      materialSecundarioId,
      gemasSlotadas,
      personagem,
    );

    if (!resultadoCraft.ok) {
      setMensagem(resultadoCraft.motivo);
      return;
    }

    setResultado(resultadoCraft);
    setMensagem(`Equipamento "${equipSelecionado.nome}" craftado com sucesso! Custo: ${custoTotal} bronze.`);

    // Deduzir carteira via API
    try {
      await api.gastarCarteira(custoTotal);
      if (onWalletChange) onWalletChange(walletCents - custoTotal);
      if (onRefresh) onRefresh();
    } catch (e) {
      setMensagem('Equipamento craftado, mas não foi possível deduzir a carteira.');
    }
  };

  const handleInstalarGema = (slotIndex, gemaId) => {
    const nova = [...gemasSlotadas];
    nova[slotIndex] = { slot: slotIndex, gemaId };
    setGemasSlotadas(nova);
  };

  const handleRemoverGema = (slotIndex) => {
    const nova = [...gemasSlotadas];
    nova[slotIndex] = null;
    setGemasSlotadas(nova);
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>⚒️ Forja de Equipamentos</h1>
        <button className="ghost" onClick={() => onBack()}>← Voltar</button>
      </header>

      <div className="content">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, padding: 16 }}>
          {/* Painel esquerdo: seleções */}
          <div style={{ border: '1px solid #3a2e54', borderRadius: 12, padding: 16, background: '#241a3a' }}>
            <h3 style={{ marginTop: 0, color: '#b8a9cf' }}>1. Tipo de Equipamento</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {Object.entries(EQUIP_TIPO).map(([id, tipo]) => (
                <button
                  key={id}
                  onClick={() => { setTipoSelecionado(id); setEquipId(null); }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid ' + (tipoSelecionado === id ? '#8b5fbf' : '#444'),
                    borderRadius: 6,
                    background: tipoSelecionado === id ? '#4a3a6e' : '#1e142c',
                    color: '#eee',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                  }}
                >
                  {tipo.icone} {tipo.nome}
                </button>
              ))}
            </div>

            <h3 style={{ marginTop: 0, color: '#b8a9cf' }}>2. Equipamento</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: 16 }}>
              {equipamentosDisponiveis.map(eq => {
                const rarityCor = EQUIP_RARITY[eq.raridade]?.cor || '#fff';
                return (
                  <button
                    key={eq.id}
                    onClick={() => setEquipId(eq.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      border: '1px solid ' + (equipId === eq.id ? '#8b5fbf' : '#333'),
                      borderRadius: 6,
                      background: equipId === eq.id ? '#4a3a6e' : '#1e142c',
                      color: '#eee',
                      cursor: 'pointer',
                      fontSize: '0.9em',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <span>{eq.nome} <span style={{ color: rarityCor, fontSize: '0.8em' }}>{EQUIP_RARITY[eq.raridade]?.nome}</span></span>
                    <span style={{ fontSize: '0.8em', color: '#888' }}>{eq.peso} kg</span>
                  </button>
                );
              })}
            </div>

            {equipSelecionado && (
              <>
                <h3 style={{ marginTop: 0, color: '#b8a9cf' }}>3. Material Primário (100% efeitos)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 16 }}>
                  {materiaisDisponiveis.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMaterialPrimarioId(m.id)}
                      style={{
                        padding: '8px',
                        border: '1px solid ' + (materialPrimarioId === m.id ? '#8b5fbf' : '#444'),
                        borderRadius: 6,
                        background: materialPrimarioId === m.id ? '#4a3a6e' : '#1e142c',
                        color: '#eee',
                        cursor: 'pointer',
                        fontSize: '0.8em',
                      }}
                    >
                      {m.nome}<br />
                      <span style={{ fontSize: '0.7em', color: '#888' }}>{m.precoPorKg} bronze/kg</span>
                    </button>
                  ))}
                </div>

                <h3 style={{ marginTop: 0, color: '#b8a9cf' }}>4. Material Secundário (até 25% efeitos)</h3>
                <button
                  onClick={() => setMaterialSecundarioId(null)}
                  style={{ marginBottom: 8, padding: '4px 8px', fontSize: '0.8em', color: '#888', background: 'transparent', border: '1px solid #444', borderRadius: 4, cursor: 'pointer' }}
                >
                  (nenhum)
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 16 }}>
                  {materiaisDisponiveis.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMaterialSecundarioId(m.id)}
                      style={{
                        padding: '8px',
                        border: '1px solid ' + (materialSecundarioId === m.id ? '#8b5fbf' : '#444'),
                        borderRadius: 6,
                        background: materialSecundarioId === m.id ? '#4a3a6e' : '#1e142c',
                        color: '#eee',
                        cursor: 'pointer',
                        fontSize: '0.8em',
                      }}
                    >
                      {m.nome}<br />
                      <span style={{ fontSize: '0.7em', color: '#888' }}>{m.precoPorKg} bronze/kg</span>
                    </button>
                  ))}
                </div>

                {personagem && (
                  <>
                    <h3 style={{ marginTop: 0, color: '#b8a9cf' }}>5. Honríneo (adaptar ao usuário)</h3>
                    <p style={{ fontSize: '0.85em', color: '#b8a9cf', margin: '0 0 8px' }}>
                      Adapta o equipamento ao atributo principal de {personagem.nome}.
                    </p>
                    <button
                      onClick={() => {
                        if (aplicarHonrineo(equipSelecionado, personagem)) {
                          setMensagem('Honríneo preparado para este personagem.');
                        }
                      }}
                      style={{ padding: '8px 12px', border: '1px solid #8b5fbf', borderRadius: 6, background: '#4a3a6e', color: '#fff', cursor: 'pointer', fontSize: '0.9em' }}
                    >
                      Aplicar Honríneo
                    </button>
                  </>
                )}

                {verificarFerroEstigio && (
                  <div style={{ padding: 10, border: '1px solid #ff5c8a', borderRadius: 6, background: '#3a1a2a', marginBottom: 16, fontSize: '0.85em' }}>
                    <span style={{ color: '#ff5c8a', fontWeight: 'bold' }}>{verificarFerroEstigio.podeUsar ? '✓' : '✗'}</span>
                    {verificarFerroEstigio.podeUsar ? 'Ferro Estígio autorizado' : verificarFerroEstigio.motivo}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Painel direito: preview e crafting */}
          <div style={{ border: '1px solid #3a2e54', borderRadius: 12, padding: 16, background: '#241a3a' }}>
            <h3 style={{ marginTop: 0, color: '#b8a9cf' }}>Preview do Equipamento</h3>

            {!equipSelecionado ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Selecione um equipamento para ver o preview.</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: '24px' }}>{EQUIP_TIPO[equipSelecionado.tipo]?.icone || '⚔️'}</span>
                  <div>
                    <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#eee' }}>{equipSelecionado.nome}</div>
                    <div style={{ fontSize: '0.9em', color: EQUIP_RARITY[equipSelecionado.raridade]?.cor || '#fff' }}>
                      {EQUIP_RARITY[equipSelecionado.raridade]?.nome}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#888' }}>{equipSelecionado.peso} kg • {equipSelecionado.slots} slots de gema</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px', color: '#b8a9cf' }}>Materiais Selecionados</h4>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, padding: 10, border: '1px solid #444', borderRadius: 6, background: '#1e142c' }}>
                      <div style={{ fontSize: '0.8em', color: '#888' }}>Primário (100%)</div>
                      <div style={{ fontWeight: 'bold', color: '#eee' }}>{matPrimario?.nome || '—'}</div>
                      <div style={{ fontSize: '0.8em', color: '#8b5fbf' }}>{matPrimario ? matPrimario.precoPorKg + ' bronze' : ''}</div>
                    </div>
                    <div style={{ flex: 1, padding: 10, border: '1px solid #444', borderRadius: 6, background: '#1e142c' }}>
                      <div style={{ fontSize: '0.8em', color: '#888' }}>Secundário (25%)</div>
                      <div style={{ fontWeight: 'bold', color: '#eee' }}>{matSecundario?.nome || '—'}</div>
                      <div style={{ fontSize: '0.8em', color: '#8b5fbf' }}>{matSecundario ? Math.round(matSecundario.precoPorKg * 0.25) + ' bronze' : ''}</div>
                    </div>
                  </div>
                </div>

                {preview?.ok && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 8px', color: '#b8a9cf' }}>Atributos Finais</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8 }}>
                        {Object.entries(preview.atributos).map(([attr, val]) => (
                          <div key={attr} style={{ padding: 8, background: '#1e142c', borderRadius: 6, textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75em', color: '#888' }}>{attr}</div>
                            <div style={{ fontWeight: 'bold', color: val > 0 ? '#3ddc84' : val < 0 ? '#ff5c8a' : '#eee' }}>{val > 0 ? '+' : ''}{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 8px', color: '#b8a9cf' }}>Custo de Fabricação</h4>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#ffd166' }}>{custoTotal} bronze</div>
                      <div style={{ fontSize: '0.85em', color: '#888' }}>
                        {equipSelecionado.precoBase} base +
                        {matPrimario ? matPrimario.precoPorKg : 0} primário +
                        {matSecundario ? Math.round(matSecundario.precoPorKg * 0.25) : 0} secundário
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 8px', color: '#b8a9cf' }}>Slots de Gema ({equipSelecionado.slots})</h4>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Array.from({ length: equipSelecionado.slots }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              padding: 10,
                              border: '2px dashed ' + (gemasSlotadas[i] ? '#8b5fbf' : '#444'),
                              borderRadius: 6,
                              background: gemasSlotadas[i] ? '#4a3a6e' : '#1e142c',
                              color: '#eee',
                              fontSize: '0.85em',
                              cursor: 'pointer',
                              width: 60,
                              textAlign: 'center',
                            }}
                            onClick={() => {
                              // Abrir selector de gema (simplificado)
                              const gemaId = window.prompt('ID da gema (ex: diamante, obsidiana):');
                              if (gemaId) handleInstalarGema(i, gemaId);
                            }}
                          >
                            {gemasSlotadas[i] ? gemasSlotadas[i].gemaId : 'vazio'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {mensagem && (
                      <div style={{ padding: 10, borderRadius: 6, background: '#3a2e54', color: '#b8a9cf', marginBottom: 12, fontSize: '0.9em' }}>
                        {mensagem}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={handleCraftar}
                        disabled={!podeCraftar}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          border: 'none',
                          borderRadius: 8,
                          background: podeCraftar ? '#8b5fbf' : '#444',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '1em',
                          cursor: podeCraftar ? 'pointer' : 'not-allowed',
                        }}
                      >
                        ⚒️ Craftar ({custoTotal} bronze)
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
