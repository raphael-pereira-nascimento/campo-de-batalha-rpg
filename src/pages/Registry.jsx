import { useEffect, useState } from 'react';
import { api, isOffline } from '../api.js';
import { ATTRIBUTES, ATTRIBUTE_NAMES, SKILL_TYPES } from '../config.js';
import { ALVO_LABEL } from '../game/sistema.js';
import AlvoSelect from '../components/AlvoSelect.jsx';

// Registro do Mundo: cada jogador cria classes, raças, equipamentos, golpes e
// monstros. As criações ficam SALVAS na conta e aparecem em:
//   - "Minhas criações": só as do jogador logado (editar/excluir).
//   - "Do mundo": as criações públicas de todos (usar/copiar).
// Marcar "tornar público" publica a criação no catálogo do mundo.

const EMPTY = {
  classes: { name: '', funcao: '', passiva: '', forcas: '', fraquezas: '', archetype: 'guerreiro', is_public: false },
  monsters: {
    nome: '', nivel: 1,
    attributes: { forca: 3, inteligencia: 1, resistencia: 3, destreza: 1, reflexos: 1 },
    arma: { nome: '', danoBase: 6 },
    spells: [], passiva: '', escala_chefe: false, multiplicador_hp: 3,
    elemento: 'fisico', fraquezas: [], resistencias: [], is_public: false,
  },
  races: { nome: '', bonus: {}, passiva: '', is_public: false },
  equipment: { tipo: 'arma', nome: '', dano_base: 6, defesa: 4, bonus: {}, penalidade: {}, maleficio: '', is_public: false },
  skills: { nome: '', tipo: 'magia', poder: 150, custo: 5, cooldown: 0, todos: false, alvo: 'unico', alvos: 3, splash: 0.5, is_public: false },
};

