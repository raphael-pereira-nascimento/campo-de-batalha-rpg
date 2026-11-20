import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ATTRIBUTE_NAMES } from '../config.js';
import {
  danoFisicoAtaque,
  danoFisicoGolpe,
  danoBaseDaArma,
  danoMagico,
  curaMagica,
  alvoNormalizado,
  ARMAS_SLOTS,
  ARMA_CATEGORIA_INFO,
  categoriaDeArma,
  SUPERAQUECIMENTO,
  FUMACA,
  armaDeFogo,
  calorDoDisparo,
  calorEstado,
  fumacaDoDisparo,
  fumacaMiraPenalidade,
  fumacaCamuflagemBonus,
  fumacaEstado,
  rajadaDaArma,
  NIVEIS_DIFICULDADE_D20,
  nivelDificuldadeD20,
  dificuldadeDoGolpe,
  exigenciaD20,
} from '../game/sistema.js';
import { MONSTERS } from '../game/monsters.js';
import { SPELLS, STATUS_DEFS, EQUIPMENT, armasDeEquipamento, skillFromSpell, penalidadesEquipamento } from '../game/data.js';
import { danoDeStatus, normalizarChance } from '../game/combatEffects.js';
import { golpesDisponiveis } from '../game/skillValidation.js';

// Catálogo de armas para o painel de Arsenais: armas gerais + peças de artilharia.
const CATALOGO_ARMAS = { ...EQUIPMENT.armas, ...EQUIPMENT.canoes };

// 💣 Canhões = 8 peças de artilharia + 5 modelos utilitários. O grupo
// "artilharia" continua sendo apenas filtro (D-62), nunca um slot.
const CANHOES_IDS = new Set(Object.keys(EQUIPMENT.canoes || {}));
const ehCanhao = (arma) => !!arma && (
  CANHOES_IDS.has(arma.id)
  || (arma.categoria === 'utilitaria' && arma.tipo === 'arma_fogo')
  || /canhão/i.test(arma.nome || '')
);


// Recarga efetiva de uma arma (canhões usam `recargaTurnos`; dados antigos usam `recarga`).
const recargaDeArma = (arma) => Math.max(0, Number(arma?.recargaTurnos ?? arma?.recarga ?? 0) || 0);
const armaUsaRecarga = (arma) =>
  !!arma && (arma.categoria === 'utilitaria' || Number(arma.usosMax) > 0 || recargaDeArma(arma) > 0);

const BUFF_DEBUFF_PRESETS = [
  { id: 'forca_up', name: 'Força+', icon: '💪', type: 'buff', stat: 'forca', value: 2 },
  { id: 'forca_down', name: 'Fraqueza', icon: '🦐', type: 'debuff', stat: 'forca', value: -2 },
  { id: 'vel_up', name: 'Acelerar', icon: '⚡', type: 'buff', stat: 'destreza', value: 3 },
  { id: 'vel_down', name: 'Desacelerar', icon: '🐌', type: 'debuff', stat: 'destreza', value: -3 },
  { id: 'ref_up', name: 'Escudo', icon: '🛡️', type: 'buff', stat: 'reflexos', value: 2 },
  { id: 'ref_down', name: 'Vulnerável', icon: '💔', type: 'debuff', stat: 'reflexos', value: -2 },
  { id: 'regen', name: 'Regenerar', icon: '💚', type: 'buff', stat: 'regen', value: 3 },
  { id: 'veneno', name: 'Veneno', icon: '☠️', type: 'debuff', stat: 'poison', value: 3 },
  { id: 'int_up', name: 'Foco', icon: '🧠', type: 'buff', stat: 'inteligencia', value: 2 },
  { id: 'res_up', name: 'Aura', icon: '✨', type: 'buff', stat: 'resistencia', value: 2 },
];

const STAT_OPTIONS = ['forca', 'inteligencia', 'resistencia', 'destreza', 'reflexos'];
const STAT_SHORT = { forca: 'FOR', inteligencia: 'INT', resistencia: 'RES', destreza: 'VEL', reflexos: 'REF' };
const ICON_SUGGESTIONS = ['🔥', '❄️', '⚡', '💀', '🌿', '🌙', '⭐', '🗡️', '🔮', '🧪', '👁️', '🩸'];

// Chefes com mecânica de proteção: só recebem dano direto após quebrar a proteção.
// A proteção fica vulnerável por N turnos antes de recarregar.
// eclipseOnly: só tem proteção na forma Eclipse.
// eclipseExtra: tem proteção nas duas formas, mas ganha HP extra no Eclipse.
const PROTECTION_CHEFS = {
  minhoca_broca: { baseHp: 180, vulnerableTurns: 3, rechargeTurns: 2, eclipseOnly: true },
  jabuti_montanha: { baseHp: 220, vulnerableTurns: 3, rechargeTurns: 2, eclipseExtra: true },
  dragao_obsidiana: { baseHp: 260, vulnerableTurns: 3, rechargeTurns: 2, eclipseExtra: true },
};

function makeProtection(cfg, eclipse = false) {
  if (cfg.eclipseOnly && !eclipse) return null;
  const hp = eclipse ? Math.round(cfg.baseHp * 1.5) : cfg.baseHp;
  return {
    hp, maxHp: hp,
    state: 'active', // active | vulnerable | recharging
    vulnerableTurnsLeft: 0,
    rechargeTurnsLeft: 0,
  };
}

// Aplica dano a um combatente respeitando a proteção do chefe.
// Retorna { danoReal, protecaoDano, protecaoQuebrou, vulneravel, msg, protection }.
// Não muta o combatente: `protection` já vem como o novo objeto (ou null quando
// a proteção não mudou), evitando descontar o dano da proteção duas vezes.
function applyDamageWithProtection(target, dmg) {
  const prot = target.protection;
  if (!prot) {
    return { danoReal: dmg, protecaoDano: 0, protecaoQuebrou: false, vulneravel: false, msg: '', protection: null };
  }

  if (prot.state === 'active') {
    // Dano vai para a proteção.
    const absorvido = Math.min(dmg, prot.hp);
    const novoHp = prot.hp - absorvido;
    const quebrou = novoHp <= 0;
    if (quebrou) {
      const vulneravelTurns = PROTECTION_CHEFS[target._bossId]?.vulnerableTurns ?? 3;
      return {
        danoReal: 0, protecaoDano: absorvido, protecaoQuebrou: true, vulneravel: true,
        msg: `🛡️ A proteção de ${target.name} se QUEBROU! Ficará vulnerável por ${vulneravelTurns} turno(s).`,
        protection: { ...prot, hp: 0, state: 'vulnerable', vulnerableTurnsLeft: vulneravelTurns, rechargeTurnsLeft: 0 },
      };
    }
    return {
      danoReal: 0, protecaoDano: absorvido, protecaoQuebrou: false, vulneravel: false,
      msg: `🛡️ ${target.name} absorveu ${absorvido} dano na proteção (${novoHp}/${prot.maxHp}).`,
      protection: { ...prot, hp: novoHp },
    };
  }

  if (prot.state === 'vulnerable') {
    // Dano direto ao chefe.
    return { danoReal: dmg, protecaoDano: 0, protecaoQuebrou: false, vulneravel: true, msg: '', protection: null };
  }

  // recharging: proteção não está disponível ainda, dano direto ao chefe.
  return { danoReal: dmg, protecaoDano: 0, protecaoQuebrou: false, vulneravel: false, msg: '', protection: null };
}

// Aplica o resultado de `applyDamageWithProtection` a um combatente do estado.
function aplicarDanoAoCombatente(f, res) {
  return {
    ...f,
    hp: Math.max(0, f.hp - res.danoReal),
    protection: res.protection ?? f.protection,
  };
}

// Avança os contadores de proteção de todos os lutadores no início de cada turno.
function processProtectionTick(fighters) {
  let changed = false;
  const next = fighters.map((f) => {
    const prot = f.protection;
    if (!prot) return f;
    let novo = prot;
    if (prot.state === 'vulnerable') {
      changed = true;
      const restante = prot.vulnerableTurnsLeft - 1;
      novo = restante <= 0
        ? {
          ...prot,
          state: 'recharging',
          vulnerableTurnsLeft: 0,
          rechargeTurnsLeft: PROTECTION_CHEFS[f._bossId]?.rechargeTurns ?? 2,
        }
        : { ...prot, vulnerableTurnsLeft: restante };
    } else if (prot.state === 'recharging') {
      changed = true;
      const restante = prot.rechargeTurnsLeft - 1;
      novo = restante <= 0
        ? { ...prot, state: 'active', rechargeTurnsLeft: 0, hp: prot.maxHp }
        : { ...prot, rechargeTurnsLeft: restante };
    }
    return novo === prot ? f : { ...f, protection: novo };
  });
  return changed ? next : fighters;
}

let _nextId = 1;
const uid = () => `tb_${_nextId++}`;

// Um item só entra na lista de uso em combate se tiver algum efeito real.
function itemTemEfeito(it) {
  if (!it || it.tipo === 'equipamento') return false;
  return !!(
    it.cura || it.mana || it.status || it.removeStatus
    || it.buffFisico || it.buffMagico || it.drunk
  );
}

// Normaliza um golpe personalizado da ficha para o formato de combate da mesa.
// `poder` das fichas já é percentual (100 = golpe comum).
function normalizarGolpeDeFicha(s = {}) {
  const tipos = ['fisico', 'magia', 'cura', 'buff', 'defesa'];
  return {
    id: String(s.id || s.nome || 'golpe'),
    nome: String(s.nome || 'Golpe'),
    tipo: tipos.includes(s.tipo) ? s.tipo : 'magia',
    poder: Math.max(1, Math.round(Number(s.poder) || 100)),
    custo: Math.max(0, Number(s.custo) || 0),
    cooldown: Math.max(0, Number(s.cooldown) || 0),
    todos: !!s.todos,
    afetaAliados: !!s.afetaAliados,
    buffTipo: s.buffTipo === 'fisico' || s.buffTipo === 'magico' ? s.buffTipo : null,
    duracao: s.duracao ? Math.max(1, Math.round(Number(s.duracao))) : 3,
    alvo: s.alvo || null,
    alvos: s.alvos || null,
    splash: s.splash ?? null,
    danoMult: s.danoMult ?? null,
    status: s.status || null,
    elemento: s.elemento || null,
    desc: s.desc || '',
  };
}

// Converte um status de golpe/arma (STATUS_DEFS) num efeito de mesa com
// dano/cura por rodada. Usa `danoDeStatus` do combate principal para honrar
// `danoPctVidaMaxima` (Podridão/Ferida Pandemônica) e não inventa dano padrão.
function statusParaEfeito(status, alvo = {}) {
  if (!status || !status.tipo || !STATUS_DEFS[status.tipo]) return null;
  const def = STATUS_DEFS[status.tipo];
  const valor = Math.max(0, Math.round(danoDeStatus(status, {
    hpMaxOriginal: alvo.hpMaxOriginal ?? alvo.hpMax,
    hpMax: alvo.hpMax,
  }) || 0));
  const reducaoCuraPct = status.reducaoCuraPct
    ?? status.reducaoPotenciaCuraProtecao
    ?? def.reducaoCuraPct
    ?? def.reducaoPotenciaCuraProtecao
    ?? null;
  return {
    uid: uid(),
    name: def.nome || status.tipo,
    icon: def.icon || '✦',
    stat: 'custom',
    statusId: status.tipo,
    dot: def.tipo === 'dot' ? valor : 0,
    hot: def.tipo === 'hot' ? valor : 0,
    value: valor,
    danoPctVidaMaxima: status.danoPctVidaMaxima
      ?? status.percentualDanoVidaMaxima
      ?? def.danoPctVidaMaxima
      ?? null,
    // Contaminação/Ferida Pandemônica reduzem a cura recebida (igual ao motor).
    reducaoCuraPct: reducaoCuraPct == null ? null : Math.max(0, Number(reducaoCuraPct) || 0),
    duration: Math.max(1, Math.trunc(
      Number(status.turnos) || Number(def.duracaoPadrao) || 1,
    )),
    type: def.tipo === 'hot' ? 'buff' : 'debuff',
  };
}

// Aplicação central de status: mesma chance, critério "somente crítico" e
// regra "efeito idêntico renova, não acumula" do `_applyStatus` do motor.
function aplicarStatusMesa(f, status, opcoes = {}) {
  const efeitos = f?.statusEffects || [];
  if (!f || !status || !STATUS_DEFS[status.tipo]) return { statusEffects: efeitos, efeito: null };
  if (status.somenteCritico === true && opcoes.crit !== true) {
    return { statusEffects: efeitos, efeito: null };
  }
  const chance = normalizarChance(status.chance, 1);
  if (chance < 1 && Math.random() > chance) return { statusEffects: efeitos, efeito: null };
  const efeito = statusParaEfeito(status, f);
  if (!efeito) return { statusEffects: efeitos, efeito: null };
  const idx = efeitos.findIndex((e) => e.statusId === efeito.statusId);
  if (idx < 0) return { statusEffects: [...efeitos, efeito], efeito };
  const atual = efeitos[idx];
  const renovado = {
    ...atual,
    duration: Math.max(Number(atual.duration) || 0, efeito.duration),
    dot: Math.max(Number(atual.dot) || 0, efeito.dot),
    hot: Math.max(Number(atual.hot) || 0, efeito.hot),
    value: Math.max(Number(atual.value) || 0, efeito.value),
    reducaoCuraPct: efeito.reducaoCuraPct == null
      ? atual.reducaoCuraPct : Math.max(Number(atual.reducaoCuraPct) || 0, efeito.reducaoCuraPct),
  };
  const statusEffects = efeitos.map((e, i) => (i === idx ? renovado : e));
  return { statusEffects, efeito: renovado };
}

// Bônus percentual de dano (buffs) por eixo. Compatível com efeitos manuais.
function temStatus(f, id) {
  return (f?.statusEffects || []).some((e) => e.statusId === id);
}

// Debuffs de controle do motor: cegueira/lentidão reduzem acerto (e lentidão
// também esquiva); fraqueza reduz o dano em 20%.
function penalidadesDeStatus(f) {
  const out = { acc: 0, dodge: 0, danoMult: 1 };
  for (const e of f?.statusEffects || []) {
    if (e.statusId === 'cegueira') out.acc += 0.25;
    if (e.statusId === 'lentidao') {
      out.acc += 0.1;
      out.dodge += 0.1;
    }
    if (e.statusId === 'fraqueza') out.danoMult *= 0.8;
  }
  return out;
}

function multiplicadorDano(f, tipo) {
  let pct = 0;
  for (const e of f?.statusEffects || []) {
    const v = Number(e.value) || 0;
    if (e.stat === 'dano') pct += v;
    else if (tipo === 'fisico' && e.stat === 'danoFisico') pct += v;
    else if (tipo === 'magia' && e.stat === 'danoMagico') pct += v;
  }
  return (1 + pct / 100) * penalidadesDeStatus(f).danoMult;
}

