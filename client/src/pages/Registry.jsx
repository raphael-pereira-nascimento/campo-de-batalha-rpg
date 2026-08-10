import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ATTRIBUTES, ATTRIBUTE_NAMES, SKILL_TYPES } from '../config.js';

export default function Registry({ player, gameData, onBack }) {
  const [tab, setTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [races, setRaces] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, m, r, e, s] = await Promise.all([
        api.listCustomClasses(),
        api.listCustomMonsters(),
        api.listCustomRaces(),
        api.listCustomEquipment(),
        api.listCustomSkills(),
      ]);
      setClasses(c.classes || []);
      setMonsters(m.monsters || []);
      setRaces(r.races || []);
      setEquipment(e.equipment || []);
      setSkills(s.skills || []);
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
          <button className={tab === 'races' ? 'active' : ''} onClick={() => setTab('races')}>
            Raças
          </button>
          <button className={tab === 'equipment' ? 'active' : ''} onClick={() => setTab('equipment')}>
            Equipamentos
          </button>
          <button className={tab === 'skills' ? 'active' : ''} onClick={() => setTab('skills')}>
            Golpes
          </button>
          <button className={tab === 'monsters' ? 'active' : ''} onClick={() => setTab('monsters')}>
            Monstros
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {tab === 'classes' && (
          <ClassRegistry player={player} classes={classes} gameData={gameData} onChanged={() => { setError(''); load(); }} setError={setError} />
        )}
        {tab === 'races' && (
          <RaceRegistry player={player} races={races} onChanged={() => { setError(''); load(); }} setError={setError} />
        )}
        {tab === 'equipment' && (
          <EquipmentRegistry player={player} equipment={equipment} onChanged={() => { setError(''); load(); }} setError={setError} />
        )}
        {tab === 'skills' && (
          <SkillRegistry player={player} skills={skills} onChanged={() => { setError(''); load(); }} setError={setError} />
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

function RaceRegistry({ player, races, onChanged, setError }) {
  const [form, setForm] = useState({ nome: '', bonus: {}, passiva: '' });

  const setBonus = (k, v) => setForm((f) => ({ ...f, bonus: { ...f.bonus, [k]: Number(v) } }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setError('Informe o nome da raça.');
    setError('');
    try {
      await api.createCustomRace({ creatorId: player.id, nome: form.nome, bonus: form.bonus, passiva: form.passiva });
      setForm({ nome: '', bonus: {}, passiva: '' });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteCustomRace(id, player.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registry-grid">
      <section className="panel">
        <h2>Nova Raça</h2>
        <form onSubmit={save} className="stack">
          <label>
            Nome da raça
            <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder="Ex.: Tribo do Céu" />
          </label>
          <p className="muted small">Bônus raciais de atributo (valores positivos somam, negativos subtraem).</p>
          <div className="attrs mini">
            {ATTRIBUTES.map((k) => (
              <div className="attr-row" key={k}>
                <span className="attr-name">{ATTRIBUTE_NAMES[k]}</span>
                <input type="number" step={1} min={-3} max={3} value={form.bonus[k] ?? 0} onChange={(e) => setBonus(k, e.target.value)} />
              </div>
            ))}
          </div>
          <label>
            Passiva
            <textarea value={form.passiva} onChange={(e) => setForm((f) => ({ ...f, passiva: e.target.value }))} rows={2} maxLength={300} placeholder="Ex.: +15% de esquiva em florestas..." />
          </label>
          <button type="submit">Registrar Raça</button>
        </form>
      </section>

      <section className="panel">
        <h2>Raças registradas ({races.length})</h2>
        <div className="registry-list">
          {races.map((r) => (
            <div className="registry-card" key={r.id}>
              <div>
                <strong>{r.nome}</strong>{' '}
                <span className="tag">por {r.creator_name}</span>
                <p className="muted">
                  {ATTRIBUTES.filter((k) => r.bonus?.[k]).map((k) => `${ATTRIBUTE_NAMES[k]} ${r.bonus[k] > 0 ? '+' : ''}${r.bonus[k]}`).join(' · ') || 'sem bônus'}
                </p>
                <p className="muted">✨ {r.passiva || 'Sem passiva'}</p>
              </div>
              {r.creator_id === player.id && (
                <div className="registry-actions">
                  <button className="ghost danger" onClick={() => remove(r.id)}>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
          {races.length === 0 && <p className="muted">Nenhuma raça registrada ainda.</p>}
        </div>
      </section>
    </div>
  );
}

function EquipmentRegistry({ player, equipment, onChanged, setError }) {
  const [form, setForm] = useState({
    tipo: 'arma',
    nome: '',
    dano_base: 6,
    defesa: 4,
    bonus: {},
    penalidade: {},
    maleficio: '',
  });

  const setBonus = (k, v) => setForm((f) => ({ ...f, bonus: { ...f.bonus, [k]: Number(v) } }));
  const setPenal = (k, v) => setForm((f) => ({ ...f, penalidade: { ...f.penalidade, [k]: Number(v) } }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setError('Informe o nome do equipamento.');
    setError('');
    try {
      await api.createCustomEquipment({ creatorId: player.id, ...form });
      setForm({ tipo: 'arma', nome: '', dano_base: 6, defesa: 4, bonus: {}, penalidade: {}, maleficio: '' });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteCustomEquipment(id, player.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registry-grid">
      <section className="panel">
        <h2>Novo Equipamento</h2>
        <form onSubmit={save} className="stack">
          <div className="form-row">
            <label>
              Tipo
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                <option value="arma">Arma</option>
                <option value="armadura">Armadura</option>
              </select>
            </label>
            <label>
              Nome
              <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder="Ex.: Espada de Cinzas" />
            </label>
            {form.tipo === 'arma' ? (
              <label>
                Dano base
                <input type="number" min={1} max={30} value={form.dano_base} onChange={(e) => setForm((f) => ({ ...f, dano_base: Number(e.target.value) }))} />
              </label>
            ) : (
              <label>
                Defesa
                <input type="number" min={1} max={20} value={form.defesa} onChange={(e) => setForm((f) => ({ ...f, defesa: Number(e.target.value) }))} />
              </label>
            )}
          </div>
          <div className="attrs mini">
            {ATTRIBUTES.map((k) => (
              <div className="attr-row" key={k}>
                <span className="attr-name">{ATTRIBUTE_NAMES[k]}</span>
                <label>Bônus
                  <input type="number" step={1} min={-3} max={3} value={form.bonus[k] ?? 0} onChange={(e) => setBonus(k, e.target.value)} />
                </label>
                <label>Malefício
                  <input type="number" step={1} min={-3} max={3} value={form.penalidade[k] ?? 0} onChange={(e) => setPenal(k, e.target.value)} />
                </label>
              </div>
            ))}
          </div>
          <label>
            Descrição do malefício
            <input value={form.maleficio} onChange={(e) => setForm((f) => ({ ...f, maleficio: e.target.value }))} maxLength={200} placeholder="Ex.: pesada demais, -1 de reflexos" />
          </label>
          <button type="submit">Registrar Equipamento</button>
        </form>
      </section>

      <section className="panel">
        <h2>Equipamentos registrados ({equipment.length})</h2>
        <div className="registry-list">
          {equipment.map((it) => (
            <div className="registry-card" key={it.id}>
              <div>
                <strong>{it.tipo === 'arma' ? '⚔️' : '🛡️'} {it.nome}</strong>{' '}
                <span className="tag">{it.tipo === 'arma' ? `dano ${it.dano_base}` : `def ${it.defesa}`}</span>
                <span className="tag">por {it.creator_name}</span>
                <p className="muted">
                  {ATTRIBUTES.filter((k) => it.bonus?.[k] || it.penalidade?.[k])
                    .map((k) => `${ATTRIBUTE_NAMES[k]} ${it.bonus?.[k] > 0 ? '+' : ''}${it.bonus?.[k] || 0}${it.penalidade?.[k] ? ` / -${Math.abs(it.penalidade[k])}` : ''}`)
                    .join(' · ') || 'sem bônus'}
                </p>
                {it.maleficio && <p className="muted">⚠️ {it.maleficio}</p>}
              </div>
              {it.creator_id === player.id && (
                <div className="registry-actions">
                  <button className="ghost danger" onClick={() => remove(it.id)}>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
          {equipment.length === 0 && <p className="muted">Nenhum equipamento registrado ainda.</p>}
        </div>
      </section>
    </div>
  );
}

function SkillRegistry({ player, skills, onChanged, setError }) {
  const [form, setForm] = useState({ nome: '', tipo: 'magia', poder: 150, custo: 5, cooldown: 0, todos: false });

  const save = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setError('Informe o nome do golpe.');
    setError('');
    try {
      await api.createCustomSkill({ creatorId: player.id, ...form });
      setForm({ nome: '', tipo: 'magia', poder: 150, custo: 5, cooldown: 0, todos: false });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteCustomSkill(id, player.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registry-grid">
      <section className="panel">
        <h2>Novo Golpe</h2>
        <form onSubmit={save} className="stack">
          <div className="form-row">
            <label>
              Nome
              <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder="Ex.: Lâmina Espectral" />
            </label>
            <label>
              Tipo
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                {Object.entries(SKILL_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Poder (%)
              <input type="number" min={10} max={1000} value={form.poder} onChange={(e) => setForm((f) => ({ ...f, poder: Number(e.target.value) }))} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Custo de MP
              <input type="number" min={0} max={99} value={form.custo} onChange={(e) => setForm((f) => ({ ...f, custo: Number(e.target.value) }))} />
            </label>
            <label>
              Recarga (turnos)
              <input type="number" min={0} max={20} value={form.cooldown} onChange={(e) => setForm((f) => ({ ...f, cooldown: Number(e.target.value) }))} />
            </label>
            <label className="check-label">
              <input type="checkbox" checked={form.todos} onChange={(e) => setForm((f) => ({ ...f, todos: e.target.checked }))} />
              Atinge todos (AoE / cura em massa)
            </label>
          </div>
          <button type="submit">Registrar Golpe</button>
        </form>
      </section>

      <section className="panel">
        <h2>Golpes registrados ({skills.length})</h2>
        <div className="registry-list">
          {skills.map((s) => (
            <div className="registry-card" key={s.id}>
              <div>
                <strong>{s.nome}</strong>{' '}
                <span className="tag">{SKILL_TYPES[s.tipo]}</span>
                <span className="tag">{s.poder}%</span>
                <span className="tag">MP {s.custo}</span>
                {s.cooldown > 0 && <span className="tag">⏳ {s.cooldown}t</span>}
                {s.todos && <span className="tag">✦ Todos</span>}
                <span className="tag">por {s.creator_name}</span>
              </div>
              {s.creator_id === player.id && (
                <div className="registry-actions">
                  <button className="ghost danger" onClick={() => remove(s.id)}>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
          {skills.length === 0 && <p className="muted">Nenhum golpe registrado ainda.</p>}
        </div>
      </section>
    </div>
  );
}
