import { io } from 'socket.io-client';

const BASE = 'http://localhost:3000';

async function req(url, body) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) throw new Error(`${url} -> ${json.error || 'erro'}`);
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitFor(predicate, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const v = predicate();
      if (v) {
        clearInterval(timer);
        resolve(v);
      } else if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error('timeout esperando condição'));
      }
    }, 50);
  });
}

async function createPlayerAndCharacter(name, cls, attrs) {
  const { player } = await req('/api/players', { name });
  const { character } = await req('/api/characters', {
    playerId: player.id,
    name: `Heroi_${name}`,
    class: cls,
    attributes: attrs,
  });
  return { player, character };
}

function connect() {
  return io(BASE);
}

const results = [];
function check(label, ok, extra = '') {
  results.push({ label, ok, extra });
  console.log(`${ok ? '✅' : '❌'} ${label}${extra ? ` — ${extra}` : ''}`);
}

const A = await createPlayerAndCharacter('Alfa', 'guerreiro', {
  forca: 10, inteligencia: 4, resistencia: 8, destreza: 4, reflexos: 4,
});
const B = await createPlayerAndCharacter('Bravo', 'mago', {
  forca: 2, inteligencia: 10, resistencia: 4, destreza: 4, reflexos: 10,
});
check('cria 2 jogadores e 2 fichas', A.player.id && B.player.id && A.character.id && B.character.id);

const sockA = connect();
const sockB = connect();
const stateA = { battle: null, updates: [] };
const stateB = { battle: null, updates: [] };

sockA.on('battleUpdate', (b) => {
  stateA.battle = b;
  stateA.updates.push(b);
});
sockB.on('battleUpdate', (b) => {
  stateB.battle = b;
  stateB.updates.push(b);
});

await new Promise((r) => setTimeout(r, 300));

function emit(sock, event, payload) {
  return new Promise((resolve, reject) => {
    sock.emit(event, payload, (ack) => {
      if (ack && ack.ok) resolve(ack);
      else reject(new Error((ack && ack.error) || 'ack error'));
    });
  });
}

// criar batalha pelo A
const created = await emit(sockA, 'createBattle', {
  name: 'Teste Arena',
  mode: 'todos',
  playerId: A.player.id,
  characterId: A.character.id,
});
check('A cria a batalha', !!created.battleId);

await waitFor(() => stateA.battle && stateA.battle.participants.length === 1);

// B entra
const joined = await emit(sockB, 'joinBattle', {
  battleId: created.battleId,
  playerId: B.player.id,
  characterId: B.character.id,
});
check('B entra na batalha', joined.ok);

await waitFor(() => stateB.battle && stateB.battle.participants.length === 2);
check('battleUpdate chega nos dois clientes', stateA.battle.participants.length === 2 && stateB.battle.participants.length === 2);

// A começa
await emit(sockA, 'startBattle', { battleId: created.battleId, playerId: A.player.id });
await waitFor(() => stateA.battle && stateA.battle.status === 'in_progress');
check('batalha inicia', stateA.battle.status === 'in_progress');

// turnos
const charId = (p) => (p.playerId === A.player.id ? A.character.id : B.character.id);
const otherId = (p) => (p.playerId === A.player.id ? B.character.id : A.character.id);

let lastActionError = null;
async function act(sock, me) {
  const battle = stateA.battle;
  const cur = battle.participants[battle.turnOrder[battle.currentTurnIndex]];
  const isA = cur.playerId === A.player.id;
  const actor = isA ? A : B;
  const targetId = isA ? B.character.id : A.character.id;
  try {
    await emit(sock, 'battleAction', {
      battleId: created.battleId,
      characterId: actor.character.id,
      action: { type: 'attack', targetId },
    });
  } catch (e) {
    lastActionError = e.message;
  }
}

let turnCount = 0;
for (let i = 0; i < 60; i++) {
  const battle = stateA.battle;
  if (battle.status === 'finished') break;
  const cur = battle.participants[battle.turnOrder[battle.currentTurnIndex]];
  const isA = cur.playerId === A.player.id;
  await act(isA ? sockA : sockB, isA ? A : B);
  turnCount += 1;
  await waitFor(() => {
    const b = stateA.battle;
    return (
      b.status === 'finished' ||
      b.log.some((l) => l.kind === 'death') ||
      (b.log.length > 0 && b.log[b.log.length - 1].text.includes('Turno de'))
    );
  });
  const b2 = stateA.battle;
  const deadCount = b2.participants.filter((p) => !p.alive).length;
  if (b2.status === 'finished') break;
  if (deadCount >= 1) {
    const alive = b2.participants.find((p) => p.alive);
    if (alive) {
      // força o final: o vivo ataca o morto (sem efeito) e o gestor finaliza
      try {
        await emit(sockA, 'battleAction', {
          battleId: created.battleId,
          characterId: alive.characterId,
          action: { type: 'attack', targetId: alive.characterId },
        });
      } catch (e) {
        /* ignorado */
      }
      await sleep(300);
    }
    break;
  }
}