// Camadas de defesa do combate principal: defesa total reduce pela metade,
// reduções percentuais por efeito e, por fim, a defesa numérica da armadura.
// `stat: 'defesa'` é mantido como legado percentual de efeitos antigos da mesa.
function danoComDefesa(alvo, danoBruto, tipo, ignoraDefesaPct = 0) {
  const bruto = Math.max(0, Math.round(danoBruto));
  let valor = bruto;
  const defesaTotal = !!alvo?.defense || (alvo?.statusEffects || []).some((e) => e.stat === 'defense');
  if (defesaTotal) valor = Math.round(valor / 2);
  let pct = 0;
  for (const e of alvo?.statusEffects || []) {
    if (e.stat === 'defesa') pct += Math.abs(Number(e.value) || 0);
    if (tipo === 'fisico' && e.stat === 'reducaoDanoFisico') pct += Math.abs(Number(e.value) || 0);
    if (tipo === 'magia' && e.stat === 'reducaoDanoMagico') pct += Math.abs(Number(e.value) || 0);
  }
  if (pct > 0) valor = Math.round(valor * (1 - Math.min(100, pct) / 100));
  // D-65: canhões que ignoram parte da defesa reduzem a armadura numérica antes
  // de descontá-la, igual ao `_applyDamage` do motor.
  const ignora = Math.min(100, Math.max(0, Number(ignoraDefesaPct) || 0));
  const defesa = Math.max(0, Math.round((Number(alvo?.defesa) || 0) * (1 - ignora / 100)));
  valor = Math.max(0, valor - defesa);
  if (valor === 0 && bruto > 0) valor = Math.max(1, Math.round(bruto * 0.1));
  return valor;
}

// Redução percentual de cura recebida (Contaminação Pandemônica etc.), com o
// mesmo teto de 100% do motor. Sem status, cura integral.
function reducaoDeCuraRecebida(f) {
  let pct = 0;
  for (const e of f?.statusEffects || []) {
    pct += Math.max(0, Number(e.reducaoCuraPct ?? e.reducaoPotenciaCuraProtecao ?? 0) || 0);
  }
  return Math.min(100, pct);
}

// Aplica a redução de cura recebida ao valor bruto, arredondando como o motor.
function curaRecebida(f, quantidade) {
  const bruto = Math.max(0, Number(quantidade) || 0);
  if (bruto <= 0) return 0;
  const reducao = reducaoDeCuraRecebida(f);
  return Math.max(0, Math.round(bruto * (1 - reducao / 100)));
}

// Remove efeitos por id (itens com `removeStatus`), igual ao motor.
function removerStatus(f, ids) {
  const alvos = Array.isArray(ids) ? ids : [ids];
  return (f.statusEffects || []).filter((e) => !alvos.includes(e.statusId));
}

function makeFighter(name, team, attrs = {}, extra = {}) {
  const a = { forca: 5, inteligencia: 5, resistencia: 5, destreza: 5, reflexos: 5, ...attrs };
  const hpMax = 500 + (a.resistencia || 5) * 10;
  const mpMax = (a.inteligencia || 5) * 10;
  return {
    id: uid(), name, team,
    hp: hpMax, hpMax, mp: mpMax, mpMax,
    speed: a.destreza || 5, reflexos: a.reflexos || 5,
    forca: a.forca || 5, inteligencia: a.inteligencia || 5,
    resistencia: a.resistencia || 5, destreza: a.destreza || 5,
    statusEffects: [],
    initiative: null,
    cooldowns: {},
    protection: extra.protection || null,
    equipment: extra.equipment || {},
    spells: extra.spells || [],
    skills: golpesDisponiveis(extra.skills || [], extra.level || 1),
    inventory: extra.inventory || [],
    level: extra.level || 1,
    defense: false,
    defesa: Number(extra.defesa) || 0,
    drunk: false,
    drunkTurns: 0,
    _charId: extra._charId || null,
    ...extra,
    hpMaxOriginal: extra.hpMaxOriginal ?? hpMax,
  };
}

function fighterFromCharacter(c, team) {
  const attrs = c.attributes || {};
  return makeFighter(c.name, team, attrs, {
    equipment: c.equipment || {},
    spells: c.spells || [],
    skills: c.skills || [],
    inventory: c.inventory || [],
    level: c.level || 1,
    _charId: c.id,
  });
}

function effectiveStat(fighter, stat) {
  let base = fighter[stat] || 0;
  // Bêbado: +1 FOR, -1 DES, -1 REF (mesmo ajuste das rolagens do motor).
  if (fighter?.drunk) {
    if (stat === 'forca') base += 1;
    if (stat === 'destreza') base -= 1;
    if (stat === 'reflexos') base -= 1;
  }
  // D-66: malefícios de equipamento (ex.: −1 DEX/REF do Canhão Bombasta)
  // também valem na mira da mesa, como no motor principal.
  base -= penalidadesEquipamento(fighter?.equipment || {})[stat] || 0;
  for (const e of fighter.statusEffects) {
    if (e.stat === stat) base += e.value;
  }
  return Math.max(0, base);
}

function computeHitChance(attacker, defender, fumacaAtacante = 0, fumacaAlvo = 0, acertoPenalidade = 0) {
  const atkMod = effectiveStat(attacker, 'destreza') + effectiveStat(attacker, 'forca') * 0.3;
  const defMod = effectiveStat(defender, 'reflexos') + effectiveStat(defender, 'resistencia') * 0.2;
  const base = 0.5;
  const delta = (atkMod - defMod) * 0.04;
  // Fumaça: atrapalha a mira de quem está dentro dela e camufla o alvo.
  const fumacaPenal = fumacaMiraPenalidade(fumacaAtacante) + fumacaCamuflagemBonus(fumacaAlvo);
  const atkPenal = penalidadesDeStatus(attacker);
  const defPenal = penalidadesDeStatus(defender);
  return Math.max(0.05, Math.min(0.95,
    base + delta - fumacaPenal - atkPenal.acc - defPenal.dodge - acertoPenalidade,
  ));
}

function computeDamage(attacker, isCrit, arma = null) {
  // Mesmo sistema do combate principal: (FOR Final + danoBase da arma) × 10.
  const base = danoFisicoAtaque(effectiveStat(attacker, 'forca'), danoBaseDaArma(arma));
  const buff = multiplicadorDano(attacker, 'fisico');
  return Math.max(1, Math.round(base * (isCrit ? 2 : 1) * buff));
}

