import { useState } from 'react';
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

export default function CharacterSheet({ character, gameData, onChanged }) {
  const [busy, setBusy] = useState(null);

  const cls = gameData.classes[character.class];
  const race = gameData.races?.[character.race];
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

  const spells = (character.spells || [])
    .map((id) => ({ id, data: gameData.spells[id] }))
    .filter((s) => s.data);

  return (
    <div className="sheet">
      <div className="sheet-head">
        <span className="class-icon">{CLASS_ICONS[character.class]}</span>
        <div>
          <h3>{character.name}</h3>
          <span className="tag">{character.custom_class_name || cls.nome}</span>
          {race && <span className="tag">{race.nome}</span>}
          <span className="tag">Nv. {character.level}</span>
          <span className="tag">XP {character.xp}/{character.level * 100}</span>
        </div>
      </div>

      {race && (
        <div className="race-passive-box">
          <strong>Passiva — {race.nome}:</strong> {race.passiva}
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
        <h4>Equipamento</h4>
        <div className="equip-row">
          <label>
            Arma
            <select
              value={(character.equipment.arma && character.equipment.arma.id) || ''}
              disabled={busy === 'arma'}
              onChange={(e) => equip('arma', e.target.value)}
            >
              <option value="">— Nenhuma —</option>
              {Object.entries(gameData.equipment.armas).map(([id, it]) => (
                <option key={id} value={id}>
                  {it.nome} (dano {it.danoBase})
                </option>
              ))}
            </select>
          </label>
          <label>
            Armadura
            <select
              value={(character.equipment.armadura && character.equipment.armadura.id) || ''}
              disabled={busy === 'armadura'}
              onChange={(e) => equip('armadura', e.target.value)}
            >
              <option value="">— Nenhuma —</option>
              {Object.entries(gameData.equipment.armaduras).map(([id, it]) => (
                <option key={id} value={id}>
                  {it.nome} (def {it.defesa})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="sheet-section">
        <h4>Magias</h4>
        <div className="spell-list">
          {spells.map(({ id, data }) => (
            <div className="spell-chip" key={id} title={data.desc}>
              <span>{data.nome}</span>
              <small>
                MP {data.custo} · {data.tipo}
              </small>
            </div>
          ))}
        </div>
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
