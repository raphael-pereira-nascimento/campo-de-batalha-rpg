import { useState } from 'react';
import { GEMS, GEM_RARITY, GEM_LIST, getGemsByRarity } from '../game/gems.js';
import {
  EQUIPMENT, WEAPON_STATES, ALCANCE_TYPES,
  WEAPON_CATEGORIES, getWeaponsByCategory, getAllArmors,
} from '../game/data.js';

const WEAPON_ICONS = {
  espada_curta: '🗡️', espada_longa: '⚔️', machado_de_guerra: '🪓',
  adaga_dupla: '🔪', martelo_sagrado: '🔨', adaga_ritual: '🩸',
  arco_simples: '🏹', arco_longo: '🏹', lanca_sagrada: '🔱',
  cajado_arcano: '🪄', orbe_magico: '🔮',
  pistola: '🔫', mosquete: '💣', bacamarte: '💥',
  rifle_de_caca: '🎯', besta_pesada: '🏹', espada_baioneta: '🗡️',
  cajado_de_fogo: '🔥', arco_composto: '🏹',
};

const ARMOR_ICONS = {
  roupa_de_aventureiro: '👕', couro: '🧥', cota_de_malha: '⛓️',
  armadura_de_placas: '🛡️', manto_arcano: '🧙', vestes_sagradas: '✝️',
  armadura_leve: '🦺',
};

const GEM_ICONS = {
  comum: '💎', incomum: '💎', rara: '💎', epica: '💠', lendaria: '🌟',
};

const RARITY_ORDER = ['comum', 'incomum', 'rara', 'epica', 'lendaria'];

function WeaponCard({ id, weapon }) {
  const alcance = ALCANCE_TYPES[weapon.alcance] || ALCANCE_TYPES.corpo;
  const tipoLabel = weapon.tipo === 'arma_fogo' ? 'Fogo' : 'Branca';
  const slots = weapon.socketSlots || 0;

  return (
    <div className="weapon-card">
      <div className="weapon-card-head">
        <div className="weapon-icon">{WEAPON_ICONS[id] || '⚔️'}</div>
        <div>
          <div className="weapon-name">{weapon.nome}</div>
          <div className="weapon-tipo">{tipoLabel} · {alcance.nome}</div>
        </div>
      </div>
      <div className="weapon-stats">
        <span className="weapon-stat"><strong>Dano:</strong> {weapon.danoBase}</span>
        {weapon.recarga > 0 && (
          <span className="weapon-stat"><strong>Recarga:</strong> {weapon.recarga}</span>
        )}
        {slots > 0 && (
          <span className="weapon-stat"><strong>Slots:</strong> {slots}</span>
        )}
        {weapon.bonus && Object.entries(weapon.bonus).map(([k, v]) => (
          <span key={k} className="weapon-stat"><strong>{k}:</strong> +{v}</span>
        ))}
      </div>
      {weapon.descricao && (
        <p className="weapon-desc">{weapon.descricao}</p>
      )}
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <span className="state-badge state-otima">Ótima</span>
        <span className="state-badge state-manutencao">Manutenção</span>
        <span className="state-badge state-danificada">Danificada</span>
        <span className="state-badge state-quebrada">Quebrada</span>
      </div>
    </div>
  );
}

function ArmorCard({ id, armor }) {
  const slots = armor.socketSlots || 0;
  return (
    <div className="weapon-card">
      <div className="weapon-card-head">
        <div className="weapon-icon">{ARMOR_ICONS[id] || '🛡️'}</div>
        <div>
          <div className="weapon-name">{armor.nome}</div>
          <div className="weapon-tipo">Armadura</div>
        </div>
      </div>
      <div className="weapon-stats">
        <span className="weapon-stat"><strong>Defesa:</strong> {armor.defesa}</span>
        {slots > 0 && (
          <span className="weapon-stat"><strong>Slots:</strong> {slots}</span>
        )}
        {armor.bonus && Object.entries(armor.bonus).map(([k, v]) => (
          <span key={k} className="weapon-stat"><strong>{k}:</strong> +{v}</span>
        ))}
        {armor.penalidade && Object.entries(armor.penalidade).map(([k, v]) => (
          <span key={k} className="weapon-stat" style={{ color: '#e63946' }}><strong>{k}:</strong> {v}</span>
        ))}
      </div>
      {armor.descricao && (
        <p className="weapon-desc">{armor.descricao}</p>
      )}
    </div>
  );
}

