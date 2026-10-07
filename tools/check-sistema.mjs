// Teste manual rápido (não faz parte da suíte): exercita voo, horda e XP.
// Uso: node tools/check-sistema.mjs
import { BattleManager } from '../server/src/game/battleManager.js';
import { MONSTERS } from '../server/src/game/monsters.js';
import { estadoEclipse } from '../server/src/game/eclipse.js';
import { manaMaxFrom, manaRecuperada, distribuirXp, danoFisicoAtaque, danoFisicoGolpe, danoMagico, curaMagica, DANO_MULT } from '../server/src/game/sistema.js';
import { montarEncontro, DUNGEONS } from '../server/src/game/dungeons.js';

const log = (...a) => console.log(...a);

log('── Mana ──');
log('INT 10, +0 bônus  =>', manaMaxFrom(10, 10), '(esperado 100)');
log('INT 10, +6 bônus  =>', manaMaxFrom(10, 16), '(esperado 160)');
log('recuperação 5/10/15/20/30 =>', [5, 10, 15, 20, 30].map(manaRecuperada).join(', '), '(esperado 3,5,8,10,15)');

log('\n── Dano (provisório — escala ×10, igual vida/mana) ──');
log('FOR 12 + arma 7           =>', danoFisicoAtaque(12, 7), '(esperado 190)');
log('FOR 10, golpe 200% (×1.5) =>', danoFisicoGolpe(10, 200), '(esperado 300)');
log('FOR 10, mega 250% (×2.2)  =>', danoFisicoGolpe(10, 250, 1, 2.2), '(esperado 550)');
log('INT 10, magia 240% (×1.4) =>', danoMagico(10, 240), '(esperado 336)');
log('INT 10, cura 200% (×1.4)   =>', curaMagica(10, 200), '(esperado 280)');
log('defesa de armadura 6      =>', 6 * DANO_MULT, '(esperado 60)');

log('\n── Eclipse ──');
for (const dia of [1, 25, 28, 30, 31]) {
  const e = estadoEclipse(dia);
  log(`dia ${dia} (ciclo ${e.diaNoCiclo}) → ${e.nome} | xp x${e.xpMult} mon x${e.monstroMult} chefe x${e.chefeMult}`);
}

log('\n── Dungeons ──');
for (const d of DUNGEONS) {
  const enc = montarEncontro(d.id, { nivelJogadores: 5, dia: 30 });
  log(`${d.nome}: ${enc.participantes.length} participantes (${enc.participantes.map((p) => p.charName + ' ' + p.hpMax + 'hp').join(' | ')}) xp=${enc.recompensas.xp}`);
}

log('\n── Voo e alcance vertical ──');
const manager = new BattleManager({ emit: () => {}, saveBattle: () => {}, onBattleEnd: () => {} });
const battle = manager.createBattle({
  name: 'Teste',
  mode: 'mestre',
  host: 'p1',
  hostName: 'Mestre',
  role: 'mestre',
  calendario: { dia: 30, tipoEclipse: 'comum' },
});
manager.joinBattle({
  battleId: battle.id,
  playerId: 'p2',
  playerName: 'Heroico',
  character: {
    id: 'c1',
    name: 'Voador',
    race: 'humano',
    level: 5,
    attributes: { forca: 5, inteligencia: 10, resistencia: 6, destreza: 8, reflexos: 7 },
    classes: [{ id: 'mago', nome: 'Mago', primary: true, bonus: { inteligencia: 3 }, hpPerLevel: 6, mpPerLevel: 10, levelUp: 'inteligencia', archetype: 'mago', spellList: [] }],
    races: [{ id: 'humano', nome: 'Humano', bonus: { escolha: 1 }, efeito: { xpMult: 1.1 } }],
    spells: [],
    equipment: { arma: { id: 'espada_curta', nome: 'Espada Curta', danoBase: 4 } },
    inventory: [],
  },
});
manager.addMonster({ battleId: battle.id, hostId: 'p1', monsterDef: MONSTERS.morcego_gigante });
manager.addMonster({ battleId: battle.id, hostId: 'p1', monsterDef: MONSTERS.horda_goblins });
manager.startBattle({ battleId: battle.id, playerId: 'p1' });

const hero = battle.participants.find((p) => !p.isMonster);
const morcego = battle.participants.find((p) => p.monsterId === 'morcego_gigante');
const horda = battle.participants.find((p) => p.monsterId === 'horda_goblins');
log(`hero: hp ${hero.hpMax} mp ${hero.mpMax} (mana = INT Final x10)`);
log(`morcego: voando=${morcego.voando} altitude=${morcego.altitude}`);
log(`horda: ${horda.horda.quantidade} corpos, hp ${horda.hpMax}, xp/unit ${horda.xpPorUnidade}`);

// Decola (aguarda o turno do herói)
function noTurnoDoHero(fn) {
  let guard = 30;
  while (guard-- > 0) {
    const cur = manager._current(battle);
    if (!cur) return false;
    if (!cur.isMonster) {
      fn(cur);
      return true;
    }
    manager.handleAction({
      battleId: battle.id,
      characterId: cur.characterId,
      playerId: 'p1',
      action: { type: 'defend' },
    });
  }
  return false;
}

noTurnoDoHero(() => {
  manager.handleAction({ battleId: battle.id, characterId: hero.characterId, playerId: 'p2', action: { type: 'voo', dir: 'subir' } });
  log('após decolar:', hero.voando ? `voando alt=${hero.altitude} tipo=${hero.vooTipo} mp=${hero.mp}` : 'não voou');
  noTurnoDoHero(() => {});
  manager.handleAction({ battleId: battle.id, characterId: hero.characterId, playerId: 'p2', action: { type: 'voo', dir: 'subir' } });
  log('após subir:', hero.voando ? `alt=${hero.altitude} mp=${hero.mp}` : 'aterrissou');
});

// Dano em horda: o pool é hpPorUnidade × qtd; os corpos caem quando o HP
// cruza o limite de hpPorUnidade (aqui 702 = 520 × eclipse 1.35).
// A horda está em defesa => 1600 ÷ 2 = 800 cruza 1 limite => 1 abatido.
log('\nhorda antes:', horda.horda.quantidade, 'corpos');
manager._applyDamage(horda, 1600, battle, hero, 'physical');
log('após 1600 de dano:', horda.horda.quantidade, 'corpos, hp', horda.hp, '/', horda.hpMax, '| kills do herói:', hero.kills);

log('\n── XP por participação ──');
const fake = [
  { uid: 'a', alive: true, kills: 5, contribuicao: { dano: 900, cura: 0, acertos: 30, acoes: 20, suporte: 0 } },
  { uid: 'b', alive: true, kills: 1, contribuicao: { dano: 120, cura: 0, acertos: 6, acoes: 8, suporte: 0 } },
  { uid: 'c', alive: false, kills: 0, contribuicao: { dano: 30, cura: 0, acertos: 2, acoes: 3, suporte: 0 } },
];
log(JSON.stringify(distribuirXp(fake, 1000).map((d) => ({ uid: d.uid, xp: d.xpGained, share: `${Math.round(d.share * 100)}%` }))));

log('\n── Últimas linhas do log da batalha ──');
battle.log.slice(-8).forEach((l) => log(' ', l.text));