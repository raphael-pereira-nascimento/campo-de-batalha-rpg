import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import {
  ATTRIBUTES,
  ATTRIBUTE_NAMES,
  POINTS,
  MIN,
  MAX,
  RACE_PENALTY,
  MAX_RACES,
  MAX_CLASSES,
  SKILL_TYPES,
  CONDITION_TYPES,
} from '../config.js';

const STEP_NAMES = [
  'Identidade',
  'Raças',
  'Classes',
  'Passiva',
  'Golpes',
  'Golpe Especial',
  'Ultimate',
  'Equipamento',
  'Atributos',
  'Resumo',
];

function emptyAttrs() {
  return { forca: 6, inteligencia: 6, resistencia: 6, destreza: 6, reflexos: 6 };
}

export function raceBonusTotal(races) {
  const bonus = {};
  for (const r of races || []) {
    for (const [k, v] of Object.entries(r.bonus || {})) {
      if (k === 'escolha') {
        const c = r.choice || 'forca';
        bonus[c] = (bonus[c] || 0) + v;
      } else {
        bonus[k] = (bonus[k] || 0) + v;
      }
    }
  }
  const f = RACE_PENALTY[(races || []).length] ?? 1;
  if (f !== 1) {
    for (const k of Object.keys(bonus)) bonus[k] = Math.round(bonus[k] * f);
  }
  return bonus;
}

export function classBonusTotal(classes) {
  const bonus = {};
  for (const c of classes || []) {
    for (const [k, v] of Object.entries(c.bonus || {})) bonus[k] = (bonus[k] || 0) + v;
  }
  return bonus;
}

function effFor(attrs, races, classes, equipment) {
  const eff = { ...attrs };
  for (const [k, v] of Object.entries(raceBonusTotal(races))) eff[k] = (eff[k] || 0) + v;
  for (const [k, v] of Object.entries(classBonusTotal(classes))) eff[k] = (eff[k] || 0) + v;
  for (const item of [equipment.arma, equipment.armadura]) {
    if (!item) continue;
    for (const [k, v] of Object.entries(item.bonus || {})) eff[k] = (eff[k] || 0) + v;
    for (const [k, v] of Object.entries(item.penalidade || {})) eff[k] = (eff[k] || 0) - v;
  }
  for (const k of ATTRIBUTES) eff[k] = Math.max(1, eff[k] || 1);
  return eff;
}