export default function Registry({ player, gameData, onBack }) {
  const [tab, setTab] = useState('classes');
  const [scope, setScope] = useState('mine'); // 'mine' | 'world'
  const [data, setData] = useState({ classes: [], monsters: [], races: [], equipment: [], skills: [] });
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [c, m, r, e, s] = await Promise.all([
        api.listCustomClasses(),
        api.listCustomMonsters(),
        api.listCustomRaces(),
        api.listCustomEquipment(),
        api.listCustomSkills(),
      ]);
      setData({
        classes: c.classes || [],
        monsters: m.monsters || [],
        races: r.races || [],
        equipment: e.equipment || [],
        skills: s.skills || [],
      });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab === 'ranking') {
      api.getRanking().then((d) => setRanking(d.ranking || [])).catch(() => {});
    }
  }, [tab]);

  const mine = data[tab] ? data[tab].filter((x) => x.creator_id === player.id) : [];
  // O catálogo do mundo mostra TODAS as criações públicas (inclusive as suas).
  const world = data[tab] ? data[tab].filter((x) => x.is_public) : [];
  const list = scope === 'mine' ? mine : world;
  const termo = search.trim().toLowerCase();
  const filtered = termo
    ? list.filter((item) => {
        const texto = [
          item.name,
          item.nome,
          item.creator_name,
          item.funcao,
          item.passiva,
          item.forcas,
          item.fraquezas,
          item.descricao,
          item.maleficio,
          item.tipo,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return texto.includes(termo);
      })
    : list;

  const onChanged = () => { setError(''); load(); };

  // Copia uma criação pública do mundo para "Minhas criações", como uma cópia
  // privada que o jogador pode editar sem alterar a criação original.
  const copyToMine = async (item) => {
    setError('');
    try {
      const payload = { ...item };
      for (const key of ['id', 'creator_id', 'creator_name', 'created_at', 'updated_at']) {
        delete payload[key];
      }
      payload.is_public = false;
      if (payload.name) payload.name = `${payload.name} (cópia)`;
      if (payload.nome) payload.nome = `${payload.nome} (cópia)`;
      const body = { creatorId: player.id, ...payload };
      if (tab === 'classes') await api.createCustomClass(body);
      else if (tab === 'monsters') await api.createCustomMonster(body);
      else if (tab === 'races') await api.createCustomRace(body);
      else if (tab === 'equipment') await api.createCustomEquipment(body);
      else if (tab === 'skills') await api.createCustomSkill(body);
      setScope('mine');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const registries = {
    classes: ClassRegistry,
    races: RaceRegistry,
    equipment: EquipmentRegistry,
    skills: SkillRegistry,
    monsters: MonsterRegistry,
  };
  const Active = registries[tab];

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
          {[
            ['classes', 'Classes'],
            ['races', 'Raças'],
            ['equipment', 'Equipamentos'],
            ['skills', 'Golpes'],
            ['monsters', 'Monstros'],
            ['ranking', '🏆 Ranking'],
          ].map(([key, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        {tab !== 'ranking' && (
          <>
            <div className="registry-intro">
              <strong>Como funciona:</strong> tudo que você cria aqui fica salvo na sua conta.
              Marque <strong>“Tornar público”</strong> para aparecer no catálogo do mundo e poder
              ser copiado por outros jogadores. As criações privadas só aparecem para você.
              {isOffline() && (
                <> No modo offline, as criações ficam apenas neste navegador e não aparecem para outras contas.</>
              )}
            </div>
            <div className="scope-toggle">
              <button className={scope === 'mine' ? 'active' : ''} onClick={() => setScope('mine')}>
                Minhas criações ({mine.length})
              </button>
              <button className={scope === 'world' ? 'active' : ''} onClick={() => setScope('world')}>
                🌍 Do mundo ({world.length})
              </button>
            </div>
            <div className="registry-search-row">
              <input
                className="registry-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔎 Buscar por nome, autor ou descrição..."
                maxLength={80}
              />
              {search && (
                <button className="ghost" onClick={() => setSearch('')}>
                  Limpar busca
                </button>
              )}
            </div>
            <Active
              player={player}
              items={filtered}
              scope={scope}
              searchTerm={search.trim()}
              gameData={gameData}
              onChanged={onChanged}
              onCopy={copyToMine}
              setError={setError}
            />
          </>
        )}

        {tab === 'ranking' && (
          <section className="panel">
            <h2>🏆 Ranking dos Aventureiros</h2>
            {ranking.length === 0 && <p className="muted">Nenhum personagem registrado ainda.</p>}
            {ranking.length > 0 && (
              <table className="ranking-table">
                <thead>
                  <tr><th>#</th><th>Nome</th><th>Nv.</th><th>XP</th><th>Vitórias</th></tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</td>
                      <td>{r.name}{r.gender === 'feminino' ? ' ♀' : r.gender === 'masculino' ? ' ♂' : ''}</td>
                      <td>{r.level}</td>
                      <td>{r.xp}</td>
                      <td>{r.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// Campo reutilizável: publicar no catálogo do mundo.
function PublicToggle({ form, setForm }) {
  return (
    <label className="check-label">
      <input
        type="checkbox"
        checked={!!form.is_public}
        onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
      />
      🌍 Tornar público (aparece no catálogo do mundo)
    </label>
  );
}

function ClassRegistry({ player, items, scope, searchTerm, gameData, onChanged, setError, onCopy }) {
  const [form, setForm] = useState(EMPTY.classes);
  const [editingId, setEditingId] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const readOnly = scope === 'world';

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Informe o nome da classe.');
    setError('');
    try {
      if (editingId) await api.updateCustomClass(editingId, { creatorId: player.id, ...form });
      else await api.createCustomClass({ creatorId: player.id, ...form });
      setForm(EMPTY.classes);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try { await api.deleteCustomClass(id, player.id); onChanged(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="registry-grid">
      {!readOnly && (
        <section className="panel">
          <h2>{editingId ? 'Editar Classe' : 'Nova Classe'}</h2>
          <form onSubmit={save} className="stack">
            <label>Nome da classe<input value={form.name} onChange={set('name')} maxLength={30} placeholder="Ex.: Bárbaro das Feras" /></label>
            <label>Função (papel no combate)<input value={form.funcao} onChange={set('funcao')} maxLength={120} placeholder="Ex.: Tanque que protege o grupo" /></label>
            <label>Passiva natural<input value={form.passiva} onChange={set('passiva')} maxLength={160} placeholder="Ex.: Fica mais forte ao perder HP" /></label>
            <label>Forças<input value={form.forcas} onChange={set('forcas')} maxLength={160} placeholder="Ex.: alta resistência, dano físico" /></label>
            <label>Fraquezas<input value={form.fraquezas} onChange={set('fraquezas')} maxLength={160} placeholder="Ex.: lento, vulnerável a magia" /></label>
            <label>
              Arquétipo mecânico (define as habilidades no combate)
              <select value={form.archetype} onChange={set('archetype')}>
                {Object.values(gameData.classes).map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
            </label>
            <PublicToggle form={form} setForm={setForm} />
            <button type="submit">{editingId ? 'Salvar Alterações' : 'Registrar Classe'}</button>
            {editingId && (
              <button type="button" className="ghost" onClick={() => { setEditingId(null); setError(''); setForm(EMPTY.classes); }}>
                Cancelar edição
              </button>
            )}
          </form>
        </section>
      )}

      <section className="panel">
        <h2>{readOnly ? 'Classes do mundo' : 'Minhas classes'} ({items.length})</h2>
        <div className="registry-list">
          {items.map((c) => (
            <div className="registry-card" key={c.id}>
              <div>
                <strong>{c.name}</strong>{' '}
                <span className="tag">arquétipo: {gameData.classes[c.archetype]?.nome}</span>
                {c.is_public && <span className="tag">🌍 público</span>}
                <span className="tag">por {c.creator_name}</span>
                <p className="muted">{c.funcao}</p>
                <p className="muted">✨ {c.passiva}</p>
                <p className="muted">💪 {c.forcas}</p>
                <p className="muted">💔 {c.fraquezas}</p>
              </div>
              {c.creator_id === player.id && !readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => { setEditingId(c.id); setForm({ ...EMPTY.classes, ...c }); }}>Editar</button>
                  <button className="ghost danger" onClick={() => remove(c.id)}>Excluir</button>
                </div>
              )}
              {readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => onCopy(c)}>📋 Copiar para minhas criações</button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="registry-empty">
              {searchTerm
                ? <>Nenhuma classe encontrada para “{searchTerm}”.</>
                : scope === 'world'
                  ? <>O catálogo do mundo ainda não tem classes. Publique uma criação sua marcando <strong>“Tornar público”</strong>.</>
                  : <>Você ainda não criou nenhuma classe. Use o formulário ao lado para começar.</>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MonsterRegistry({ player, items, scope, searchTerm, gameData, onChanged, setError, onCopy }) {
  const [form, setForm] = useState(EMPTY.monsters);
  const [editingId, setEditingId] = useState(null);
  const ELEMENTOS = ['fisico', 'fogo', 'agua', 'terra', 'ar', 'luz', 'trevas'];
  const readOnly = scope === 'world';
  const toggleList = (key, val) => setForm((f) => ({ ...f, [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val] }));
  const setAttr = (k) => (e) => setForm((f) => ({ ...f, attributes: { ...f.attributes, [k]: Number(e.target.value) } }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setError('Informe o nome do monstro.');
    setError('');
    try {
      const payload = { creatorId: player.id, ...form, arma: form.arma.nome ? form.arma : null };
      if (editingId) await api.updateCustomMonster(editingId, payload);
      else await api.createCustomMonster(payload);
      setForm(EMPTY.monsters);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try { await api.deleteCustomMonster(id, player.id); onChanged(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="registry-grid">
      {!readOnly && (
        <section className="panel">
          <h2>{editingId ? 'Editar Monstro' : 'Novo Monstro'}</h2>
          <form onSubmit={save} className="stack">
            <label>Nome<input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={30} placeholder="Ex.: Fel das Sombras" /></label>
            <div className="form-row">
              <label>Nível<input type="number" min={1} max={50} value={form.nivel} onChange={(e) => setForm((f) => ({ ...f, nivel: Number(e.target.value) }))} /></label>
              <label>Multiplicador de HP (chefe)<input type="number" step={0.5} min={1} max={10} value={form.multiplicador_hp} onChange={(e) => setForm((f) => ({ ...f, multiplicador_hp: Number(e.target.value) }))} /></label>
            </div>
            <label>Arma (nome)<input value={form.arma.nome} onChange={(e) => setForm((f) => ({ ...f, arma: { ...f.arma, nome: e.target.value } }))} placeholder="Ex.: Garras Negras" /></label>
            <div className="form-row">
              <label>Dano base da arma<input type="number" min={1} max={30} value={form.arma.danoBase} onChange={(e) => setForm((f) => ({ ...f, arma: { ...f.arma, danoBase: Number(e.target.value) } }))} /></label>
              <label className="check-label"><input type="checkbox" checked={form.escala_chefe} onChange={(e) => setForm((f) => ({ ...f, escala_chefe: e.target.checked }))} /> É um CHEFE (escalável)</label>
            </div>
            <label>Passiva<input value={form.passiva} onChange={(e) => setForm((f) => ({ ...f, passiva: e.target.value }))} maxLength={160} placeholder="Ex.: Regenera HP no início do turno" /></label>
            <div className="attrs mini">
              {ATTRIBUTES.map((k) => (
                <div className="attr-row" key={k}>
                  <span className="attr-name">{ATTRIBUTE_NAMES[k]}</span>
                  <input type="number" min={1} max={12} value={form.attributes[k]} onChange={setAttr(k)} />
                </div>
              ))}
            </div>
            <label>
              Elemento do ataque
              <select value={form.elemento} onChange={(e) => setForm((f) => ({ ...f, elemento: e.target.value }))}>
                {ELEMENTOS.map((el) => (<option key={el} value={el}>{el}</option>))}
              </select>
            </label>
            <div>
              <span className="muted small">Fraquezas (dano ×1.5): </span>
              {ELEMENTOS.filter((e) => e !== 'fisico').map((el) => (
                <label key={el} className="check-label inline"><input type="checkbox" checked={form.fraquezas.includes(el)} onChange={() => toggleList('fraquezas', el)} /> {el}</label>
              ))}
            </div>
            <div>
              <span className="muted small">Resistências (dano ×0.5): </span>
              {ELEMENTOS.filter((e) => e !== 'fisico').map((el) => (
                <label key={el} className="check-label inline"><input type="checkbox" checked={form.resistencias.includes(el)} onChange={() => toggleList('resistencias', el)} /> {el}</label>
              ))}
            </div>
            <p className="muted small">Vida = 500 + Resistência × 10 · Mana = (Inteligência Final) × 10. Chefes ganham mais ações conforme o nº de jogadores.</p>
            <PublicToggle form={form} setForm={setForm} />
            <button type="submit">{editingId ? 'Salvar Alterações' : 'Criar Monstro'}</button>
            {editingId && (
              <button type="button" className="ghost" onClick={() => { setEditingId(null); setError(''); setForm(EMPTY.monsters); }}>Cancelar edição</button>
            )}
          </form>
        </section>
      )}

      <section className="panel">
        <h2>{readOnly ? 'Monstros do mundo' : 'Meus monstros'} ({items.length})</h2>
        <div className="registry-list">
          {items.map((m) => (
            <div className="registry-card" key={m.id}>
              <div>
                <strong>{m.nome}</strong>{' '}
                {m.escala_chefe && <span className="tag boss-tag">☠️ Chefe ×{m.multiplicador_hp}</span>}
                <span className="tag">Nv. {m.nivel}</span>
                {m.elemento && m.elemento !== 'fisico' && <span className="tag">{m.elemento}</span>}
                {m.is_public && <span className="tag">🌍 público</span>}
                <span className="tag">por {m.creator_name}</span>
                <p className="muted">HP {m.attributes.resistencia * 10} · MP {m.attributes.inteligencia * 10} · Arma: {m.arma ? `${m.arma.nome} (${m.arma.danoBase})` : 'sem arma'}</p>
                {(m.fraquezas?.length > 0 || m.resistencias?.length > 0) && (
                  <p className="muted">
                    {m.fraquezas?.length ? `⚠️ fraco: ${m.fraquezas.join(', ')}` : ''}
                    {m.fraquezas?.length && m.resistencias?.length ? ' · ' : ''}
                    {m.resistencias?.length ? `🛡️ resiste: ${m.resistencias.join(', ')}` : ''}
                  </p>
                )}
                <p className="muted">✨ {m.passiva || 'Sem passiva'}</p>
              </div>
              {m.creator_id === player.id && !readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => { setEditingId(m.id); setForm({ ...EMPTY.monsters, ...m, arma: m.arma || EMPTY.monsters.arma }); }}>Editar</button>
                  <button className="ghost danger" onClick={() => remove(m.id)}>Excluir</button>
                </div>
              )}
              {readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => onCopy(m)}>📋 Copiar para minhas criações</button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="registry-empty">
              {searchTerm
                ? <>Nenhum monstro encontrado para “{searchTerm}”.</>
                : scope === 'world'
                  ? <>O catálogo do mundo ainda não tem monstros. Publique uma criação sua marcando <strong>“Tornar público”</strong>.</>
                  : <>Você ainda não criou nenhum monstro. Use o formulário ao lado para começar.</>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RaceRegistry({ player, items, scope, searchTerm, onChanged, setError, onCopy }) {
  const [form, setForm] = useState(EMPTY.races);
  const [editingId, setEditingId] = useState(null);
  const readOnly = scope === 'world';
  const setBonus = (k, v) => setForm((f) => ({ ...f, bonus: { ...f.bonus, [k]: Number(v) } }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setError('Informe o nome da raça.');
    setError('');
    try {
      const payload = { creatorId: player.id, nome: form.nome, bonus: form.bonus, passiva: form.passiva, is_public: form.is_public };
      if (editingId) await api.updateCustomRace(editingId, payload);
      else await api.createCustomRace(payload);
      setForm(EMPTY.races);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try { await api.deleteCustomRace(id, player.id); onChanged(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="registry-grid">
      {!readOnly && (
        <section className="panel">
          <h2>{editingId ? 'Editar Raça' : 'Nova Raça'}</h2>
          <form onSubmit={save} className="stack">
            <label>Nome da raça<input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder="Ex.: Tribo do Céu" /></label>
            <p className="muted small">Bônus raciais de atributo (valores positivos somam, negativos subtraem).</p>
            <div className="attrs mini">
              {ATTRIBUTES.map((k) => (
                <div className="attr-row" key={k}>
                  <span className="attr-name">{ATTRIBUTE_NAMES[k]}</span>
                  <input type="number" step={1} min={-3} max={3} value={form.bonus[k] ?? 0} onChange={(e) => setBonus(k, e.target.value)} />
                </div>
              ))}
            </div>
            <label>Passiva<textarea value={form.passiva} onChange={(e) => setForm((f) => ({ ...f, passiva: e.target.value }))} rows={2} maxLength={300} placeholder="Ex.: +15% de esquiva em florestas..." /></label>
            <PublicToggle form={form} setForm={setForm} />
            <button type="submit">{editingId ? 'Salvar Alterações' : 'Registrar Raça'}</button>
            {editingId && (
              <button type="button" className="ghost" onClick={() => { setEditingId(null); setError(''); setForm(EMPTY.races); }}>Cancelar edição</button>
            )}
          </form>
        </section>
      )}

      <section className="panel">
        <h2>{readOnly ? 'Raças do mundo' : 'Minhas raças'} ({items.length})</h2>
        <div className="registry-list">
          {items.map((r) => (
            <div className="registry-card" key={r.id}>
              <div>
                <strong>{r.nome}</strong>{' '}
                {r.is_public && <span className="tag">🌍 público</span>}
                <span className="tag">por {r.creator_name}</span>
                <p className="muted">
                  {ATTRIBUTES.filter((k) => r.bonus?.[k]).map((k) => `${ATTRIBUTE_NAMES[k]} ${r.bonus[k] > 0 ? '+' : ''}${r.bonus[k]}`).join(' · ') || 'sem bônus'}
                </p>
                <p className="muted">✨ {r.passiva || 'Sem passiva'}</p>
              </div>
              {r.creator_id === player.id && !readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => { setEditingId(r.id); setForm({ nome: r.nome, bonus: r.bonus || {}, passiva: r.passiva || '', is_public: r.is_public }); }}>Editar</button>
                  <button className="ghost danger" onClick={() => remove(r.id)}>Excluir</button>
                </div>
              )}
              {readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => onCopy(r)}>📋 Copiar para minhas criações</button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="registry-empty">
              {searchTerm
                ? <>Nenhuma raça encontrada para “{searchTerm}”.</>
                : scope === 'world'
                  ? <>O catálogo do mundo ainda não tem raças. Publique uma criação sua marcando <strong>“Tornar público”</strong>.</>
                  : <>Você ainda não criou nenhuma raça. Use o formulário ao lado para começar.</>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EquipmentRegistry({ player, items, scope, searchTerm, onChanged, setError, onCopy }) {
  const [form, setForm] = useState(EMPTY.equipment);
  const [editingId, setEditingId] = useState(null);
  const readOnly = scope === 'world';
  const setBonus = (k, v) => setForm((f) => ({ ...f, bonus: { ...f.bonus, [k]: Number(v) } }));
  const setPenal = (k, v) => setForm((f) => ({ ...f, penalidade: { ...f.penalidade, [k]: Number(v) } }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setError('Informe o nome do equipamento.');
    setError('');
    try {
      const payload = { creatorId: player.id, ...form };
      if (editingId) await api.updateCustomEquipment(editingId, payload);
      else await api.createCustomEquipment(payload);
      setForm(EMPTY.equipment);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try { await api.deleteCustomEquipment(id, player.id); onChanged(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="registry-grid">
      {!readOnly && (
        <section className="panel">
          <h2>{editingId ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
          <form onSubmit={save} className="stack">
            <div className="form-row">
              <label>Tipo
                <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                  <option value="arma">Arma</option>
                  <option value="armadura">Armadura</option>
                </select>
              </label>
              <label>Nome<input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder="Ex.: Espada de Cinzas" /></label>
              {form.tipo === 'arma' ? (
                <label>Dano base<input type="number" min={1} max={30} value={form.dano_base} onChange={(e) => setForm((f) => ({ ...f, dano_base: Number(e.target.value) }))} /></label>
              ) : (
                <label>Defesa<input type="number" min={1} max={20} value={form.defesa} onChange={(e) => setForm((f) => ({ ...f, defesa: Number(e.target.value) }))} /></label>
              )}
            </div>
            <div className="attrs mini">
              {ATTRIBUTES.map((k) => (
                <div className="attr-row" key={k}>
                  <span className="attr-name">{ATTRIBUTE_NAMES[k]}</span>
                  <label>Bônus<input type="number" step={1} min={-3} max={3} value={form.bonus[k] ?? 0} onChange={(e) => setBonus(k, e.target.value)} /></label>
                  <label>Malefício<input type="number" step={1} min={-3} max={3} value={form.penalidade[k] ?? 0} onChange={(e) => setPenal(k, e.target.value)} /></label>
                </div>
              ))}
            </div>
            <label>Descrição do malefício<input value={form.maleficio} onChange={(e) => setForm((f) => ({ ...f, maleficio: e.target.value }))} maxLength={200} placeholder="Ex.: pesada demais, -1 de reflexos" /></label>
            <PublicToggle form={form} setForm={setForm} />
            <button type="submit">{editingId ? 'Salvar Alterações' : 'Registrar Equipamento'}</button>
            {editingId && (
              <button type="button" className="ghost" onClick={() => { setEditingId(null); setError(''); setForm(EMPTY.equipment); }}>Cancelar edição</button>
            )}
          </form>
        </section>
      )}

      <section className="panel">
        <h2>{readOnly ? 'Equipamentos do mundo' : 'Meus equipamentos'} ({items.length})</h2>
        <div className="registry-list">
          {items.map((it) => (
            <div className="registry-card" key={it.id}>
              <div>
                <strong>{it.tipo === 'arma' ? '⚔️' : '🛡️'} {it.nome}</strong>{' '}
                <span className="tag">{it.tipo === 'arma' ? `dano ${it.dano_base}` : `def ${it.defesa}`}</span>
                {it.is_public && <span className="tag">🌍 público</span>}
                <span className="tag">por {it.creator_name}</span>
                <p className="muted">
                  {ATTRIBUTES.filter((k) => it.bonus?.[k] || it.penalidade?.[k])
                    .map((k) => `${ATTRIBUTE_NAMES[k]} ${it.bonus?.[k] > 0 ? '+' : ''}${it.bonus?.[k] || 0}${it.penalidade?.[k] ? ` / -${Math.abs(it.penalidade[k])}` : ''}`)
                    .join(' · ') || 'sem bônus'}
                </p>
                {it.maleficio && <p className="muted">⚠️ {it.maleficio}</p>}
              </div>
              {it.creator_id === player.id && !readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => { setEditingId(it.id); setForm({ ...EMPTY.equipment, ...it }); }}>Editar</button>
                  <button className="ghost danger" onClick={() => remove(it.id)}>Excluir</button>
                </div>
              )}
              {readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => onCopy(it)}>📋 Copiar para minhas criações</button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="registry-empty">
              {searchTerm
                ? <>Nenhum equipamento encontrado para “{searchTerm}”.</>
                : scope === 'world'
                  ? <>O catálogo do mundo ainda não tem equipamentos. Publique uma criação sua marcando <strong>“Tornar público”</strong>.</>
                  : <>Você ainda não criou nenhum equipamento. Use o formulário ao lado para começar.</>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SkillRegistry({ player, items, scope, searchTerm, onChanged, setError, onCopy }) {
  const [form, setForm] = useState(EMPTY.skills);
  const [editingId, setEditingId] = useState(null);
  const readOnly = scope === 'world';
  const isDano = form.tipo === 'fisico' || form.tipo === 'magia';

  const save = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setError('Informe o nome do golpe.');
    setError('');
    try {
      const payload = { creatorId: player.id, ...form };
      if (editingId) await api.updateCustomSkill(editingId, payload);
      else await api.createCustomSkill(payload);
      setForm(EMPTY.skills);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try { await api.deleteCustomSkill(id, player.id); onChanged(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="registry-grid">
      {!readOnly && (
        <section className="panel">
          <h2>{editingId ? 'Editar Golpe' : 'Novo Golpe'}</h2>
          <form onSubmit={save} className="stack">
            <div className="form-row">
              <label>Nome<input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder="Ex.: Lâmina Espectral" /></label>
              <label>Tipo
                <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                  {Object.entries(SKILL_TYPES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
              </label>
              <label>Poder (%)<input type="number" min={10} max={1000} value={form.poder} onChange={(e) => setForm((f) => ({ ...f, poder: Number(e.target.value) }))} /></label>
            </div>
            <div className="form-row">
              <label>Custo de MP<input type="number" min={0} max={99} value={form.custo} onChange={(e) => setForm((f) => ({ ...f, custo: Number(e.target.value) }))} /></label>
              <label>Recarga (turnos)<input type="number" min={0} max={20} value={form.cooldown} onChange={(e) => setForm((f) => ({ ...f, cooldown: Number(e.target.value) }))} /></label>
            </div>
            {isDano && (
              <AlvoSelect alvo={form.alvo} alvos={form.alvos} splash={form.splash} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
            )}
            {form.tipo === 'cura' && (
              <label className="check-label"><input type="checkbox" checked={form.todos} onChange={(e) => setForm((f) => ({ ...f, todos: e.target.checked }))} /> Cura em massa (todos os aliados)</label>
            )}
            <PublicToggle form={form} setForm={setForm} />
            <button type="submit">{editingId ? 'Salvar Alterações' : 'Registrar Golpe'}</button>
            {editingId && (
              <button type="button" className="ghost" onClick={() => { setEditingId(null); setError(''); setForm(EMPTY.skills); }}>Cancelar edição</button>
            )}
          </form>
        </section>
      )}

      <section className="panel">
        <h2>{readOnly ? 'Golpes do mundo' : 'Meus golpes'} ({items.length})</h2>
        <div className="registry-list">
          {items.map((s) => (
            <div className="registry-card" key={s.id}>
              <div>
                <strong>{s.nome}</strong>{' '}
                <span className="tag">{SKILL_TYPES[s.tipo]}</span>
                <span className="tag">{s.poder}%</span>
                <span className="tag">MP {s.custo}</span>
                {s.cooldown > 0 && <span className="tag">⏳ {s.cooldown}t</span>}
                {s.alvo && s.alvo !== 'unico' && (<span className="tag">◎ {ALVO_LABEL[s.alvo] || s.alvo}</span>)}
                {s.todos && <span className="tag">✦ Todos</span>}
                {s.is_public && <span className="tag">🌍 público</span>}
                <span className="tag">por {s.creator_name}</span>
              </div>
              {s.creator_id === player.id && !readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => { setEditingId(s.id); setForm({ ...EMPTY.skills, ...s }); }}>Editar</button>
                  <button className="ghost danger" onClick={() => remove(s.id)}>Excluir</button>
                </div>
              )}
              {readOnly && (
                <div className="registry-actions">
                  <button className="ghost" onClick={() => onCopy(s)}>📋 Copiar para minhas criações</button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="registry-empty">
              {searchTerm
                ? <>Nenhum golpe encontrado para “{searchTerm}”.</>
                : scope === 'world'
                  ? <>O catálogo do mundo ainda não tem golpes. Publique uma criação sua marcando <strong>“Tornar público”</strong>.</>
                  : <>Você ainda não criou nenhum golpe. Use o formulário ao lado para começar.</>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
