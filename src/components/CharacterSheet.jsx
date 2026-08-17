import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ATTRIBUTES, ATTRIBUTE_NAMES } from '../config.js';
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

  useEffect(() => {
    api
      .listCustomEquipment()
      .then((d) => setCustomEquipment(d.equipment || []))
      .catch(() => {});
  }, []);

  const cls = character.classes?.[0] ? gameData.classes[character.classes[0].archetype] : gameData.classes[character.class];
  const races = character.races || [];
  const classes = character.classes || [];
  const skills = (character.skills || []).length
    ? character.skills
    : (character.spells || [])
        .map((id) => gameData.spells[id])
        .filter(Boolean)
        .map(skillFromSpell);

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

      <StatBar label="HP" value={character.hp_current} max={character.hp_max} color="#e63946" />
      <StatBar label="MP" value={character.mp_current} max={character.mp_max} color="#4a90e2" />

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
    </div>
  );
}
