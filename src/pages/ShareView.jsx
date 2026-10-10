import { useEffect, useState } from 'react';
import { api, isOffline } from '../api.js';
import { ATTRIBUTES, ATTRIBUTE_NAMES } from '../config.js';
import { deriveStats } from '../game/data.js';
import {
  armasDeEquipamento,
  ARMA_CATEGORIA_INFO,
  melhorArma,
} from '../game/sistema.js';
import StatBar from '../components/StatBar.jsx';
import { buildShareJson } from '../utils/shareCharacter.js';

const CLASS_ICONS = {
  guerreiro: '🛡️',
  mago: '🔮',
  arqueiro: '🏹',
  clerigo: '✝️',
  assassino: '🗡️',
  paladino: '⚔️',
};

// Campos que seguem o mesmo formato de criação (api.createCharacter) para que o
// servidor revalide tudo ao importar — nada de dados forjados entrando na conta.
const CAMPOS_FICHA = ['name', 'gender', 'attributes', 'races', 'classes', 'passiva', 'skills', 'ultimate', 'especial', 'equipment', 'habilidades'];

function toImportPayload(ch, playerId) {
  const payload = { playerId };
  for (const campo of CAMPOS_FICHA) {
    if (ch[campo] !== undefined && ch[campo] !== null) payload[campo] = ch[campo];
  }
  return payload;
}

