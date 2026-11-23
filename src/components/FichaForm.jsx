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
  GENDER_OPTIONS,
  HABILIDADE_CUSTOS,
  IDIOMAS,
  ESPECIALIZACOES_ARMAS,
  PASSIVAS_EXTRAS,
  rotuloPoder,
  ajudaPoder,
  resumoPoder,
  rotuloElemento,
} from '../config.js';
import { applyGenderToRace } from '../game/races.js';
import AlvoSelect from './AlvoSelect.jsx';
import {
  manaMaxFrom,
  danoFisicoAtaque,
  danoBaseDaArma,
  armasDeEquipamento,
  melhorArma,
  categoriaDeArma,
  ARMAS_SLOTS,
  ARMA_CATEGORIA_INFO,
  ALVO_LABEL,
} from '../game/sistema.js';
import { CLASSES, STATUS_DEFS, STATUS_KEYS, ELEMENTOS, attributeBreakdown, raceBonusTotal, classBonusTotal } from '../game/data.js';
import { NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX } from '../game/skillValidation.js';

const STEP_NAMES = [
  'Identidade',
  'Gênero',
  'Raças',
  'Classes',
  'Passiva',
  'Golpes',
  'Golpe Especial',
  'Ultimate',
  'Equipamento',
  'Atributos',
  'Habilidades',
  'Resumo',
];

function emptyAttrs() {
  return { forca: 6, inteligencia: 6, resistencia: 6, destreza: 6, reflexos: 6 };
}

// Base/BR/BC/Final usam o mesmo cálculo do servidor; nada é somado dentro de
// `attrs`, então escolher raça ou classe nunca altera os pontos distribuídos.
const sinal = (v) => (!v ? '—' : v > 0 ? `+${v}` : String(v));

