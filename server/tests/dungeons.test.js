import { describe, it, expect } from 'vitest';
import {
  DUNGEONS,
  dungeonPorNivel,
  dungeonsDisponiveis,
  dungeonXpTotal,
  montarEncontro,
} from '../src/game/dungeons.js';
import { MONSTERS, buildMonster, monsterXp } from '../src/game/monsters.js';

describe('Dungeons — progressão confirmada pelo criador', () => {
  it('a progressão começa no manequim e termina no Golem de Pedra', () => {
    expect(DUNGEONS[0].ondas.some((o) => o.monstro === 'manequim')).toBe(true);
    expect(DUNGEONS[0].nivelMin).toBe(1);
    const ultimo = DUNGEONS[DUNGEONS.length - 1];
    expect(ultimo.chefe).toBe('golem_pedra');
    // Faixas em ordem e sem sobreposição.
    for (let i = 1; i < DUNGEONS.length; i += 1) {
      expect(DUNGEONS[i].nivelMin).toBeGreaterThan(DUNGEONS[i - 1].nivelMin);
    }
  });

  it('todo monstro citado existe no bestiário', () => {
    for (const d of DUNGEONS) {
      for (const onda of d.ondas) expect(MONSTERS[onda.monstro], onda.monstro).toBeTruthy();
      if (d.subchefe) expect(MONSTERS[d.subchefe], d.subchefe).toBeTruthy();
      if (d.chefe) expect(MONSTERS[d.chefe], d.chefe).toBeTruthy();
    }
  });

  it('dungeonPorNivel devolve a dungeon da faixa', () => {
    expect(dungeonPorNivel(1).id).toBe('sala_treino');
    expect(dungeonPorNivel(7).id).toBe('cripta_ossada');
    expect(dungeonPorNivel(12).id).toBe('panteao_camuflado');
    expect(dungeonPorNivel(50).id).toBe(DUNGEONS[DUNGEONS.length - 1].id);
  });

  it('dungeonsDisponiveis marca as de nível alto como bloqueadas', () => {
    const lista = dungeonsDisponiveis(3);
    const cripta = lista.find((d) => d.id === 'cripta_ossada');
    expect(cripta.bloqueada).toBe(true);
    expect(cripta.motivoBloqueio).toContain('5');
    const treino = lista.find((d) => d.id === 'sala_treino');
    expect(treino.bloqueada).toBe(false);
    // Quem está no nível já vê as faixas liberadas.
    const nivel5 = dungeonsDisponiveis(5).find((d) => d.id === 'cripta_ossada');
    expect(nivel5.bloqueada).toBe(false);
  });

  it('durante o Eclipse as dungeons de alto nível pagam mais', () => {
    const normal = dungeonsDisponiveis(30, 1).find((d) => d.id === 'golem_pedra');
    const eclipse = dungeonsDisponiveis(30, 30).find((d) => d.id === 'golem_pedra');
    expect(eclipse.bonusEclipse).toBeGreaterThan(normal.bonusEclipse);
    expect(eclipse.recompensaXp).toBeGreaterThan(normal.recompensaXp);
    // Dungeons baixas não são sensíveis ao Eclipse.
    const treinoNormal = dungeonsDisponiveis(1, 1).find((d) => d.id === 'sala_treino');
    const treinoEclipse = dungeonsDisponiveis(1, 30).find((d) => d.id === 'sala_treino');
    expect(treinoEclipse.recompensaXp).toBe(treinoNormal.recompensaXp);
  });

  it('dungeonXpTotal soma as recompensas com chefes', () => {
    const d = DUNGEONS.find((x) => x.chefe);
    expect(dungeonXpTotal(d)).toBeGreaterThan(d.recompensas.xp);
  });
});

