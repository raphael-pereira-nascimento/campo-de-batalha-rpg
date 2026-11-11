import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  getMateriaisPorCategoria, getMaterialById,
} from '../game/materials.js';
import {
  formatarPrecoPorKg, precoKgEmCents, materialTemEfeitos,
} from '../game/materialRules.js';
import {
  EQUIPAMENTOS, getEquipamentosPorTipo, getEquipamentoById,
  EQUIP_TIPO, ARMA_SUBCATEGORIA, EQUIP_RARITY,
} from '../game/equipments.js';
import {
  craftarEquipamento, calcularAtributosEquipamento, calcularCustoFabricacao,
  podeUsarFerroEstigio, aplicarHonrineo, melhorarEquipamento, calcularCustoMelhoria,
  inicializarDurabilidade, calcularDurabilidadeMax, calcularCustoReparoPorPonto,
  calcularCustoReparoCompleto, repararEquipamento, desmontarEquipamento,
  tipoInventarioEquipamento, gemasSlotadasParaSocketedGems,
} from '../game/forge.js';
import { getGemaById, GEM_LIST } from '../game/gems.js';
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

const SLOT_MAP = {
  arma: 'perto',
  armadura: 'armadura',
  acessorio: 'acessorio',
};

const MELHORIA_BONUS_POR_NIVEL = {
  arma: { forca: 1 },
  armadura: { resistencia: 1 },
  acessorio: { inteligencia: 1 },
  cajado: { inteligencia: 1 },
  varinha: { inteligencia: 1 },
  grimorio: { inteligencia: 1 },
  orbe: { inteligencia: 1 },
  catalisador: { inteligencia: 1 },
};