export default function FichaForm({ player, gameData, customClasses = [], onCreated, onCancel }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [gender, setGender] = useState('masculino');
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [passiva, setPassiva] = useState('');
  const [skills, setSkills] = useState([]);
  const [ultimate, setUltimate] = useState(null);
  const [especial, setEspecial] = useState(null);
  const [equipment, setEquipment] = useState({
    armas: { perto: null, distancia: null, utilitaria: null },
    armadura: null,
    acessorio: null,
  });
  const [attrs, setAttrs] = useState(emptyAttrs());
  const [habilidades, setHabilidades] = useState([]);
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
  const abilityCost = habilidades.reduce((s, h) => s + (h.custo || 0), 0);
  const remaining = POINTS - used - abilityCost;

  const stats = useMemo(() => {
    const br = attributeBreakdown(attrs, equipment, races, classes);
    const eff = br.final;
    const hpMax = 500 + eff.resistencia * 10;
    // Regra confirmada: Mana = INT × 2 + BR + BC (não cresce por nível).
    const mpMax = manaMaxFrom(attrs.inteligencia, eff.inteligencia);
    // Dano do ataque básico = (FOR Final + danoBase da melhor arma) × 10 (provisório).
    const dano = danoFisicoAtaque(eff.forca, danoBaseDaArma(melhorArma(equipment)));
    return { hpMax, mpMax, dano, eff, br };
  }, [attrs, races, classes, equipment]);

  const penaltyPct = Math.round((1 - (RACE_PENALTY[races.length] ?? 1)) * 100);

  const canAdvance = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return !!gender;
    if (step === 2) return races.length >= 1;
    if (step === 3) return classes.length >= 1;
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
    if (remaining < 0) {
      setError(`Pontos excedidos: atributos + habilidades somam ${POINTS - remaining}.`);
      setStep(9);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createCharacter({
        playerId: player.id,
        name,
        gender,
        attributes: attrs,
        races,
        classes,
        passiva,
        desc,
        skills,
        ultimate,
        especial,
        equipment: {
          armas: {
            perto: equipment.armas?.perto || null,
            distancia: equipment.armas?.distancia || null,
            utilitaria: equipment.armas?.utilitaria || null,
          },
          arma:
            equipment.armas?.perto || equipment.armas?.distancia || equipment.armas?.utilitaria || null,
          armadura: equipment.armadura || null,
          acessorio: equipment.acessorio || null,
        },
        habilidades,
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
            <div className="stack">
              <p className="muted small">
                O gênero ajusta a expressão racial: cada raça tem bônus e passivas naturais
                diferentes para ♂ masculino e ♀ feminino. Veja os detalhes no passo de Raças.
              </p>
              <div className="gender-options">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`gender-option ${gender === g.id ? 'selected' : ''}`}
                    onClick={() => setGender(g.id)}
                  >
                    <span className="gender-icon">{g.icon}</span>
                    <span>{g.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <RacesStep
              gameData={gameData}
              customRaces={customRaces}
              races={races}
              gender={gender}
              onAdd={addRace}
              onRemove={(id) => setRaces((prev) => prev.filter((r) => r !== id))}
              penaltyPct={penaltyPct}
              player={player}
            />
          )}

          {step === 3 && (
            <ClassesStep
              gameData={gameData}
              customClasses={customClasses}
              classes={classes}
              onAdd={addClass}
              onRemove={(id) => setClasses((prev) => prev.filter((c) => c !== id))}
              onPrimary={(id) =>
                setClasses((prev) => prev.map((c) => ({ ...c, primary: c === id })))
              }
              player={player}
            />
          )}

          {step === 4 && (
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

          {step === 5 && (
            <SkillsStep skills={skills} setSkills={setSkills} customSkills={customSkills} player={player} />
          )}

          {step === 6 && (
            <MegaSkillStep
              title="Golpe Especial (estilo KOF)"
              value={especial}
              onChange={setEspecial}
              allowModo={false}
            />
          )}

          {step === 7 && (
            <MegaSkillStep
              title="Ultimate (estilo battleground)"
              value={ultimate}
              onChange={setUltimate}
              allowModo
            />
          )}

          {step === 8 && (
            <EquipStep
              gameData={gameData}
              customEquipment={customEquipment}
              equipment={equipment}
              setEquipment={setEquipment}
              player={player}
              classes={classes}
            />
          )}

          {step === 9 && (
            <div className="stack">
              <p className="muted small">
                Distribua até {POINTS} pontos entre atributos (1 a {MAX} por atributo). Base é o
                que você escolhe aqui; BR/BC e o total aparecem ao lado, estilo Pokémon/Evocreo.
              </p>
              <div className="attr-head">
                <span>Atributo</span><span>Base</span><span>BR</span><span>BC</span><span>Final</span>
              </div>
              <div className="attrs">
                {ATTRIBUTES.map((key) => (
                  <div className="attr-row attr-detailed" key={key}>
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
                    <span className="attr-bonus" title="Bônus da raça (já com a penalidade de múltiplas raças)">{sinal(stats.br.race[key])}</span>
                    <span className="attr-bonus" title="Bônus da classe">{sinal(stats.br.class[key])}</span>
                    <span className="attr-total" title="Atributo final = base + BR + BC + equipamento + gemas">{stats.br.final[key]}</span>
                  </div>
                ))}
              </div>
              <div className="form-meta">
                <span className={remaining === 0 ? 'points ok' : 'points'}>
                  Pontos restantes: {remaining}
                </span>
                <span>
                  Vida máx: <strong>{stats.hpMax}</strong> · Mana máx: <strong>{stats.mpMax}</strong> · Dano: <strong>{stats.dano}</strong>
                </span>
              </div>
              <p className="muted small">
                Base = pontos distribuídos (não mudam ao adicionar raça ou classe) · BR = bônus
                racial · BC = bônus de classe · Final = base + BR + BC + equipamento + gemas (mín. 1).
              </p>
            </div>
          )}

          {step === 10 && (
            <AbilitiesStep
              pontosDisponiveis={remaining}
              habilidades={habilidades}
              setHabilidades={setHabilidades}
            />
          )}

          {step === 11 && (
            <Summary
              name={name}
              gender={gender}
              races={races}
              classes={classes}
              passiva={passiva}
              skills={skills}
              ultimate={ultimate}
              especial={especial}
              equipment={equipment}
              habilidades={habilidades}
              stats={stats}
            />
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={step === 0 ? onCancel : () => { setError(''); setStep(step - 1); }}>
            {step === 0 ? 'Cancelar' : '← Voltar'}
          </button>
          {step < 11 ? (
            <button type="button" onClick={() => canAdvance() ? (setError(''), setStep(step + 1)) : setError('Preencha o necessário para avançar.')}>
              Próximo →
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={loading || remaining < 0 || !name.trim()}>
              {loading ? 'Criando...' : remaining > 0 ? `Criar Personagem (${remaining} pt não gasto${remaining > 1 ? 's' : ''})` : 'Criar Personagem'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RacesStep({ gameData, customRaces, races, gender, onAdd, onRemove, penaltyPct, player }) {
  const [pick, setPick] = useState('');
  const [choice, setChoice] = useState('forca');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nome: '', bonus: {}, passiva: '' });
  const [publish, setPublish] = useState(false);

  const allRaces = [...Object.values(gameData.races || {}), ...customRaces];
  const picked = allRaces.find((r) => r.id === pick);
  const pickedGender = picked ? applyGenderToRace(picked, gender) : null;

  const doAdd = () => {
    if (!pick) return;
    const isCustom = customRaces.some((r) => r.id === pick);
    // O gênero é aplicado à raça aqui: bônus/passivas específicas ficam gravadas na ficha.
    const merged = applyGenderToRace(picked, gender);
    const def = {
      id: pick,
      nome: merged.nome,
      bonus: merged.bonus,
      passiva: merged.passiva,
      efeito: merged.efeito || {},
      source: isCustom ? 'registry' : 'preset',
      choice,
    };
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
        await api.createCustomRace({ creatorId: player.id, is_public: true, ...{ nome: def.nome, bonus: def.bonus, passiva: def.passiva } });
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

      {pickedGender && (
        <div className="info-box">
          <strong>{pickedGender.nome}</strong> ({GENDER_OPTIONS.find((g) => g.id === gender)?.icon} {gender}) —{' '}
          {pickedGender.passiva || 'sem passiva definida.'}
          {'generos' in (picked || {}) && picked.generos[gender]?.bonus && (
            <span className="tag" style={{ marginLeft: 8 }}>
              Bônus de gênero:{' '}
              {Object.entries(picked.generos[gender].bonus)
                .map(([k, v]) => `${ATTRIBUTE_NAMES[k] || k} +${v}`)
                .join(', ')}
            </span>
          )}
        </div>
      )}

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

function ClassesStep({ gameData, customClasses, classes, onAdd, onRemove, onPrimary, player }) {
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
    // `bonus` precisa acompanhar a classe escolhida: sem ele a coluna BC da
    // tabela de atributos ficaria vazia na criação, mesmo com a classe no wizard.
    const def = isCustom
      ? { id: pick, nome: picked.name, archetype: picked.archetype, bonus: picked.bonus, primary: false }
      : { id: pick, nome: picked.nome, archetype: pick, bonus: picked?.bonus, primary: false };
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
        await api.createCustomClass({ creatorId: player.id, is_public: true, name: def.nome, funcao: '', passiva: '', forcas: '', fraquezas: '', archetype: form.archetype });
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
            <label title="A Mana não cresce por nível: Mana = (Inteligência Final) × 10. Este campo está guardado por compatibilidade e não altera a Mana máxima.">
              Mana por nível (obsoleto)
              <input type="number" min={1} max={30} value={form.mpPerLevel} disabled onChange={(e) => setForm((f) => ({ ...f, mpPerLevel: Number(e.target.value) }))} />
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
          <p className="muted small">
            A Mana máxima = (Inteligência Final) × 10. O Atributo Final inclui bônus de raça, classe e equipamentos.
          </p>
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

const SKILL_FORM_VAZIO = {
  nome: '',
  tipo: 'magia',
  poder: 150,
  custo: 5,
  cooldown: 0,
  todos: false,
  afetaAliados: false,
  buffTipo: '',
  duracao: 3,
  alvo: 'unico',
  alvos: 3,
  splash: 0.5,
  statusTipo: '',
  statusTurnos: 2,
  statusDano: 50,
  desc: '',
  elemento: 'fisico',
  nivel: NIVEL_GOLPE_MIN,
  desbloqueado: true,
};

let skillSeq = 0;
const novoSkillId = () => `golpe_${Date.now()}_${(skillSeq += 1)}`;
const clampNum = (v, min, max, padrao) => {
  const n = Number(v);
  return Math.max(min, Math.min(max, Math.round(Number.isFinite(n) ? n : padrao)));
};

// Ao trocar o tipo, um status escolhido antes pode deixar de fazer sentido
// (cura não recebe DOT; ataque não recebe HoT; buff/defesa não aplicam status).
// Limpar aqui evita salvar um status que o seletor nem mostra mais.
function aoTrocarTipo(form, tipo) {
  const def = STATUS_DEFS[form.statusTipo];
  let compativel = !def;
  if (def) {
    if (tipo === 'cura') compativel = def.tipo === 'hot';
    else if (tipo === 'fisico' || tipo === 'magia') compativel = def.tipo !== 'hot';
  }
  return { ...form, tipo, statusTipo: compativel ? form.statusTipo : '' };
}

// Monta o golpe no formato persistido (normalizeSkill do servidor). Só inclui
// campos que fazem sentido para o tipo escolhido, para não criar lixo.
function montarGolpe(form, id) {
  const tipo = SKILL_TYPES[form.tipo] ? form.tipo : 'magia';
  const golpe = {
    id,
    nome: String(form.nome || '').trim().slice(0, 40),
    tipo,
    poder: clampNum(form.poder, 10, 1000, 100),
    custo: clampNum(form.custo, 0, 99, 0),
    cooldown: clampNum(form.cooldown, 0, 20, 0),
    todos: tipo === 'cura' ? !!form.todos : false,
    desc: String(form.desc || '').trim().slice(0, 200),
    // Elemento e nível alimentam a árvore; o custo de MP é `custo` (acima).
    elemento: ELEMENTOS.includes(form.elemento) ? form.elemento : 'fisico',
    nivel: clampNum(form.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX, NIVEL_GOLPE_MIN),
    desbloqueado: form.desbloqueado !== false,
  };
  if (tipo === 'buff' || tipo === 'defesa') {
    golpe.afetaAliados = !!form.afetaAliados;
    golpe.duracao = clampNum(form.duracao, 1, 8, 3);
  }
  if (tipo === 'buff') {
    golpe.buffTipo = form.buffTipo === 'fisico' || form.buffTipo === 'magico'
      ? form.buffTipo
      : null;
  }
  if (tipo === 'fisico' || tipo === 'magia') {
    const alvo = ALVO_LABEL[form.alvo] ? form.alvo : 'unico';
    golpe.alvo = alvo;
    if (alvo !== 'unico') {
      golpe.alvos = clampNum(form.alvos, 2, 10, 3);
      golpe.splash = Math.max(0.1, Math.min(1, Number(form.splash) || 0.5));
    }
  }
  // Status (queimadura, sangramento, regeneração...) só em golpes de dano/cura.
  if (tipo === 'fisico' || tipo === 'magia' || tipo === 'cura') {
    const def = STATUS_DEFS[form.statusTipo];
    if (def) {
      golpe.status = {
        tipo: form.statusTipo,
        turnos: clampNum(form.statusTurnos, 1, 8, def.duracaoPadrao || 2),
        dano: clampNum(form.statusDano, 0, 999, def.danoPadrao || 0),
      };
    }
  }
  return golpe;
}

// Converte um golpe persistido (ficha ou Registro do Mundo) para o formulário.
// Sem isso, status/buff/defesa importados voltam como "nenhum" e são perdidos
// ao salvar a ficha novamente.
function golpeParaForm(golpe = {}) {
  const status = golpe.status && typeof golpe.status === 'object' ? golpe.status : null;
  // Golpes legados com `todos` em dano equivalem a área no motor.
  const alvo = ALVO_LABEL[golpe.alvo] ? golpe.alvo
    : (golpe.todos && (golpe.tipo === 'fisico' || golpe.tipo === 'magia') ? 'area' : 'unico');
  return {
    ...SKILL_FORM_VAZIO,
    nome: golpe.nome || '',
    tipo: SKILL_TYPES[golpe.tipo] ? golpe.tipo : 'magia',
    poder: Number(golpe.poder) || 100,
    custo: Number(golpe.custo) || 0,
    cooldown: Number(golpe.cooldown) || 0,
    todos: !!golpe.todos,
    afetaAliados: !!golpe.afetaAliados,
    buffTipo: golpe.buffTipo || '',
    duracao: Number(golpe.duracao) || 3,
    alvo,
    alvos: Number(golpe.alvos) || 3,
    splash: Number(golpe.splash) || 0.5,
    statusTipo: status?.tipo || '',
    statusTurnos: Number(status?.turnos) || 2,
    statusDano: Number(status?.dano) || 0,
    desc: golpe.desc ?? golpe.descricao ?? '',
    elemento: ELEMENTOS.includes(golpe.elemento) ? golpe.elemento : 'fisico',
    nivel: clampNum(golpe.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX, NIVEL_GOLPE_MIN),
    desbloqueado: golpe.desbloqueado !== false,
  };
}

function SkillsStep({ skills, setSkills, customSkills, player }) {
  const [form, setForm] = useState(SKILL_FORM_VAZIO);
  const [pickCustom, setPickCustom] = useState('');
  const [publish, setPublish] = useState(false);
  const [publishError, setPublishError] = useState('');
  const isDano = form.tipo === 'fisico' || form.tipo === 'magia';
  const aceitaStatus = isDano || form.tipo === 'cura';
  const statusDef = STATUS_DEFS[form.statusTipo] || null;

  const add = async () => {
    if (!form.nome.trim()) return;
    const skill = montarGolpe(form, novoSkillId());
    setSkills((prev) => [...prev, skill]);
    setPublishError('');
    if (publish) {
      try {
        // Publica o golpe completo: status/buff/defesa também precisam sobreviver
        // ao vai-e-vem entre a ficha e o Registro do Mundo.
        await api.createCustomSkill({
          creatorId: player.id,
          is_public: true,
          nome: skill.nome,
          tipo: skill.tipo,
          poder: skill.poder,
          custo: skill.custo,
          cooldown: skill.cooldown,
          todos: skill.todos,
          afetaAliados: skill.afetaAliados,
          buffTipo: skill.buffTipo,
          duracao: skill.duracao,
          status: skill.status,
          alvo: skill.alvo,
          alvos: skill.alvos,
          splash: skill.splash,
          descricao: skill.desc,
          elemento: skill.elemento,
          nivel: skill.nivel,
          desbloqueado: skill.desbloqueado,
        });
      } catch (e) {
        setPublishError(`Golpe salvo na ficha, mas não publicado: ${e?.message || 'falha na API'}.`);
      }
    }
    setForm(SKILL_FORM_VAZIO);
  };

  const addCustom = () => {
    const c = customSkills.find((s) => s.id === pickCustom);
    if (!c) return;
    const golpe = montarGolpe(golpeParaForm(c), novoSkillId());
    setSkills((prev) => [...prev, golpe]);
    setPickCustom('');
  };

  return (
    <div className="stack">
      <p className="muted small">
        Crie golpes próprios (físicos, mágicos, cura, buff ou defesa). Eles se somam aos golpes base das classes escolhidas.
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
            <select value={form.tipo} onChange={(e) => setForm((f) => aoTrocarTipo(f, e.target.value))}>
              {Object.entries(SKILL_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            {rotuloPoder(form.tipo)}
            <input type="number" min={10} max={1000} value={form.poder} disabled={form.tipo === 'defesa'} title={ajudaPoder(form.tipo)} onChange={(e) => setForm((f) => ({ ...f, poder: Number(e.target.value) }))} />
            <small className="muted small field-help">{ajudaPoder(form.tipo)}</small>
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
        </div>
        <div className="form-row">
          <label>
            Elemento mágico
            <select value={form.elemento} onChange={(e) => setForm((f) => ({ ...f, elemento: e.target.value }))}>
              {ELEMENTOS.map((el) => (<option key={el} value={el}>{rotuloElemento(el)}</option>))}
            </select>
          </label>
          <label>
            Nível para adquirir
            <input type="number" min={NIVEL_GOLPE_MIN} max={NIVEL_GOLPE_MAX} value={form.nivel} onChange={(e) => setForm((f) => ({ ...f, nivel: Number(e.target.value) }))} />
          </label>
        </div>
        <label className="check-label">
          <input type="checkbox" checked={form.desbloqueado} onChange={(e) => setForm((f) => ({ ...f, desbloqueado: e.target.checked }))} />
          Golpe desbloqueado (desmarque para guardar na árvore e desbloquear depois)
        </label>
        {isDano && (
          <AlvoSelect
            alvo={form.alvo}
            alvos={form.alvos}
            splash={form.splash}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          />
        )}
        {form.tipo === 'cura' && (
          <label className="check-label">
            <input type="checkbox" checked={form.todos} onChange={(e) => setForm((f) => ({ ...f, todos: e.target.checked }))} />
            Cura em massa (todos os aliados, incluindo você)
          </label>
        )}
        {(form.tipo === 'buff' || form.tipo === 'defesa') && (
          <>
            <label className="check-label">
              <input type="checkbox" checked={form.afetaAliados} onChange={(e) => setForm((f) => ({ ...f, afetaAliados: e.target.checked }))} />
              Afeta todos os aliados (incluindo você)
            </label>
            <label>
              Duração (turnos)
              <input type="number" min={1} max={8} value={form.duracao} onChange={(e) => setForm((f) => ({ ...f, duracao: Number(e.target.value) }))} />
            </label>
          </>
        )}
        {form.tipo === 'buff' && (
          <label>
            Tipo de bônus
            <select value={form.buffTipo} onChange={(e) => setForm((f) => ({ ...f, buffTipo: e.target.value }))}>
              <option value="">Físico e mágico</option>
              <option value="fisico">Somente físico</option>
              <option value="magico">Somente mágico</option>
            </select>
          </label>
        )}
        {aceitaStatus && (
          <div className="form-row">
            <label>
              Status aplicado
              <select value={form.statusTipo} onChange={(e) => setForm((f) => ({ ...f, statusTipo: e.target.value }))}>
                <option value="">Nenhum</option>
                {STATUS_KEYS.filter((k) => {
                  const def = STATUS_DEFS[k];
                  if (form.tipo === 'cura') return def.tipo === 'hot';
                  return def.tipo !== 'hot';
                }).map((k) => (
                  <option key={k} value={k}>{STATUS_DEFS[k].nome}</option>
                ))}
              </select>
            </label>
            {statusDef && (
              <>
                <label>
                  Turnos do status
                  <input type="number" min={1} max={8} value={form.statusTurnos} onChange={(e) => setForm((f) => ({ ...f, statusTurnos: Number(e.target.value) }))} />
                </label>
                <label>
                  Dano/cura por turno
                  <input type="number" min={0} max={999} value={form.statusDano} onChange={(e) => setForm((f) => ({ ...f, statusDano: Number(e.target.value) }))} />
                </label>
              </>
            )}
          </div>
        )}
        <label>
          Descrição (opcional)
          <input value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} maxLength={200} placeholder="O que acontece ao usar?" />
        </label>
        <label className="check-label">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Publicar no Registro do Mundo
        </label>
        <button onClick={add} disabled={!form.nome.trim()}>+ Adicionar golpe</button>
        {publishError && <div className="error">{publishError}</div>}
      </div>

      <div className="chosen-list">
        {skills.map((s, i) => (
          <div className="chosen-chip" key={s.id || i}>
            <strong>{s.nome}</strong>
            <span className="tag">{SKILL_TYPES[s.tipo]}</span>
            <span className="tag">{resumoPoder(s)}</span>
            <span className="tag">MP {s.custo}</span>
            {s.elemento && <span className="tag">✦ {rotuloElemento(s.elemento)}</span>}
            <span className="tag">Nv {s.nivel || 1}</span>
            {s.desbloqueado === false && <span className="tag">🔒 Bloqueado</span>}
            {s.cooldown > 0 && <span className="tag">⏳ {s.cooldown}t</span>}
            {s.todos && <span className="tag">✦ Todos</span>}
            {s.afetaAliados && <span className="tag">✦ Aliados</span>}
            {s.buffTipo && <span className="tag">{s.buffTipo === 'fisico' ? '💪 Físico' : '🔮 Mágico'}</span>}
            {s.duracao && (s.tipo === 'buff' || s.tipo === 'defesa') && <span className="tag">{s.duracao}t</span>}
            {s.alvo && s.alvo !== 'unico' && <span className="tag">◎ {ALVO_LABEL[s.alvo] || s.alvo}</span>}
            {s.status && <span className="tag">{STATUS_DEFS[s.status.tipo]?.icon} {STATUS_DEFS[s.status.tipo]?.nome || s.status.tipo}</span>}
            <button className="ghost remove-x" onClick={() => setSkills((prev) => prev.filter((_, x) => x !== i))}>✕</button>
          </div>
        ))}
        {skills.length === 0 && <p className="muted">Nenhum golpe próprio criado ainda.</p>}
      </div>
    </div>
  );
}

const MODO_PADRAO = { turnos: 3, danoMultPct: 50 };

function megaFormInicial(allowModo) {
  return {
    nome: '',
    tipo: 'magia',
    poder: 300,
    custo: 0,
    desc: '',
    todos: false,
    afetaAliados: false,
    buffTipo: '',
    duracao: 3,
    alvo: 'unico',
    alvos: 3,
    splash: 0.5,
    statusTipo: '',
    statusTurnos: 2,
    statusDano: 50,
    modo: allowModo ? { ...MODO_PADRAO } : null,
  };
}

function MegaSkillStep({ title, value, onChange, allowModo }) {
  const [form, setForm] = useState(() => {
    const inicial = megaFormInicial(allowModo);
    if (!value) return inicial;
    // O golpe salvo guarda `status` como objeto; o formulário usa
    // statusTipo/statusTurnos/statusDano. `golpeParaForm` faz a conversão,
    // mas traz defaults de golpe comum (poder 100 / status 0) — aqui os
    // valores de especial/ultimate só são substituídos quando realmente salvos.
    const salvo = golpeParaForm(value);
    return {
      ...inicial,
      ...salvo,
      poder: Number(value.poder) || inicial.poder,
      statusDano: value.status?.dano == null ? inicial.statusDano : salvo.statusDano,
      // `modo` antigo podia vir nulo mesmo em ultimate: o editor sempre tem um.
      modo: allowModo ? { ...MODO_PADRAO, ...(value.modo || {}) } : null,
    };
  });
  const [hasCond, setHasCond] = useState(!!value?.condicao);
  const [condTipo, setCondTipo] = useState(value?.condicao?.tipo || 'danoRecebido');
  const [condValor, setCondValor] = useState(value?.condicao?.valor ?? 50);
  const isDano = form.tipo === 'fisico' || form.tipo === 'magia';
  const aceitaStatus = isDano || form.tipo === 'cura';
  const statusDef = STATUS_DEFS[form.statusTipo] || null;
  const modo = form.modo || MODO_PADRAO;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setModo = (k) => (e) => setForm((f) => ({
    ...f,
    modo: { ...(f.modo || MODO_PADRAO), [k]: Number(e.target.value) },
  }));

  const finalize = () => {
    const base = montarGolpe(form, value?.id || novoSkillId());
    if (!base.nome) return;
    const payload = {
      ...base,
      condicao: hasCond
        ? { tipo: condTipo, valor: Math.max(0, Math.round(Number(condValor) || 0)) }
        : null,
      modo: allowModo
        ? {
          turnos: clampNum(modo.turnos, 1, 10, 3),
          danoMultPct: clampNum(modo.danoMultPct, 0, 300, 50),
        }
        : null,
    };
    onChange(payload);
  };

  return (
    <div className="stack">
      <h3>{title}</h3>
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
            <select value={form.tipo} onChange={(e) => setForm((f) => aoTrocarTipo(f, e.target.value))}>
              {Object.entries(SKILL_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            {rotuloPoder(form.tipo)}
            <input type="number" min={10} max={1000} value={form.poder} disabled={form.tipo === 'defesa'} title={ajudaPoder(form.tipo)} onChange={(e) => setForm((f) => ({ ...f, poder: Number(e.target.value) }))} />
            <small className="muted small field-help">{ajudaPoder(form.tipo)}</small>
          </label>
          <label>
            Custo de MP
            <input type="number" min={0} max={99} value={form.custo} onChange={(e) => setForm((f) => ({ ...f, custo: Number(e.target.value) }))} />
          </label>
        </div>

        {isDano && (
          <AlvoSelect
            alvo={form.alvo}
            alvos={form.alvos}
            splash={form.splash}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          />
        )}

        {form.tipo === 'cura' && (
          <label className="check-label">
            <input type="checkbox" checked={form.todos} onChange={(e) => setForm((f) => ({ ...f, todos: e.target.checked }))} />
            Cura em massa (todos os aliados, incluindo você)
          </label>
        )}
        {(form.tipo === 'buff' || form.tipo === 'defesa') && (
          <>
            <label className="check-label">
              <input type="checkbox" checked={form.afetaAliados} onChange={(e) => setForm((f) => ({ ...f, afetaAliados: e.target.checked }))} />
              Afeta todos os aliados (incluindo você)
            </label>
            <label>
              Duração (turnos)
              <input type="number" min={1} max={8} value={form.duracao} onChange={(e) => setForm((f) => ({ ...f, duracao: Number(e.target.value) }))} />
            </label>
          </>
        )}
        {form.tipo === 'buff' && (
          <label>
            Tipo de bônus
            <select value={form.buffTipo} onChange={(e) => setForm((f) => ({ ...f, buffTipo: e.target.value }))}>
              <option value="">Físico e mágico</option>
              <option value="fisico">Somente físico</option>
              <option value="magico">Somente mágico</option>
            </select>
          </label>
        )}
        {aceitaStatus && (
          <div className="form-row">
            <label>
              Status aplicado
              <select value={form.statusTipo} onChange={(e) => setForm((f) => ({ ...f, statusTipo: e.target.value }))}>
                <option value="">Nenhum</option>
                {STATUS_KEYS.filter((k) => {
                  const def = STATUS_DEFS[k];
                  if (form.tipo === 'cura') return def.tipo === 'hot';
                  return def.tipo !== 'hot';
                }).map((k) => (
                  <option key={k} value={k}>{STATUS_DEFS[k].nome}</option>
                ))}
              </select>
            </label>
            {statusDef && (
              <>
                <label>
                  Turnos do status
                  <input type="number" min={1} max={8} value={form.statusTurnos} onChange={(e) => setForm((f) => ({ ...f, statusTurnos: Number(e.target.value) }))} />
                </label>
                <label>
                  Dano/cura por turno
                  <input type="number" min={0} max={999} value={form.statusDano} onChange={(e) => setForm((f) => ({ ...f, statusDano: Number(e.target.value) }))} />
                </label>
              </>
            )}
          </div>
        )}

        {allowModo && (
          <div className="form-row">
            <label>
              Turnos do Modo Ultimate
              <input type="number" min={1} max={10} value={modo.turnos} onChange={setModo('turnos')} />
            </label>
            <label>
              Bônus de dano no modo (%)
              <input type="number" min={0} max={300} value={modo.danoMultPct} onChange={setModo('danoMultPct')} />
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
          <span className="tag">{resumoPoder(value)}</span>
          {value.custo > 0 && <span className="tag">MP {value.custo}</span>}
          {value.todos && <span className="tag">✦ Todos</span>}
          {value.afetaAliados && <span className="tag">✦ Aliados</span>}
          {value.alvo && value.alvo !== 'unico' && (
            <span className="tag">◎ {ALVO_LABEL[value.alvo] || value.alvo}</span>
          )}
          {value.status && <span className="tag">{STATUS_DEFS[value.status.tipo]?.icon} {STATUS_DEFS[value.status.tipo]?.nome || value.status.tipo}</span>}
          {value.condicao && <span className="tag">🔒 {CONDITION_TYPES[value.condicao.tipo]} {value.condicao.valor}</span>}
          {value.modo && <span className="tag">🔥 {value.modo.turnos}t · +{value.modo.danoMultPct}%</span>}
          {value.desc && <span className="muted small">{value.desc}</span>}
        </div>
      )}
    </div>
  );
}

function EquipStep({ gameData, customEquipment, equipment, setEquipment, player, classes = [] }) {
  const [creating, setCreating] = useState(false);
  const [publish, setPublish] = useState(false);
  const [form, setForm] = useState({
    tipo: 'arma',
    categoria: 'perto',
    nome: '',
    dano_base: 6,
    defesa: 4,
    usos_max: 3,
    efeito_tipo: '',
    efeito_turnos: 2,
    efeito_dano: 50,
    bonus: {},
    penalidade: {},
    maleficio: '',
  });
  const [armaPicks, setArmaPicks] = useState({ perto: '', distancia: '', utilitaria: '' });
  const [armaduraPick, setArmaduraPick] = useState('');
  const [acessorioPick, setAcessorioPick] = useState('');

  const mainScores = mainAttributesForClasses(classes);

  // O id do catálogo é a CHAVE do objeto — Object.values perde o id e o select
  // não consegue equipar (option value ficava undefined). Usamos Object.entries.
  const presetArmas = [
    ...Object.entries(gameData.equipment.armas),
    ...Object.entries(gameData.equipment.canoes || {}),
  ].map(([id, it]) => ({ id, ...it }));
  const presetArmaduras = Object.entries(gameData.equipment.armaduras).map(([id, it]) => ({ id, ...it }));
  const presetAcessorios = Object.entries(gameData.equipment.acessorios || {}).map(([id, it]) => ({ id, ...it }));
  const customArmas = customEquipment.filter((e) => e.tipo === 'arma');
  const customArmaduras = customEquipment.filter((e) => e.tipo === 'armadura');
  const customAcessorios = customEquipment.filter((e) => e.tipo === 'acessorio');

  const armasDaCategoria = (categoria) =>
    [...presetArmas.filter((a) => (a.categoria || categoriaDeArma(a)) === categoria), ...customArmas].map((a) => ({
      ...a,
      _categoria: categoria,
    }));

  const applyArma = (categoria) => {
    const pick = armaPicks[categoria];
    if (!pick) return;
    const src = armasDaCategoria(categoria).find((a) => a.id === pick || a.nome === pick);
    if (!src) return;
    const isCustom = customArmas.some((a) => a.id === pick);
    const def = isCustom
      ? {
          id: pick,
          nome: src.nome,
          categoria,
          danoBase: Number(src.dano_base),
          bonus: src.bonus || {},
          penalidade: src.penalidade || {},
          maleficio: src.maleficio || '',
        }
      : {
          // Copia a definição COMPLETA do catálogo (alvo/alvos/splash, elemento,
          // recarga etc.) — senão armas de fogo perdem o multi-alvo ao equipar.
          ...src,
          id: src.id,
          categoria,
          bonus: src.bonus || {},
          penalidade: src.penalidade || {},
        };
    delete def._categoria;
    setEquipment((eq) => ({ ...eq, armas: { ...(eq.armas || {}), [categoria]: def } }));
    setArmaPicks((p) => ({ ...p, [categoria]: '' }));
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

  const applyAcessorio = () => {
    if (!acessorioPick) return;
    const src = [...presetAcessorios, ...customAcessorios].find((a) => a.id === acessorioPick || a.nome === acessorioPick);
    if (!src) return;
    const isCustom = customAcessorios.some((a) => a.id === acessorioPick);
    const def = isCustom
      ? { id: acessorioPick, nome: src.nome, bonus: src.bonus || {}, penalidade: src.penalidade || {}, maleficio: src.maleficio || '', socketSlots: src.socketSlots || 0 }
      : { id: src.id, nome: src.nome, bonus: src.bonus || {}, penalidade: src.penalidade || {}, maleficio: src.maleficio || '', socketSlots: src.socketSlots || 0 };
    setEquipment((eq) => ({ ...eq, acessorio: def }));
  };

  const setBonus = (k, v) => setForm((f) => ({ ...f, bonus: { ...f.bonus, [k]: Number(v) } }));
  const setPenal = (k, v) => setForm((f) => ({ ...f, penalidade: { ...f.penalidade, [k]: Number(v) } }));

  const createItem = async () => {
    if (!form.nome.trim()) return;
    const efeito =
      form.tipo === 'arma' && form.categoria === 'utilitaria' && form.efeito_tipo
        ? {
            tipo: form.efeito_tipo,
            turnos: Math.max(1, form.efeito_turnos),
            dano: ['queimadura', 'veneno'].includes(form.efeito_tipo) ? form.efeito_dano : undefined,
          }
        : null;
    const def =
      form.tipo === 'arma'
        ? {
            id: `arma_${Date.now()}`,
            nome: form.nome.trim(),
            categoria: form.categoria,
            danoBase: form.dano_base,
            usosMax: form.categoria === 'utilitaria' ? Math.max(1, form.usos_max) : undefined,
            efeito,
            bonus: form.bonus,
            penalidade: form.penalidade,
            maleficio: form.maleficio,
          }
        : {
            id: `armadura_${Date.now()}`,
            nome: form.nome.trim(),
            defesa: form.defesa,
            bonus: form.bonus,
            penalidade: form.penalidade,
            maleficio: form.maleficio,
          };
    if (form.tipo === 'arma') {
      setEquipment((eq) => ({ ...eq, armas: { ...(eq.armas || {}), [form.categoria]: def } }));
    } else {
      setEquipment((eq) => ({ ...eq, armadura: def }));
    }
    if (publish) {
      try {
        await api.createCustomEquipment({
          creatorId: player.id,
          is_public: true,
          nome: form.nome,
          tipo: form.tipo,
          categoria: form.categoria,
          dano_base: form.dano_base,
          defesa: form.defesa,
          usos_max: form.usos_max,
          bonus: form.bonus,
          penalidade: form.penalidade,
          maleficio: form.maleficio,
        });
      } catch (_e) { /* opcional */ }
    }
    setForm({ tipo: 'arma', categoria: 'perto', nome: '', dano_base: 6, defesa: 4, usos_max: 3, efeito_tipo: '', efeito_turnos: 2, efeito_dano: 50, bonus: {}, penalidade: {}, maleficio: '' });
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
        {ARMAS_SLOTS.map((cat) => {
          const info = ARMA_CATEGORIA_INFO[cat];
          const catalogo = presetArmas.filter((a) => (a.categoria || categoriaDeArma(a)) === cat);
          return (
            <label key={cat}>
              {info.icon} {info.nome}
              <select value={armaPicks[cat]} onChange={(e) => setArmaPicks((p) => ({ ...p, [cat]: e.target.value }))}>
                <option value="">Escolher arma...</option>
                <optgroup label="Catálogo">
                  {catalogo.map((a) => {
                    const rec = equipmentRecommendation(a, classes);
                    return (
                      <option key={a.id} value={a.id}>
                        {rec.recomendado && rec.principal ? '🌟' : ''} {a.nome}
                        (dano {a.danoBase}{a.usosMax ? ` · ${a.usosMax} usos` : ''}{a.recarga > 0 ? ` · recarga ${a.recarga}` : ''})
                      </option>
                    );
                  })}
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
          );
        })}
        <label>
          🛡️ Armadura
          <select value={armaduraPick} onChange={(e) => setArmaduraPick(e.target.value)}>
            <option value="">Escolher armadura...</option>
            <optgroup label="Catálogo">
              {presetArmaduras.map((a) => {
                const rec = equipmentRecommendation(a, classes);
                return (
                  <option key={a.id} value={a.id}>
                    {rec.recomendado && rec.principal ? '🌟' : ''} {a.nome} (def {a.defesa})
                  </option>
                );
              })}
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
        <label>
          💍 Acessório
          <select value={acessorioPick} onChange={(e) => setAcessorioPick(e.target.value)}>
            <option value="">Escolher acessório...</option>
            <optgroup label="Catálogo">
              {presetAcessorios.map((a) => {
                const rec = equipmentRecommendation(a, classes);
                return (
                  <option key={a.id} value={a.id}>
                    {rec.recomendado && rec.principal ? '🌟' : ''} {a.nome}
                    {a.bonus ? ` (` + Object.entries(a.bonus).map(([k, v]) => `${ATTRIBUTE_NAMES[k]} +${v}`).join(', ') + ')' : ''}
                  </option>
                );
              })}
            </optgroup>
            {customAcessorios.length > 0 && (
              <optgroup label="Criadas">
                {customAcessorios.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </div>
      <div className="join-controls">
        {ARMAS_SLOTS.map((cat) => (
          <button key={cat} onClick={() => applyArma(cat)} disabled={!armaPicks[cat]}>
            Equipar {ARMA_CATEGORIA_INFO[cat].nome.toLowerCase()}
          </button>
        ))}
        <button onClick={applyArmadura} disabled={!armaduraPick}>Equipar armadura</button>
        <button onClick={applyAcessorio} disabled={!acessorioPick}>Equipar acessório</button>
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
            {form.tipo === 'arma' && (
              <label>
                Categoria
                <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
                  {ARMAS_SLOTS.map((cat) => (
                    <option key={cat} value={cat}>
                      {ARMA_CATEGORIA_INFO[cat].icon} {ARMA_CATEGORIA_INFO[cat].nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
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
            {form.tipo === 'arma' && form.categoria === 'utilitaria' && (
              <>
                <label>
                  Usos por batalha
                  <input type="number" min={1} max={10} value={form.usos_max} onChange={(e) => setForm((f) => ({ ...f, usos_max: Number(e.target.value) }))} />
                </label>
                <label>
                  Efeito
                  <select value={form.efeito_tipo} onChange={(e) => setForm((f) => ({ ...f, efeito_tipo: e.target.value }))}>
                    <option value="">Nenhum (só dano)</option>
                    <option value="lentidao">🐢 Lentidão</option>
                    <option value="cegueira">🌫️ Cegueira</option>
                    <option value="fraqueza">💢 Fraqueza</option>
                    <option value="queimadura">🔥 Queimadura</option>
                    <option value="veneno">☠️ Veneno</option>
                  </select>
                </label>
                {form.efeito_tipo && (
                  <label>
                    Turnos
                    <input type="number" min={1} max={9} value={form.efeito_turnos} onChange={(e) => setForm((f) => ({ ...f, efeito_turnos: Number(e.target.value) }))} />
                  </label>
                )}
                {['queimadura', 'veneno'].includes(form.efeito_tipo) && (
                  <label>
                    Dano/turno
                    <input type="number" min={1} max={500} value={form.efeito_dano} onChange={(e) => setForm((f) => ({ ...f, efeito_dano: Number(e.target.value) }))} />
                  </label>
                )}
              </>
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
        {ARMAS_SLOTS.map((cat) => {
          const arma = equipment.armas?.[cat];
          if (!arma) return null;
          const info = ARMA_CATEGORIA_INFO[cat];
          const rec = equipmentRecommendation(arma, classes);
          return (
            <div className="chosen-chip" key={cat}>
              <strong>{info.icon} {arma.nome}</strong>
              {rec.recomendado && rec.principal && <span className="tag recommend-tag">🌟 Recomendado</span>}
              <span className="tag">{info.nome}</span>
              <span className="tag">dano {arma.danoBase}</span>
              {arma.usosMax ? <span className="tag">{arma.usosMax} usos</span> : null}
              {arma.recarga > 0 ? <span className="tag">recarga {arma.recarga}</span> : null}
              {arma.efeito ? <span className="tag">efeito: {arma.efeito.tipo}</span> : null}
              <span className="muted small">{bonusSummary(arma)}</span>
              <button
                className="ghost remove-x"
                onClick={() => setEquipment((eq) => ({ ...eq, armas: { ...(eq.armas || {}), [cat]: null } }))}
              >
                ✕
              </button>
            </div>
          );
        })}
        {equipment.armadura && (
          <div className="chosen-chip">
            <strong>🛡️ {equipment.armadura.nome}</strong>
            {equipmentRecommendation(equipment.armadura, classes).recomendado && equipmentRecommendation(equipment.armadura, classes).principal && <span className="tag recommend-tag">🌟 Recomendado</span>}
            <span className="tag">def {equipment.armadura.defesa}</span>
            <span className="muted small">{bonusSummary(equipment.armadura)}</span>
            <button className="ghost remove-x" onClick={() => setEquipment((eq) => ({ ...eq, armadura: null }))}>✕</button>
          </div>
        )}
        {equipment.acessorio && (
          <div className="chosen-chip">
            <strong>💍 {equipment.acessorio.nome}</strong>
            {equipmentRecommendation(equipment.acessorio, classes).recomendado && equipmentRecommendation(equipment.acessorio, classes).principal && <span className="tag recommend-tag">🌟 Recomendado</span>}
            <span className="muted small">{bonusSummary(equipment.acessorio)}</span>
            <button className="ghost remove-x" onClick={() => setEquipment((eq) => ({ ...eq, acessorio: null }))}>✕</button>
          </div>
        )}
        {!armasDeEquipamento(equipment).length && !equipment.armadura && !equipment.acessorio && <p className="muted">Sem equipamento.</p>}
      </div>
    </div>
  );
}

// ── Sistema de indicação de equipamento ─────────────────────────────
// Calcula o(s) atributo(s) principal(is) com base nas classes escolhidas.
// Retorna um mapa { atributo: pontuacao } onde maior = mais importante.
function mainAttributesForClasses(classes) {
  const scores = {};
  for (const c of classes || []) {
    const def = CLASSES[c.id || c.archetype];
    if (!def) continue;
    const lvl = c.archetype ? c.archetype : c.id;
    const clsDef = CLASSES[lvl];
    if (!clsDef) continue;
    // O atributo do "levelUp" é o principal da classe.
    const prim = clsDef.levelUp;
    scores[prim] = (scores[prim] || 0) + 1;
    // Bônus diretos da classe também contam como indicação.
    for (const [k, v] of Object.entries(clsDef.bonus || {})) {
      if (v > 0) scores[k] = (scores[k] || 0) + v;
    }
  }
  return scores;
}

// Verifica se um item (arma/armadura/acessorio) é recomendado para as classes.
// Retorna { recomendado: boolean, motivo: string, atributos: string[] }
function equipmentRecommendation(item, classes) {
  if (!item || !classes?.length) return { recomendado: false, motivo: '', atributos: [] };
  const scores = mainAttributesForClasses(classes);
  if (!scores || Object.keys(scores).length === 0) return { recomendado: false, motivo: '', atributos: [] };

  const hitAttrs = [];
  const b = item.bonus || {};
  const p = item.penalidade || {};

  for (const [attr, val] of Object.entries(b)) {
    if (val > 0 && scores[attr] && scores[attr] > 0) hitAttrs.push(attr);
  }
  // Itens com penalidade no atributo principal não são recomendados.
  for (const [attr, val] of Object.entries(p)) {
    if (val > 0 && scores[attr] && scores[attr] > 0) return { recomendado: false, motivo: 'Penalidade no atributo principal', atributos: [] };
  }

  if (hitAttrs.length === 0) return { recomendado: false, motivo: '', atributos: [] };

  const main = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const motivos = hitAttrs.map((a) => `${ATTRIBUTE_NAMES[a]} +${b[a]}`).join(', ');
  const ehPrincipal = hitAttrs.includes(main);
  return {
    recomendado: true,
    motivo: ehPrincipal ? `Ideal para suas classes: ${motivos}` : `Bônus úteis: ${motivos}`,
    atributos: hitAttrs,
    principal: ehPrincipal,
  };
}

function AbilitiesStep({ pontosDisponiveis, habilidades, setHabilidades }) {
  const has = (id) => habilidades.some((h) => h.id === id);

  const addIdioma = (lang) => {
    if (has(lang.id) || pontosDisponiveis < HABILIDADE_CUSTOS.idioma) return;
    setHabilidades((prev) => [
      ...prev,
      { tipo: 'idioma', id: lang.id, nome: lang.nome, custo: HABILIDADE_CUSTOS.idioma },
    ]);
  };

  const addEspecializacao = (esp) => {
    if (has(esp.id) || pontosDisponiveis < HABILIDADE_CUSTOS.especializacao) return;
    setHabilidades((prev) => [
      ...prev,
      {
        tipo: 'especializacao',
        id: esp.id,
        nome: `Especialista: ${esp.nome}`,
        categoria: esp.categoria,
        custo: HABILIDADE_CUSTOS.especializacao,
      },
    ]);
  };

  const addPassiva = (p) => {
    if (has(p.id) || pontosDisponiveis < p.custo) return;
    setHabilidades((prev) => [
      ...prev,
      { tipo: 'passiva_extra', id: p.id, nome: p.nome, desc: p.desc, efeito: p.efeito, custo: p.custo },
    ]);
  };

  const remove = (id) => setHabilidades((prev) => prev.filter((h) => h.id !== id));

  return (
    <div className="stack">
      <p className="muted small">
        Sobraram <strong>{pontosDisponiveis}</strong> ponto(s) de atributo? Gaste-os aqui em
        habilidades especiais. Idiomas custam {HABILIDADE_CUSTOS.idioma} ponto, especialização em
        arma {HABILIDADE_CUSTOS.especializacao} e passivas extras {HABILIDADE_CUSTOS.passiva_extra}.
      </p>

      <h4>🗣️ Idiomas ({HABILIDADE_CUSTOS.idioma} pt)</h4>
      <div className="ability-grid">
        {IDIOMAS.map((l) => (
          <button key={l.id} type="button" className="ability-chip" onClick={() => addIdioma(l)} disabled={has(l.id) || pontosDisponiveis < HABILIDADE_CUSTOS.idioma}>
            + {l.nome}
          </button>
        ))}
      </div>

      <h4>⚔️ Especialização em arma ({HABILIDADE_CUSTOS.especializacao} pt)</h4>
      <div className="ability-grid">
        {ESPECIALIZACOES_ARMAS.map((e) => (
          <button key={e.id} type="button" className="ability-chip" title={e.desc} onClick={() => addEspecializacao(e)} disabled={has(e.id) || pontosDisponiveis < HABILIDADE_CUSTOS.especializacao}>
            + {e.nome}
          </button>
        ))}
      </div>

      <h4>✨ Passivas extras ({HABILIDADE_CUSTOS.passiva_extra} pt)</h4>
      <div className="ability-grid">
        {PASSIVAS_EXTRAS.map((p) => (
          <button key={p.id} type="button" className="ability-chip" title={p.desc} onClick={() => addPassiva(p)} disabled={has(p.id) || pontosDisponiveis < p.custo}>
            + {p.nome} — {p.desc}
          </button>
        ))}
      </div>

      <div className="chosen-list">
        {habilidades.map((h) => (
          <div className="chosen-chip" key={h.id}>
            <strong>{h.nome}</strong>
            <span className="tag">{h.custo} pt</span>
            {h.desc && <span className="muted small">{h.desc}</span>}
            <button className="ghost remove-x" onClick={() => remove(h.id)}>✕</button>
          </div>
        ))}
        {habilidades.length === 0 && (
          <p className="muted">Nenhuma habilidade extra comprada.</p>
        )}
      </div>
    </div>
  );
}

function Summary({ name, gender, races, classes, passiva, skills, ultimate, especial, equipment, habilidades, stats }) {
  const raceBonus = raceBonusTotal(races);
  const classBonus = classBonusTotal(classes);
  const g = GENDER_OPTIONS.find((x) => x.id === gender);
  return (
    <div className="stack summary">
      <h3>{name || 'Sem nome'} {g ? <span className="gender-icon">{g.icon}</span> : ''}</h3>
      <p>
        <strong>Gênero:</strong> {g ? g.nome : '—'}
      </p>
      <p>
        <strong>Raças:</strong>{' '}
        {races.map((r) => `${r.nome}${'escolha' in (r.bonus || {}) ? ` (+1 ${ATTRIBUTE_NAMES[r.choice || 'forca']})` : ''}`).join(' + ') || '—'}
      </p>
      <p>
        <strong>Classes:</strong>{' '}
        {classes.map((c) => `${c.nome}${c.primary ? ' ★' : ''}`).join(' + ') || '—'}
      </p>
      <p className="muted small">
        Bônus raciais efetivos (BR):{' '}
        {ATTRIBUTES.filter((k) => raceBonus[k]).map((k) => `${ATTRIBUTE_NAMES[k]} ${sinal(raceBonus[k])}`).join(' · ') || 'nenhum'}
      </p>
      <p className="muted small">
        Bônus de classe (BC):{' '}
        {ATTRIBUTES.filter((k) => classBonus[k]).map((k) => `${ATTRIBUTE_NAMES[k]} ${sinal(classBonus[k])}`).join(' · ') || 'nenhum'}
      </p>
      {passiva && <p><strong>Passiva:</strong> {passiva}</p>}
      {habilidades.length > 0 && (
        <p className="muted small">
          Habilidades extras: {habilidades.map((h) => `${h.nome} (${h.custo}pt)`).join(', ')}
        </p>
      )}
      {skills.length > 0 && (
        <p className="muted small">Golpes próprios: {skills.map((s) => s.nome).join(', ')}</p>
      )}
      {ultimate && <p><strong>Ultimate:</strong> {ultimate.nome} ({resumoPoder(ultimate)}) {ultimate.modo ? `· ${ultimate.modo.turnos}t +${ultimate.modo.danoMultPct}%` : ''}</p>}
      {especial && <p><strong>Especial:</strong> {especial.nome} ({resumoPoder(especial)})</p>}
      {armasDeEquipamento(equipment).map(({ slot, arma }) => (
        <p className="muted small" key={slot}>
          {ARMA_CATEGORIA_INFO[slot].icon} {arma.nome}
          {arma.usosMax ? ` (${arma.usosMax} usos)` : ''}
          {arma.recarga > 0 ? ` (recarga ${arma.recarga})` : ''}
        </p>
      ))}
      {equipment.armadura && <p className="muted small">🛡️ {equipment.armadura.nome}</p>}
      {equipment.acessorio && <p className="muted small">💍 {equipment.acessorio.nome}</p>}
      <div className="form-meta">
        <span>Vida: <strong>{stats.hpMax}</strong></span>
        <span>Mana: <strong>{stats.mpMax}</strong></span>
        <span>Dano: <strong>{stats.dano}</strong></span>
      </div>
    </div>
  );
}
