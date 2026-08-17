import { BattleManager } from '../game/battleManager.js';
import { MONSTERS } from '../game/monsters.js';
import { pickMonsterAction } from './ai.js';
import { addOfflineCoins } from './storage.js';

class OfflineBattle {
  constructor() {
    this.manager = null;
    this.listeners = [];
    this.running = false;
    this.battleId = null;
  }

  on(event, fn) {
    this.listeners.push({ event, fn });
    return () => {
      this.listeners = this.listeners.filter((l) => l.fn !== fn);
    };
  }

  _emit(event, data) {
    this.listeners.filter((l) => l.event === event).forEach((l) => l.fn(data));
  }

  create(playerId, characterData, mode = 'solo') {
    this.manager = new BattleManager({
      emit: (battle) => {
        if (battle) this._emit('battleUpdate', { ...battle });
      },
      saveBattle: () => {},
      onBattleEnd: () => {},
    });

    const normalizedClasses = (characterData.classes || []).map((c) => ({
      ...c,
      archetype: c.archetype || c.id || 'guerreiro',
      primary: c.primary ?? false,
      bonus: c.bonus || {},
      hpPerLevel: c.hpPerLevel ?? 8,
      mpPerLevel: c.mpPerLevel ?? 5,
      levelUp: c.levelUp || 'forca',
      spellList: c.spellList || [],
    }));

    const normalizedRaces = (characterData.races || []).map((r) => ({
      id: r.id || 'humano',
      nome: r.nome || 'Humano',
      bonus: r.bonus || {},
      passiva: r.passiva || '',
      efeito: r.efeito || {},
    }));

    const primaryClass = normalizedClasses.find((c) => c.primary) || normalizedClasses[0];

    const battle = this.manager.createBattle({
      name: 'Batalha Solo',
      mode: 'mestre',
      host: playerId,
      hostName: playerId,
      character: {
        id: characterData.id,
        name: characterData.name,
        class: primaryClass?.archetype || primaryClass?.id || 'guerreiro',
        race: normalizedRaces[0]?.id || 'humano',
        level: characterData.level || 1,
        classes: normalizedClasses,
        races: normalizedRaces,
        skills: characterData.skills || [],
        passiva: characterData.passiva || '',
        ultimate: characterData.ultimate || null,
        especial: characterData.especial || null,
        attributes: characterData.attributes,
        spells: characterData.spells || characterData.skills?.map((s) => s.id) || [],
        equipment: characterData.equipment || {},
        inventory: characterData.inventory || [],
      },
    });

    this.battleId = battle.id;
    return battle.id;
  }

  addMonster(monsterKey) {
    if (!this.battleId) return;
    const def = MONSTERS[monsterKey];
    if (!def) return;
    const battle = this.manager.getBattle(this.battleId);
    this.manager.addMonster({
      battleId: this.battleId,
      hostId: battle.host,
      monsterDef: def,
    });
  }

  start() {
    if (!this.battleId) return;
    const battle = this.manager.getBattle(this.battleId);
    this.manager.startBattle({
      battleId: this.battleId,
      playerId: battle.host,
    });
    this._emit('battleUpdate', { ...this.manager.getBattle(this.battleId) });
  }

  async playerAction(characterId, action) {
    if (!this.battleId) return;
    const state = this.manager.getBattle(this.battleId);
    if (!state || state.status === 'finished') return;

    this.manager.handleAction({
      battleId: this.battleId,
      characterId,
      playerId: state.host,
      action,
    });

    this._emit('battleUpdate', { ...this.manager.getBattle(this.battleId) });

    if (this.manager.getBattle(this.battleId).status === 'finished') {
      this._handleBattleEnd();
      return;
    }

    await this._runMonsterTurns();
  }

  async _runMonsterTurns() {
    if (!this.battleId) return;
    let safety = 0;

    while (safety < 50) {
      safety++;
      const state = this.manager.getBattle(this.battleId);
      if (!state || state.status === 'finished') break;

      const curIdx = state.turnOrder[state.currentTurnIndex];
      const cur = state.participants[curIdx];
      if (!cur || !cur.isMonster || !cur.alive) break;

      const action = pickMonsterAction(cur, state);
      if (!action) {
        const target = state.participants.find((p) => !p.isMonster && p.alive);
        if (!target) break;
        this.manager.handleAction({
          battleId: this.battleId,
          characterId: cur.characterId,
          playerId: state.host,
          action: { type: 'attack', targetId: target.characterId },
        });
      } else {
        this.manager.handleAction({
          battleId: this.battleId,
          characterId: cur.characterId,
          playerId: state.host,
          action,
        });
      }
      this._emit('battleUpdate', { ...this.manager.getBattle(this.battleId) });

      if (this.manager.getBattle(this.battleId).status === 'finished') break;

      const nextIdx = this.manager.getBattle(this.battleId).turnOrder[
        this.manager.getBattle(this.battleId).currentTurnIndex
      ];
      const next = this.manager.getBattle(this.battleId).participants[nextIdx];
      if (!next || !next.isMonster) break;
    }
  }

  _handleBattleEnd() {
    if (!this.battleId) return;
    const state = this.manager.getBattle(this.battleId);
    addOfflineCoins(100 + (state.monstersKilled || 0) * 25);
    this._emit('battleUpdate', { ...state });
  }

  getState() {
    if (!this.battleId || !this.manager) return null;
    const battle = this.manager.getBattle(this.battleId);
    return battle ? { ...battle } : null;
  }

  destroy() {
    this.listeners = [];
    this.manager = null;
    this.battleId = null;
    this.running = false;
  }
}

export const offlineBattle = new OfflineBattle();