export default function FichaForm({ player, gameData, customClasses = [], onCreated, onCancel }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [passiva, setPassiva] = useState('');
  const [skills, setSkills] = useState([]);
  const [ultimate, setUltimate] = useState(null);
  const [especial, setEspecial] = useState(null);
  const [equipment, setEquipment] = useState({ arma: null, armadura: null });
  const [attrs, setAttrs] = useState(emptyAttrs());
  const [customRaces, setCustomRaces] = useState([]);
  const [customEquipment, setCustomEquipment] = useState([]);
  const [customSkills, setCustomSkills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listCustomRaces().then((d) => setCustomRaces(d.races || [])).catch(() => {});
    api.listCustomEquipment().then((d) => setCustomEquipment(d.equipment || [])).catch(() => {});
    api.listCustomSkills().then((d) => setCustomSkills(d.skills || [])).catch(() => {});
  }, []);

  const used = Object.values(attrs).reduce((a, b) => a + b, 0);
  const remaining = POINTS - used;

  const stats = useMemo(() => {
    const eff = effFor(attrs, races, classes, equipment);
    const primary = classes.find((c) => c.primary) || classes[0] || {};
    const hpMax = eff.resistencia * 10;
    const mpMax = eff.inteligencia * 10;
    return { hpMax, mpMax, eff };
  }, [attrs, races, classes, equipment]);

  const penaltyPct = Math.round((1 - (RACE_PENALTY[races.length] ?? 1)) * 100);

  const canAdvance = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return races.length >= 1;
    if (step === 2) return classes.length >= 1;
    return true;
  };

  const addRace = (def) => {
    if (races.length >= MAX_RACES) return;
    setRaces((prev) => [...prev, def]);
  };

  const addClass = (def) => {
    if (classes.length >= MAX_CLASSES) return;
    const withPrimary = { ...def, primary: classes.length === 0 };
    setClasses((prev) => [...prev, withPrimary]);
  };

  const change = (key, delta) => {
    setAttrs((prev) => {
      const next = { ...prev, [key]: Math.min(MAX, Math.max(MIN, prev[key] + delta)) };
      if (Object.values(next).reduce((a, b) => a + b, 0) > POINTS) return prev;
      return next;
    });
  };

  const submit = async () => {
    if (used !== POINTS) {
      setError(`Distribua exatamente ${POINTS} pontos. Faltam/sobram: ${POINTS - used}`);
      setStep(8);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createCharacter({
        playerId: player.id,
        name,
        attributes: attrs,
        races,
        classes,
        passiva,
        skills,
        ultimate,
        especial,
        equipment: { arma: equipment.arma || null, armadura: equipment.armadura || null },
      });
      onCreated();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal ficha-form wizard">
        <h2>Criar Ficha de Personagem</h2>

        <div className="wizard-steps">
          {STEP_NAMES.map((s, i) => (
            <button
              key={s}
              type="button"
              className={i === step ? 'active' : i < step ? 'done' : ''}
              onClick={() => i < step && setStep(i)}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="wizard-body">
          {step === 0 && (
            <div className="stack">
              <label>
                Nome do personagem
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Ex.: Aric, Ondeado" />
              </label>
              <label>
                Descrição (opcional)
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} maxLength={300} placeholder="História, aparência, características..." />
              </label>
            </div>
          )}

          {step === 1 && (
            <RacesStep
              gameData={gameData}
              customRaces={customRaces}
              races={races}
              onAdd={addRace}
              onRemove={(id) => setRaces((prev) => prev.filter((r) => r !== id))}
              penaltyPct={penaltyPct}
            />
          )}

          {step === 2 && (
            <ClassesStep
              gameData={gameData}
              customClasses={customClasses}
              classes={classes}
              onAdd={addClass}
              onRemove={(id) => setClasses((prev) => prev.filter((c) => c !== id))}
              onPrimary={(id) =>
                setClasses((prev) => prev.map((c) => ({ ...c, primary: c === id })))
              }
            />
          )}

          {step === 3 && (
            <div className="stack">
              <p className="muted small">
                Uma passiva exclusiva do personagem, além das passivas das raças e classes.
              </p>
              <label>
                Passiva do personagem
                <textarea value={passiva} onChange={(e) => setPassiva(e.target.value)} rows={3} maxLength={300} placeholder="Ex.: Renasce uma vez por batalha com 10% do HP..." />
              </label>
            </div>
          )}

          {step === 4 && (
            <SkillsStep skills={skills} setSkills={setSkills} customSkills={customSkills} />
          )}

          {step === 5 && (
            <MegaSkillStep
              title="Golpe Especial (estilo KOF)"
              value={especial}
              onChange={setEspecial}
              allowModo={false}
            />
          )}

          {step === 6 && (
            <MegaSkillStep
              title="Ultimate (estilo battleground)"
              value={ultimate}
              onChange={setUltimate}
              allowModo
            />
          )}

          {step === 7 && (
            <EquipStep
              gameData={gameData}
              customEquipment={customEquipment}
              equipment={equipment}
              setEquipment={setEquipment}
            />
          )}

          {step === 8 && (
            <div className="stack">
              <p className="muted small">Distribua os {POINTS} pontos (1 a {MAX} por atributo).</p>
              <div className="attrs">
                {ATTRIBUTES.map((key) => (
                  <div className="attr-row" key={key}>
                    <span className="attr-name">{ATTRIBUTE_NAMES[key]}</span>
                    <div className="attr-controls">
                      <button type="button" onClick={() => change(key, -1)} disabled={attrs[key] <= MIN}>
                        −
                      </button>
                      <span className="attr-value">{attrs[key]}</span>
                      <button type="button" onClick={() => change(key, 1)} disabled={attrs[key] >= MAX || remaining <= 0}>
                        +
                      </button>
                    </div>
                    <span className="attr-total">{stats.eff[key]}</span>
                  </div>
                ))}
              </div>
              <div className="form-meta">
                <span className={remaining === 0 ? 'points ok' : 'points'}>Pontos restantes: {remaining}</span>
                <span>
                  Vida máx: <strong>{stats.hpMax}</strong> · Mana máx: <strong>{stats.mpMax}</strong>
                </span>
              </div>
              <p className="muted small">Os números à direita são os atributos efetivos (base + raças + classes + equipamento).</p>
            </div>
          )}

          {step === 9 && (
            <Summary
              name={name}
              races={races}
              classes={classes}
              passiva={passiva}
              skills={skills}
              ultimate={ultimate}
              especial={especial}
              equipment={equipment}
              stats={stats}
            />
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={step === 0 ? onCancel : () => { setError(''); setStep(step - 1); }}>
            {step === 0 ? 'Cancelar' : '← Voltar'}
          </button>
          {step < 9 ? (
            <button type="button" onClick={() => canAdvance() ? (setError(''), setStep(step + 1)) : setError('Preencha o necessário para avançar.')}>
              Próximo →
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={loading || used !== POINTS || !name.trim()}>
              {loading ? 'Criando...' : 'Criar Personagem'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RacesStep({ gameData, customRaces, races, onAdd, onRemove, penaltyPct }) {
  const [pick, setPick] = useState('');
  const [choice, setChoice] = useState('forca');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nome: '', bonus: {}, passiva: '' });
  const [publish, setPublish] = useState(false);

  const allRaces = [...Object.values(gameData.races || {}), ...customRaces];
  const picked = allRaces.find((r) => r.id === pick);

  const doAdd = () => {
    if (!pick) return;
    const isCustom = customRaces.some((r) => r.id === pick);
    const def = isCustom
      ? { id: pick, nome: picked.nome, bonus: picked.bonus, passiva: picked.passiva, efeito: picked.efeito || {}, source: 'registry' }
      : { id: pick, nome: picked.nome, bonus: picked.bonus, passiva: picked.passiva, efeito: picked.efeito || {}, source: 'preset', choice };
    onAdd(def);
    setPick('');
  };

  const doCreate = async () => {
    if (!form.nome.trim()) return;
    const def = {
      id: `raca_${Date.now()}`,
      nome: form.nome.trim(),
      bonus: form.bonus,
      passiva: form.passiva.trim(),
      efeito: {},
      source: 'inline',
    };
    onAdd(def);
    if (publish) {
      try {
        await api.createCustomRace({ creatorId: undefined, ...{ nome: def.nome, bonus: def.bonus, passiva: def.passiva } });
      } catch (_e) { /* publicação opcional */ }
    }
    setForm({ nome: '', bonus: {}, passiva: '' });
    setCreating(false);
  };

  const setBonus = (k, v) => setForm((f) => ({ ...f, bonus: { ...f.bonus, [k]: Number(v) } }));

  return (
    <div className="stack">
      <p className="muted small">
        Escolha de <strong>1 a {MAX_RACES} raças</strong>. Os bônus somam e as passivas de todas ficam ativas.
      </p>
      {races.length > 1 && (
        <div className="info-box">
          ⚖️ Penalidade por raças múltiplas: bônus reduzidos em <strong>{penaltyPct}%</strong> (2 raças = 30%, 3 raças = 45%).
        </div>
      )}

      <div className="join-controls">
        <select value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Adicionar raça...</option>
          <optgroup label="Raças do mundo">
            {Object.values(gameData.races || {}).map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </optgroup>
          {customRaces.length > 0 && (
            <optgroup label="Registradas">
              {customRaces.map((r) => (
                <option key={r.id} value={r.id}>{r.nome} (registrada)</option>
              ))}
            </optgroup>
          )}
        </select>
        {picked && 'escolha' in picked.bonus && (
          <select value={choice} onChange={(e) => setChoice(e.target.value)}>
            {ATTRIBUTES.map((k) => (
              <option key={k} value={k}>{ATTRIBUTE_NAMES[k]} (+1)</option>
            ))}
          </select>
        )}
        <button onClick={doAdd} disabled={!pick || races.length >= MAX_RACES}>+ Adicionar</button>
        <button className="ghost" onClick={() => setCreating((c) => !c)}>
          {creating ? 'Fechar' : '✍️ Criar nova raça'}
        </button>
      </div>

      {creating && (
        <div className="inline-create">
          <label>
            Nome da raça
            <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder="Ex.: Tribo do Céu" />
          </label>
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
          <label className="check-label">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Publicar no Registro do Mundo
          </label>
          <button onClick={doCreate} disabled={!form.nome.trim()}>Criar raça</button>
        </div>
      )}

      <div className="chosen-list">
        {races.map((r, i) => (
          <div className="chosen-chip" key={i}>
            <strong>{r.nome}</strong>
            <span className="muted small">{r.passiva}</span>
            {'escolha' in (r.bonus || {}) && (
              <span className="tag">+1 em {ATTRIBUTE_NAMES[r.choice || 'forca']}</span>
            )}
            <button className="ghost remove-x" onClick={() => onRemove(r)}>✕</button>
          </div>
        ))}
        {races.length === 0 && <p className="muted">Nenhuma raça escolhida.</p>}
      </div>
    </div>
  );
}

function ClassesStep({ gameData, customClasses, classes, onAdd, onRemove, onPrimary }) {
  const [pick, setPick] = useState('');
  const [creating, setCreating] = useState(false);
  const [publish, setPublish] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    bonus: {},
    hpPerLevel: 8,
    mpPerLevel: 5,
    levelUp: 'forca',
    archetype: 'guerreiro',
    spellList: [],
  });

  const allClasses = [...Object.values(gameData.classes), ...customClasses];
  const picked = allClasses.find((c) => c.id === pick);

  const doAdd = () => {
    if (!pick) return;
    const isCustom = customClasses.some((c) => c.id === pick);
    const def = isCustom
      ? { id: pick, nome: picked.name, archetype: picked.archetype, primary: false }
      : { id: pick, nome: picked.nome, archetype: pick, primary: false };
    onAdd(def);
    setPick('');
  };

  const setBonus = (k, v) => setForm((f) => ({ ...f, bonus: { ...f.bonus, [k]: Number(v) } }));
  const toggleSpell = (id) =>
    setForm((f) => ({ ...f, spellList: f.spellList.includes(id) ? f.spellList.filter((x) => x !== id) : [...f.spellList, id] }));

  const doCreate = async () => {
    if (!form.nome.trim()) return;
    const def = {
      id: `classe_${Date.now()}`,
      nome: form.nome.trim(),
      bonus: form.bonus,
      hpPerLevel: form.hpPerLevel,
      mpPerLevel: form.mpPerLevel,
      levelUp: form.levelUp,
      archetype: form.archetype,
      spellList: form.spellList,
      primary: false,
    };
    onAdd(def);
    if (publish) {
      try {
        await api.createCustomClass({ creatorId: undefined, name: def.nome, funcao: '', passiva: '', forcas: '', fraquezas: '', archetype: form.archetype });
      } catch (_e) { /* opcional */ }
    }
    setForm({ nome: '', bonus: {}, hpPerLevel: 8, mpPerLevel: 5, levelUp: 'forca', archetype: 'guerreiro', spellList: [] });
    setCreating(false);
  };

  return (
    <div className="stack">
      <p className="muted small">
        Escolha <strong>1 ou 2 classes</strong>. Os bônus somam, os golpes das duas se juntam e a <strong>primária</strong> define vida/mana por nível.
      </p>

      <div className="join-controls">
        <select value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Adicionar classe...</option>
          <optgroup label="Classes do mundo">
            {Object.values(gameData.classes).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </optgroup>
          {customClasses.length > 0 && (
            <optgroup label="Registradas">
              {customClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (registrada)</option>
              ))}
            </optgroup>
          )}
        </select>
        <button onClick={doAdd} disabled={!pick || classes.length >= MAX_CLASSES}>+ Adicionar</button>
        <button className="ghost" onClick={() => setCreating((c) => !c)}>
          {creating ? 'Fechar' : '✍️ Criar nova classe'}
        </button>
      </div>

      {creating && (
        <div className="inline-create">
          <label>
            Nome da classe
            <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder="Ex.: Bárbaro das Feras" />
          </label>
          <div className="form-row">
            <label>
              Vida por nível
              <input type="number" min={1} max={30} value={form.hpPerLevel} onChange={(e) => setForm((f) => ({ ...f, hpPerLevel: Number(e.target.value) }))} />
            </label>
            <label>
              Mana por nível
              <input type="number" min={1} max={30} value={form.mpPerLevel} onChange={(e) => setForm((f) => ({ ...f, mpPerLevel: Number(e.target.value) }))} />
            </label>
            <label>
              Atributo do up
              <select value={form.levelUp} onChange={(e) => setForm((f) => ({ ...f, levelUp: e.target.value }))}>
                {ATTRIBUTES.map((k) => (
                  <option key={k} value={k}>{ATTRIBUTE_NAMES[k]}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Arquétipo (golpes base da classe)
            <select value={form.archetype} onChange={(e) => setForm((f) => ({ ...f, archetype: e.target.value }))}>
              {Object.values(gameData.classes).map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </label>
          <div className="attrs mini">
            {ATTRIBUTES.map((k) => (
              <div className="attr-row" key={k}>
                <span className="attr-name">{ATTRIBUTE_NAMES[k]}</span>
                <input type="number" step={1} min={-3} max={3} value={form.bonus[k] ?? 0} onChange={(e) => setBonus(k, e.target.value)} />
              </div>
            ))}
          </div>
          <label>
            Golpes base (marque os que a classe ensina)
            <div className="spell-pick-list">
              {Object.values(gameData.spells).map((s) => (
                <label className="check-label" key={s.nome}>
                  <input type="checkbox" checked={form.spellList.includes(s.nome)} onChange={() => toggleSpell(s.nome)} />
                  {s.nome} (MP {s.custo})
                </label>
              ))}
            </div>
          </label>
          <label className="check-label">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Publicar no Registro do Mundo
          </label>
          <button onClick={doCreate} disabled={!form.nome.trim()}>Criar classe</button>
        </div>
      )}

      <div className="chosen-list">
        {classes.map((c, i) => (
          <div className="chosen-chip" key={i}>
            <strong>{c.nome}</strong>
            {c.primary && <span className="tag primary-tag">★ Primária</span>}
            <button className="ghost" onClick={() => onPrimary(c)}>Marcar primária</button>
            <button className="ghost remove-x" onClick={() => onRemove(c)}>✕</button>
          </div>
        ))}
        {classes.length === 0 && <p className="muted">Nenhuma classe escolhida.</p>}
      </div>
    </div>
  );
}

function SkillsStep({ skills, setSkills, customSkills }) {
  const [form, setForm] = useState({ nome: '', tipo: 'magia', poder: 150, custo: 5, cooldown: 0, todos: false });
  const [pickCustom, setPickCustom] = useState('');
  const [publish, setPublish] = useState(false);

  const add = async () => {
    if (!form.nome.trim()) return;
    const skill = { id: `golpe_${Date.now()}`, ...form };
    setSkills((prev) => [...prev, skill]);
    if (publish) {
      try {
        await api.createCustomSkill({ creatorId: undefined, nome: form.nome, tipo: form.tipo, poder: form.poder, custo: form.custo, cooldown: form.cooldown, todos: form.todos });
      } catch (_e) { /* opcional */ }
    }
    setForm({ nome: '', tipo: 'magia', poder: 150, custo: 5, cooldown: 0, todos: false });
  };

  const addCustom = () => {
    const c = customSkills.find((s) => s.id === pickCustom);
    if (!c) return;
    setSkills((prev) => [...prev, { id: `golpe_${Date.now()}`, nome: c.nome, tipo: c.tipo, poder: Number(c.poder), custo: Number(c.custo), cooldown: Number(c.cooldown), todos: !!c.todos }]);
    setPickCustom('');
  };

  return (
    <div className="stack">
      <p className="muted small">
        Crie golpes próprios (físicos ou mágicos). Eles se somam aos golpes base das classes escolhidas.
      </p>

      {customSkills.length > 0 && (
        <div className="join-controls">
          <select value={pickCustom} onChange={(e) => setPickCustom(e.target.value)}>
            <option value="">Importar golpe registrado...</option>
            {customSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          <button onClick={addCustom} disabled={!pickCustom}>+ Importar</button>
        </div>
      )}

      <div className="inline-create">
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
        <label className="check-label">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Publicar no Registro do Mundo
        </label>
        <button onClick={add} disabled={!form.nome.trim()}>+ Adicionar golpe</button>
      </div>

      <div className="chosen-list">
        {skills.map((s, i) => (
          <div className="chosen-chip" key={i}>
            <strong>{s.nome}</strong>
            <span className="tag">{SKILL_TYPES[s.tipo]}</span>
            <span className="tag">{s.poder}%</span>
            <span className="tag">MP {s.custo}</span>
            {s.cooldown > 0 && <span className="tag">⏳ {s.cooldown}t</span>}
            {s.todos && <span className="tag">✦ Todos</span>}
            <button className="ghost remove-x" onClick={() => setSkills((prev) => prev.filter((_, x) => x !== i))}>✕</button>
          </div>
        ))}
        {skills.length === 0 && <p className="muted">Nenhum golpe próprio criado ainda.</p>}
      </div>
    </div>
  );
}

function MegaSkillStep({ title, value, onChange, allowModo }) {
  const [form, setForm] = useState(
    value || {
      nome: '',
      tipo: 'magia',
      poder: 300,
      custo: 0,
      desc: '',
      condicao: null,
      modo: allowModo ? { turnos: 3, danoMultPct: 50 } : null,
    },
  );
  const [hasCond, setHasCond] = useState(false);
  const [condTipo, setCondTipo] = useState('danoRecebido');
  const [condValor, setCondValor] = useState(50);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const finalize = () => {
    if (!form.nome.trim()) return;
    onChange({
      ...form,
      poder: Number(form.poder),
      custo: Number(form.custo),
      condicao: hasCond ? { tipo: condTipo, valor: Number(condValor) } : null,
    });
  };

  return (
    <div className="stack">
      <p className="muted small">
        {allowModo
          ? 'Barra de Ultimate (0-100%) enche com dano causado e recebido. Ativar custa 100% e entra em Modo Ultimate.'
          : 'Barra de Especial (0-100%) enche ao acertar ataques (críticos enchem mais). Disparar custa 100%.'}
      </p>

      <div className="inline-create">
        <div className="form-row">
          <label>
            Nome
            <input value={form.nome} onChange={set('nome')} maxLength={40} placeholder={allowModo ? 'Ex.: Despertar Supremo' : 'Ex.: Cometa Carmesim'} />
          </label>
          <label>
            Tipo do golpe
            <select value={form.tipo} onChange={set('tipo')}>
              {Object.entries(SKILL_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Poder (%)
            <input type="number" min={10} max={1000} value={form.poder} onChange={(e) => setForm((f) => ({ ...f, poder: Number(e.target.value) }))} />
          </label>
          <label>
            Custo de MP
            <input type="number" min={0} max={99} value={form.custo} onChange={(e) => setForm((f) => ({ ...f, custo: Number(e.target.value) }))} />
          </label>
        </div>

        {allowModo && (
          <div className="form-row">
            <label>
              Turnos do Modo Ultimate
              <input type="number" min={1} max={10} value={form.modo.turnos} onChange={(e) => setForm((f) => ({ ...f, modo: { ...f.modo, turnos: Number(e.target.value) } }))} />
            </label>
            <label>
              Bônus de dano no modo (%)
              <input type="number" min={0} max={300} value={form.modo.danoMultPct} onChange={(e) => setForm((f) => ({ ...f, modo: { ...f.modo, danoMultPct: Number(e.target.value) } }))} />
            </label>
          </div>
        )}

        <label>
          Descrição
          <input value={form.desc} onChange={set('desc')} maxLength={200} placeholder="O que acontece ao usar?" />
        </label>

        <label className="check-label">
          <input type="checkbox" checked={hasCond} onChange={(e) => setHasCond(e.target.checked)} />
          Condição extra além da barra cheia
        </label>
        {hasCond && (
          <div className="form-row">
            <select value={condTipo} onChange={(e) => setCondTipo(e.target.value)}>
              {Object.entries(CONDITION_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input type="number" min={0} max={9999} value={condValor} onChange={(e) => setCondValor(e.target.value)} />
          </div>
        )}

        <button onClick={finalize} disabled={!form.nome.trim()}>
          {value ? 'Atualizar golpe' : 'Definir golpe'}
        </button>
        {value && (
          <button className="ghost" onClick={() => onChange(null)}>Remover</button>
        )}
      </div>

      {value && (
        <div className="chosen-chip">
          <strong>{value.nome}</strong>
          <span className="tag">{SKILL_TYPES[value.tipo]}</span>
          <span className="tag">{value.poder}%</span>
          {value.condicao && <span className="tag">🔒 {CONDITION_TYPES[value.condicao.tipo]} {value.condicao.valor}</span>}
          {value.modo && <span className="tag">🔥 {value.modo.turnos}t · +{value.modo.danoMultPct}%</span>}
        </div>
      )}
    </div>
  );
}

function EquipStep({ gameData, customEquipment, equipment, setEquipment }) {
  const [creating, setCreating] = useState(false);
  const [publish, setPublish] = useState(false);
  const [form, setForm] = useState({
    tipo: 'arma',
    nome: '',
    dano_base: 6,
    defesa: 4,
    bonus: {},
    penalidade: {},
    maleficio: '',
  });
  const [armaPick, setArmaPick] = useState('');
  const [armaduraPick, setArmaduraPick] = useState('');

  const presetArmas = Object.values(gameData.equipment.armas);
  const presetArmaduras = Object.values(gameData.equipment.armaduras);
  const customArmas = customEquipment.filter((e) => e.tipo === 'arma');
  const customArmaduras = customEquipment.filter((e) => e.tipo === 'armadura');

  const applyArma = () => {
    if (!armaPick) return;
    const src = [...presetArmas, ...customArmas].find((a) => a.id === armaPick || a.nome === armaPick);
    if (!src) return;
    const isCustom = customArmas.some((a) => a.id === armaPick);
    const def = isCustom
      ? { id: armaPick, nome: src.nome, danoBase: Number(src.dano_base), bonus: src.bonus || {}, penalidade: src.penalidade || {}, maleficio: src.maleficio || '' }
      : { id: src.id, nome: src.nome, danoBase: src.danoBase, bonus: src.bonus || {}, penalidade: src.penalidade || {}, maleficio: src.maleficio || '' };
    setEquipment((eq) => ({ ...eq, arma: def }));
  };

  const applyArmadura = () => {
    if (!armaduraPick) return;
    const src = [...presetArmaduras, ...customArmaduras].find((a) => a.id === armaduraPick || a.nome === armaduraPick);
    if (!src) return;
    const isCustom = customArmaduras.some((a) => a.id === armaduraPick);
    const def = isCustom
      ? { id: armaduraPick, nome: src.nome, defesa: Number(src.defesa), bonus: src.bonus || {}, penalidade: src.penalidade || {}, maleficio: src.maleficio || '' }
      : { id: src.id, nome: src.nome, defesa: src.defesa, bonus: src.bonus || {}, penalidade: src.penalidade || {}, maleficio: src.maleficio || '' };
    setEquipment((eq) => ({ ...eq, armadura: def }));
  };

  const setBonus = (k, v) => setForm((f) => ({ ...f, bonus: { ...f.bonus, [k]: Number(v) } }));
  const setPenal = (k, v) => setForm((f) => ({ ...f, penalidade: { ...f.penalidade, [k]: Number(v) } }));

  const createItem = async () => {
    if (!form.nome.trim()) return;
    const def =
      form.tipo === 'arma'
        ? { id: `arma_${Date.now()}`, nome: form.nome.trim(), danoBase: form.dano_base, bonus: form.bonus, penalidade: form.penalidade, maleficio: form.maleficio }
        : { id: `armadura_${Date.now()}`, nome: form.nome.trim(), defesa: form.defesa, bonus: form.bonus, penalidade: form.penalidade, maleficio: form.maleficio };
    setEquipment((eq) => ({ ...eq, [form.tipo]: def }));
    if (publish) {
      try {
        await api.createCustomEquipment({ creatorId: undefined, nome: form.nome, tipo: form.tipo, dano_base: form.dano_base, defesa: form.defesa, bonus: form.bonus, penalidade: form.penalidade, maleficio: form.maleficio });
      } catch (_e) { /* opcional */ }
    }
    setForm({ tipo: 'arma', nome: '', dano_base: 6, defesa: 4, bonus: {}, penalidade: {}, maleficio: '' });
    setCreating(false);
  };

  const bonusSummary = (item) =>
    item
      ? ATTRIBUTES.filter((k) => item.bonus?.[k] || item.penalidade?.[k])
          .map((k) => `${ATTRIBUTE_NAMES[k]} ${item.bonus?.[k] > 0 ? '+' : ''}${item.bonus?.[k] || 0}${item.penalidade?.[k] ? ` / ${item.penalidade[k]}` : ''}`)
          .join(', ') || 'sem bônus'
      : '';

  return (
    <div className="stack">
      <div className="form-row">
        <label>
          Arma
          <select value={armaPick} onChange={(e) => setArmaPick(e.target.value)}>
            <option value="">Escolher arma...</option>
            <optgroup label="Catálogo">
              {presetArmas.map((a) => (
                <option key={a.id} value={a.id}>{a.nome} (dano {a.danoBase})</option>
              ))}
            </optgroup>
            {customArmas.length > 0 && (
              <optgroup label="Criadas">
                {customArmas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} (dano {a.dano_base})</option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <label>
          Armadura
          <select value={armaduraPick} onChange={(e) => setArmaduraPick(e.target.value)}>
            <option value="">Escolher armadura...</option>
            <optgroup label="Catálogo">
              {presetArmaduras.map((a) => (
                <option key={a.id} value={a.id}>{a.nome} (def {a.defesa})</option>
              ))}
            </optgroup>
            {customArmaduras.length > 0 && (
              <optgroup label="Criadas">
                {customArmaduras.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} (def {a.defesa})</option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </div>
      <div className="join-controls">
        <button onClick={applyArma} disabled={!armaPick}>Equipar arma</button>
        <button onClick={applyArmadura} disabled={!armaduraPick}>Equipar armadura</button>
        <button className="ghost" onClick={() => setCreating((c) => !c)}>
          {creating ? 'Fechar' : '✍️ Criar equipamento'}
        </button>
      </div>

      {creating && (
        <div className="inline-create">
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
              <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={40} placeholder={form.tipo === 'arma' ? 'Ex.: Espada de Cinzas' : 'Ex.: Manto do Crepúsculo'} />
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
            <input value={form.maleficio} onChange={(e) => setForm((f) => ({ ...f, maleficio: e.target.value }))} maxLength={200} placeholder="Ex.: -1 de reflexos, pesada demais" />
          </label>
          <label className="check-label">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Publicar no Registro do Mundo
          </label>
          <button onClick={createItem} disabled={!form.nome.trim()}>Criar equipamento</button>
        </div>
      )}

      <div className="chosen-list">
        {equipment.arma && (
          <div className="chosen-chip">
            <strong>⚔️ {equipment.arma.nome}</strong>
            <span className="tag">dano {equipment.arma.danoBase}</span>
            <span className="muted small">{bonusSummary(equipment.arma)}</span>
            <button className="ghost remove-x" onClick={() => setEquipment((eq) => ({ ...eq, arma: null }))}>✕</button>
          </div>
        )}
        {equipment.armadura && (
          <div className="chosen-chip">
            <strong>🛡️ {equipment.armadura.nome}</strong>
            <span className="tag">def {equipment.armadura.defesa}</span>
            <span className="muted small">{bonusSummary(equipment.armadura)}</span>
            <button className="ghost remove-x" onClick={() => setEquipment((eq) => ({ ...eq, armadura: null }))}>✕</button>
          </div>
        )}
        {!equipment.arma && !equipment.armadura && <p className="muted">Sem equipamento.</p>}
      </div>
    </div>
  );
}

function Summary({ name, races, classes, passiva, skills, ultimate, especial, equipment, stats }) {
  const raceBonus = raceBonusTotal(races);
  return (
    <div className="stack summary">
      <h3>{name || 'Sem nome'}</h3>
      <p>
        <strong>Raças:</strong>{' '}
        {races.map((r) => `${r.nome}${'escolha' in (r.bonus || {}) ? ` (+1 ${ATTRIBUTE_NAMES[r.choice || 'forca']})` : ''}`).join(' + ') || '—'}
      </p>
      <p>
        <strong>Classes:</strong>{' '}
        {classes.map((c) => `${c.nome}${c.primary ? ' ★' : ''}`).join(' + ') || '—'}
      </p>
      <p className="muted small">
        Bônus raciais efetivos:{' '}
        {ATTRIBUTES.filter((k) => raceBonus[k]).map((k) => `${ATTRIBUTE_NAMES[k]} ${raceBonus[k] > 0 ? '+' : ''}${raceBonus[k]}`).join(' · ') || 'nenhum'}
      </p>
      {passiva && <p><strong>Passiva:</strong> {passiva}</p>}
      {skills.length > 0 && (
        <p className="muted small">Golpes próprios: {skills.map((s) => s.nome).join(', ')}</p>
      )}
      {ultimate && <p><strong>Ultimate:</strong> {ultimate.nome} ({ultimate.poder}%) {ultimate.modo ? `· ${ultimate.modo.turnos}t +${ultimate.modo.danoMultPct}%` : ''}</p>}
      {especial && <p><strong>Especial:</strong> {especial.nome} ({especial.poder}%)</p>}
      {equipment.arma && <p className="muted small">⚔️ {equipment.arma.nome}</p>}
      {equipment.armadura && <p className="muted small">🛡️ {equipment.armadura.nome}</p>}
      <div className="form-meta">
        <span>Vida: <strong>{stats.hpMax}</strong></span>
        <span>Mana: <strong>{stats.mpMax}</strong></span>
      </div>
    </div>
  );
}