export default function Forge({ onBack, player, characters, walletCents, onWalletChange, onRefresh }) {
  const [tipoSelecionado, setTipoSelecionado] = useState('arma');
  const [equipId, setEquipId] = useState(null);
  const [materialPrimarioId, setMaterialPrimarioId] = useState(null);
  const [materialSecundarioId, setMaterialSecundarioId] = useState(null);
  const [gemasSlotadas, setGemasSlotadas] = useState([]);
  const [personagemSelecionado, setPersonagemSelecionado] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [itemCraftadoId, setItemCraftadoId] = useState(null);

  // Melhoria
  const [equipParaMelhorar, setEquipParaMelhorar] = useState(null);
  const [melhoriaPreview, setMelhoriaPreview] = useState(null);

  // Durabilidade e reparo
  const [itemParaReparar, setItemParaReparar] = useState(null);
  const [reparoPreview, setReparoPreview] = useState(null);

  // Socketar
  const [characterGems, setCharacterGems] = useState([]);
  const [carregandoGems, setCarregandoGems] = useState(false);
  const [socketEquipSlot, setSocketEquipSlot] = useState(null);
  const [socketGemId, setSocketGemId] = useState(null);
  const [socketando, setSocketando] = useState(false);

  // Inventário
  const [inventarioItens, setInventarioItens] = useState([]);
  const [carregandoInventario, setCarregandoInventario] = useState(false);

  const equipamentosDisponiveis = useMemo(() =>
    getEquipamentosPorTipo(tipoSelecionado), [tipoSelecionado]);

  const materiaisDisponiveis = useMemo(() => {
    // Inclui todas as categorias de dados (minério, metal, especial e mágico).
    // Antes, fichas de `especial`/`magico` com efeitos podiam ficar de fora da
    // seleção; o filtro final é apenas "tem algum efeito definido".
    const porCategoria = (categoria) => getMateriaisPorCategoria(categoria);
    let lista;
    if (tipoSelecionado === 'arma' || tipoSelecionado === 'armadura') {
      lista = ['minerio', 'metal', 'especial', 'magico'].flatMap(porCategoria);
    } else {
      lista = [
        ...porCategoria('especial'),
        ...porCategoria('magico'),
        ...porCategoria('metal').filter((m) => m.raridade !== 'comum'),
      ];
    }
    // Evita duplicatas (obsidiana/diamante aparecem em `especial`) e fichas
    // pendentes do catálogo, que não devem ser selecionáveis na forja.
    const unicos = [...new Map(lista.map((m) => [m.id, m])).values()];
    return unicos.filter(materialTemEfeitos);
  }, [tipoSelecionado]);

  const equipSelecionado = equipId ? getEquipamentoById(equipId) : null;
  const matPrimario = materialPrimarioId ? getMaterialById(materialPrimarioId) : null;
  const matSecundario = materialSecundarioId ? getMaterialById(materialSecundarioId) : null;
  const personagem = personagemSelecionado
    ? characters.find(c => c.id === personagemSelecionado)
    : null;

  // Carrega gems do personagem
  useEffect(() => {
    if (!personagemSelecionado) {
      setCharacterGems([]);
      return;
    }
    setCarregandoGems(true);
    api.getCharacterGemsDetailed(personagemSelecionado)
      .then((d) => setCharacterGems(d.gems || []))
      .catch((e) => console.warn('[forge] gems:', e.message))
      .finally(() => setCarregandoGems(false));
  }, [personagemSelecionado]);

  // Carrega inventário do personagem
  useEffect(() => {
    if (!personagemSelecionado) {
      setInventarioItens([]);
      return;
    }
    setCarregandoInventario(true);
    api.getCharacter(personagemSelecionado)
      .then((d) => {
        const itens = (d.character?.inventory || []).filter((it) =>
          it && (it.tipo === 'arma' || it.tipo === 'arma_fogo' || it.tipo === 'armadura' || it.tipo === 'acessorio')
        );
        setInventarioItens(itens);
      })
      .catch((e) => console.warn('[forge] inventário:', e.message))
      .finally(() => setCarregandoInventario(false));
  }, [personagemSelecionado]);

  const gemsDisponiveisSocket = useMemo(() => {
    if (!personagemSelecionado) return [];
    return characterGems.filter((g) => g.estado && !['bruta', 'destruida'].includes(g.estado));
  }, [characterGems, personagemSelecionado]);

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

  const slotParaEquipar = useMemo(() => {
    if (!equipSelecionado) return null;
    if (equipSelecionado.tipo === 'arma') {
      if (equipSelecionado.categoria === 'utilitaria') return 'utilitaria';
      if (equipSelecionado.subcategoria === 'fogo') return 'distancia';
      return 'perto';
    }
    return SLOT_MAP[equipSelecionado.tipo] || null;
  }, [equipSelecionado]);

  const slotParaApi = useMemo(() => {
    if (!slotParaEquipar) return null;
    if (slotParaEquipar === 'perto') return 'arma_perto';
    if (slotParaEquipar === 'distancia') return 'arma_distancia';
    if (slotParaEquipar === 'utilitaria') return 'arma_utilitaria';
    return slotParaEquipar;
  }, [slotParaEquipar]);

  // ── CRAFTAR ──
  const handleCraftar = async () => {
    if (!podeCraftar) {
      setMensagem('Não há recursos suficientes para craftar.');
      return;
    }
    if (!personagemSelecionado) {
      setMensagem('Selecione um personagem destinatário antes de craftar.');
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

    try {
      const gemasSocketadas = gemasSlotadasParaSocketedGems(
        resultadoCraft.equip.gemasSlotadas || [],
        equipSelecionado.slots || 0,
      );
      const itemParaInventario = {
        id: resultadoCraft.equip.id || equipId,
        nome: equipSelecionado.nome,
        tipo: tipoInventarioEquipamento(equipSelecionado),
        raridade: equipSelecionado.raridade,
        peso: equipSelecionado.peso,
        slots: equipSelecionado.slots,
        socketSlots: equipSelecionado.slots || 0,
        bonus: equipSelecionado.bonus,
        penalidade: equipSelecionado.penalidade,
        // Bônus-base + materiais, sem as gemas: elas entram via `socketedGems`
        // para não duplicar os atributos no cálculo de combate.
        atributosFinais: resultadoCraft.atributosSemGemas,
        materiais: resultadoCraft.equip.materiais,
        custo: resultadoCraft.custo,
        honrineoAplicado: resultadoCraft.equip.honrineoAplicado,
        gemasSlotadas: resultadoCraft.equip.gemasSlotadas || [],
        socketedGems: gemasSocketadas.socketedGems,
        socketedGemEstados: gemasSocketadas.socketedGemEstados,
        descricao: equipSelecionado.descricao,
        subcategoria: equipSelecionado.subcategoria,
        categoria: equipSelecionado.categoria,
        usosMax: equipSelecionado.usosMax,
        recargaTurnos: equipSelecionado.recargaTurnos,
        danoBase: equipSelecionado.danoBase,
        // Campos de combate da definição-base: sem eles a peça craftada perde
        // defesa (armadura), alcance/elemento/efeito (armas) ao ser equipada.
        defesa: equipSelecionado.defesa,
        alcance: equipSelecionado.alcance,
        elemento: equipSelecionado.elemento,
        efeito: equipSelecionado.efeito,
        alvo: equipSelecionado.alvo,
        alvos: equipSelecionado.alvos,
        splash: equipSelecionado.splash,
        recarga: equipSelecionado.recarga,
        durabilidade: inicializarDurabilidade(equipSelecionado),
        durabilidadeMax: calcularDurabilidadeMax(equipSelecionado.raridade || 'comum'),
      };

      const res = await api.craftItem(personagemSelecionado, itemParaInventario);
      if (!res.ok) {
        setMensagem(`Item craftado mas não foi salvo no inventário: ${res.error || ''}`);
        return;
      }

      const novoItemId = res.item?.id || itemParaInventario.id;
      setItemCraftadoId(novoItemId);

      try {
        await api.gastarCarteira(custoTotal);
        if (onWalletChange) onWalletChange(walletCents - custoTotal);
        if (onRefresh) onRefresh();
      } catch (e) {
        setMensagem('Item salvo no inventário, mas não foi possível deduzir a carteira.');
        return;
      }

      setMensagem(`⚒️ "${equipSelecionado.nome}" craftado e adicionado ao inventário de ${personagem.nome}! Custo: ${custoTotal} bronze.`);
    } catch (e) {
      setMensagem('Erro ao salvar item no inventário: ' + e.message);
    }
  };

  // ── GEMS ──
  const handleInstalarGemaPreview = (slotIndex, gemaId) => {
    const nova = [...gemasSlotadas];
    nova[slotIndex] = { slot: slotIndex, gemaId };
    setGemasSlotadas(nova);
  };

  const handleRemoverGemaPreview = (slotIndex) => {
    const nova = [...gemasSlotadas];
    nova[slotIndex] = null;
    setGemasSlotadas(nova);
  };

  const handleSocketGema = async () => {
    if (!socketEquipSlot || !socketGemId || !personagemSelecionado || !itemCraftadoId) return;
    setSocketando(true);
    try {
      const slotKey = `${socketEquipSlot.equipSlot}_${socketEquipSlot.slotIndex}`;
      const d = await api.socketGem(personagemSelecionado, slotKey, socketGemId);
      if (d.character) {
        const gems = await api.getCharacterGemsDetailed(personagemSelecionado);
        setCharacterGems(gems.gems || []);
        setMensagem(`✨ Gema socketada no item "${equipSelecionado?.nome}"!`);
      }
      setSocketEquipSlot(null);
      setSocketGemId(null);
    } catch (e) {
      setMensagem('Erro ao socketar gema: ' + e.message);
    } finally {
      setSocketando(false);
    }
  };

  // ── EQUIPAR ──
  const handleEquipar = async () => {
    if (!personagemSelecionado || !itemCraftadoId || !slotParaApi) return;
    setMensagem('Equipando item...');
    try {
      const d = await api.equipItem(personagemSelecionado, slotParaApi, itemCraftadoId);
      if (d.character) {
        setMensagem(`⚔️ "${equipSelecionado?.nome}" equipado em ${personagem.nome}!`);
        if (onRefresh) onRefresh();
        setItemCraftadoId(null);
        setResultado(null);
      }
    } catch (e) {
      setMensagem('Erro ao equipar item: ' + e.message);
    }
  };

  // ── MELHORAR ──
  const calcularPreviewMelhoria = useCallback((item) => {
    if (!item) return null;
    const nivelAtual = Number(item.melhoriaNivel || 0);
    const custo = calcularCustoMelhoria(nivelAtual);
    const tipoBonus = MELHORIA_BONUS_POR_NIVEL[item.tipo] || { forca: 1 };
    const atributosAdicionados = {};
    for (const [attr, val] of Object.entries(tipoBonus)) {
      atributosAdicionados[attr] = val;
    }
    return { custo, nivelNovo: nivelAtual + 1, atributosAdicionados };
  }, []);

  const handleMelhorarEquipamento = async () => {
    if (!equipParaMelhorar || !personagemSelecionado) return;

    const preview = calcularPreviewMelhoria(equipParaMelhorar);
    if (!preview) return;

    if (walletCents < preview.custo) {
      setMensagem(`Ouro insuficiente. Custo: ${preview.custo} bronze.`);
      return;
    }

    try {
      const resultado = melhorarEquipamento(equipParaMelhorar, personagem);
      if (!resultado.ok) {
        setMensagem(resultado.motivo);
        return;
      }

      const itemMelhorado = {
        ...equipParaMelhorar,
        modo: 'atualizar',
        melhoriaNivel: resultado.nivelNovo,
        atributosFinais: resultado.equip.atributosFinais,
        custoMelhoria: resultado.custo,
      };

      const res = await api.craftItem(personagemSelecionado, itemMelhorado);
      if (!res.ok) {
        setMensagem(`Item melhorado mas não foi salvo: ${res.error || ''}`);
        return;
      }

      try {
        await api.gastarCarteira(preview.custo);
        if (onWalletChange) onWalletChange(walletCents - preview.custo);
        if (onRefresh) onRefresh();
      } catch (e) {
        setMensagem('Item melhorado, mas não foi possível deduzir a carteira.');
        return;
      }

      setMensagem(`✨ "${equipParaMelhorar.nome}" melhorado para +${resultado.nivelNovo}!`);
      setEquipParaMelhorar(null);
      setMelhoriaPreview(null);
      api.getCharacter(personagemSelecionado)
        .then((d) => {
          const itens = (d.character?.inventory || []).filter((it) =>
            it && (it.tipo === 'arma' || it.tipo === 'arma_fogo' || it.tipo === 'armadura' || it.tipo === 'acessorio')
          );
          setInventarioItens(itens);
        });
    } catch (e) {
      setMensagem('Erro ao melhorar item: ' + e.message);
    }
  };

  // ── REPARAR ──
  const calcularPreviewReparo = useCallback((item) => {
    if (!item) return null;
    const durAtual = item.durabilidade != null ? item.durabilidade : calcularDurabilidadeMax(item.raridade || 'comum');
    const reparo = calcularCustoReparoCompleto(item, durAtual);
    return reparo;
  }, []);

  const handleRepararEquipamento = async () => {
    if (!itemParaReparar || !personagemSelecionado) return;

    const preview = calcularPreviewReparo(itemParaReparar);
    if (!preview) {
      setMensagem('Este equipamento não precisa de reparo.');
      return;
    }

    if (walletCents < preview.custoTotal) {
      setMensagem(`Ouro insuficiente. Custo do reparo: ${preview.custoTotal} bronze.`);
      return;
    }

    try {
      const durAtual = itemParaReparar.durabilidade != null ? itemParaReparar.durabilidade : calcularDurabilidadeMax(itemParaReparar.raridade || 'comum');
      const resultado = repararEquipamento(itemParaReparar, durAtual);
      if (!resultado.ok) {
        setMensagem(resultado.motivo);
        return;
      }

      const itemReparado = {
        ...itemParaReparar,
        modo: 'atualizar',
        durabilidade: resultado.durabilidadeNova,
      };

      const res = await api.craftItem(personagemSelecionado, itemReparado);
      if (!res.ok) {
        setMensagem(`Item reparado mas não foi salvo: ${res.error || ''}`);
        return;
      }

      try {
        await api.gastarCarteira(preview.custoTotal);
        if (onWalletChange) onWalletChange(walletCents - preview.custoTotal);
        if (onRefresh) onRefresh();
      } catch (e) {
        setMensagem('Item reparado, mas não foi possível deduzir a carteira.');
        return;
      }

      setMensagem(`🔧 "${itemParaReparar.nome}" reparado! Durabilidade restaurada.`);
      setItemParaReparar(null);
      setReparoPreview(null);
      api.getCharacter(personagemSelecionado)
        .then((d) => {
          const itens = (d.character?.inventory || []).filter((it) =>
            it && (it.tipo === 'arma' || it.tipo === 'arma_fogo' || it.tipo === 'armadura' || it.tipo === 'acessorio')
          );
          setInventarioItens(itens);
        });
    } catch (e) {
      setMensagem('Erro ao reparar item: ' + e.message);
    }
  };

  return (
    <main className="page">
      <header className="topbar">
        <h1>⚒️ Forja de Equipamentos</h1>
        <button className="ghost" onClick={() => onBack()}>← Voltar</button>
      </header>

      <div className="content">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, padding: 16 }}>
          {/* Painel esquerdo */}
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

            <h3 style={{ marginTop: 0, color: '#b8a9cf' }}>Personagem Destinatário</h3>
            <div style={{ marginBottom: 16 }}>
              <select
                value={personagemSelecionado || ''}
                onChange={(e) => setPersonagemSelecionado(e.target.value || null)}
                style={{
                  width: '100%', padding: '8px', borderRadius: 6,
                  border: '1px solid #444', background: '#1e142c', color: '#eee',
                }}
              >
                <option value="">— Escolha um personagem —</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Nv.{c.level || 1})
                  </option>
                ))}
              </select>
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
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px',
                      border: '1px solid ' + (equipId === eq.id ? '#8b5fbf' : '#333'),
                      borderRadius: 6,
                      background: equipId === eq.id ? '#4a3a6e' : '#1e142c',
                      color: '#eee', cursor: 'pointer', fontSize: '0.9em',
                      width: '100%', textAlign: 'left',
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
                        color: '#eee', cursor: 'pointer', fontSize: '0.8em',
                      }}
                    >
                      {m.nome}<br />
                      <span style={{ fontSize: '0.7em', color: '#888' }}>{formatarPrecoPorKg(m)}</span>
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
                        color: '#eee', cursor: 'pointer', fontSize: '0.8em',
                      }}
                    >
                      {m.nome}<br />
                      <span style={{ fontSize: '0.7em', color: '#888' }}>{formatarPrecoPorKg(m)}</span>
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

          {/* Painel direito */}
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
                      <div style={{ fontSize: '0.8em', color: '#8b5fbf' }}>{matPrimario ? formatarPrecoPorKg(matPrimario) : ''}</div>
                    </div>
                    <div style={{ flex: 1, padding: 10, border: '1px solid #444', borderRadius: 6, background: '#1e142c' }}>
                      <div style={{ fontSize: '0.8em', color: '#888' }}>Secundário (25%)</div>
                      <div style={{ fontWeight: 'bold', color: '#eee' }}>{matSecundario?.nome || '—'}</div>
                      <div style={{ fontSize: '0.8em', color: '#8b5fbf' }}>{matSecundario ? Math.round((precoKgEmCents(matSecundario.precoPorKg) || 0) * 0.25) + ' bronze' : ''}</div>
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
                        {matPrimario ? (precoKgEmCents(matPrimario.precoPorKg) || 0) : 0} primário +
                        {matSecundario ? Math.round((precoKgEmCents(matSecundario.precoPorKg) || 0) * 0.25) : 0} secundário
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
                              color: '#eee', cursor: 'pointer', width: 60, textAlign: 'center',
                            }}
                            onClick={() => {
                              const gemaId = window.prompt('ID da gema (ex: diamante, obsidiana):');
                              if (gemaId) handleInstalarGemaPreview(i, gemaId);
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

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button
                        onClick={handleCraftar}
                        disabled={!podeCraftar}
                        style={{
                          padding: '12px 20px', border: 'none', borderRadius: 8,
                          background: podeCraftar ? '#8b5fbf' : '#444',
                          color: '#fff', fontWeight: 'bold', fontSize: '1em',
                          cursor: podeCraftar ? 'pointer' : 'not-allowed',
                        }}
                      >
                        ⚒️ Craftar ({custoTotal} bronze)
                      </button>
                    </div>

                    {/* SOCKETAR GEMA */}
                    {itemCraftadoId && personagemSelecionado && (
                      <div style={{ marginTop: 24, padding: 16, border: '1px solid #4a3a6e', borderRadius: 8, background: '#2a1d3e' }}>
                        <h4 style={{ margin: '0 0 12px', color: '#ffd166' }}>💎 Socketar Gema no Item Craftado</h4>
                        <p style={{ fontSize: '0.85em', color: '#b8a9cf', marginBottom: 12 }}>
                          Escolha uma gema do inventário de {personagem.nome} para encaixar em um slot do item.
                        </p>

                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>Slot de gema</label>
                          <select
                            value={socketEquipSlot ? `${socketEquipSlot.equipSlot}_${socketEquipSlot.slotIndex}` : ''}
                            onChange={(e) => {
                              const [es, si] = e.target.value.split('_');
                              setSocketEquipSlot({ equipSlot: es, slotIndex: Number(si) });
                            }}
                            style={{
                              width: '100%', padding: '8px', borderRadius: 6,
                              border: '1px solid #444', background: '#1e142c', color: '#eee',
                            }}
                          >
                            <option value="">— Escolher slot —</option>
                            {Array.from({ length: equipSelecionado.slots }).map((_, i) => (
                              <option key={i} value={`slot_${i}`}>
                                Slot {i + 1} {gemasSlotadas[i] ? '(ocupado no preview)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>Gema</label>
                          <select
                            value={socketGemId || ''}
                            onChange={(e) => setSocketGemId(e.target.value || null)}
                            style={{
                              width: '100%', padding: '8px', borderRadius: 6,
                              border: '1px solid #444', background: '#1e142c', color: '#eee',
                            }}
                            disabled={!socketEquipSlot}
                          >
                            <option value="">— Escolher gema —</option>
                            {gemsDisponiveisSocket.map((g) => {
                              const gemDef = getGemaById(g.gem_id);
                              return (
                                <option key={`${g.gem_id}|${g.estado}`} value={g.gem_id}>
                                  {gemDef?.nome || g.gem_id} ({g.estado}) · {gemDef?.raridade || '?'}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <button
                          onClick={handleSocketGema}
                          disabled={socketando || !socketEquipSlot || !socketGemId}
                          style={{
                            width: '100%', padding: '10px', border: 'none', borderRadius: 6,
                            background: (socketEquipSlot && socketGemId) ? '#4a90e2' : '#444',
                            color: '#fff', fontWeight: 'bold', cursor: (socketEquipSlot && socketGemId) ? 'pointer' : 'not-allowed',
                          }}
                        >
                          {socketando ? 'Socketando...' : '✨ Socketar Gema'}
                        </button>
                      </div>
                    )}

                    {/* EQUIPAR ITEM */}
                    {itemCraftadoId && personagemSelecionado && slotParaEquipar && (
                      <div style={{ marginTop: 16, padding: 16, border: '1px solid #3ddc84', borderRadius: 8, background: '#1d3a2e' }}>
                        <h4 style={{ margin: '0 0 8px', color: '#3ddc84' }}>⚔️ Equipar Item no Personagem</h4>
                        <p style={{ fontSize: '0.85em', color: '#b8a9cf', marginBottom: 12 }}>
                          Equipar "{equipSelecionado.nome}" em {personagem.nome} no slot <strong>{slotParaEquipar}</strong>.
                        </p>
                        <button
                          onClick={handleEquipar}
                          style={{
                            width: '100%', padding: '12px', border: 'none', borderRadius: 6,
                            background: '#3ddc84', color: '#000', fontWeight: 'bold', cursor: 'pointer',
                          }}
                        >
                          Equipar Agora
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* MELHORIA */}
          {personagemSelecionado && (
            <div style={{ marginTop: 24, padding: 16, border: '1px solid #7c5cff', borderRadius: 8, background: '#2a1d3e' }}>
              <h4 style={{ margin: '0 0 12px', color: '#7c5cff' }}>✨ Melhoria de Equipamento (+Nível)</h4>
              <p style={{ fontSize: '0.85em', color: '#b8a9cf', marginBottom: 12 }}>
                Aumente o nível de melhoria de um item do inventário para ganhar bônus de atributo permanente.
              </p>

              {inventarioItens.length === 0 ? (
                <p style={{ fontSize: '0.85em', color: '#888', fontStyle: 'italic' }}>
                  Nenhum equipamento no inventário para melhorar.
                </p>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>
                      Item para Melhorar
                    </label>
                    <select
                      value={equipParaMelhorar?.id || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        const item = inventarioItens.find((it) => it.id === id) || null;
                        setEquipParaMelhorar(item);
                        setMelhoriaPreview(item ? calcularPreviewMelhoria(item) : null);
                      }}
                      style={{
                        width: '100%', padding: '8px', borderRadius: 6,
                        border: '1px solid #444', background: '#1e142c', color: '#eee',
                      }}
                    >
                      <option value="">— Escolher item —</option>
                      {inventarioItens.map((it) => {
                        const nivel = Number(it.melhoriaNivel || 0);
                        return (
                          <option key={it.id} value={it.id}>
                            {it.nome} {nivel > 0 ? ` (+${nivel})` : ''} · {it.tipo}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {equipParaMelhorar && melhoriaPreview && (
                    <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: '#1e142c' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>
                        <span>Nível Atual:</span>
                        <span style={{ color: '#eee' }}>{Number(equipParaMelhorar.melhoriaNivel || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>
                        <span>Novo Nível:</span>
                        <span style={{ color: '#ffd166', fontWeight: 'bold' }}>{melhoriaPreview.nivelNovo}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: '#888', marginBottom: 8 }}>
                        <span>Custo:</span>
                        <span style={{ color: '#ffd166', fontWeight: 'bold' }}>{melhoriaPreview.custo} bronze</span>
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#b8a9cf' }}>
                        Bônus: {Object.entries(melhoriaPreview.atributosAdicionados)
                          .map(([attr, val]) => `${attr} ${val > 0 ? '+' : ''}${val}`)
                          .join(', ')}
                      </div>
                      <button
                        onClick={handleMelhorarEquipamento}
                        disabled={walletCents < melhoriaPreview.custo}
                        style={{
                          width: '100%', padding: '10px', border: 'none', borderRadius: 6,
                          background: (walletCents >= melhoriaPreview.custo) ? '#7c5cff' : '#444',
                          color: '#fff', fontWeight: 'bold', cursor: (walletCents >= melhoriaPreview.custo) ? 'pointer' : 'not-allowed',
                        }}
                      >
                        ✨ Melhorar (+{melhoriaPreview.nivelNovo}) ({melhoriaPreview.custo} bronze)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* DURABILIDADE E REPARO */}
          {personagemSelecionado && (
            <div style={{ marginTop: 24, padding: 16, border: '1px solid #ffd166', borderRadius: 8, background: '#2e2a1d' }}>
              <h4 style={{ margin: '0 0 12px', color: '#ffd166' }}>🔧 Durabilidade e Reparo</h4>
              <p style={{ fontSize: '0.85em', color: '#b8a9cf', marginBottom: 12 }}>
                Equipamentos perdem durabilidade com o uso em batalha. Quando a durabilidade chega a 0, o item fica quebrado e não pode ser usado até ser reparado.
              </p>

              {inventarioItens.length === 0 ? (
                <p style={{ fontSize: '0.85em', color: '#888', fontStyle: 'italic' }}>
                  Nenhum equipamento no inventário para reparar.
                </p>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>
                      Item para Reparar
                    </label>
                    <select
                      value={itemParaReparar?.id || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        const item = inventarioItens.find((it) => it.id === id) || null;
                        setItemParaReparar(item);
                        setReparoPreview(item ? calcularPreviewReparo(item) : null);
                      }}
                      style={{
                        width: '100%', padding: '8px', borderRadius: 6,
                        border: '1px solid #444', background: '#1e142c', color: '#eee',
                      }}
                    >
                      <option value="">— Escolher item —</option>
                      {inventarioItens.map((it) => {
                        const durAtual = it.durabilidade != null ? it.durabilidade : calcularDurabilidadeMax(it.raridade || 'comum');
                        const durMax = calcularDurabilidadeMax(it.raridade || 'comum');
                        const pct = Math.round((durAtual / durMax) * 100);
                        const precisaReparo = durAtual < durMax;
                        return (
                          <option key={it.id} value={it.id}>
                            {it.nome} {it.melhoriaNivel ? `(+${it.melhoriaNivel})` : ''} · Dur: {pct}% {precisaReparo ? '⚠️' : '✅'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {itemParaReparar && reparoPreview && (
                    <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: '#1e142c' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>
                        <span>Durabilidade Atual:</span>
                        <span style={{ color: '#eee' }}>{itemParaReparar.durabilidade != null ? itemParaReparar.durabilidade : calcularDurabilidadeMax(itemParaReparar.raridade || 'comum')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>
                        <span>Durabilidade Máxima:</span>
                        <span style={{ color: '#eee' }}>{calcularDurabilidadeMax(itemParaReparar.raridade || 'comum')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: '#888', marginBottom: 8 }}>
                        <span>Pontos a Reparar:</span>
                        <span style={{ color: '#ffd166', fontWeight: 'bold' }}>{reparoPreview.pontosReparar}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: '#888', marginBottom: 8 }}>
                        <span>Custo por Ponto:</span>
                        <span style={{ color: '#ffd166' }}>{calcularCustoReparoPorPonto(itemParaReparar.raridade || 'comum')} bronze</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#eee', fontWeight: 'bold', marginBottom: 8 }}>
                        <span>Custo Total:</span>
                        <span style={{ color: '#ffd166' }}>{reparoPreview.custoTotal} bronze</span>
                      </div>
                      <button
                        onClick={handleRepararEquipamento}
                        disabled={walletCents < reparoPreview.custoTotal}
                        style={{
                          width: '100%', padding: '10px', border: 'none', borderRadius: 6,
                          background: (walletCents >= reparoPreview.custoTotal) ? '#ffd166' : '#444',
                          color: '#000', fontWeight: 'bold', cursor: (walletCents >= reparoPreview.custoTotal) ? 'pointer' : 'not-allowed',
                        }}
                      >
                        🔧 Reparar Completamente ({reparoPreview.custoTotal} bronze)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}