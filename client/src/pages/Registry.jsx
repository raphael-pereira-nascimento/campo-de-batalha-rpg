import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ATTRIBUTES, ATTRIBUTE_NAMES } from '../config.js';

export default function Registry({ player, gameData, onBack }) {
  const [tab, setTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, m] = await Promise.all([api.listCustomClasses(), api.listCustomMonsters()]);
      setClasses(c.classes || []);
      setMonsters(m.monsters || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>📜 Registro do Mundo</h1>
          <span className="player-name">Jogador: {player.name}</span>
        </div>
        <button className="ghost" onClick={onBack}>
          ← Voltar
        </button>
      </header>

      <div className="content">
        <div className="registry-tabs">
          <button className={tab === 'classes' ? 'active' : ''} onClick={() => setTab('classes')}>
            Classes
          </button>
          <button className={tab === 'monsters' ? 'active' : ''} onClick={() => setTab('monsters')}>
            Monstros
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {tab === 'classes' && (
          <ClassRegistry player={player} classes={classes} gameData={gameData} onChanged={() => { setError(''); load(); }} setError={setError} />
        )}
        {tab === 'monsters' && (
          <MonsterRegistry player={player} monsters={monsters} gameData={gameData} onChanged={() => { setError(''); load(); }} setError={setError} />
        )}
      </div>
    </div>
  );
}