export default function ShareView({ shareId, player, gameData, onImported, onHome }) {
  const [ch, setCh] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    api
      .getSharedCharacter(shareId)
      .then((res) => {
        const data = res.character || res.data?.data || res.data;
        if (alive) {
          if (!data) setError('Ficha não encontrada ou expirada.');
          else setCh(data);
          setBusy(false);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message || 'Não foi possível carregar a ficha.');
        setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [shareId]);

  if (busy) return <div className="page-pad"><p className="muted">Carregando ficha compartilhada…</p></div>;

  if (error) {
    return (
      <div className="page-pad">
        <div className="error">{error}</div>
        <button className="ghost" onClick={onHome}>← Voltar</button>
      </div>
    );
  }

  if (!ch) return null;

  const classes = Array.isArray(ch.classes) ? ch.classes : [];
  const races = Array.isArray(ch.races) ? ch.races : [];
  const eq = ch.equipment || {};
  const armas = armasDeEquipamento(eq);
  const armadura = eq.armadura || null;
  const melhor = melhorArma(eq);
  const derivados = deriveStats(classes, ch.level || 1, ch.attributes, eq, races);
  const hpMax = derivados.hpMax;
  const mpMax = derivados.mpMax;
  const cls = classes[0] ? gameData.classes[classes[0].archetype] : null;
  const podeImportar = !!player && !isOffline();

  const importar = async () => {
    if (!podeImportar) return onHome();
    setBusy(true);
    setError('');
    try {
      await api.createCharacter(toImportPayload(ch, player.id));
      onImported();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const copiarJson = () => {
    navigator.clipboard
      ?.writeText(buildShareJson(ch))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <div className="page-pad">
      <div className="share-toolbar">
        <div>
          <h2 style={{ margin: 0 }}>📋 Ficha Compartilhada</h2>
          <p className="muted small">Você está vendo a ficha de alguém. Pode copiar o JSON ou importar para a sua conta.</p>
        </div>
        <div className="join-controls" style={{ flexWrap: 'wrap' }}>
          <button onClick={importar} disabled={busy}>
            {player ? (podeImportar ? '📥 Importar para minha conta' : 'Importar (offline não suportado)') : '🔑 Entrar para importar'}
          </button>
          <button className="ghost" onClick={copiarJson}>{copied ? '✅ Copiado!' : '📄 Copiar JSON'}</button>
          <button className="ghost" onClick={onHome}>← Voltar</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="sheet">
        <div className="sheet-head">
          <span className="class-icon">{CLASS_ICONS[classes[0]?.archetype || ch.class]}</span>
          <div>
            <h3>{ch.name}</h3>
            {cls && <span className="tag">{ch.custom_class_name || cls.nome}</span>}
            {races.map((r) => (
              <span className="tag" key={r.id}>{r.nome}</span>
            ))}
            <span className="tag">Nv. {ch.level || 1}</span>
          </div>
        </div>

        <StatBar label="HP" value={hpMax} max={hpMax} color="#e63946" />
        <StatBar label="MP" value={mpMax} max={mpMax} color="#4a90e2" />
        <p className="muted small">
          HP = 500 + (RES final × 10) · <strong>{hpMax}</strong>
          {' · '}Mana = (INT final × 10) · <strong>{mpMax}</strong>
          {' · '}Dano = (FOR final + melhor arma) × 10 · <strong>{derivados.dano}</strong>
          {' · '}Defesa: <strong>{derivados.defesa}</strong>
        </p>

        <div className="attr-grid">
          {ATTRIBUTES.map((k) => (
            <div className="attr-chip" key={k}>
              <span>{ATTRIBUTE_NAMES[k]}</span>
              <strong>{ch.attributes?.[k]}</strong>
            </div>
          ))}
        </div>

        {ch.passiva && (
          <div className="race-passive-box">
            <strong>Passiva:</strong> {ch.passiva}
          </div>
        )}

        <div className="sheet-section">
          <h4>Arsenal ({armas.length}/3)</h4>
          <div className="spell-list">
            {armas.map(({ slot, arma }) => (
              <div className="spell-chip" key={slot}>
                <span>
                  {ARMA_CATEGORIA_INFO[slot].icon} {arma.nome}
                  {arma.usosMax ? ` (${arma.usosMax} usos/batalha)` : ''}
                </span>
                <small>dano {arma.danoBase}{arma.efeito ? ` · 🧪 efeito: ${arma.efeito.tipo} (${arma.efeito.turnos} turnos)` : ''}</small>
              </div>
            ))}
            {armadura && (
              <div className="spell-chip">
                <span>🛡️ {armadura.nome}</span>
                <small>def {armadura.defesa}</small>
              </div>
            )}
            {!armas.length && !armadura && <p className="muted">Sem equipamento.</p>}
            {melhor && armas.length > 1 && (
              <p className="muted small">⚔️ Ataque básico usa a arma de maior dano: <strong>{melhor.nome}</strong> (dano {melhor.danoBase}).</p>
            )}
          </div>
        </div>

        <div className="sheet-section">
          <h4>Golpes e Magias</h4>
          <div className="spell-list">
            {(ch.skills || []).map((s, i) => (
              <div className="spell-chip" key={s.id || i}>
                <span>{s.nome}</span>
                <small>poder {s.poder}% · custo {s.custo} MP{s.desc ? ` · ${s.desc}` : ''}</small>
              </div>
            ))}
            {(ch.skills || []).length === 0 && <p className="muted">Nenhum golpe listado.</p>}
          </div>
        </div>

        {ch.ultimate && (
          <div className="sheet-section">
            <h4>Ultimate</h4>
            <div className="spell-chip">
              <span>🔥 {ch.ultimate.nome} ({ch.ultimate.poder}%)</span>
              <small>{ch.ultimate.modo ? ` · ${ch.ultimate.modo.turnos}t +${ch.ultimate.modo.danoMultPct}%` : ''}</small>
            </div>
          </div>
        )}

        {ch.especial && (
          <div className="sheet-section">
            <h4>Golpe Especial</h4>
            <div className="spell-chip">
              <span>💥 {ch.especial.nome} ({ch.especial.poder}%)</span>
              <small>condição: {ch.especial.condicao?.tipo} {ch.especial.condicao?.valor || ''}</small>
            </div>
          </div>
        )}

        {ch.habilidades?.length > 0 && (
          <div className="sheet-section">
            <h4>Habilidades</h4>
            <div className="spell-list">
              {ch.habilidades.map((h, i) => (
                <div className="spell-chip" key={h.id || i}>
                  <span>{h.nome}</span>
                  <small className="tag">{h.custo} pts</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}