describe('Dungeons — montagem do encontro', () => {
  it('montarEncontro devolve participantes prontos para a batalha', () => {
    const enc = montarEncontro('sala_treino', { nivelJogadores: 4 });
    expect(enc).toBeTruthy();
    expect(enc.participantes.length).toBeGreaterThan(0);
    for (const p of enc.participantes) {
      expect(p.isMonster).toBe(true);
      expect(p.hpMax).toBeGreaterThan(0);
      expect(p.alive).toBe(true);
      expect(p.uid).toBeTruthy();
    }
  });

  it('dungeon inexistente devolve null', () => {
    expect(montarEncontro('nao_existe')).toBeNull();
  });

  it('o chefe escala com a soma do HP do grupo (regra do chefe dinâmico)', () => {
    const com1 = montarEncontro('golem_pedra', { nivelJogadores: 1 });
    const com4 = montarEncontro('golem_pedra', { nivelJogadores: 4 });
    const chefe1 = com1.participantes.find((p) => p.ondaRotulo === 'Chefe');
    const chefe4 = com4.participantes.find((p) => p.ondaRotulo === 'Chefe');
    expect(chefe1.hpMax).toBeGreaterThan(0);
    expect(chefe4.hpMax).toBeGreaterThan(chefe1.hpMax);
    expect(chefe4.isBoss).toBe(true);
  });

  it('hordes têm vários corpos e morrem um a um', () => {
    const horda = buildMonster(MONSTERS.horda_goblins);
    expect(horda.horda.quantidade).toBe(MONSTERS.horda_goblins.horda.quantidade);
    expect(horda.hpMax).toBe(horda.horda.hpPorUnidade * horda.horda.quantidade);
    expect(horda.hpMax).toBeGreaterThan(buildMonster(MONSTERS.goblin).hpMax);
    expect(horda.xpPorUnidade).toBe(monsterXp(MONSTERS.horda_goblins));
    expect(horda.xpValue).toBe(horda.xpPorUnidade * horda.horda.quantidade);
  });

  it('o Eclipse escala o HP por corpo da horda (não só o total)', () => {
    const normal = montarEncontro('panteao_camuflado', { nivelJogadores: 5 }).participantes
      .find((p) => p.horda);
    const eclipse = montarEncontro('panteao_camuflado', { nivelJogadores: 5, dia: 30 }).participantes
      .find((p) => p.horda);
    expect(eclipse.horda.hpPorUnidade).toBeGreaterThan(normal.horda.hpPorUnidade);
    expect(eclipse.hpMax).toBe(eclipse.horda.hpPorUnidade * eclipse.horda.quantidade);
    expect(eclipse.eclipse).toBe(true);
  });

  it('o Eclipse dá ação extra ao chefe da dungeon', () => {
    const normal = montarEncontro('golem_pedra', { nivelJogadores: 5 }).participantes
      .find((p) => p.ondaRotulo === 'Chefe');
    const eclipse = montarEncontro('golem_pedra', { nivelJogadores: 5, dia: 30 }).participantes
      .find((p) => p.ondaRotulo === 'Chefe');
    expect((eclipse.acoesPorTurno || 1)).toBeGreaterThan(normal.acoesPorTurno || 1);
    expect(eclipse.hpMax).toBeGreaterThan(normal.hpMax);
  });

  it('recompensas sobem durante o Eclipse', () => {
    const normal = montarEncontro('golem_pedra', { nivelJogadores: 5 });
    const eclipse = montarEncontro('golem_pedra', { nivelJogadores: 5, dia: 30 });
    expect(eclipse.recompensas.xp).toBeGreaterThan(normal.recompensas.xp);
    expect(eclipse.recompensas.moedas).toBeGreaterThan(normal.recompensas.moedas);
  });
});

describe('Bestiário — Mana pela mesma fórmula dos jogadores', () => {
  it('Mana do monstro = INT x 10', () => {
    const goblin = buildMonster(MONSTERS.goblin);
    expect(goblin.mpMax).toBe(MONSTERS.goblin.attributes.inteligencia * 10);
    const golem = buildMonster(MONSTERS.golem_pedra);
    expect(golem.mpMax).toBe(MONSTERS.golem_pedra.attributes.inteligencia * 10);
  });

  it('monstros voladores já entram no ar com o alcance vertical definido', () => {
    const morcego = buildMonster(MONSTERS.morcego_gigante);
    expect(morcego.voando).toBe(true);
    expect(morcego.altitude).toBeGreaterThan(0);
    expect(morcego.vooNatural).toBe(true);
    expect(morcego.alcanceVertical).toBeGreaterThan(0);
    const chao = buildMonster(MONSTERS.goblin);
    expect(chao.voando).toBe(false);
    expect(chao.altitude).toBe(0);
  });
});