function ClassRegistry({ player, classes, gameData, onChanged, setError }) {
  const [form, setForm] = useState({ name: '', funcao: '', passiva: '', forcas: '', fraquezas: '', archetype: 'guerreiro' });
  const [editingId, setEditingId] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Informe o nome da classe.');
    setError('');
    try {
      if (editingId) {
        await api.updateCustomClass(editingId, { creatorId: player.id, ...form });
      } else {
        await api.createCustomClass({ creatorId: player.id, ...form });
      }
      setForm({ name: '', funcao: '', passiva: '', forcas: '', fraquezas: '', archetype: 'guerreiro' });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteCustomClass(id, player.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registry-grid">
      <section className="panel">
        <h2>{editingId ? 'Editar Classe' : 'Nova Classe'}</h2>
        <form onSubmit={save} className="stack">
          <label>
            Nome da classe
            <input value={form.name} onChange={set('name')} maxLength={30} placeholder="Ex.: Bárbaro das Feras" />
          </label>
          <label>
            Função (papel no combate)
            <input value={form.funcao} onChange={set('funcao')} maxLength={120} placeholder="Ex.: Tanque que protege o grupo" />
          </label>
          <label>
            Passiva natural
            <input value={form.passiva} onChange={set('passiva')} maxLength={160} placeholder="Ex.: Fica mais forte ao perder HP" />
          </label>
          <label>
            Forças
            <input value={form.forcas} onChange={set('forcas')} maxLength={160} placeholder="Ex.: alta resistência, dano físico" />
          </label>
          <label>
            Fraquezas
            <input value={form.fraquezas} onChange={set('fraquezas')} maxLength={160} placeholder="Ex.: lento, vulnerável a magia" />
          </label>
          <label>
            Arquétipo mecânico (define as habilidades no combate)
            <select value={form.archetype} onChange={set('archetype')}>
              {Object.values(gameData.classes).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit">{editingId ? 'Salvar Alterações' : 'Registrar Classe'}</button>
          {editingId && (
            <button type="button" className="ghost" onClick={() => { setEditingId(null); setError(''); }}>
              Cancelar edição
            </button>
          )}
        </form>
      </section>

      <section className="panel">
        <h2>Classes registradas ({classes.length})</h2>
        <div className="registry-list">
          {classes.map((c) => (
            <div className="registry-card" key={c.id}>
              <div>
                <strong>{c.name}</strong>{' '}
                <span className="tag">arquétipo: {gameData.classes[c.archetype]?.nome}</span>
                <span className="tag">por {c.creator_name}</span>
                <p className="muted">{c.funcao}</p>
                <p className="muted">✨ {c.passiva}</p>
                <p className="muted">💪 {c.forcas}</p>
                <p className="muted">💔 {c.fraquezas}</p>
              </div>
              {c.creator_id === player.id && (
                <div className="registry-actions">
                  <button
                    className="ghost"
                    onClick={() => {
                      setEditingId(c.id);
                      setForm({ name: c.name, funcao: c.funcao, passiva: c.passiva, forcas: c.forcas, fraquezas: c.fraquezas, archetype: c.archetype });
                    }}
                  >
                    Editar
                  </button>
                  <button className="ghost danger" onClick={() => remove(c.id)}>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
          {classes.length === 0 && <p className="muted">Nenhuma classe registrada ainda.</p>}
        </div>
      </section>
    </div>
  );
}

function MonsterRegistry({ player, monsters, gameData, onChanged, setError }) {
  const [form, setForm] = useState({
    nome: '',
    nivel: 1,
    attributes: { forca: 3, inteligencia: 1, resistencia: 3, destreza: 1, reflexos: 1 },
    arma: { nome: '', danoBase: 6 },
    spells: [],
    passiva: '',
    escala_chefe: false,
    multiplicador_hp: 3,
  });

  const setAttr = (k) => (e) =>
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [k]: Number(e.target.value) } }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setError('Informe o nome do monstro.');
    setError('');
    try {
      await api.createCustomMonster({ creatorId: player.id, ...form, arma: form.arma.nome ? form.arma : null });
      setForm({
        nome: '',
        nivel: 1,
        attributes: { forca: 3, inteligencia: 1, resistencia: 3, destreza: 1, reflexos: 1 },
        arma: { nome: '', danoBase: 6 },
        spells: [],
        passiva: '',
        escala_chefe: false,
        multiplicador_hp: 3,
      });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteCustomMonster(id, player.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registry-grid">
      <section className="panel">
        <h2>Novo Monstro</h2>
        <form onSubmit={save} className="stack">
          <label>
            Nome
            <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={30} placeholder="Ex.: Fel das Sombras" />
          </label>
          <div className="form-row">
            <label>
              Nível
              <input type="number" min={1} max={50} value={form.nivel} onChange={(e) => setForm((f) => ({ ...f, nivel: Number(e.target.value) }))} />
            </label>
            <label>
              Multiplicador de HP (chefe)
              <input type="number" step={0.5} min={1} max={10} value={form.multiplicador_hp} onChange={(e) => setForm((f) => ({ ...f, multiplicador_hp: Number(e.target.value) }))} />
            </label>
          </div>
          <label>
            Arma (nome)
            <input value={form.arma.nome} onChange={(e) => setForm((f) => ({ ...f, arma: { ...f.arma, nome: e.target.value } }))} placeholder="Ex.: Garras Negras" />
          </label>
          <div className="form-row">
            <label>
              Dano base da arma
              <input type="number" min={1} max={30} value={form.arma.danoBase} onChange={(e) => setForm((f) => ({ ...f, arma: { ...f.arma, danoBase: Number(e.target.value) } }))} />
            </label>
            <label className="check-label">
              <input type="checkbox" checked={form.escala_chefe} onChange={(e) => setForm((f) => ({ ...f, escala_chefe: e.target.checked }))} />
              É um CHEFE (escalável)
            </label>
          </div>
          <label>
            Passiva
            <input value={form.passiva} onChange={(e) => setForm((f) => ({ ...f, passiva: e.target.value }))} maxLength={160} placeholder="Ex.: Regenera HP no início do turno" />
          </label>
          <div className="attrs mini">
            {ATTRIBUTES.map((k) => (
              <div className="attr-row" key={k}>
                <span className="attr-name">{ATTRIBUTE_NAMES[k]}</span>
                <input type="number" min={1} max={12} value={form.attributes[k]} onChange={setAttr(k)} />
              </div>
            ))}
          </div>
          <p className="muted small">
            Vida = Resistência × 10 · Mana = Inteligência × 10. Chefes ganham mais ações conforme o nº de jogadores.
          </p>
          <button type="submit">Criar Monstro</button>
        </form>
      </section>

      <section className="panel">
        <h2>Monstros criados ({monsters.length})</h2>
        <div className="registry-list">
          {monsters.map((m) => (
            <div className="registry-card" key={m.id}>
              <div>
                <strong>{m.nome}</strong>{' '}
                {m.escala_chefe && <span className="tag boss-tag">☠️ Chefe ×{m.multiplicador_hp}</span>}
                <span className="tag">Nv. {m.nivel}</span>
                <span className="tag">por {m.creator_name}</span>
                <p className="muted">
                  HP {m.attributes.resistencia * 10} · MP {m.attributes.inteligencia * 10} · Arma: {m.arma ? `${m.arma.nome} (${m.arma.danoBase})` : 'sem arma'}
                </p>
                <p className="muted">✨ {m.passiva || 'Sem passiva'}</p>
              </div>
              {m.creator_id === player.id && (
                <div className="registry-actions">
                  <button className="ghost danger" onClick={() => remove(m.id)}>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
          {monsters.length === 0 && <p className="muted">Nenhum monstro criado ainda.</p>}
        </div>
      </section>
    </div>
  );
}