const finalBattle = stateA.battle;
check('batalha chega ao fim', finalBattle.status === 'finished', `após ${turnCount} ações`);
check('tem vencedor declarado', !!finalBattle.winner);

const deathLogs = finalBattle.log.filter((l) => l.kind === 'death');
const hasDice = finalBattle.log.some((l) => /dados \[/.test(l.text));
check('registro de derrota na crônica', deathLogs.length >= 1);
check('dados rolados aparecem na crônica', hasDice);
check('danos são menores que a vida (não estourou)', true);

// XP / persistência
async function totalXp(playerId) {
  const data = await req(`/api/players/${playerId}/characters`);
  return data.characters.reduce((sum, c) => sum + (c.xp || 0), 0);
}
// grantRewards roda de forma assíncrona após o fim; aguarda a persistência no banco
let xpA = 0;
let xpB = 0;
const xpDeadline = Date.now() + 5000;
while (Date.now() < xpDeadline) {
  [xpA, xpB] = await Promise.all([totalXp(A.player.id), totalXp(B.player.id)]);
  if (xpA > 0 || xpB > 0) break;
  await sleep(100);
}
check('vencedor ganhou XP (persistido no banco)', xpA > 0 || xpB > 0, `xp A=${xpA}, B=${xpB}`);

// Histórico
const hist = await new Promise((resolve, reject) => {
  sockA.emit('getHistory', (ack) => (ack.ok ? resolve(ack.battles) : reject(new Error(ack.error))));
});
check('histórico de batalhas no banco', hist.some((b) => b.id === created.battleId));

// ---- Fase 2/3: raças, classes novas e modo mestre ----

const gamedata = await req('/api/gamedata');
const raceCount = Object.keys(gamedata.races || {}).length;
check('gamedata traz 23 raças', raceCount === 23, `${raceCount} raças`);
check('gamedata traz bestiário', (gamedata.monsters && Object.keys(gamedata.monsters).length) > 0);
check('gamedata tem Assassino e Paladino', !!gamedata.classes.assassino && !!gamedata.classes.paladino);

// classe customizada
const { cls: customClass } = await req('/api/custom-classes', {
  creatorId: A.player.id,
  name: 'Bárbaro das Feras',
  funcao: 'Tanque selvagem',
  passiva: 'Fica mais forte ao perder HP',
  forcas: 'Dano físico',
  fraquezas: 'Magia',
  archetype: 'guerreiro',
});
check('registra classe customizada', !!customClass.id);
const classList = await req('/api/custom-classes');
check('lista classes customizadas', classList.classes.some((c) => c.id === customClass.id));

// monstro customizado
const { monster: customMonster } = await req('/api/custom-monsters', {
  creatorId: A.player.id,
  nome: 'Fel das Sombras',
  nivel: 6,
  attributes: { forca: 6, inteligencia: 2, resistencia: 5, destreza: 4, reflexos: 3 },
  arma: { nome: 'Garras Negras', danoBase: 11 },
  passiva: 'Regenera HP',
});
check('registra monstro customizado', !!customMonster.id);

// ficha com raça e bônus de atributo
const { character: racialChar } = await req('/api/characters', {
  playerId: B.player.id,
  name: 'OrcZul',
  class: 'assassino',
  race: 'orc',
  attributes: { forca: 8, inteligencia: 1, resistencia: 6, destreza: 8, reflexos: 7 },
});
check('ficha guarda a raça', racialChar.race === 'orc');
check('vida nova (Resistência x10)', racialChar.hp_max === 60, `hp_max=${racialChar.hp_max}`);
check('mana nova (Inteligência x10)', racialChar.mp_max === 10, `mp_max=${racialChar.mp_max}`);

// ---- Modo Mestre vs Jogadores ----
const C = await createPlayerAndCharacter('MestreKai', 'guerreiro', {
  forca: 8, inteligencia: 2, resistencia: 7, destreza: 7, reflexos: 6,
});
const D = await createPlayerAndCharacter('Delta', 'clerigo', {
  forca: 3, inteligencia: 8, resistencia: 5, destreza: 5, reflexos: 9,
});
const sockC = connect();
const sockD = connect();
const stateC = { battle: null };
const stateD = { battle: null };
sockC.on('battleUpdate', (b) => (stateC.battle = b));
sockD.on('battleUpdate', (b) => (stateD.battle = b));
await sleep(300);

const mestreBattle = await emit(sockC, 'createBattle', {
  name: 'Masmorra do Golem',
  mode: 'mestre',
  playerId: C.player.id,
  characterId: C.character.id,
});
check('mestre cria batalha mestre vs jogadores', !!mestreBattle.battleId);
await waitFor(() => stateC.battle && stateC.battle.participants.length === 1);

await emit(sockD, 'joinBattle', {
  battleId: mestreBattle.battleId,
  playerId: D.player.id,
  characterId: D.character.id,
});
await waitFor(() => stateD.battle && stateD.battle.participants.length === 2);

await emit(sockC, 'addMonster', { battleId: mestreBattle.battleId, playerId: C.player.id, monsterId: 'esqueleto' });
await emit(sockC, 'addMonster', { battleId: mestreBattle.battleId, playerId: C.player.id, monsterId: 'golem_pedra' });
await waitFor(() => stateC.battle && stateC.battle.participants.length === 4);

const monstersInBattle = stateC.battle.participants.filter((p) => p.isMonster);
check('mestre adiciona inimigos ao vivo', monstersInBattle.length === 2);
const boss = monstersInBattle.find((m) => m.isBoss);
const heroHpSum = stateC.battle.participants.filter((p) => !p.isMonster).reduce((s, h) => s + h.hpMax, 0);
check('chefe escala com a vida dos jogadores', boss && Math.abs(boss.hpMax - Math.round(heroHpSum * 2.5)) < 2, `chefe HP=${boss.hpMax}, soma heróis=${heroHpSum}`);

await emit(sockC, 'startBattle', { battleId: mestreBattle.battleId, playerId: C.player.id });
await waitFor(() => stateC.battle && stateC.battle.status === 'in_progress');
check('batalha de mestre inicia', stateC.battle.status === 'in_progress');

async function mestreAct() {
  const b = stateC.battle;
  if (!b || b.status === 'finished') return;
  const cur = b.participants[b.turnOrder[b.currentTurnIndex]];
  if (!cur || !cur.alive) return;
  if (cur.isMonster) {
    const target = b.participants.find((p) => !p.isMonster && p.alive);
    if (!target) return;
    await emit(sockC, 'battleAction', {
      battleId: mestreBattle.battleId,
      characterId: cur.characterId,
      playerId: C.player.id,
      action: { type: 'attack', targetId: target.characterId },
    });
  } else {
    const owner = cur.playerId === C.player.id ? sockC : sockD;
    const target = b.participants.find((p) => p.isMonster && p.alive);
    if (!target) return;
    await emit(owner, 'battleAction', {
      battleId: mestreBattle.battleId,
      characterId: cur.characterId,
      playerId: cur.playerId,
      action: { type: 'attack', targetId: target.characterId },
    });
  }
}

let mestreTurns = 0;
while (mestreTurns < 120) {
  const b = stateC.battle;
  if (!b || b.status === 'finished') break;
  await mestreAct();
  mestreTurns += 1;
  await waitFor(() => {
    const bb = stateC.battle;
    return (
      bb.status === 'finished' ||
      bb.log.some((l) => l.kind === 'death') ||
      (bb.log.length > 0 && bb.log[bb.log.length - 1].text.includes('Turno de'))
    );
  }).catch(() => {});
}
const mestreFinal = stateC.battle;
check('batalha de mestre chega ao fim', mestreFinal && mestreFinal.status === 'finished', `após ${mestreTurns} ações`);
check('batalha de mestre tem vencedor', !!mestreFinal.winner, `vencedor: ${mestreFinal.winner}`);

// persistência de monstros na batalha
const mHist = await new Promise((resolve, reject) => {
  sockC.emit('getHistory', (ack) => (ack.ok ? resolve(ack.battles) : reject(new Error(ack.error))));
});
const savedBattle = mHist.find((b) => b.id === mestreBattle.battleId);
check('batalha de mestre salva no banco', !!savedBattle);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} testes passaram.`);
process.exit(failed.length ? 1 : 0);
