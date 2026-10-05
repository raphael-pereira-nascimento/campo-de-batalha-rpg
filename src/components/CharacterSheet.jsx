import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ATTRIBUTES, ATTRIBUTE_NAMES } from '../config.js';
import { GEMS, GEM_RARITY, gemIsRaw } from '../game/gems.js';
import { deriveStats } from '../game/data.js';
import { cargaMaxima, VOO } from '../game/sistema.js';
import StatBar from './StatBar.jsx';

const CLASS_ICONS = {
  guerreiro: '🛡️',
  mago: '🔮',
  arqueiro: '🏹',
  clerigo: '✝️',
  assassino: '🗡️',
  paladino: '⚔️',
};

const SKILL_TYPE_ICONS = { fisico: '⚔️', magia: '✨', cura: '💚', buff: '🔮', defesa: '🛡️' };

function skillFromSpell(s) {
  return {
    id: s.nome,
    nome: s.nome,
    tipo: s.tipo === 'ataque' ? 'magia' : s.tipo,
    poder: Math.round((s.poder || 1) * 100),
    custo: s.custo || 0,
    desc: s.desc || '',
  };
}

export default function CharacterSheet({ character, gameData, onChanged }) {
  const [busy, setBusy] = useState(null);
  const [customEquipment, setCustomEquipment] = useState([]);
  const [characterGems, setCharacterGems] = useState([]);
  const [socketModal, setSocketModal] = useState(null); // { equipSlot, slotIndex }
  const [dragGem, setDragGem] = useState(null); // gemId sendo arrastada
  const [dropSlot, setDropSlot] = useState(null); // { equipSlot, slotIndex } alvo

  useEffect(() => {
    api
      .listCustomEquipment()
      .then((d) => setCustomEquipment(d.equipment || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .getCharacterGems(character.id)
      .then((d) => setCharacterGems(d.gems || []))
      .catch(() => {});
  }, [character.id]);

  const cls = character.classes?.[0] ? gameData.classes[character.classes[0].archetype] : gameData.classes[character.class];
  const races = character.races || [];
  const classes = character.classes || [];
  const skills = (character.skills || []).length
    ? character.skills
    : (character.spells || [])
        .map((id) => gameData.spells[id])
        .filter(Boolean)
        .map(skillFromSpell);

  // Recalcula os máximos com as fórmulas atuais para fichas criadas antes da
  // mudança da regra de Mana (INT × 2 + BR + BC).
  const derivados = deriveStats(classes, character.level, character.attributes, character.equipment, races);
  const hpMax = derivados.hpMax || character.hp_max;
  const mpMax = derivados.mpMax || character.mp_max;
  const voa = races.some((r) => (r.vooNatural || gameData.races?.[r.id]?.vooNatural));
  const cargaMax = cargaMaxima(derivados.effectiveAttributes, character.level);

  const equip = async (slot, itemId) => {
    setBusy(slot);
    try {
      const d = await api.equipItem(character.id, slot, itemId);
      onChanged(d.character);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleSocket = async (equipSlot, slotIndex, gemId) => {
    setBusy('socket');
    try {
      const d = await api.socketGem(character.id, `${equipSlot}_${slotIndex}`, gemId);
      if (d.character) onChanged(d.character);
      const gems = await api.getCharacterGems(character.id);
      setCharacterGems(gems.gems || []);
      setSocketModal(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleUnsocket = async (equipSlot, slotIndex) => {
    setBusy('unsocket');
    try {
      const d = await api.unsocketGem(character.id, `${equipSlot}_${slotIndex}`);
      if (d.character) onChanged(d.character);
      const gems = await api.getCharacterGems(character.id);
      setCharacterGems(gems.gems || []);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  const armas = [
    ...Object.entries(gameData.equipment.armas).map(([id, it]) => ({ id, label: `${it.nome} (dano ${it.danoBase})` })),
    ...customEquipment
      .filter((e) => e.tipo === 'arma')
      .map((e) => ({ id: e.id, label: `${e.nome} (dano ${e.dano_base}) ✨` })),
  ];
  const armaduras = [
    ...Object.entries(gameData.equipment.armaduras).map(([id, it]) => ({ id, label: `${it.nome} (def ${it.defesa})` })),
    ...customEquipment
      .filter((e) => e.tipo === 'armadura')
      .map((e) => ({ id: e.id, label: `${e.nome} (def ${e.defesa}) ✨` })),
  ];

  const equipSummary = (item) =>
    item
      ? ATTRIBUTES.filter((k) => item.bonus?.[k] || item.penalidade?.[k])
          .map((k) => `${ATTRIBUTE_NAMES[k]} ${item.bonus?.[k] > 0 ? '+' : ''}${item.bonus?.[k] || 0}${item.penalidade?.[k] ? ` / -${Math.abs(item.penalidade[k])}` : ''}`)
          .join(', ') || 'sem bônus'
      : '';

  // Deltas de atributos vindos das gemas socketadas (por slot de equipamento).
  // Positivo = buff (verde), negativo = debuff (vermelho). Gemas brutas não contam.
  const gemAttrDeltas = () => {
    const acc = {};
    for (const equipSlot of ['arma', 'armadura']) {
      const item = character.equipment?.[equipSlot];
      if (!item) continue;
      for (const gemId of item.socketedGems || []) {
        const gem = GEMS[gemId];
        if (!gem || gemIsRaw(gemId)) continue;
        const fx = gem.efeitos?.[equipSlot];
        if (!fx?.bonus) continue;
        for (const [k, v] of Object.entries(fx.bonus)) acc[k] = (acc[k] || 0) + v;
      }
    }
    return acc;
  };

  // Total de efeitos de gemas equipadas por slot (para exibição descritiva).
  const gemSlotEffects = (equipSlot) => {
    const item = character.equipment?.[equipSlot];
    if (!item) return [];
    const out = [];
    for (const gemId of item.socketedGems || []) {
      const gem = GEMS[gemId];
      if (!gem || gemIsRaw(gemId)) continue;
      const fx = gem.efeitos?.[equipSlot];
      if (fx?.desc) out.push({ gemId, desc: fx.desc, bonus: fx.bonus || {} });
    }
    return out;
  };

  return (
    <div className="sheet">
      <div className="sheet-head">
        <span className="class-icon">{CLASS_ICONS[classes[0]?.archetype || character.class]}</span>
        <div>
          <h3>{character.name}</h3>
          <span className="tag">{character.custom_class_name || cls?.nome}</span>
          {races.map((r) => (
            <span className="tag" key={r.id}>{r.nome}</span>
          ))}
          <span className="tag">Nv. {character.level}</span>
          <span className="tag">XP {character.xp}/{character.level * 100}</span>
        </div>
      </div>

      <div className="sheet-section">
        <h4>Raças</h4>
        <div className="spell-list">
          {races.map((r) => (
            <div className="spell-chip" key={r.id} title={r.passiva}>
              <span>{r.nome}</span>
              <small>✨ {r.passiva}</small>
            </div>
          ))}
          {races.length === 0 && <p className="muted">Nenhuma raça.</p>}
        </div>
      </div>

      <div className="sheet-section">
        <h4>Classes</h4>
        <div className="spell-list">
          {classes.map((c) => (
            <div className="spell-chip" key={c.id}>
              <span>{c.nome}{c.primary ? ' ★' : ''}</span>
              <small>{gameData.classes[c.archetype]?.nome}{c.primary ? ' · define vida/mana' : ''}</small>
            </div>
          ))}
          {classes.length === 0 && <p className="muted">Nenhuma classe.</p>}
        </div>
      </div>

      {character.passiva && (
        <div className="race-passive-box">
          <strong>Passiva do personagem:</strong> {character.passiva}
        </div>
      )}

      <StatBar label="HP" value={character.hp_current} max={hpMax} color="#e63946" />
      <StatBar label="MP" value={character.mp_current} max={mpMax} color="#4a90e2" />
      <p className="muted small">
        Mana = (INT final) × 10 = {character.attributes?.inteligencia} → <strong>{mpMax}</strong>
        {mpMax !== character.mp_max && character.mp_max ? ` (ficha salva com ${character.mp_max})` : ''}
        {' · '}HP = 500 + (RES final × 10) · <strong>{hpMax}</strong>
        {' · '}Carga máxima: <strong>{cargaMax}</strong>
        {voa && <span> · 🕊️ Voo natural (manter no ar custa foco; voo mágico custa {VOO.manaPorTurno} MP/turno)</span>}
      </p>

      <div className="attr-grid">
        {ATTRIBUTES.map((k) => (
          <div className="attr-chip" key={k}>
            <span>{ATTRIBUTE_NAMES[k]}</span>
            <strong>{character.attributes[k]}</strong>
          </div>
        ))}
      </div>

      <div className="sheet-section">
        <h4>Golpes</h4>
        <div className="spell-list">
          {skills.map((s) => (
            <div className="spell-chip" key={s.id} title={s.desc}>
              <span>{SKILL_TYPE_ICONS[s.tipo] || '✨'} {s.nome}</span>
              <small>MP {s.custo} · {s.poder}%</small>
            </div>
          ))}
          {skills.length === 0 && <p className="muted">Nenhum golpe.</p>}
        </div>
      </div>

      {(character.ultimate || character.especial) && (
        <div className="sheet-section">
          <h4>Ultimate & Especial</h4>
          <div className="spell-list">
            {character.ultimate && (
              <div className="spell-chip mega" title={character.ultimate.desc}>
                <span>🔥 {character.ultimate.nome}</span>
                <small>
                  {character.ultimate.poder}%{character.ultimate.modo ? ` · ${character.ultimate.modo.turnos}t +${character.ultimate.modo.danoMultPct}%` : ''}
                </small>
              </div>
            )}
            {character.especial && (
              <div className="spell-chip mega" title={character.especial.desc}>
                <span>💫 {character.especial.nome}</span>
                <small>{character.especial.poder}%</small>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sheet-section">
        <h4>Equipamento</h4>
        <div className="equip-row">
          <label>
            Arma
            <select
              value={(character.equipment?.arma?.id) || ''}
              disabled={busy === 'arma'}
              onChange={(e) => equip('arma', e.target.value)}
            >
              <option value="">— Nenhuma —</option>
              {armas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Armadura
            <select
              value={(character.equipment?.armadura?.id) || ''}
              disabled={busy === 'armadura'}
              onChange={(e) => equip('armadura', e.target.value)}
            >
              <option value="">— Nenhuma —</option>
              {armaduras.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {(character.equipment?.arma || character.equipment?.armadura) && (
          <div className="spell-list">
            {character.equipment?.arma && (
              <div className="spell-chip">
                <span>⚔️ {character.equipment.arma.nome}</span>
                <small>dano {character.equipment.arma.danoBase} · {equipSummary(character.equipment.arma)}{character.equipment.arma.maleficio ? ` · ⚠️ ${character.equipment.arma.maleficio}` : ''}</small>
              </div>
            )}
            {character.equipment?.armadura && (
              <div className="spell-chip">
                <span>🛡️ {character.equipment.armadura.nome}</span>
                <small>def {character.equipment.armadura.defesa} · {equipSummary(character.equipment.armadura)}{character.equipment.armadura.maleficio ? ` · ⚠️ ${character.equipment.armadura.maleficio}` : ''}</small>
              </div>
            )}
          </div>
        )}

        {(character.equipment?.arma || character.equipment?.armadura) && (
          <div style={{ marginTop: 8 }}>
            {['arma', 'armadura'].map((equipSlot) => {
              const item = character.equipment?.[equipSlot];
              if (!item) return null;
              const slots = item.socketSlots || 0;
              const socketedGems = item.socketedGems || [];
              if (slots === 0) return null;
              return (
                <div key={equipSlot} style={{ marginBottom: 8 }}>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                    Slots — {item.nome} ({equipSlot === 'arma' ? item.danoBase ? 'Arma' : 'Arma' : 'Armadura'})
                  </small>
                  <div className="socket-slots" style={{ marginTop: 4 }}>
                    {Array.from({ length: slots }, (_, i) => {
                      const gemId = socketedGems[i];
                      const gem = gemId ? GEMS[gemId] : null;
                      const isDropTarget = dropSlot?.equipSlot === equipSlot && dropSlot?.slotIndex === i;
                      return (
                        <div
                          key={i}
                          className={`socket-slot ${gem ? 'filled' : ''} ${gem ? `gem-rarity-${gem?.raridade || 'comum'}` : ''} ${isDropTarget && !gem ? 'drop-target' : ''}`}
                          title={gem ? gem.nome : 'Slot vazio'}
                          onClick={() => {
                            if (gem) return;
                            setSocketModal({ equipSlot, slotIndex: i });
                          }}
                          onDragOver={(e) => {
                            if (gem) return;
                            e.preventDefault();
                            setDropSlot({ equipSlot, slotIndex: i });
                          }}
                          onDragLeave={() =>
                            setDropSlot((s) => (s?.equipSlot === equipSlot && s?.slotIndex === i ? null : s))
                          }
                          onDrop={(e) => {
                            e.preventDefault();
                            setDropSlot(null);
                            if (gem) return;
                            const gid = e.dataTransfer.getData('text/gem-id') || dragGem;
                            if (gid && !gemIsRaw(gid)) handleSocket(equipSlot, i, gid);
                            else if (gid) alert('⚠️ Requer polimento antes de usar');
                            setDragGem(null);
                          }}
                        >
                          {gem ? '💎' : '+'}
                          {gem && (
                            <>
                              <span className="slot-gem-name">{gem.nome}</span>
                              <span
                                className="remove-gem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnsocket(equipSlot, i);
                                }}
                              >
                                ✕
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Efeitos de gemas equipadas — buffs em verde, debuffs em vermelho */}
        {(() => {
          const deltas = gemAttrDeltas();
          const entries = Object.entries(deltas);
          if (entries.length === 0) return null;
          return (
            <div className="sheet-section">
              <h4>Efeitos das Gemas</h4>
              <div className="attr-grid">
                {entries.map(([k, v]) => (
                  <div className={`attr-chip gem-stat ${v >= 0 ? 'gem-buff' : 'gem-debuff'}`} key={k}>
                    <span>{ATTRIBUTE_NAMES[k] || k}</span>
                    <strong>{v > 0 ? '+' : ''}{v}</strong>
                  </div>
                ))}
              </div>
              <div className="gem-effects">
                {['arma', 'armadura'].map((slot) =>
                  gemSlotEffects(slot).map(({ gemId, desc }) => (
                    <div className="gem-effect" key={slot + gemId}>
                      <span className="gem-effect-type">💎 {GEMS[gemId]?.nome}</span>
                      <span>{desc}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="sheet-section">
        <h4>Itens</h4>
        <div className="item-list">
          {(character.inventory || []).map((it, i) => (
            <span className="item-chip" key={i}>
              {it.nome} ×1
            </span>
          ))}
        </div>
      </div>

      {socketModal && (
        <div className="modal-backdrop" onClick={() => setSocketModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>💎 Inserir Gema</h2>
            <p className="muted">
              Slot: {socketModal.equipSlot} #{socketModal.slotIndex + 1}
            </p>
            {characterGems.length === 0 ? (
              <p className="muted">Nenhuma gema disponível no inventário.</p>
            ) : (
              <div className="gem-select-grid">
                {characterGems.map((gemId) => {
                  const gem = GEMS[gemId];
                  if (!gem) return null;
                  const rarity = GEM_RARITY[gem.raridade] || GEM_RARITY.comum;
                  const raw = gemIsRaw(gemId);
                  const hasEffect = !!gem.efeitos?.[socketModal.equipSlot];
                  return (
                    <div
                      key={gemId}
                      className={`gem-select-card dark-fantasy ${raw ? 'gem-raw' : ''} ${!hasEffect ? 'gem-incompativel' : ''}`}
                      style={{ borderColor: raw ? '#6b5b3e' : rarity.cor }}
                      draggable={!raw && hasEffect}
                      onDragStart={(e) => {
                        if (raw || !hasEffect) return;
                        e.dataTransfer.setData('text/gem-id', gemId);
                        setDragGem(gemId);
                      }}
                      onDragEnd={() => setDragGem(null)}
                      title={
                        raw
                          ? '⚠️ Requer polimento antes de usar'
                          : !hasEffect
                          ? `Esta gema não se encaixa em ${socketModal.equipSlot}`
                          : `${gem.nome} — clique para equipar ou arraste para um slot`
                      }
                      onClick={() => {
                        if (raw) return alert('⚠️ Requer polimento antes de usar');
                        if (!hasEffect) return alert(`Esta gema não se encaixa em ${socketModal.equipSlot}`);
                        handleSocket(socketModal.equipSlot, socketModal.slotIndex, gemId);
                      }}
                    >
                      <div className="gem-card-head">
                        <span className="gem-icon">💎</span>
                        <div>
                          <div className="gem-name" style={{ color: rarity.cor }}>{gem.nome}</div>
                          <div className="gem-rarity-label">{rarity.nome}</div>
                        </div>
                      </div>
                      <div className="gem-biome">🌍 {gem.bioma}</div>
                      <div className="gem-ef-list">
                        {['arma', 'armadura', 'acessorio', 'golem'].map((slot) => {
                          const fx = gem.efeitos?.[slot];
                          if (!fx?.desc) return null;
                          return (
                            <div className={`gem-ef ${slot === socketModal.equipSlot ? 'gem-ef-ativo' : ''}`} key={slot}>
                              <span className="gem-ef-slot">{slot}</span>
                              <span className="gem-bonus-line">{fx.desc}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="gem-fusao">◆ Fusões: {gem.fusao?.length ? gem.fusao.join(', ') : '—'}</div>
                      <div className="gem-select-foot">
                        <span className={`estado-badge ${raw ? 'estado-bruta' : 'estado-polida'}`}>
                          {raw ? '⛓ Bruta' : '✨ Polida'}
                        </span>
                        {raw && <span className="gem-tooltip">⚠️ Requer polimento</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="modal-actions">
              <button className="ghost" onClick={() => setSocketModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