export default function TableBattle({ onBack, characters = [], gameData }) {
  const rollTimers = useRef(new Set());
  useEffect(() => () => {
    for (const timer of rollTimers.current) clearInterval(timer);
    rollTimers.current.clear();
  }, []);
  const [fighters, setFighters] = useState([]);
  const [round, setRound] = useState(1);
  const [initiativeOrder, setInitiativeOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [initiativeRolled, setInitiativeRolled] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('ally');
  const [newAttrs, setNewAttrs] = useState({ forca: 5, inteligencia: 5, resistencia: 5, destreza: 5, reflexos: 5 });

  const [atkAttacker, setAtkAttacker] = useState('');
  const [atkDefender, setAtkDefender] = useState('');
const [lastRoll, setLastRoll] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [diceFaces, setDiceFaces] = useState(20);
  const [diceQty, setDiceQty] = useState(1);
  const [diceBonus, setDiceBonus] = useState(0);
  const [diceRolls, setDiceRolls] = useState([]);
  const [diceTotal, setDiceTotal] = useState(null);

  const [buffTarget, setBuffTarget] = useState('');
  const [buffPreset, setBuffPreset] = useState(BUFF_DEBUFF_PRESETS[0].id);
  const [buffDuration, setBuffDuration] = useState(3);

  const [customBuffs, setCustomBuffs] = useState([]);
  const [customDebuffs, setCustomDebuffs] = useState([]);
  const [cbName, setCbName] = useState('');
  const [cbStat, setCbStat] = useState('forca');
  const [cbValue, setCbValue] = useState(2);
  const [cbIcon, setCbIcon] = useState('🔥');
  const [importTeam, setImportTeam] = useState('ally');
  const [bossId, setBossId] = useState('');
  const [bossEclipse, setBossEclipse] = useState(false);

  // Estados das ações rápidas (espelham o painel do Campo de Batalha)
  const [actionMode, setActionMode] = useState('attack'); // attack | spell | item
  const [actAttacker, setActAttacker] = useState('');
  const [actTargets, setActTargets] = useState([]);
  const [selWeaponId, setSelWeaponId] = useState('');
  const [selSpellId, setSelSpellId] = useState('');
  const [selItemId, setSelItemId] = useState('');

  // Painel dedicado de artilharia (🧰), espelhando o Campo de Batalha.
  const [canhaoAtirador, setCanhaoAtirador] = useState('');
  const [canhaoId, setCanhaoId] = useState('');
  const [canhaoAlvos, setCanhaoAlvos] = useState([]);

  // Controle de recarga e usos de armas utilitárias (canhões etc.)
  // wpnRecarga[armaId] = turnos restantes até poder usar novamente
  // wpnUsos[armaId] = usos restantes antes de precisar recarregar
  const [wpnRecarga, setWpnRecarga] = useState({});
  const [wpnUsos, setWpnUsos] = useState({});

  // Superaquecimento e fumaça (por lutador e por arma).
  // wpnCalor[fid][armaId] = calor acumulado (0..SUPERAQUECIMENTO.calorMax)
  // wpnSuperaquecido[fid][armaId] = rodadas restantes de travamento
  // wpnDisparou[fid][armaId] = disparou nesta rodada? (para esfriar/fumegar)
  // fumaca[fid] = nuvem ao redor do lutador (0..FUMACA.max)
  const [wpnCalor, setWpnCalor] = useState({});
  const [wpnSuperaquecido, setWpnSuperaquecido] = useState({});
  const [wpnDisparou, setWpnDisparou] = useState({});
  const [fumaca, setFumaca] = useState({});

  const [log, setLog] = useState([]);

  const allies = useMemo(() => fighters.filter((f) => f.team === 'ally'), [fighters]);
  const enemies = useMemo(() => fighters.filter((f) => f.team === 'enemy'), [fighters]);
  const alive = useMemo(() => fighters.filter((f) => f.hp > 0), [fighters]);
  const importedIds = useMemo(() => new Set(fighters.map((f) => f._charId).filter(Boolean)), [fighters]);

  const allPresets = useMemo(() => [
    ...BUFF_DEBUFF_PRESETS,
    ...customBuffs.map((c) => ({ ...c, id: c.uid, type: 'buff' })),
    ...customDebuffs.map((c) => ({ ...c, id: c.uid, type: 'debuff' })),
  ], [customBuffs, customDebuffs]);

  // Lista as armas de um lutador (fallback: desarmado, dano base 2).
  // Retorna objetos de arma (com `slot`), para o código de ataque/UI usar
  // `arma.id`, `arma.nome` etc. diretamente.
  const armasDoLutador = useCallback((f) => {
    if (!f) return [];
    const lista = armasDeEquipamento(f.equipment || {}).map(({ slot, arma }) => ({ ...arma, slot }));
    if (lista.length === 0) {
      lista.push({ id: 'desarmado', nome: 'Desarmado', danoBase: 2, slot: 'perto', categoria: 'perto', recarga: 0 });
    }
    return lista;
  }, []);

  // D-64: artilharia exige atirador + 1 aliado vivo. A mesa não tem papéis de
  // tripulação persistentes: qualquer combatente vivo do mesmo time serve.
  const tripulacaoIncompleta = useCallback((atirador, arma) => {
    const minimo = Number(arma?.tripulacaoMinima) || 0;
    if (minimo <= 1 || !atirador) return false;
    const ajudantes = fighters.filter((f) =>
      f.id !== atirador.id && f.hp > 0 && f.team === atirador.team);
    return ajudantes.length < minimo - 1;
  }, [fighters]);

  // Canhões equipados pelo atirador (8 de artilharia + 5 utilitários).
  const canhoesDoLutador = useCallback(
    (f) => armasDoLutador(f).filter(ehCanhao),
    [armasDoLutador],
  );
  const atiradorCanhao = useMemo(
    () => fighters.find((f) => f.id === canhaoAtirador) || null,
    [fighters, canhaoAtirador],
  );
  const canhaoSelecionado = useMemo(() => (
    atiradorCanhao
      ? canhoesDoLutador(atiradorCanhao).find((a) => a.id === canhaoId) || null
      : null
  ), [atiradorCanhao, canhaoId, canhoesDoLutador]);
  useEffect(() => {
    if (!canhaoAtirador) {
      setCanhaoId('');
      setCanhaoAlvos([]);
      return;
    }
    const atk = fighters.find((f) => f.id === canhaoAtirador);
    const opcoes = canhoesDoLutador(atk);
    if (opcoes.some((a) => a.id === canhaoId)) return;
    const preferida = opcoes.find((a) => CANHOES_IDS.has(a.id)) || opcoes[0];
    setCanhaoId(preferida ? preferida.id : '');
    setCanhaoAlvos([]);
  }, [canhaoAtirador, fighters, canhaoId, canhoesDoLutador]);

  // Estado do painel de artilharia: tripulação, carga, recarga e calor.
  const canhaoTripIncompleta = !!canhaoSelecionado
    && tripulacaoIncompleta(atiradorCanhao, canhaoSelecionado);
  const canhaoRecarga = canhaoAtirador && canhaoSelecionado
    ? Number((wpnRecarga[canhaoAtirador] || {})[canhaoSelecionado.id]) || 0
    : 0;
  const canhaoUsos = canhaoAtirador && canhaoSelecionado
    ? ((wpnUsos[canhaoAtirador] || {})[canhaoSelecionado.id]) ?? canhaoSelecionado.usosMax
    : 0;
  const canhaoTravado = canhaoAtirador && canhaoSelecionado
    ? Number((wpnSuperaquecido[canhaoAtirador] || {})[canhaoSelecionado.id]) || 0
    : 0;
  const canhaoAutoAlvo = !!canhaoSelecionado
    && alvoNormalizado(canhaoSelecionado).tipo === 'area';
  const canhaoBloqueado = !canhaoAtirador || !canhaoSelecionado || canhaoRecarga > 0
    || canhaoTravado > 0 || (!!canhaoSelecionado?.usosMax && canhaoUsos <= 0)
    || (!canhaoAutoAlvo && canhaoAlvos.length === 0);

  // Arma escolhida no painel de ações e se ela está travada por superaquecimento.
  const armaSelecionada = useMemo(() => {
    const atk = fighters.find((f) => f.id === actAttacker);
    return atk ? armasDoLutador(atk).find((a) => a.id === selWeaponId) || null : null;
  }, [fighters, actAttacker, selWeaponId, armasDoLutador]);

  // O seletor visual sempre mostra uma arma, mas o estado começa vazio. Sem
  // isto a barra de calor e o bloqueio por superaquecimento só apareceriam
  // depois de trocar a arma manualmente.
  useEffect(() => {
    if (!actAttacker) {
      if (selWeaponId) setSelWeaponId('');
      return;
    }
    const atk = fighters.find((f) => f.id === actAttacker);
    const armas = armasDoLutador(atk);
    if (armas.some((a) => a.id === selWeaponId)) return;
    const melhor = armas
      .filter((a) => a.categoria !== 'utilitaria')
      .sort((a, b) => (danoBaseDaArma(b) || 0) - (danoBaseDaArma(a) || 0))[0] || armas[0];
    setSelWeaponId(melhor ? melhor.id : '');
  }, [actAttacker, fighters, selWeaponId, armasDoLutador]);

  const armaSelecionadaTravada = !!armaSelecionada
    && (((wpnSuperaquecido[actAttacker] || {})[armaSelecionada.id]) || 0) > 0;
  // Armas de área (ex.: canhões de explosão) escolhem os inimigos sozinhas.
  const armaAutoAlvo = !!armaSelecionada
    && alvoNormalizado(armaSelecionada).tipo === 'area';

  const magiasDoLutador = useCallback((f) => {
    if (!f) return [];
    const out = [];
    const vistos = new Set();
    const push = (chave, spell, skill) => {
      if (!skill) return;
      const nome = skill.nome || spell?.nome || chave;
      const dedupe = String(nome).toLowerCase();
      if (vistos.has(dedupe)) return;
      vistos.add(dedupe);
      out.push({ sid: String(chave), spell: spell || null, skill });
    };
    // Fichas novas guardam ids em `spells`; fichas antigas guardam nomes.
    for (const ref of f.spells || []) {
      if (!ref) continue;
      const spell = SPELLS[ref] || Object.values(SPELLS).find((s) => s.nome === ref);
      if (spell) {
        push(SPELLS[ref] ? ref : spell.nome, spell, skillFromSpell(spell));
        continue;
      }
      const s = (f.skills || []).find((x) => x && (x.id === ref || x.nome === ref));
      if (s) push(ref, null, normalizarGolpeDeFicha(s));
    }
    // Golpes personalizados da ficha.
    for (const s of f.skills || []) {
      if (!s || !s.nome) continue;
      push(s.id || s.nome, null, normalizarGolpeDeFicha(s));
    }
    return out;
  }, []);

  const itensDoLutador = useCallback((f) => {
    if (!f) return [];
    return (f.inventory || []).filter(itemTemEfeito);
  }, []);

  // Magia/golpe selecionado nas Ações Rápidas (para alvos e botão).
  const magiaSelecionada = useMemo(() => {
    const atk = fighters.find((f) => f.id === actAttacker);
    if (!atk) return null;
    return magiasDoLutador(atk).find((x) => x.sid === selSpellId) || null;
  }, [fighters, actAttacker, selSpellId, magiasDoLutador]);
  const magiaSuporte = !!magiaSelecionada
    && ['cura', 'buff', 'defesa'].includes(magiaSelecionada.skill.tipo);
  const magiaEmGrupo = !!magiaSelecionada && (
    (magiaSelecionada.skill.tipo === 'cura' && magiaSelecionada.skill.todos)
    || (['buff', 'defesa'].includes(magiaSelecionada.skill.tipo) && magiaSelecionada.skill.afetaAliados)
  );
  // Magias de dano em área escolhem todos os inimigos sozinhas, sem exigir alvo.
  const magiaAutoAlvo = !!magiaSelecionada
    && !magiaSuporte
    && alvoNormalizado(magiaSelecionada.skill || {}).tipo === 'area';

  // Resolve o modo de alvo de um golpe (unico/area/cone/explosao) e devolve os
  // alvos válidos: somente inimigos vivos, com o alvo principal escolhido
  // primeiro. Em área, todos os inimigos vivos entram automaticamente.
  const alvosDoGolpe = useCallback((attacker, golpe, selecionados = actTargets) => {
    const spec = alvoNormalizado(golpe || {});
    if (!attacker) return { spec, alvos: [] };
    const inimigos = fighters.filter((f) => f.hp > 0 && f.team !== attacker.team);
    const escolhidos = selecionados
      .map((id) => fighters.find((f) => f.id === id))
      .filter((f) => f && f.hp > 0 && f.team !== attacker.team);

    if (spec.tipo === 'area') {
      const alvos = [];
      for (const t of escolhidos) if (!alvos.includes(t)) alvos.push(t);
      for (const t of inimigos) if (!alvos.includes(t)) alvos.push(t);
      return { spec, alvos };
    }

    const max = Math.max(1, spec.max || 1);
    const alvos = [];
    for (const t of escolhidos) {
      if (alvos.length >= max) break;
      if (!alvos.includes(t)) alvos.push(t);
    }
    return { spec, alvos };
  }, [fighters, actTargets]);

  // Alvos de magias de suporte (cura/buff/defesa). Em grupo: todos os aliados
  // vivos + o conjurador. Buff/defesa individual vale só para quem conjurou
  // (como no motor); cura individual pode escolher um aliado.
  const alvosDeSuporte = useCallback((attacker, skill) => {
    if (!attacker) return [];
    const aliadosVivos = fighters.filter((f) => f.hp > 0 && f.team === attacker.team);
    // O motor usa `todos` só para cura e `afetaAliados` só para buff/defesa.
    if (skill?.tipo === 'cura' && skill?.todos) return aliadosVivos;
    if ((skill?.tipo === 'buff' || skill?.tipo === 'defesa') && skill?.afetaAliados) return aliadosVivos;
    if (skill?.tipo === 'buff' || skill?.tipo === 'defesa') return [attacker];
    const escolhidos = actTargets
      .map((id) => fighters.find((f) => f.id === id))
      .filter((f) => f && f.hp > 0 && f.team === attacker.team);
    return escolhidos.length ? [escolhidos[0]] : [attacker];
  }, [fighters, actTargets]);

  const addLog = useCallback((text) => {
    setLog((prev) => [...prev.slice(-50), { id: Date.now() + Math.random(), text, round }]);
  }, [round]);

  const adjustHp = useCallback((id, delta) => {
    setFighters((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const hp = Math.max(0, Math.min(f.hpMax, f.hp + delta));
      return { ...f, hp };
    }));
  }, []);

  const adjustMp = useCallback((id, delta) => {
    setFighters((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const mp = Math.max(0, Math.min(f.mpMax, f.mp + delta));
      return { ...f, mp };
    }));
  }, []);

  const setHp = useCallback((id, val) => {
    setFighters((prev) => prev.map((f) => f.id === id ? { ...f, hp: Math.max(0, Math.min(f.hpMax, Number(val) || 0)) } : f));
  }, []);

  const setMp = useCallback((id, val) => {
    setFighters((prev) => prev.map((f) => f.id === id ? { ...f, mp: Math.max(0, Math.min(f.mpMax, Number(val) || 0)) } : f));
  }, []);

  const initWpnState = useCallback((f) => {
    const armas = armasDoLutador(f);
    const usos = {};
    const recarga = {};
    for (const arma of armas) {
      if (arma.usosMax) usos[arma.id] = arma.usosMax;
      if (armaUsaRecarga(arma)) recarga[arma.id] = 0;
    }
    return { usos, recarga };
  }, [armasDoLutador]);

  // Equipa uma arma/canhão no slot escolhido. Inicializa usos e recarga do
  // armamento novo (o efeito de inicialização só roda para lutadores novos).
  const equiparArma = useCallback((fighterId, slot, armaId) => {
    const dono = fighters.find((f) => f.id === fighterId);
    const atual = (dono?.equipment?.armas || {})[slot] || null;
    const def = armaId
      ? (CATALOGO_ARMAS[armaId] || (atual?.id === armaId ? atual : null))
      : null;
    // Ids fora do catálogo (armas customizadas/legado) só podem permanecer.
    if (armaId && !def) return;
    // O catálogo é indexado por id; o id entra na arma equipada porque usos e
    // recarga são controlados por ele. A categoria da definição é preservada.
    const nova = def ? {
      ...def, id: armaId, categoria: def.categoria || slot,
      ...(categoriaDeArma(def) ? { categoria: categoriaDeArma(def) } : {}),
    } : null;
    setFighters((prev) => prev.map((f) => {
      if (f.id !== fighterId) return f;
      const armas = { ...(f.equipment?.armas || {}), [slot]: nova };
      return { ...f, equipment: { ...(f.equipment || {}), armas } };
    }));
    setWpnUsos((prev) => {
      const mapa = { ...(prev[fighterId] || {}) };
      if (nova) {
        if (nova.usosMax) mapa[nova.id] = nova.usosMax;
        else delete mapa[nova.id];
      }
      return { ...prev, [fighterId]: mapa };
    });
    setWpnRecarga((prev) => {
      const mapa = { ...(prev[fighterId] || {}) };
      if (nova) mapa[nova.id] = armaUsaRecarga(nova) ? 0 : mapa[nova.id] || 0;
      return { ...prev, [fighterId]: mapa };
    });
    if (fighterId === actAttacker) {
      setSelWeaponId(nova ? nova.id : '');
    }
    addLog(nova
      ? `🧰 ${dono?.name || 'Combatente'} equipa ${nova.nome}${nova.usosMax ? ` (${nova.usosMax} uso(s))` : ''}.`
      : `🧰 ${dono?.name || 'Combatente'} fica desarmado no slot ${ARMA_CATEGORIA_INFO[slot]?.nome || slot}.`);
  }, [actAttacker, fighters, addLog]);

  const addFighter = useCallback(() => {
    if (!newName.trim()) return;
    const f = makeFighter(newName.trim(), newTeam, { ...newAttrs });
    setFighters((prevFighters) => [...prevFighters, f]);
    // setState dentro de updater roda duas vezes no StrictMode e duplica a ordem.
    if (initiativeRolled) setInitiativeOrder((prevOrder) => [...prevOrder, f.id]);
    setNewName('');
  }, [newName, newTeam, newAttrs, initiativeRolled]);

  const removeFighter = useCallback((id) => {
    setFighters((prevFighters) => prevFighters.filter((f) => f.id !== id));
    if (!initiativeOrder.includes(id)) return;
    const next = initiativeOrder.filter((fid) => fid !== id);
    const curIdx = initiativeOrder.indexOf(id);
    let newIdx = currentTurnIndex;
    if (curIdx <= currentTurnIndex) newIdx = Math.max(0, currentTurnIndex - 1);
    if (newIdx >= next.length) newIdx = Math.max(0, next.length - 1);
    setInitiativeOrder(next);
    setCurrentTurnIndex(newIdx);
  }, [currentTurnIndex, initiativeOrder]);

  const importCharacter = useCallback((charId) => {
    const c = characters.find((ch) => ch.id === charId);
    if (!c) return;
    const f = { ...fighterFromCharacter(c, importTeam), _charId: charId };
    setFighters((prevFighters) => [...prevFighters, f]);
    if (initiativeRolled) setInitiativeOrder((prevOrder) => [...prevOrder, f.id]);
  }, [characters, importTeam, initiativeRolled]);

  // Inicializa wpnUsos, wpnRecarga, calor, travamento e fumaça para fighters
  // que ainda não têm entrada.
  useEffect(() => {
    const novosUsos = { ...wpnUsos };
    const novosRec = { ...wpnRecarga };
    const novosCalor = { ...wpnCalor };
    const novosSuper = { ...wpnSuperaquecido };
    const novosDisparou = { ...wpnDisparou };
    const novasFumaca = { ...fumaca };
    let mudou = false;
    for (const f of fighters) {
      if (novosUsos[f.id] === undefined || novosRec[f.id] === undefined) {
        const { usos, recarga } = initWpnState(f);
        // Marca o lutador mesmo sem armas de recarga (evita reinicializar
        // indefinidamente e o loop de renders).
        novosUsos[f.id] = usos;
        novosRec[f.id] = recarga;
        mudou = true;
      }
      if (novosCalor[f.id] === undefined) {
        novosCalor[f.id] = {};
        mudou = true;
      }
      if (novosSuper[f.id] === undefined) {
        novosSuper[f.id] = {};
        mudou = true;
      }
      if (novosDisparou[f.id] === undefined) {
        novosDisparou[f.id] = {};
        mudou = true;
      }
      if (novasFumaca[f.id] === undefined) {
        novasFumaca[f.id] = 0;
        mudou = true;
      }
    }
    if (mudou) {
      setWpnUsos(novosUsos);
      setWpnRecarga(novosRec);
      setWpnCalor(novosCalor);
      setWpnSuperaquecido(novosSuper);
      setWpnDisparou(novosDisparou);
      setFumaca(novasFumaca);
    }
  }, [
    fighters, wpnUsos, wpnRecarga, wpnCalor, wpnSuperaquecido, wpnDisparou, fumaca,
    initWpnState,
  ]);

  const bosses = useMemo(
    () => Object.values(MONSTERS)
      .filter((m) => m.tipo === 'chefe')
      .sort((a, b) => (a.nivel || 0) - (b.nivel || 0)),
    [],
  );

  const addBoss = useCallback(() => {
    const def = MONSTERS[bossId];
    if (!def) return;
    const cfg = PROTECTION_CHEFS[def.id];
    const protection = cfg ? makeProtection(cfg, bossEclipse) : null;
    const f = makeFighter(
      `${bossEclipse && def.varianteEclipse ? '🌑 ' : ''}${def.icone || '👑'} ${def.nome}${bossEclipse && def.varianteEclipse ? ` (${def.varianteEclipse.sufixo || 'Eclipse'})` : ''}`,
      'enemy',
      { ...def.attributes },
      { protection, _bossId: def.id, _eclipse: bossEclipse && def.varianteEclipse ? true : null, spells: def.spells || [] }
    );
    setFighters((prevFighters) => [...prevFighters, f]);
    if (initiativeRolled) setInitiativeOrder((prevOrder) => [...prevOrder, f.id]);
    const golpes = (def.spells || []).map((s) => SPELLS[s]?.nome || s).join(', ');
    const protoTxt = protection
      ? ` 🛡️ Proteção: ${protection.hp}/${protection.maxHp} (${bossEclipse ? 'Eclipse' : 'normal'})`
      : '';
    addLog(`👑 ${def.nome} (Nv.${def.nivel}) entra na mesa como inimigo! Passiva: ${def.passiva || '—'}${golpes ? ` Golpes: ${golpes}.` : ''}${protoTxt}`);
    setBossId('');
  }, [bossId, addLog, initiativeRolled, bossEclipse]);

  // Rola iniciativa (D20 + VEL) para todos que ainda não têm e define a ordem de turnos.
  const rollInitiative = useCallback(() => {
    // Usa o estado recém-calculado (não o `fighters` fechado) para a ordem.
    const atualizados = fighters.map((f) => ({
      ...f,
      initiative: f.initiative ?? Math.floor(Math.random() * 20) + 1 + effectiveStat(f, 'destreza'),
    }));
    setFighters(atualizados);
    const order = atualizados
      .filter((f) => f.hp > 0)
      .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))
      .map((f) => f.id);
    setInitiativeOrder(order);
    setCurrentTurnIndex(0);
    setInitiativeRolled(true);
    addLog(`🎯 Iniciativa rolada! Ordem: ${order.map((id) => atualizados.find((f) => f.id === id)?.name).join(' → ')}`);
  }, [fighters, addLog, effectiveStat]);

  const applyBuff = useCallback(() => {
    if (!buffTarget || !buffPreset) return;
    const preset = allPresets.find((b) => b.id === buffPreset);
    if (!preset) return;
    const eff = { ...preset, duration: buffDuration, uid: uid() };
    setFighters((prev) => prev.map((f) => {
      if (f.id !== buffTarget) return f;
      return { ...f, statusEffects: [...f.statusEffects, eff] };
    }));
    const target = fighters.find((f) => f.id === buffTarget);
    addLog(`${preset.icon} ${target?.name} recebe ${preset.name} por ${buffDuration} rodadas`);
  }, [buffTarget, buffPreset, buffDuration, fighters, allPresets, addLog]);

  const addCustomEffect = useCallback((type) => {
    const list = type === 'buff' ? customBuffs : customDebuffs;
    if (list.length >= 3) return;
    if (!cbName.trim()) return;
    const eff = {
      uid: uid(), name: cbName.trim(), icon: cbIcon || '✨',
      stat: cbStat, value: type === 'buff' ? Math.abs(cbValue) : -Math.abs(cbValue),
      type,
    };
    if (type === 'buff') setCustomBuffs((p) => [...p, eff]);
    else setCustomDebuffs((p) => [...p, eff]);
    setCbName('');
  }, [cbName, cbStat, cbValue, cbIcon, customBuffs, customDebuffs]);

  // Valida recarga/usos/superaquecimento e consome o disparo UMA vez, mesmo
  // quando ele erra ou atinge vários alvos. Compartilhado pelas Ações Rápidas
  // e pelo "Ataque com Dado": os dois caminhos precisam pagar o mesmo preço.
  const prepararDisparo = useCallback((attacker, arma) => {
    const usaRecarga = armaUsaRecarga(arma);
    // D-64: sem ajudante o tiro sai, mas custa mais um turno de recarga e -20% de mira.
    const tripIncompleta = tripulacaoIncompleta(attacker, arma);
    if (tripIncompleta && usaRecarga) {
      addLog(`⚙️ ${arma.nome} sem tripulação mínima: −20% de acerto e +1 turno de recarga.`);
    }
    const recargaAtual = ((wpnRecarga[attacker.id] || {})[arma.id]) || 0;
    const usosAtuais = ((wpnUsos[attacker.id] || {})[arma.id]) ?? arma.usosMax ?? 1;
    if (usaRecarga && recargaAtual > 0) {
      addLog(`⏳ ${arma.nome} ainda está recarregando (${recargaAtual} turno(s)).`);
      return false;
    }
    if (usaRecarga && arma.usosMax && usosAtuais <= 0) {
      addLog(`🔫 ${arma.nome} está sem munição.`);
      return false;
    }
    const superaquecimentoAtual = ((wpnSuperaquecido[attacker.id] || {})[arma.id]) || 0;
    if (superaquecimentoAtual > 0) {
      addLog(`🌡️ ${arma.nome} está superaquecida e precisa esfriar (${superaquecimentoAtual} rodada(s)).`);
      return false;
    }

    if (usaRecarga) {
      const recargaTurnos = recargaDeArma(arma) + (tripIncompleta ? 1 : 0);
      if (arma.usosMax) {
        const restante = usosAtuais - 1;
        setWpnUsos((prev) => ({
          ...prev,
          [attacker.id]: { ...(prev[attacker.id] || {}), [arma.id]: restante },
        }));
        if (restante <= 0 && recargaTurnos > 0) {
          setWpnRecarga((prev) => ({
            ...prev,
            [attacker.id]: { ...(prev[attacker.id] || {}), [arma.id]: recargaTurnos + 1 },
          }));
        }
      } else if (recargaTurnos > 0) {
        setWpnRecarga((prev) => ({
          ...prev,
          [attacker.id]: { ...(prev[attacker.id] || {}), [arma.id]: recargaTurnos + 1 },
        }));
      }
    }

    if (armaDeFogo(arma)) {
      const calorAntes = Number((wpnCalor[attacker.id] || {})[arma.id]) || 0;
      const calorDepois = Math.min(
        SUPERAQUECIMENTO.calorMax,
        calorAntes + calorDoDisparo(arma),
      );
      setWpnCalor((prev) => ({
        ...prev,
        [attacker.id]: { ...(prev[attacker.id] || {}), [arma.id]: calorDepois },
      }));
      setWpnDisparou((prev) => ({
        ...prev,
        [attacker.id]: { ...(prev[attacker.id] || {}), [arma.id]: true },
      }));
      if (calorDepois >= SUPERAQUECIMENTO.calorMax) {
        setWpnSuperaquecido((prev) => ({
          ...prev,
          [attacker.id]: {
            ...(prev[attacker.id] || {}),
            [arma.id]: SUPERAQUECIMENTO.bloqueioTurnos + 1,
          },
        }));
        setWpnCalor((prev) => ({
          ...prev,
          [attacker.id]: {
            ...(prev[attacker.id] || {}),
            [arma.id]: SUPERAQUECIMENTO.calorAposBloqueio,
          },
        }));
        addLog(`🔥 ${arma.nome} SUPERAQUECEU! ${attacker.name} precisa deixá-la esfriar por ${SUPERAQUECIMENTO.bloqueioTurnos} rodada(s).`);
      } else if (
        calorAntes < SUPERAQUECIMENTO.limiarAviso &&
        calorDepois >= SUPERAQUECIMENTO.limiarAviso
      ) {
        addLog(`🥵 ${arma.nome} está muito quente (${Math.round(calorDepois)}/${SUPERAQUECIMENTO.calorMax}).`);
      }

      const fumacaAntes = Number(fumaca[attacker.id]) || 0;
      const fumacaDepois = Math.min(
        FUMACA.max,
        fumacaAntes + fumacaDoDisparo(arma, rajadaDaArma(arma)) + (Number(arma.fumacaExtra) || 0),
      );
      setFumaca((prev) => ({ ...prev, [attacker.id]: fumacaDepois }));
      if (fumacaAntes < FUMACA.limiarDenso && fumacaDepois >= FUMACA.limiarDenso) {
        addLog(`🌫️ A fumaça ao redor de ${attacker.name} fica densa (${Math.round(fumacaDepois)}/${FUMACA.max}).`);
      } else if (fumacaAntes < FUMACA.limiarVisivel && fumacaDepois >= FUMACA.limiarVisivel) {
        addLog(`💨 ${attacker.name} some parcialmente numa nuvem de fumaça.`);
      }
    }
    return true;
  }, [wpnRecarga, wpnUsos, wpnSuperaquecido, wpnCalor, fumaca, addLog, tripulacaoIncompleta]);

  // Validações compartilhadas pelas Ações Rápidas e pelo painel de artilharia.
  const podeAgir = useCallback((attacker, atiradorId) => {
    if (!attacker || attacker.hp <= 0) return false;
    if (temStatus(attacker, 'congelamento')) {
      addLog(`🧊 ${attacker.name} está congelado e não pode agir neste turno.`);
      return false;
    }
    // Respeita a ordem de turno quando a iniciativa já foi rolada.
    if (initiativeRolled && initiativeOrder.length > 0) {
      const currentId = initiativeOrder[currentTurnIndex];
      if (atiradorId !== currentId) {
        const current = fighters.find((f) => f.id === currentId);
        addLog(`⛔ Não é a vez de ${attacker.name}. Aguarde a vez de ${current ? current.name : '—'}.`);
        return false;
      }
    }
    return true;
  }, [addLog, fighters, initiativeRolled, initiativeOrder, currentTurnIndex]);

  // Disparo de arma da mesa: usado pelas Ações Rápidas e pelo botão 🧰 de
  // artilharia. Um único caminho consome recarga/usos/calor/fumaça uma vez,
  // inclusive quando o tiro erra ou atinge vários alvos.
  const dispararArmaMesa = useCallback((attacker, arma, alvosForcados = null) => {
    const { spec, alvos } = alvosForcados
      ? { spec: alvoNormalizado(arma), alvos: alvosForcados }
      : alvosDoGolpe(attacker, arma);
    if (alvos.length === 0) {
      addLog(`🎯 ${attacker.name} não encontrou inimigos vivos para atacar.`);
      setActTargets([]);
      return;
    }
    const tripIncompleta = tripulacaoIncompleta(attacker, arma);

    // Recarga/usos/superaquecimento e consumo do disparo (compartilhados com
    // o Ataque com Dado).
    if (!prepararDisparo(attacker, arma)) {
      setActTargets([]);
      return;
    }

    const danoBase = danoFisicoAtaque(effectiveStat(attacker, 'forca'), danoBaseDaArma(arma));
    const buffDano = multiplicadorDano(attacker, 'fisico');
    // D-68: ataque comum = 100% (dif. 0); armas com efeito pesado (ex.:
    // congelamento) aumentam a exigência do d20 no sistema rolar-maior.
    const dificuldade = dificuldadeDoGolpe({
      poder: 100,
      status: arma.efeito ? { turnos: arma.efeito.turnos, dano: arma.efeito.dano } : null,
    });
    const resultados = [];
    const efeitosPorAlvo = new Map();

    // Cada alvo tem sua própria rolagem de acerto, crítico e multiplicador
    // de dano (principal usa `danoMult`; secundários usam `splash`).
    alvos.forEach((alvo, i) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const chance = computeHitChance(
          attacker,
          alvo,
          Number(fumaca[attacker.id]) || 0,
          Number(fumaca[alvo.id]) || 0,
          tripIncompleta ? 0.2 : 0,
        );
        const exigencia = exigenciaD20(chance, dificuldade);
        const nivel = nivelDificuldadeD20(exigencia);
        // D-68: 20 é crítico natural, 1 é falha natural.
        const isCrit = roll === 20;
        const isFail = roll === 1;
        const hit = isCrit || (!isFail && roll >= exigencia);
        const mult = i > 0 ? spec.splash : spec.danoMult;
        const alvoTxt = alvos.length > 1 ? `${alvo.name}${i === 0 ? ' (principal)' : ''}` : alvo.name;
        const difTxt = dificuldade > 0 ? ` · dif. +${dificuldade}` : '';

        if (!hit) {
          addLog(`⚔️ ${attacker.name} erra ${alvoTxt} com ${arma.nome || 'desarmado'} → D20:${roll} · ${nivel?.nome || '—'} (≥${exigencia}${difTxt})`);
          return;
        }

        const bruto = danoBase * (isCrit ? 2 : 1) * mult * buffDano;
        const dmg = danoComDefesa(alvo, bruto, 'fisico', arma?.ignoraDefesaPct || 0);
        const res = applyDamageWithProtection(alvo, dmg);
        resultados.push({ id: alvo.id, res });
        const multTxt = mult < 1 ? ` (${Math.round(mult * 100)}%)` : '';
        const redTxt = dmg < Math.round(bruto) ? ' (defesa)' : '';
        const suffix = res.msg ? ` ${res.msg}` : res.danoReal > 0 ? ` → ${dmg} dano${multTxt}${redTxt}` : '';
        addLog(`⚔️ ${attacker.name} ataca ${alvoTxt} com ${arma.nome || 'desarmado'} → D20:${roll} · ${nivel?.nome || '—'} (≥${exigencia}${difTxt}) ${isCrit ? 'CRÍTICO ' : ''}${suffix}`);
        if (res.protecaoQuebrou) addLog(res.msg);

        // Efeito da arma (ex.: congelamento) só em quem foi atingido e sobreviveu.
        const hpDepois = Math.max(0, alvo.hp - res.danoReal);
        if (arma.efeito && hpDepois > 0) {
          const aplicado = aplicarStatusMesa({ ...alvo, hp: hpDepois }, arma.efeito, { crit: isCrit });
          if (aplicado.efeito) {
            efeitosPorAlvo.set(alvo.id, aplicado.statusEffects);
            addLog(`✨ ${alvo.name} recebe ${aplicado.efeito.name} por ${aplicado.efeito.duration} rodadas`);
          }
        }
      });

    if (resultados.length > 0 || efeitosPorAlvo.size > 0) {
      setFighters((prev) => prev.map((f) => {
        let nf = f;
        const r = resultados.find((x) => x.id === f.id);
        if (r) nf = aplicarDanoAoCombatente(nf, r.res);
        const efeitos = efeitosPorAlvo.get(f.id);
        if (efeitos) nf = { ...nf, statusEffects: efeitos };
        return nf;
      }));
    }
    setActTargets([]);
    setCanhaoAlvos([]);
  }, [alvosDoGolpe, fumaca, addLog, prepararDisparo, tripulacaoIncompleta]);

  // Disparo do painel dedicado de artilharia (🧰).
  const dispararCanhao = useCallback(() => {
    if (!podeAgir(atiradorCanhao, canhaoAtirador) || !canhaoSelecionado) return;
    if (canhaoBloqueado) {
      if (canhaoRecarga > 0) addLog(`⏳ ${canhaoSelecionado.nome} ainda está recarregando (${canhaoRecarga} turno(s)).`);
      else if (canhaoTravado > 0) addLog(`🔥 ${canhaoSelecionado.nome} precisa esfriar (${canhaoTravado} rodada(s)).`);
      else if (!!canhaoSelecionado.usosMax && canhaoUsos <= 0) addLog(`🔫 ${canhaoSelecionado.nome} está sem carga.`);
      else addLog(`🎯 Escolha pelo menos um alvo para ${canhaoSelecionado.nome}.`);
      return;
    }
    const { alvos } = alvosDoGolpe(atiradorCanhao, canhaoSelecionado, canhaoAlvos);
    dispararArmaMesa(atiradorCanhao, canhaoSelecionado, alvos);
  }, [
    podeAgir, atiradorCanhao, canhaoAtirador, canhaoSelecionado, canhaoBloqueado,
    canhaoRecarga, canhaoTravado, canhaoUsos, addLog, alvosDoGolpe, canhaoAlvos,
    dispararArmaMesa,
  ]);

  // Executa uma ação rápida: ataque físico, magia (consome MP) ou item (cura).
  const executarAcao = useCallback(() => {
    const attacker = fighters.find((f) => f.id === actAttacker);
    if (!podeAgir(attacker, actAttacker)) return;

    if (actionMode === 'attack') {
      const armas = armasDoLutador(attacker);
      const arma =
        armas.find((a) => a.id === selWeaponId) ||
        armas
          .filter((a) => a.categoria !== 'utilitaria')
          .sort((a, b) => (danoBaseDaArma(b) || 0) - (danoBaseDaArma(a) || 0))[0] ||
        armas[0];
      dispararArmaMesa(attacker, arma);
      return;
    }

    if (actionMode === 'spell') {
      const m = magiasDoLutador(attacker).find((x) => x.sid === selSpellId);
      if (!m) return;
      const skill = m.skill;
      const custo = skill.custo || 0;
      if ((attacker.mp || 0) < custo) { addLog(`🔮 ${attacker.name} não tem MP suficiente (${custo})`); return; }
      const cd = Number(attacker.cooldowns?.[skill.id]) || 0;
      if (cd > 0) {
        addLog(`⏳ ${skill.nome} está em recarga (${cd} rodada(s)).`);
        return;
      }
      const cooldownsNovos = skill.cooldown > 0
        ? { ...(attacker.cooldowns || {}), [skill.id]: skill.cooldown }
        : attacker.cooldowns;
      const pagarCusto = (f) => (
        f.id === attacker.id
          ? { ...f, mp: Math.max(0, f.mp - custo), cooldowns: cooldownsNovos }
          : f
      );

      // ── Magias de suporte: cura, buff e defesa ──
      if (magiaSuporte) {
        const alvos = alvosDeSuporte(attacker, skill);
        if (alvos.length === 0) {
          addLog(`🎯 ${attacker.name} não encontrou aliados vivos para ${skill.nome}.`);
          return;
        }

        if (skill.tipo === 'cura') {
          const curaBase = Math.max(0, Math.round(
            curaMagica(effectiveStat(attacker, 'inteligencia'), skill.poder),
          ));
          // Cura pode carregar status positivo (ex.: regeneração).
          const efeitoCura = skill.status ? statusParaEfeito(skill.status, attacker) : null;
          setFighters((prev) => prev.map((f) => {
            const nf = pagarCusto(f);
            if (!alvos.some((a) => a.id === nf.id)) return nf;
            const cura = Math.max(0, Math.min(nf.hpMax - nf.hp, curaRecebida(nf, curaBase)));
            const comCura = { ...nf, hp: nf.hp + cura };
            const aplicado = skill.status ? aplicarStatusMesa(comCura, skill.status) : null;
            return aplicado?.efeito
              ? { ...comCura, statusEffects: aplicado.statusEffects }
              : comCura;
          }));
          alvos.forEach((a) => {
            const cura = Math.max(0, Math.min(a.hpMax - a.hp, curaRecebida(a, curaBase)));
            addLog(`💚 ${attacker.name} usa ${skill.nome} em ${a.name}: cura ${cura} de HP (MP ${custo}).`);
            if (efeitoCura) addLog(`✨ ${a.name} recebe ${efeitoCura.name} por ${efeitoCura.duration} rodada(s).`);
          });
          setActTargets([]);
          return;
        }

        const duracao = skill.tipo === 'defesa'
          ? 1
          : Math.max(1, Number(skill.duracao) || 3);
        const valor = skill.tipo === 'defesa'
          ? 1
          : Math.max(1, Number(skill.poder) || 10);
        const stat = skill.tipo === 'defesa'
          ? 'defense' // marcador: dano pela metade, igual ao `p.defense` do motor
          : skill.buffTipo === 'fisico' ? 'danoFisico'
            : skill.buffTipo === 'magico' ? 'danoMagico' : 'dano';
        const icone = skill.tipo === 'defesa'
          ? '🛡️'
          : skill.buffTipo === 'fisico' ? '💪' : skill.buffTipo === 'magico' ? '🔮' : '✨';
        const base = {
          name: skill.nome, icon: icone, stat, value: valor,
          duration: duracao, type: 'buff', skillId: skill.id,
        };
        setFighters((prev) => prev.map((f) => {
          const nf = pagarCusto(f);
          if (!alvos.some((a) => a.id === nf.id)) return nf;
          const efeitos = skill.tipo === 'defesa'
            ? nf.statusEffects.filter((e) => e.skillId !== skill.id)
            : nf.statusEffects;
          return { ...nf, statusEffects: [...efeitos, { ...base, uid: uid() }] };
        }));
        const nomes = alvos.map((a) => a.name).join(', ');
        if (skill.tipo === 'defesa') {
          addLog(`🛡️ ${attacker.name} usa ${skill.nome}: ${nomes} se defendem (dano reduzido pela metade, MP ${custo}).`);
        } else {
          const eixo = skill.buffTipo === 'fisico' ? 'dano físico'
            : skill.buffTipo === 'magico' ? 'dano mágico' : 'dano';
          addLog(`${icone} ${attacker.name} usa ${skill.nome}: ${nomes} ganha +${valor}% ${eixo} por ${duracao} rodada(s) (MP ${custo}).`);
        }
        setActTargets([]);
        return;
      }

      // ── Magias/golpes de dano ──
      const { spec, alvos } = alvosDoGolpe(attacker, skill);
      if (alvos.length === 0) {
        addLog(`🎯 ${attacker.name} não encontrou inimigos vivos para ${skill.nome}.`);
        setActTargets([]);
        return;
      }

      const poder = Math.max(1, Number(skill.poder) || 100);
      const danoBase = skill.tipo === 'fisico'
        ? danoFisicoGolpe(
          effectiveStat(attacker, 'forca'),
          poder,
          multiplicadorDano(attacker, 'fisico'),
        )
        : danoMagico(
          effectiveStat(attacker, 'inteligencia'),
          poder,
          multiplicadorDano(attacker, 'magia'),
        );
      const multi = spec.tipo !== 'unico';
      // Dificuldade do golpe só pesa quando há rolagem de acerto (multi-alvo).
      const dificuldade = multi
        ? dificuldadeDoGolpe({ poder, status: skill.status || null })
        : 0;
      const resultados = [];
      const efeitosPorAlvo = new Map();

      // Magias de alvo único mantêm o comportamento antigo (sem rolagem de
      // acerto). Área/cone/explosão rolam acerto e dano por alvo, com o alvo
      // principal cheio e os secundários reduzidos pelo `splash`.
      alvos.forEach((alvo, i) => {
        const roll = multi ? Math.floor(Math.random() * 20) + 1 : null;
        const chance = multi
          ? computeHitChance(
            attacker,
            alvo,
            Number(fumaca[attacker.id]) || 0,
            Number(fumaca[alvo.id]) || 0,
          )
          : 1;
        const exigencia = multi ? exigenciaD20(chance, dificuldade) : 20;
        const nivel = multi ? nivelDificuldadeD20(exigencia) : null;
        // D-68: 20 é crítico natural, 1 é falha natural.
        const isCrit = multi && roll === 20;
        const isFail = multi && roll === 1;
        const hit = !multi || isCrit || (!isFail && roll >= exigencia);
        const mult = i > 0 ? spec.splash : spec.danoMult;
        const alvoTxt = alvos.length > 1 ? `${alvo.name}${i === 0 ? ' (principal)' : ''}` : alvo.name;
        const difTxt = dificuldade > 0 ? ` · dif. +${dificuldade}` : '';

        if (!hit) {
          addLog(`🔮 ${attacker.name} erra ${skill.nome} em ${alvoTxt} → D20:${roll} · ${nivel?.nome || '—'} (≥${exigencia}${difTxt})${i === 0 ? ` (MP ${custo})` : ''}`);
          return;
        }

        const bruto = danoBase * (isCrit ? 2 : 1) * mult;
        const dmg = danoComDefesa(alvo, bruto, skill.tipo === 'fisico' ? 'fisico' : 'magia');
        const res = applyDamageWithProtection(alvo, dmg);
        resultados.push({ id: alvo.id, res });
        const multTxt = mult < 1 ? ` (${Math.round(mult * 100)}%)` : '';
        const redTxt = dmg < Math.round(bruto) ? ' (defesa)' : '';
        const rollTxt = multi ? ` → D20:${roll} · ${nivel?.nome || '—'} (≥${exigencia}${difTxt})${isCrit ? ' CRÍTICO' : ''}` : '';
        const suffix = res.msg ? ` ${res.msg}` : res.danoReal > 0 ? ` → ${dmg} dano${multTxt}${redTxt}` : '';
        addLog(`🔮 ${attacker.name} lança ${skill.nome} em ${alvoTxt}${rollTxt}${suffix}${i === 0 ? ` (MP ${custo})` : ''}`);
        if (res.protecaoQuebrou) addLog(res.msg);

        // Efeito da magia só em quem foi atingido e sobreviveu.
        const hpDepois = Math.max(0, alvo.hp - res.danoReal);
        if (skill.status && hpDepois > 0) {
          const aplicado = aplicarStatusMesa({ ...alvo, hp: hpDepois }, skill.status, { crit: isCrit });
          if (aplicado.efeito) {
            efeitosPorAlvo.set(alvo.id, aplicado.statusEffects);
            addLog(`✨ ${alvo.name} recebe ${aplicado.efeito.name} por ${aplicado.efeito.duration} rodadas`);
          }
        }
      });

      setFighters((prev) => prev.map((f) => {
        let nf = pagarCusto(f);
        const r = resultados.find((x) => x.id === nf.id);
        if (r) nf = aplicarDanoAoCombatente(nf, r.res);
        const efeitos = efeitosPorAlvo.get(nf.id);
        if (efeitos) nf = { ...nf, statusEffects: efeitos };
        return nf;
      }));
      setActTargets([]);
      return;
    }

    if (actionMode === 'item') {
      const it = itensDoLutador(attacker).find((x) => x.id === selItemId);
      if (!it) return;
      // Itens são aplicados em quem os usa, igual ao `_resolveItem` do motor.
      const alvo = attacker;
      const detalhes = [];
      const buffs = [];
      // Cura de item obedece à redução de cura recebida (Contaminação etc.).
      const curaItem = it.cura ? curaRecebida(alvo, it.cura) : 0;
      if (it.cura) detalhes.push(`+${Math.max(0, Math.min(alvo.hpMax - alvo.hp, curaItem))} HP`);
      if (it.mana) detalhes.push(`+${Math.max(0, Math.min(alvo.mpMax - alvo.mp, it.mana))} MP`);
      const efeitoStatus = it.status ? statusParaEfeito(it.status, alvo) : null;
      if (efeitoStatus) detalhes.push(`${efeitoStatus.name} por ${efeitoStatus.duration} rodada(s)`);
      if (it.removeStatus) detalhes.push('remove efeito(s) nocivo(s)');
      if (it.buffFisico) {
        buffs.push({
          uid: uid(), name: it.nome, icon: '💪', stat: 'danoFisico',
          value: Math.round(it.buffFisico * 100), duration: it.buffTurns || 3, type: 'buff',
        });
        detalhes.push(`+${Math.round(it.buffFisico * 100)}% dano físico`);
      }
      if (it.buffMagico) {
        buffs.push({
          uid: uid(), name: it.nome, icon: '🔮', stat: 'danoMagico',
          value: Math.round(it.buffMagico * 100), duration: it.buffTurns || 3, type: 'buff',
        });
        detalhes.push(`+${Math.round(it.buffMagico * 100)}% dano mágico`);
      }
      if (it.drunk) detalhes.push('fica bêbado');

      setFighters((prev) => prev.map((f) => {
        if (f.id !== attacker.id) return f;
        // Consome UMA cópia: itens iguais ocupam entradas distintas no inventário.
        const idx = (f.inventory || []).findIndex((x) => x.id === it.id);
        let nf = {
          ...f,
          inventory: idx < 0
            ? (f.inventory || [])
            : (f.inventory || []).filter((_, i) => i !== idx),
        };
        let hp = nf.hp;
        let mp = nf.mp;
        if (it.cura) hp = Math.max(0, Math.min(nf.hpMax, hp + curaItem));
        if (it.mana) mp = Math.max(0, Math.min(nf.mpMax, mp + it.mana));
        let statusEffects = it.removeStatus ? removerStatus(nf, it.removeStatus) : nf.statusEffects;
        if (it.status) {
          const aplicado = aplicarStatusMesa({ ...nf, hp, statusEffects }, it.status);
          if (aplicado.efeito) statusEffects = aplicado.statusEffects;
        }
        return {
          ...nf, hp, mp,
          statusEffects: [...statusEffects, ...buffs],
          drunk: it.drunk ? true : nf.drunk,
          drunkTurns: it.drunk
            ? Math.max(nf.drunkTurns || 0, it.drunkTurns || 3)
            : nf.drunkTurns,
        };
      }));
      addLog(`🧪 ${attacker.name} usa ${it.nome}${detalhes.length ? `: ${detalhes.join(', ')}` : ''}.`);
      setSelItemId('');
      setActTargets([]);
      return;
    }
  }, [
    fighters, actAttacker, actTargets, actionMode, selWeaponId, selSpellId, selItemId,
    armasDoLutador, magiasDoLutador, itensDoLutador, alvosDoGolpe, alvosDeSuporte,
    magiaSuporte, addLog, prepararDisparo, podeAgir, dispararArmaMesa,
    tripulacaoIncompleta, fumaca,
  ]);

  const removeCustomEffect = useCallback((type, uid_) => {
    if (type === 'buff') setCustomBuffs((p) => p.filter((e) => e.uid !== uid_));
    else setCustomDebuffs((p) => p.filter((e) => e.uid !== uid_));
  }, []);

  // Processa os efeitos no início da rodada espelhando `_processStatuses` do
  // motor: cada status é aplicado por vez (DOT letal interrompe a cura), a cura
  // passa pela redução recebida e os turnos são decrementados ao final.
  const tickEffects = useCallback(() => {
    const mensagens = new Set();
    setFighters((prev) => prev.map((f0) => {
      let f = { ...f0, statusEffects: [...(f0.statusEffects || [])] };
      for (let i = f.statusEffects.length - 1; i >= 0; i--) {
        const e = { ...f.statusEffects[i] };
        const danoBruto = Math.max(0, Number(e.dot ?? (e.stat === 'poison' ? e.value : 0)) || 0);
        const curaBruta = Math.max(0, Number(e.hot ?? (e.stat === 'regen' ? e.value : 0)) || 0);
        if (f.hp > 0 && danoBruto > 0) {
          const dano = Math.min(f.hp, Math.round(danoBruto));
          f.hp -= dano;
          mensagens.add(`☠️ ${f.name} sofre ${dano} de dano de ${e.name || 'efeito'}`);
        }
        if (f.hp > 0 && curaBruta > 0) {
          const antes = f.hp;
          f.hp = Math.min(f.hpMax, f.hp + curaRecebida(f, curaBruta));
          if (f.hp > antes) mensagens.add(`💚 ${f.name} recupera ${f.hp - antes} HP de ${e.name || 'efeito'}`);
        }
        e.duration = (Number(e.duration) || 0) - 1;
        if (e.duration <= 0) {
          f.statusEffects.splice(i, 1);
          if (e.statusId) mensagens.add(`${e.icon || '✦'} ${e.name} em ${f.name} acabou.`);
        } else {
          f.statusEffects[i] = e;
        }
      }
      // Recargas de golpes diminuem a cada rodada.
      const cooldowns = {};
      for (const [k, v] of Object.entries(f.cooldowns || {})) {
        if (Number(v) > 1) cooldowns[k] = Number(v) - 1;
      }
      const drunkTurns = Math.max(0, (f.drunkTurns || 0) - 1);
      return {
        ...f, cooldowns,
        drunkTurns,
        drunk: drunkTurns > 0 && !!f.drunk,
      };
    }));
    for (const msg of mensagens) addLog(msg);
  }, [addLog]);

  const rollDice = useCallback(() => {
    if (!atkAttacker || !atkDefender) return;
    const attacker = fighters.find((f) => f.id === atkAttacker);
    const defender = fighters.find((f) => f.id === atkDefender);
    if (!attacker || !defender || defender.hp <= 0) return;
    if (temStatus(attacker, 'congelamento')) {
      addLog(`🧊 ${attacker.name} está congelado e não pode atacar neste turno.`);
      return;
    }

    // Respeita a ordem de turno quando a iniciativa já foi rolada.
    if (initiativeRolled && initiativeOrder.length > 0) {
      const currentId = initiativeOrder[currentTurnIndex];
      if (atkAttacker !== currentId) {
        const current = fighters.find((f) => f.id === currentId);
        addLog(`⛔ Não é a vez de ${attacker.name}. Aguarde a vez de ${current ? current.name : '—'}.`);
        return;
      }
    }

    const armas = armasDoLutador(attacker);
    const arma = armas.find((a) => a.id === selWeaponId)
      || armas.filter((a) => a.categoria !== 'utilitaria')
        .sort((a, b) => (danoBaseDaArma(b) || 0) - (danoBaseDaArma(a) || 0))[0]
      || armas[0]
      || null;
    // Mesmo caminho das Ações Rápidas: arma travada/sem munição não dispara,
    // e o tiro consome munição, recarga, calor e fumaça.
    const tripIncompleta = tripulacaoIncompleta(attacker, arma);
    if (arma && !prepararDisparo(attacker, arma)) return;
    setRolling(true);
    setRollResult(null);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setLastRoll(Math.floor(Math.random() * 20) + 1);
      if (step >= 15) {
        clearInterval(interval);
        rollTimers.current.delete(interval);
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        setLastRoll(finalRoll);
        setRolling(false);
        const hitChance = computeHitChance(
          attacker,
          defender,
          Number(fumaca[attacker.id]) || 0,
          Number(fumaca[defender.id]) || 0,
          tripIncompleta ? 0.2 : 0,
        );
        const exigencia = exigenciaD20(hitChance);
        const nivel = nivelDificuldadeD20(exigencia);
        // D-68: 20 é crítico natural, 1 é falha natural.
        const isCrit = finalRoll === 20;
        const isFail = finalRoll === 1;
        const hit = isCrit || (!isFail && finalRoll >= exigencia);
        if (hit) {
          const bruto = computeDamage(attacker, isCrit, arma);
          const dmg = danoComDefesa(defender, bruto, 'fisico', arma?.ignoraDefesaPct || 0);
          const res = applyDamageWithProtection(defender, dmg);
          setFighters((prev) => prev.map((f) => (
            f.id === defender.id ? aplicarDanoAoCombatente(f, res) : f
          )));
          const critText = isCrit ? ' 🎯 CRÍTICO!' : '';
          const suffix = res.msg ? ` ${res.msg}` : res.danoReal > 0 ? ` → ${dmg} dano${isCrit ? ' x2' : ''}` : '';
          addLog(`${attacker.name} ataca ${defender.name} → D20: ${finalRoll} · ${nivel?.nome || '—'} (≥${exigencia}) → ACERTA${critText}${suffix}`);
          if (res.protecaoQuebrou) addLog(res.msg);
          setRollResult({ roll: finalRoll, exigencia, threshold: exigencia, hit: true, isCrit, damage: res.danoReal, nivel });
        } else {
          addLog(`${attacker.name} ataca ${defender.name} → D20: ${finalRoll} · ${nivel?.nome || '—'} (≥${exigencia}) → ERRA`);
          setRollResult({ roll: finalRoll, exigencia, threshold: exigencia, hit: false, isCrit: false, damage: 0, nivel });
        }
      }
    }, 60);
    rollTimers.current.add(interval);
  }, [atkAttacker, atkDefender, fighters, addLog, initiativeRolled, initiativeOrder, currentTurnIndex, fumaca, armasDoLutador, selWeaponId, prepararDisparo, tripulacaoIncompleta]);

  // Fim de rodada: avança a recarga de cada arma e recarrega as utilitárias
  // quando o contador zera (volta ao `usosMax`).
  const processarRecargas = useCallback((somenteId = null) => {
    const recNovo = {};
    const finalizadas = [];
    let mudou = false;
    for (const fid of Object.keys(wpnRecarga)) {
      const mapa = wpnRecarga[fid];
      if (somenteId && fid !== somenteId) {
        recNovo[fid] = mapa;
        continue;
      }
      if (!mapa || typeof mapa !== 'object') {
        recNovo[fid] = mapa;
        continue;
      }
      const armasRec = { ...mapa };
      for (const armaId of Object.keys(armasRec)) {
        if (armasRec[armaId] > 0) {
          armasRec[armaId] -= 1;
          mudou = true;
          if (armasRec[armaId] === 0) finalizadas.push({ fid, armaId });
        }
      }
      recNovo[fid] = armasRec;
    }
    if (mudou) setWpnRecarga(recNovo);
    if (!finalizadas.length) return;
    setWpnUsos((prev) => {
      const next = { ...prev };
      for (const { fid, armaId } of finalizadas) {
        const arma = armasDoLutador(fighters.find((f) => f.id === fid)).find((a) => a.id === armaId);
        if (arma?.usosMax) next[fid] = { ...(next[fid] || {}), [armaId]: arma.usosMax };
      }
      return next;
    });
    for (const { fid, armaId } of finalizadas) {
      const f = fighters.find((x) => x.id === fid);
      const arma = armasDoLutador(f).find((a) => a.id === armaId);
      if (f && arma) addLog(`🔫 ${f.name} recarregou ${arma.nome}.`);
    }
  }, [wpnRecarga, fighters, armasDoLutador, addLog]);

  // Fim de rodada: esfria armas que não dispararam, desconta o travamento do
  // superaquecimento e dissipa a fumaça de quem não atirou. Espelha o
  // `_resfriarArmas` do combate principal, mas em escala de rodada da mesa.
  const processarCalorEFumaca = useCallback((somenteId = null) => {
    const novoCalor = {};
    const novoSuper = {};
    const novaFumaca = { ...fumaca };
    for (const f of fighters) {
      if (somenteId && f.id !== somenteId) {
        novoCalor[f.id] = wpnCalor[f.id] || {};
        novoSuper[f.id] = wpnSuperaquecido[f.id] || {};
        continue;
      }
      const calorMap = { ...(wpnCalor[f.id] || {}) };
      const superMap = { ...(wpnSuperaquecido[f.id] || {}) };
      const disparouMap = wpnDisparou[f.id] || {};

      for (const armaId of Object.keys(calorMap)) {
        if (disparouMap[armaId]) continue;
        calorMap[armaId] = Math.max(
          0,
          (Number(calorMap[armaId]) || 0) - SUPERAQUECIMENTO.resfriamentoPorTurno,
        );
      }

      for (const armaId of Object.keys(superMap)) {
        const restante = Number(superMap[armaId]) || 0;
        if (restante <= 0) {
          delete superMap[armaId];
          continue;
        }
        superMap[armaId] = restante - 1;
        if (superMap[armaId] <= 0) {
          delete superMap[armaId];
          calorMap[armaId] = Math.min(
            Number(calorMap[armaId]) || 0,
            SUPERAQUECIMENTO.calorAposBloqueio,
          );
          const arma = armasDoLutador(f).find((a) => a.id === armaId);
          addLog(`🌡️ ${arma?.nome || armaId} esfriou e voltou a ficar disponível para ${f.name}.`);
        }
      }

      novoCalor[f.id] = calorMap;
      novoSuper[f.id] = superMap;

      const disparou = Object.values(disparouMap).some(Boolean);
      if (!disparou) {
        novaFumaca[f.id] = Math.max(
          0,
          (Number(novaFumaca[f.id]) || 0) - FUMACA.dissipacaoPorTurno,
        );
      }
    }
    setWpnCalor(novoCalor);
    setWpnSuperaquecido(novoSuper);
    setFumaca(novaFumaca);
    const novoDisparou = {};
    for (const f of fighters) {
      novoDisparou[f.id] = somenteId && f.id !== somenteId
        ? (wpnDisparou[f.id] || {}) : {};
    }
    setWpnDisparou(novoDisparou);
  }, [fighters, wpnCalor, wpnSuperaquecido, wpnDisparou, fumaca, armasDoLutador, addLog]);

  const nextTurn = useCallback(() => {
    if (initiativeOrder.length === 0) {
      // Sem iniciativa rolando: comportamento antigo (próxima rodada)
      setFighters((prev) => processProtectionTick(prev));
      tickEffects();
      processarRecargas();
      processarCalorEFumaca();
      setRound((r) => r + 1);
      setRollResult(null);
      addLog(`═══ Rodada ${round + 1} ═══`);
      return;
    }
    const advance = (idx) => {
      // Recarga/calor/fumaça avançam no fim do turno de quem agiu (como no
      // motor), não no fim da rodada inteira.
      const atualId = initiativeOrder[idx];
      if (atualId) {
        processarRecargas(atualId);
        processarCalorEFumaca(atualId);
      }
      const nextIdx = idx + 1;
      if (nextIdx >= initiativeOrder.length) {
        // Fim da rodada: processa efeitos e proteção.
        setFighters((prev) => processProtectionTick(prev));
        tickEffects();
        setRound((r) => r + 1);
        setCurrentTurnIndex(0);
        addLog(`═══ Fim da rodada ${round}. Iniciando rodada ${round + 1} ═══`);
      } else {
        const nextFighter = fighters.find((f) => f.id === initiativeOrder[nextIdx]);
        if (nextFighter && nextFighter.hp <= 0) {
          // Pula combatentes derrotados
          advance(nextIdx);
        } else {
          setCurrentTurnIndex(nextIdx);
        }
      }
      setRollResult(null);
    };
    advance(currentTurnIndex);
  }, [currentTurnIndex, initiativeOrder, round, fighters, tickEffects, processarRecargas, processarCalorEFumaca, addLog]);

  const doRoll = useCallback(() => {
    const faces = Math.max(2, Math.min(100, Number(diceFaces) || 20));
    const qty = Math.max(1, Math.min(5, Number(diceQty) || 1));
    const bonus = Number(diceBonus) || 0;
    setRolling(true);
    setDiceRolls([]);
    setDiceTotal(null);
    let steps = 0;
    const interval = setInterval(() => {
      steps += 1;
      const rolls = Array.from({ length: qty }, () => Math.floor(Math.random() * faces) + 1);
      setDiceRolls(rolls);
      setDiceTotal(rolls.reduce((s, n) => s + n, 0) + bonus);
      if (steps >= 12) {
        clearInterval(interval);
        rollTimers.current.delete(interval);
        setRolling(false);
        const finalRolls = Array.from({ length: qty }, () => Math.floor(Math.random() * faces) + 1);
        const total = finalRolls.reduce((s, n) => s + n, 0) + bonus;
        setDiceRolls(finalRolls);
        setDiceTotal(total);
        addLog(`🎲 Rola ${qty}d${faces}${bonus >= 0 ? '+' + bonus : bonus} → [${finalRolls.join(', ')}] = ${total}`);
      }
    }, 60);
    rollTimers.current.add(interval);
  }, [diceFaces, diceQty, diceBonus, addLog]);

  const renderFighterCard = (f) => {
    const hpPct = f.hpMax > 0 ? (f.hp / f.hpMax) * 100 : 0;
    const mpPct = f.mpMax > 0 ? (f.mp / f.mpMax) * 100 : 0;
    const dead = f.hp <= 0;
    const isTurn = initiativeRolled && initiativeOrder.length > 0 && initiativeOrder[currentTurnIndex] === f.id;
    const turnPos = initiativeRolled ? initiativeOrder.indexOf(f.id) + 1 : null;
    const fumegando = (Number(fumaca[f.id]) || 0) >= FUMACA.limiarVisivel;
    return (
      <div key={f.id} className={`fighter-card ${dead ? 'fighter-dead' : ''} ${isTurn ? 'fighter-turn' : ''} ${fumegando ? 'fumegando' : ''}`}>
        <div className="fighter-card-header">
          <span className="fighter-card-name">{dead && '☠️ '}{f.name}{isTurn ? ' ◀── vez' : ''}</span>
          {turnPos && <span className="turn-pos">#{turnPos}</span>}
          <button className="ghost remove-x" onClick={() => removeFighter(f.id)}>✕</button>
        </div>
        <div className="fighter-card-stats-row">
          {[
            { label: 'INI', val: f.initiative ?? '—' },
            { label: 'VEL', val: effectiveStat(f, 'destreza') },
            { label: 'REF', val: effectiveStat(f, 'reflexos') },
            { label: 'FOR', val: effectiveStat(f, 'forca') },
            { label: 'INT', val: effectiveStat(f, 'inteligencia') },
            { label: 'RES', val: effectiveStat(f, 'resistencia') },
          ].map(({ label, val }) => (
            <span key={label} className={`fighter-card-stat ${label === 'INI' && isTurn ? 'stat-ini-turn' : ''}`}>{label} {val}</span>
          ))}
        </div>
        <div className="fighter-card-bars">
          <div className="fighter-card-bar-row">
            <span className="bar-label">HP</span>
            <div className="stat-bar-wrap">
              <div className="stat-bar stat-bar-hp" style={{ width: `${hpPct}%` }} />
              <input type="number" className="stat-input" value={f.hp} min={0} max={f.hpMax} onChange={(e) => setHp(f.id, e.target.value)} />
              <span className="stat-max">/{f.hpMax}</span>
            </div>
            <div className="stat-btns">
              <button className="stat-btn stat-btn-dmg" onClick={() => { adjustHp(f.id, -1); addLog(`💔 ${f.name} -1 HP`); }}>-1</button>
              <button className="stat-btn stat-btn-dmg" onClick={() => { adjustHp(f.id, -5); addLog(`💥 ${f.name} -5 HP`); }}>-5</button>
              <button className="stat-btn stat-btn-heal" onClick={() => { adjustHp(f.id, 1); addLog(`💚 ${f.name} +1 HP`); }}>+1</button>
              <button className="stat-btn stat-btn-heal" onClick={() => { adjustHp(f.id, 5); addLog(`💚 ${f.name} +5 HP`); }}>+5</button>
            </div>
          </div>
          <div className="fighter-card-bar-row">
            <span className="bar-label">MP</span>
            <div className="stat-bar-wrap">
              <div className="stat-bar stat-bar-mp" style={{ width: `${mpPct}%` }} />
              <input type="number" className="stat-input" value={f.mp} min={0} max={f.mpMax} onChange={(e) => setMp(f.id, e.target.value)} />
              <span className="stat-max">/{f.mpMax}</span>
            </div>
            <div className="stat-btns">
              <button className="stat-btn" onClick={() => adjustMp(f.id, -1)}>-1</button>
              <button className="stat-btn" onClick={() => adjustMp(f.id, -5)}>-5</button>
              <button className="stat-btn" onClick={() => adjustMp(f.id, 1)}>+1</button>
              <button className="stat-btn" onClick={() => adjustMp(f.id, 5)}>+5</button>
            </div>
          </div>
          {f.protection && (
            <div className="fighter-card-bar-row protection-row">
              <span className="bar-label">🛡️ Prot</span>
              <div className="stat-bar-wrap">
                <div className={`stat-bar stat-bar-prot ${f.protection.state === 'vulnerable' ? 'prot-vuln' : ''}`} style={{ width: `${f.protection.maxHp > 0 ? (f.protection.hp / f.protection.maxHp) * 100 : 0}%` }} />
                <span className="stat-num">{f.protection.hp}/{f.protection.maxHp}</span>
              </div>
              <span className={`prot-state ${f.protection.state}`}>
                {f.protection.state === 'active' ? 'ativo'
                  : f.protection.state === 'vulnerable' ? `vulnerável ${f.protection.vulnerableTurnsLeft}t`
                  : `recarregando ${f.protection.rechargeTurnsLeft}t`}
              </span>
            </div>
          )}
          {/* Recarga/usos de armas utilitárias (canhões etc.) */}
          {(() => {
            const armas = armasDoLutador(f);
            const armasUtil = armas.filter((a) => armaUsaRecarga(a) || a.categoria === 'utilitaria');
            if (armasUtil.length === 0) return null;
            const rec = wpnRecarga[f.id] || {};
            const usos = wpnUsos[f.id] || {};
            return (
              <div className="fighter-card-bar-row wpn-row" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #3a2e54' }}>
                {armasUtil.map((arma) => {
                  const r = rec[arma.id] || 0;
                  const u = usos[arma.id] ?? arma.usosMax ?? 0;
                  const emRecarga = r > 0;
                  const contagem = arma.usosMax ? `${u}/${arma.usosMax}` : 'pronta';
                  return (
                    <span key={arma.id} className="wpn-badge" style={{ 
                      background: emRecarga ? '#3a1a2a' : '#1e142c',
                      border: emRecarga ? '1px solid #ff5c8a' : '1px solid #4a90e2',
                      color: emRecarga ? '#ff5c8a' : '#3ddc84',
                    }}>
                      {emRecarga ? '⏳' : '🔫'} {arma.nome}: {emRecarga ? `${r}t` : contagem}
                    </span>
                  );
                })}
              </div>
            );
          })()}
          {/* Calor e fumaça das armas de fogo */}
          {(() => {
            const armasFogo = armasDoLutador(f).filter(armaDeFogo);
            const calorMap = wpnCalor[f.id] || {};
            const superMap = wpnSuperaquecido[f.id] || {};
            const fuma = Number(fumaca[f.id]) || 0;
            const fumaInfo = fumacaEstado(fuma);
            if (armasFogo.length === 0 && fuma <= 0) return null;
            return (
              <div
                className="fighter-card-bar-row wpn-row"
                style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #3a2e54', flexWrap: 'wrap', gap: 6 }}
              >
                {armasFogo.map((arma) => {
                  const cal = Number(calorMap[arma.id]) || 0;
                  const sup = Number(superMap[arma.id]) || 0;
                  const info = calorEstado(cal);
                  return (
                    <span
                      key={arma.id}
                      className={`tag heat-tag heat-${info.nivel}`}
                      title={`Calor de ${arma.nome}: ${Math.round(cal)}/${SUPERAQUECIMENTO.calorMax}${sup > 0 ? ` — travada por ${sup} rodada(s)` : ''}`}
                    >
                      {info.icon} {arma.nome} {Math.round(info.pct)}%{sup > 0 ? ` 🔒${sup}t` : ''}
                    </span>
                  );
                })}
                {fuma > 0 && (
                  <span
                    className={`tag smoke-tag smoke-${fumaInfo.nivel}`}
                    title={`${fumaInfo.nome}: mira −${Math.round(fumaInfo.mira * 100)}% e camuflagem −${Math.round(fumaInfo.camuflagem * 100)}% para ser atingido.`}
                  >
                    🌫️ {Math.round(fumaInfo.pct)}%
                  </span>
                )}
              </div>
            );
          })()}
        </div>
        {f.statusEffects.length > 0 && (
          <div className="fighter-card-effects">
            {f.statusEffects.map((e) => (
              <span key={e.uid} className={`effect-tag ${e.type}`} title={`${e.name} (${e.duration} rodadas)`}>
                {e.icon} {e.duration}
              </span>
            ))}
          </div>
        )}
        {/* Arsenais: um item por slot. Inclui os canhões de artilharia. */}
        <div className="fighter-card-arsenal" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #3a2e54' }}>
          <span className="bar-label">🧰 Arsenal</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 4 }}>
            {ARMAS_SLOTS.map((slot) => {
              const equipada = f.equipment?.armas?.[slot] || null;
              const info = ARMA_CATEGORIA_INFO[slot] || {};
              const opcoes = Object.entries(CATALOGO_ARMAS)
                .filter(([, a]) => categoriaDeArma(a) === slot);
              const foraDoCatalogo = equipada && !opcoes.some(([id]) => id === equipada.id);
              return (
                <label key={slot} className="action-field" style={{ fontSize: 11 }}>
                  <span className="muted">{info.icon} {info.nome || slot}</span>
                  <select
                    value={equipada?.id || ''}
                    onChange={(e) => equiparArma(f.id, slot, e.target.value)}
                  >
                    <option value="">— vazio —</option>
                    {foraDoCatalogo && (
                      <option value={equipada.id}>{equipada.nome} (atual)</option>
                    )}
                    {opcoes.map(([id, a]) => (
                      <option key={id} value={id}>{a.nome}</option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="page">
      <header className="topbar">
        <div className="topbar-left">
          <h1>📋 Batalha de Mesa</h1>
          <span className="player-name">Rodada {round}</span>
          {initiativeRolled && initiativeOrder.length > 0 && (
            <span className="turn-badge">
              🎯 Vez de:{' '}
              <strong>{fighters.find((f) => f.id === initiativeOrder[currentTurnIndex])?.name}</strong>
              {currentTurnIndex + 1}/{initiativeOrder.length}
            </span>
          )}
        </div>
        <div className="topbar-right">
          <button className="ghost" onClick={onBack}>← Voltar</button>
          <button
            onClick={rollInitiative}
            disabled={initiativeRolled || fighters.length === 0}
            className={initiativeRolled ? 'ghost' : ''}
          >
            {initiativeRolled ? '✅ Iniciativa definida' : '🎲 Rolar Iniciativa'}
          </button>
          <button onClick={nextTurn} disabled={fighters.length === 0} className="btn-next-turn">
            ➡️ Próximo Turno
          </button>
        </div>
      </header>

      <div className="table-battle-layout">
        <div className="table-battle-main">

          <section className="panel">
            <h2>🛡️ Aliados</h2>
            <div className="fighter-cards-grid">
              {allies.map(renderFighterCard)}
              {allies.length === 0 && <p className="muted">Nenhum aliado</p>}
            </div>
          </section>

          <section className="panel">
            <h2>⚔️ Inimigos</h2>
            <div className="fighter-cards-grid">
              {enemies.map(renderFighterCard)}
              {enemies.length === 0 && <p className="muted">Nenhum inimigo</p>}
            </div>
          </section>

          <section className="panel">
            <h2>➕ Adicionar Combatente</h2>
            <div className="table-battle-form">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome"
                onKeyDown={(e) => e.key === 'Enter' && addFighter()}
              />
              <select value={newTeam} onChange={(e) => setNewTeam(e.target.value)}>
                <option value="ally">Aliado</option>
                <option value="enemy">Inimigo</option>
              </select>
              {STAT_OPTIONS.map((attr) => (
                <label key={attr} className="attr-mini-label">
                  {STAT_SHORT[attr]}
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newAttrs[attr]}
                    onChange={(e) => setNewAttrs((p) => ({ ...p, [attr]: Math.max(1, Math.min(12, +e.target.value || 1)) }))}
                  />
                </label>
              ))}
              <button onClick={addFighter} disabled={!newName.trim()}>Adicionar</button>
            </div>
          </section>

          <section className="panel">
            <h2>👑 Adicionar Chefão de Bioma</h2>
            <p className="muted small">Entra como inimigo com os atributos do bestiário. Golpes, passiva, especial e ultimate vão para a crônica.</p>
            <div className="table-battle-form">
              <select value={bossId} onChange={(e) => setBossId(e.target.value)}>
                <option value="">Escolha um chefão...</option>
                {bosses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icone || '👑'} {b.nome} (Nv.{b.nivel}){b.bioma ? ` — ${b.bioma}` : ''}
                  </option>
                ))}
              </select>
              <button onClick={addBoss} disabled={!bossId}>Invocar chefão</button>
              {bossId && PROTECTION_CHEFS[bossId] && (
                <label className="check-label inline" style={{ marginLeft: 10 }}>
                  <input
                    type="checkbox"
                    checked={bossEclipse}
                    onChange={(e) => setBossEclipse(e.target.checked)}
                  />
                  🌑 Modo Eclipse (proteção extra)
                </label>
              )}
            </div>
            {bossId && (() => {
              const b = MONSTERS[bossId];
              const cfg = PROTECTION_CHEFS[bossId];
              if (!b) return null;
              const proto = cfg ? makeProtection(cfg, bossEclipse) : null;
              return (
                <div className="muted small" style={{ marginTop: 8 }}>
                  <div><strong>Passiva:</strong> {b.passiva}</div>
                  <div><strong>Golpes:</strong> {(b.spells || []).map((s) => SPELLS[s]?.nome || s).join(' · ')}</div>
                  {(b.especial || b.ultimate) && (
                    <div>
                      {b.especial && <><strong>Especial:</strong> {SPELLS[b.especial]?.nome || b.especial} </>}
                      {b.ultimate && <><strong>Ultimate:</strong> {SPELLS[b.ultimate]?.nome || b.ultimate}</>}
                      {b.varianteEclipse?.spell && (
                        <> · <strong>Eclipse:</strong> {SPELLS[b.varianteEclipse.spell]?.nome || b.varianteEclipse.spell}</>
                      )}
                    </div>
                  )}
                  {proto && (
                    <div style={{ marginTop: 6, padding: 6, background: 'rgba(255, 209, 102, 0.12)', border: '1px solid var(--accent-2)', borderRadius: 8 }}>
                      <strong>🛡️ Proteção do chefe:</strong> {proto.hp}/{proto.maxHp} HP ・
                      vulnerável {cfg.vulnerableTurns}t ・ recarrega {cfg.rechargeTurns}t
                      {bossEclipse ? ' (Eclipse: +50% HP)' : ''}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {characters.length > 0 && (
            <section className="panel">
              <h2>📥 Importar Ficha</h2>              <div className="table-battle-form">
                <select id="import-char-select" defaultValue="">
                  <option value="" disabled>Escolha uma ficha...</option>
                  {characters.filter((c) => !importedIds.has(c.id)).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (Nv.{c.level})</option>
                  ))}
                </select>
                <select value={importTeam} onChange={(e) => setImportTeam(e.target.value)}>
                  <option value="ally">Aliado</option>
                  <option value="enemy">Inimigo</option>
                </select>
                <button
                  onClick={() => {
                    const sel = document.getElementById('import-char-select');
                    if (sel && sel.value) importCharacter(sel.value);
                  }}
                >
                  Importar
                </button>
              </div>
            </section>
          )}

          <section className="panel attack-section">
            <h2>⚔️ Ataque com Dado</h2>
            <div className="attack-panel attack-command">
              <div className="attack-row">
                <div className="attack-field">
                  <label>Atacante</label>
                  <select value={atkAttacker} onChange={(e) => setAtkAttacker(e.target.value)}>
                    <option value="">—</option>
                    {alive.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} (HP {f.hp})</option>
                    ))}
                  </select>
                </div>
                <span className="attack-vs">⚔</span>
                <div className="attack-field">
                  <label>Alvo</label>
                  <select value={atkDefender} onChange={(e) => setAtkDefender(e.target.value)}>
                    <option value="">—</option>
                    {alive.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} (HP {f.hp})</option>
                    ))}
                  </select>
                </div>
              </div>
              {atkAttacker && atkDefender && (
                <div className="attack-info">
                  {(() => {
                    const a = fighters.find((f) => f.id === atkAttacker);
                    const d = fighters.find((f) => f.id === atkDefender);
                    if (!a || !d) return null;
                    const fumacaA = Number(fumaca[a.id]) || 0;
                    const fumacaD = Number(fumaca[d.id]) || 0;
                    const chance = computeHitChance(a, d, fumacaA, fumacaD);
                    const exigencia = exigenciaD20(chance);
                    const penalFumaca = fumacaMiraPenalidade(fumacaA) + fumacaCamuflagemBonus(fumacaD);
                    return (
                      <>
                        <span className="chance-text">Chance: {(chance * 100).toFixed(0)}% (exige {exigencia} ou mais no D20; 20 é crítico, 1 é falha)</span>
                        <span className="modifier-text">VEL: {effectiveStat(a, 'destreza')} vs REF: {effectiveStat(d, 'reflexos')}</span>
                        {penalFumaca > 0 && (
                          <span className="modifier-text smoke-warning">
                            🌫️ Fumaça: −{Math.round(penalFumaca * 100)}% de acerto
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
              <div className="dice-area">
                <button className="dice-btn dice-btn-roll" onClick={rollDice} disabled={rolling || !atkAttacker || !atkDefender}>
                  {rolling ? '🎲...' : '🎲 Rolar D20'}
                </button>
                {lastRoll !== null && !rolling && (
                  <div className={`dice-result ${rollResult?.hit ? (rollResult?.isCrit ? 'crit' : 'hit') : 'miss'}`}>
                    <span className="dice-number">{lastRoll}</span>
                    <span className="dice-label">
                      {rollResult?.isCrit && '🎯 CRÍTICO! '}
                      {rollResult?.hit ? `ACERTA! (${rollResult?.damage} dano)` : 'ERRA!'}
                      {rollResult?.nivel && ` · ${rollResult.nivel.icon} ${rollResult.nivel.nome}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="d20-tiers" title="Faixas de exigência do d20 (D-68, rolar-maior: quanto maior o número, mais difícil a exigência)">
                <span className="d20-tiers-label">🎲 d20</span>
                {NIVEIS_DIFICULDADE_D20.map((t) => (
                  <span key={t.id} className={`d20-tier d20-${t.id}`}>
                    {t.icon} {t.nome} {t.min}–{t.max}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="panel actions-section">
            <h2>🎯 Ações Rápidas (igual ao Campo de Batalha)</h2>
            <div className="attack-panel actions-command">
              {/* Linha 1: Atacante + Modo */}
              <div className="actions-row">
                <div className="action-field">
                  <label>Atacante</label>
                  <select
                    value={actAttacker}
                    onChange={(e) => {
                      setActAttacker(e.target.value);
                      setActTargets([]);
                      // Magia/item do lutador anterior não existem no novo:
                      // sem limpar, o botão fica habilitado e a ação não faz nada.
                      setSelSpellId('');
                      setSelItemId('');
                    }}
                  >
                    <option value="">—</option>
                    {alive.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} (HP {f.hp} MP {f.mp})</option>
                    ))}
                  </select>
                </div>
                <div className="action-field">
                  <label>Modo</label>
                  <select value={actionMode} onChange={(e) => {
                    setActionMode(e.target.value);
                    setSelSpellId('');
                    setSelItemId('');
                    setActTargets([]);
                  }}>
                    <option value="attack">⚔️ Ataque</option>
                    <option value="spell">🔮 Magia</option>
                    <option value="item">🧪 Item</option>
                  </select>
                </div>
              </div>

              {/* Linha 2: Arma / Magia / Item (apenas o relevante) */}
              {actAttacker && actionMode === 'attack' && (
                <div className="actions-row">
                  <div className="action-field">
                    <label>Arma</label>
                    <select value={selWeaponId} onChange={(e) => setSelWeaponId(e.target.value)}>
                      {armasDoLutador(fighters.find((f) => f.id === actAttacker)).map((arma) => {
                        const r = (wpnRecarga[actAttacker] || {})[arma.id] || 0;
                        const u = (wpnUsos[actAttacker] || {})[arma.id] ?? arma.usosMax;
                        const cal = Number((wpnCalor[actAttacker] || {})[arma.id]) || 0;
                        const infoCalor = calorEstado(cal);
                        const travada = (Number((wpnSuperaquecido[actAttacker] || {})[arma.id]) || 0);
                        const emRecarga = r > 0;
                        const semMunicao = !emRecarga && !!arma.usosMax && u <= 0;
                        const contagem = arma.usosMax ? ` — ${u}/${arma.usosMax}` : '';
                        const calorTxt = armaDeFogo(arma) && cal > 0 ? ` — ${infoCalor.icon}${Math.round(infoCalor.pct)}%` : '';
                        return (
                          <option key={arma.id} value={arma.id} disabled={emRecarga || semMunicao || travada > 0}>
                            {arma.categoria === 'utilitaria' ? '🧰 ' : ''}{arma.nome} (dano base {danoBaseDaArma(arma)}){travada > 0 ? ` — 🔥 superaquecida (${travada}t)` : emRecarga ? ` — recarregando ${r}t` : semMunicao ? ' — sem munição' : contagem}{calorTxt}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              {/* Calor e fumaça da arma selecionada (armas de fogo) */}
              {actAttacker && actionMode === 'attack' && armaSelecionada && armaDeFogo(armaSelecionada) && (() => {
                const cal = Number((wpnCalor[actAttacker] || {})[armaSelecionada.id]) || 0;
                const travada = Number((wpnSuperaquecido[actAttacker] || {})[armaSelecionada.id]) || 0;
                const info = calorEstado(cal);
                const fumaAtirador = Number(fumaca[actAttacker]) || 0;
                const fumaInfo = fumacaEstado(fumaAtirador);
                return (
                  <div className={`heat-meter heat-${info.nivel}`}>
                    <div className="heat-meter-head">
                      <span>{info.icon} Calor — {armaSelecionada.nome}</span>
                      <span className={`heat-value ${travada > 0 ? 'overheat-warning' : ''}`}>
                        {Math.round(cal)}/{SUPERAQUECIMENTO.calorMax}{travada > 0 ? ` · travada ${travada}t` : ''}
                      </span>
                    </div>
                    <div className="heat-track">
                      <div className="heat-fill" style={{ width: `${info.pct}%` }} />
                    </div>
                    <div className="heat-hint">
                      +{calorDoDisparo(armaSelecionada)} por disparo · esfria {SUPERAQUECIMENTO.resfriamentoPorTurno}/rodada sem atirar
                      {travada > 0 && ' · ⚠️ troque de arma ou aguarde para esfriar'}
                    </div>
                    {fumaAtirador > 0 && (
                      <div className="heat-hint smoke-warning">
                        🌫️ Fumaça {Math.round(fumaInfo.pct)}% — mira −{Math.round(fumaInfo.mira * 100)}% · camuflagem −{Math.round(fumaInfo.camuflagem * 100)}%
                      </div>
                    )}
                  </div>
                );
              })()}

              {actAttacker && actionMode === 'spell' && (
                <div className="actions-row">
                  <div className="action-field">
                    <label>Magia</label>
                    <select value={selSpellId} onChange={(e) => setSelSpellId(e.target.value)}>
                      <option value="">— Escolha uma magia —</option>
                      {magiasDoLutador(fighters.find((f) => f.id === actAttacker)).map((x) => (
                        <option key={x.sid} value={x.sid}>
                          {x.skill.nome} (MP {x.skill.custo || 0}{x.skill.tipo === 'cura' ? ' · cura' : x.skill.tipo === 'buff' ? ' · buff' : x.skill.tipo === 'defesa' ? ' · defesa' : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {actAttacker && actionMode === 'item' && (
                <div className="actions-row">
                  <div className="action-field">
                    <label>Item</label>
                    <select value={selItemId} onChange={(e) => setSelItemId(e.target.value)}>
                      <option value="">— Escolha um item —</option>
                      {itensDoLutador(fighters.find((f) => f.id === actAttacker)).map((it, idx) => (
                        // Itens repetidos têm o mesmo id: a chave precisa da posição.
                        <option key={`${it.id}-${idx}`} value={it.id}>{it.nome}{it.cura ? ` +${it.cura} HP` : ''}{it.mana ? ` +${it.mana} MP` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Linha 3: Alvo(s) */}
              {actAttacker && (
                <div className="actions-row">
                  <div className="action-field action-field-full">
                    <label>{magiaSuporte ? 'Aliado(s)' : 'Alvo(s)'}</label>
                    <select multiple size={Math.min(4, Math.max(1, alive.length))} value={actTargets} onChange={(e) => {
                      const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                      setActTargets(vals);
                    }}>
                      {alive
                        .filter((f) => f.id !== actAttacker)
                        .filter((f) => (magiaSuporte ? f.team === (fighters.find((a) => a.id === actAttacker)?.team) : true))
                        .map((f) => (
                          <option key={f.id} value={f.id}>{f.team === 'ally' ? '🛡️' : '⚔️'} {f.name} (HP {f.hp})</option>
                        ))}
                      {alive.length <= 1 && <option disabled>Sem outros alvos vivos</option>}
                    </select>
                    <small className="muted">
                      {magiaSuporte
                        ? 'Cura individual: escolha um aliado (ou nenhum para usar em si). Buff/defesa individual vale só para o conjurador; magias de grupo afetam todos os aliados automaticamente.'
                        : 'Segure Ctrl/Cmd para múltiplos alvos. Armas/magias de área, cone e explosão atingem vários inimigos (cada um rola o próprio acerto).'}
                    </small>
                  </div>
                </div>
              )}

              {/* Botão executar */}
              <div className="actions-row actions-row-execute">
                <button
                  className="dice-btn dice-btn-execute"
                  onClick={executarAcao}
                  disabled={
                    !actAttacker
                    || (actionMode === 'attack' && actTargets.length === 0 && !armaAutoAlvo)
                    || (actionMode === 'spell' && !selSpellId)
                    || (actionMode === 'spell' && !magiaSuporte && !magiaEmGrupo && !magiaAutoAlvo && actTargets.length === 0)
                    || (actionMode === 'item' && !selItemId)
                    || (actionMode === 'attack' && armaSelecionadaTravada)
                  }
                >
                  ▶ Executar Ação
                </button>
              </div>
            </div>
          </section>

          <section className="panel actions-section">
            <h2>💣 Artilharia — Canhões (🧰)</h2>
            <p className="muted small">
              Painel de tiro dedicado: peças de artilharia e canhões utilitários usam
              a mesma recarga/carga, tripulação mínima (D-64) e fumaça do Campo de Batalha.
            </p>
            <div className="attack-panel actions-command">
              <div className="actions-row">
                <div className="action-field">
                  <label>Atirador</label>
                  <select value={canhaoAtirador} onChange={(e) => {
                    setCanhaoAtirador(e.target.value);
                    setCanhaoAlvos([]);
                  }}>
                    <option value="">—</option>
                    {alive.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} (HP {f.hp})</option>
                    ))}
                  </select>
                </div>
                <div className="action-field">
                  <label>Peça</label>
                  <select value={canhaoId} onChange={(e) => {
                    setCanhaoId(e.target.value);
                    setCanhaoAlvos([]);
                  }} disabled={!canhaoAtirador}>
                    {!canhaoAtirador && <option value="">Escolha o atirador</option>}
                    {canhaoAtirador && canhoesDoLutador(atiradorCanhao).length === 0 && (
                      <option value="">Nenhum canhão equipado</option>
                    )}
                    {canhoesDoLutador(atiradorCanhao).map((arma) => {
                      const r = Number((wpnRecarga[canhaoAtirador] || {})[arma.id]) || 0;
                      const u = ((wpnUsos[canhaoAtirador] || {})[arma.id]) ?? arma.usosMax;
                      const travada = Number((wpnSuperaquecido[canhaoAtirador] || {})[arma.id]) || 0;
                      const status = travada > 0 ? ` — 🔥 ${travada}t`
                        : r > 0 ? ` — ⏳ ${r}t`
                          : arma.usosMax ? ` — ${u}/${arma.usosMax}` : '';
                      return (
                        <option key={arma.id} value={arma.id} disabled={r > 0 || travada > 0 || (!!arma.usosMax && u <= 0)}>
                          💣 {arma.nome} (dano base {danoBaseDaArma(arma)}){status}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              {canhaoAtirador && (
                <div className="actions-row">
                  <div className="action-field action-field-full">
                    <label>{canhaoAutoAlvo ? 'Alvos (área: todos automaticamente)' : 'Alvo(s)'}</label>
                    <select
                      multiple
                      size={Math.min(4, Math.max(1, alive.length))}
                      value={canhaoAlvos}
                      onChange={(e) => setCanhaoAlvos(Array.from(e.target.selectedOptions).map((o) => o.value))}
                      disabled={canhaoAutoAlvo}
                    >
                      {alive
                        .filter((f) => f.id !== canhaoAtirador && f.team !== atiradorCanhao?.team)
                        .map((f) => (
                          <option key={f.id} value={f.id}>{f.name} (HP {f.hp})</option>
                        ))}
                      {alive.length <= 1 && <option disabled>Sem outros alvos vivos</option>}
                    </select>
                  </div>
                </div>
              )}
              {canhaoSelecionado && (() => {
                const fumacaAtirador = Number(fumaca[canhaoAtirador]) || 0;
                const info = fumacaEstado(fumacaAtirador);
                const alvo = fighters.find((f) => f.id === canhaoAlvos[0]);
                const chance = alvo
                  ? computeHitChance(
                    atiradorCanhao, alvo, fumacaAtirador, Number(fumaca[alvo.id]) || 0,
                    canhaoTripIncompleta ? 0.2 : 0,
                  )
                  : 0.5;
                const dificuldade = dificuldadeDoGolpe({
                  poder: 100,
                  status: canhaoSelecionado.efeito
                    ? { turnos: canhaoSelecionado.efeito.turnos, dano: canhaoSelecionado.efeito.dano }
                    : null,
                });
                return (
                  <div className="attack-info">
                    <span className="chance-text">
                      💣 {canhaoSelecionado.nome} · recarga {recargaDeArma(canhaoSelecionado)}t
                      {canhaoTripIncompleta ? ' + 1t (sem ajudante)' : ''}
                      {canhaoSelecionado.usosMax ? ` · carga ${canhaoUsos}/${canhaoSelecionado.usosMax}` : ''}
                      {canhaoRecarga > 0 ? ` · ⏳ ${canhaoRecarga}t restantes` : ''}
                      {canhaoTripIncompleta ? ' · sem ajudante: −20% de acerto' : ''}
                      {alvo ? ` · exige ${exigenciaD20(chance, dificuldade)} no D20` : ''}
                    </span>
                    {canhaoTripIncompleta && (
                      <span className="modifier-text smoke-warning">
                        ⚙️ Tripulação incompleta (D-64): precisa de 2 vivos no mesmo lado.
                      </span>
                    )}
                    {fumacaAtirador > 0 && (
                      <span className="modifier-text smoke-warning">
                        🌫️ Fumaça {Math.round(info.pct)}% — mira −{Math.round(info.mira * 100)}%
                        {(Number(canhaoSelecionado.fumacaExtra) || 0) > 0 ? ' · +1 por disparo (D-67)' : ''}
                      </span>
                    )}
                  </div>
                );
              })()}
              <div className="actions-row actions-row-execute">
                <button
                  className="dice-btn dice-btn-execute"
                  onClick={dispararCanhao}
                  disabled={canhaoBloqueado}
                  title={canhaoRecarga > 0 ? 'Aguardando recarga' : canhaoTravado > 0 ? 'Superaquecida' : 'Disparar com a peça escolhida'}
                >
                  🧰 Disparar Canhão
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>🎲 Dado de Decisão (fora do combate)</h2>
            <p className="muted small">Use para decidir situações: se um buff/debuff vale, se o ambiente reage, testes de perícia, sorte do Mestre etc.</p>
            <div className="attack-panel">
              <div className="attack-selects">
                <label>
                  Dados
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={diceQty}
                    onChange={(e) => setDiceQty(Math.max(1, Math.min(5, +e.target.value || 1)))}
                  />
                </label>
                <span className="vs-text">d</span>
                <label>
                  Lados
                  <select value={diceFaces} onChange={(e) => setDiceFaces(Number(e.target.value))}>
                    {[2, 4, 6, 8, 10, 12, 20, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label>
                  Bônus
                  <input
                    type="number"
                    min={-10}
                    max={10}
                    value={diceBonus}
                    onChange={(e) => setDiceBonus(Math.max(-10, Math.min(10, +e.target.value || 0)))}
                  />
                </label>
              </div>
              <div className="dice-area">
                <button className="dice-btn" onClick={doRoll} disabled={rolling}>
                  {rolling ? '🎲...' : `🎲 Rolar ${diceQty}d${diceFaces}${diceBonus >= 0 ? '+' + diceBonus : diceBonus}`}
                </button>
                {diceRolls.length > 0 && !rolling && (
                  <div className="dice-result neutral">
                    <span className="dice-number">{diceTotal}</span>
                    <span className="dice-label">[{diceRolls.join(', ')}]{diceBonus ? ` ${diceBonus > 0 ? '+' : ''}${diceBonus}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="panel battle-log-panel">
            <h2>Crônica da Mesa</h2>
            <div className="battle-log">
              {log.map((l) => (
                <div key={l.id} className="log-line log-info">{l.text}</div>
              ))}
            </div>
          </section>
        </div>

        <aside className="table-battle-sidebar">
          <section className="panel">
            <h2>✨ Aplicar Efeito</h2>
            <div className="buff-panel-sidebar">
              <label>
                Combatente
                <select value={buffTarget} onChange={(e) => setBuffTarget(e.target.value)}>
                  <option value="">—</option>
                  {fighters.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Efeito
                <select value={buffPreset} onChange={(e) => setBuffPreset(e.target.value)}>
                  {allPresets.map((b) => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name} ({b.value > 0 ? '+' : ''}{b.value} {STAT_SHORT[b.stat] || b.stat})</option>
                  ))}
                </select>
              </label>
              <label>
                Rodadas
                <input type="number" min={1} max={10} value={buffDuration} onChange={(e) => setBuffDuration(Math.max(1, Math.min(10, +e.target.value || 1)))} />
              </label>
              <button onClick={applyBuff} disabled={!buffTarget}>Aplicar</button>
            </div>
          </section>

          <section className="panel">
            <h2>🔧 Buffs Customizados ({customBuffs.length}/3)</h2>
            <div className="custom-effects-list">
              {customBuffs.map((e) => (
                <div key={e.uid} className="custom-effect-item buff">
                  <span>{e.icon} {e.name} (+{e.value} {STAT_SHORT[e.stat]})</span>
                  <button className="ghost remove-x" onClick={() => removeCustomEffect('buff', e.uid)}>✕</button>
                </div>
              ))}
              {customBuffs.length < 3 && (
                <div className="custom-effect-form">
                  <input value={cbName} onChange={(e) => setCbName(e.target.value)} placeholder="Nome" maxLength={20} />
                  <select value={cbIcon} onChange={(e) => setCbIcon(e.target.value)}>
                    {ICON_SUGGESTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <select value={cbStat} onChange={(e) => setCbStat(e.target.value)}>
                    {STAT_OPTIONS.map((s) => <option key={s} value={s}>{STAT_SHORT[s]}</option>)}
                  </select>
                  <input type="number" min={1} max={10} value={cbValue} onChange={(e) => setCbValue(Math.max(1, Math.min(10, +e.target.value || 1)))} style={{ width: 50 }} />
                  <button onClick={() => addCustomEffect('buff')} disabled={!cbName.trim()}>+</button>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <h2>🔧 Debuffs Customizados ({customDebuffs.length}/3)</h2>
            <div className="custom-effects-list">
              {customDebuffs.map((e) => (
                <div key={e.uid} className="custom-effect-item debuff">
                  <span>{e.icon} {e.name} ({e.value} {STAT_SHORT[e.stat]})</span>
                  <button className="ghost remove-x" onClick={() => removeCustomEffect('debuff', e.uid)}>✕</button>
                </div>
              ))}
              {customDebuffs.length < 3 && (
                <div className="custom-effect-form">
                  <input value={cbName} onChange={(e) => setCbName(e.target.value)} placeholder="Nome" maxLength={20} />
                  <select value={cbIcon} onChange={(e) => setCbIcon(e.target.value)}>
                    {ICON_SUGGESTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <select value={cbStat} onChange={(e) => setCbStat(e.target.value)}>
                    {STAT_OPTIONS.map((s) => <option key={s} value={s}>{STAT_SHORT[s]}</option>)}
                  </select>
                  <input type="number" min={1} max={10} value={cbValue} onChange={(e) => setCbValue(Math.max(1, Math.min(10, +e.target.value || 1)))} style={{ width: 50 }} />
                  <button onClick={() => addCustomEffect('debuff')} disabled={!cbName.trim()}>+</button>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}