function GemCard({ gem }) {
  const rarity = GEM_RARITY[gem.raridade] || GEM_RARITY.comum;
  return (
    <div className={`gem-card gem-rarity-${gem.raridade}`}>
      <div className="gem-card-head">
        <div className="gem-icon" style={{ borderColor: rarity.cor }}>{GEM_ICONS[gem.raridade]}</div>
        <div>
          <div className="gem-name" style={{ color: rarity.cor }}>{gem.nome}</div>
          <div className="gem-tipo">{gem.tipo} · {rarity.nome}</div>
        </div>
      </div>
      {gem.descricao && <p className="gem-desc">{gem.descricao}</p>}
      <div className="gem-effects">
        {gem.efeits && gem.efeits.arma && (
          <div className="gem-effect"><span className="gem-effect-type">Arma:</span> {gem.efeits.arma.desc}</div>
        )}
        {gem.efeits && gem.efeits.armadura && (
          <div className="gem-effect"><span className="gem-effect-type">Armadura:</span> {gem.efeits.armadura.desc}</div>
        )}
        {gem.efeits && gem.efeits.acessorio && (
          <div className="gem-effect"><span className="gem-effect-type">Acessório:</span> {gem.efeits.acessorio.desc}</div>
        )}
      </div>
      <div className="gem-stats">
        {gem.preco > 0 && (
          <span className="gem-stat"><strong>Preço:</strong> {gem.preco} 🪙</span>
        )}
        {gem.bioma && (
          <span className="gem-stat"><strong>Bioma:</strong> {gem.bioma}</span>
        )}
      </div>
      {gem.drops && gem.drops.length > 0 && (
        <div className="gem-drop-list">
          <strong style={{ marginRight: 4 }}>Drops:</strong>
          {gem.drops.map((d, i) => (
            <span key={i} className="gem-stat">{d}</span>
          ))}
        </div>
      )}
      {gem.fusao && gem.fusao.length > 0 && gem.fusao[0] !== 'qualquer' && (
        <div className="gem-fusao">Fusão: {gem.fusao.map((f) => {
          const g = GEMS[f];
          return g ? g.nome : f;
        }).join(' + ')}</div>
      )}
      {gem.fusao_requisito && (
        <div className="gem-fusao">Fusão: {gem.fusao_requisito.map((f) => {
          const g = GEMS[f];
          return g ? g.nome : f;
        }).join(' + ')}</div>
      )}
    </div>
  );
}

export default function Compendium({ onBack }) {
  const [tab, setTab] = useState('armas');
  const [weaponFilter, setWeaponFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');

  const armors = getAllArmors();
  const allWeaponsFlat = Object.entries(EQUIPMENT.armas).map(([id, w]) => ({ id, ...w }));

  const filteredWeapons = weaponFilter === 'all'
    ? allWeaponsFlat
    : allWeaponsFlat.filter((w) => {
        if (weaponFilter === 'branca') return w.tipo === 'arma' && ['corpo', 'medio'].includes(w.alcance || 'corpo');
        if (weaponFilter === 'fogo') return w.tipo === 'arma_fogo';
        if (weaponFilter === 'magica') return w.tipo === 'arma' && w.alcance === 'longo' && (w.bonus?.inteligencia || 0) >= 2;
        return true;
      });

  const filteredGems = rarityFilter === 'all'
    ? GEM_LIST
    : GEM_LIST.filter((g) => g.raridade === rarityFilter);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>⚔️ Arsenal</h1>
          <span className="player-name">Armas, Armaduras e Pedras Preciosas</span>
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
        <div className="compendium-tabs">
          <button
            className={tab === 'armas' ? 'active' : ''}
            onClick={() => setTab('armas')}
          >
            ⚔️ Armas e Armaduras
          </button>
          <button
            className={tab === 'gemas' ? 'active' : ''}
            onClick={() => setTab('gemas')}
          >
            💎 Pedras Preciosas
          </button>
        </div>

        {tab === 'armas' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'Todas' },
                { key: 'branca', label: '⚔️ Brancas' },
                { key: 'fogo', label: '🔫 Fogo' },
                { key: 'magica', label: '✨ Mágicas' },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`ghost ${weaponFilter === f.key ? 'active' : ''}`}
                  style={weaponFilter === f.key ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}}
                  onClick={() => setWeaponFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="compendium-section">
              <h3>⚔️ Armas</h3>
              <div className="compendium-grid">
                {filteredWeapons.map((w) => (
                  <WeaponCard key={w.id} id={w.id} weapon={w} />
                ))}
              </div>
            </div>

            <div className="compendium-section">
              <h3>🛡️ Armaduras</h3>
              <div className="compendium-grid">
                {armors.map((a) => (
                  <ArmorCard key={a.id} id={a.id} armor={a} />
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'gemas' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                className={`ghost ${rarityFilter === 'all' ? 'active' : ''}`}
                style={rarityFilter === 'all' ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}}
                onClick={() => setRarityFilter('all')}
              >
                Todas
              </button>
              {RARITY_ORDER.map((r) => (
                <button
                  key={r}
                  className={`ghost ${rarityFilter === r ? 'active' : ''}`}
                  style={rarityFilter === r
                    ? { background: GEM_RARITY[r].cor, color: '#fff', borderColor: GEM_RARITY[r].cor }
                    : { borderColor: GEM_RARITY[r].cor, color: GEM_RARITY[r].cor }
                  }
                  onClick={() => setRarityFilter(r)}
                >
                  {GEM_RARITY[r].nome}
                </button>
              ))}
            </div>

            {RARITY_ORDER.filter((r) => rarityFilter === 'all' || rarityFilter === r).map((r) => {
              const gems = getGemsByRarity(r);
              if (gems.length === 0) return null;
              return (
                <div key={r} className="compendium-section">
                  <h3 style={{ color: GEM_RARITY[r].cor }}>{GEM_RARITY[r].nome} ({gems.length})</h3>
                  <div className="compendium-grid">
                    {gems.map((g) => (
                      <GemCard key={g.id} gem={g} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
