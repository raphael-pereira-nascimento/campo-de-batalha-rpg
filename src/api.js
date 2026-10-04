import { io } from 'socket.io-client';
import { gameData } from './offline/gameData.js';
import { isOffline, setServerStatus, saveOfflinePlayer, getOfflinePlayer, getOfflineCharacters, saveOfflineCharacter, getOfflineWallet, addOfflineCoins, getOfflineGems, addOfflineGem, removeOfflineGem } from './offline/storage.js';
import { offlineBattle } from './offline/battle.js';
import { MONSTERS } from './game/monsters.js';
import { gemIsRaw } from './game/gems.js';
import { EQUIPMENT, POTIONS, deriveStats, applyMaxMults, efeitosDeHabilidades } from './game/data.js';
import { DUNGEONS } from './game/dungeons.js';
import {
  estadoMundo,
  avancarDia as avancarDiaLocal,
  setDia as setDiaLocal,
  setTipoEclipse as setTipoEclipseLocal,
} from './game/calendar.js';

// Soma os efeitos mecânicos das raças + passivas extras da ficha.
function efeitosDaFicha(charOrPayload) {
  const out = {};
  for (const r of charOrPayload.races || []) {
    for (const [k, v] of Object.entries(r.efeito || {})) out[k] = (out[k] || 0) + v;
  }
  for (const [k, v] of Object.entries(efeitosDeHabilidades(charOrPayload.habilidades))) {
    out[k] = (out[k] || 0) + v;
  }
  return out;
}

const API = import.meta.env.VITE_API_URL || '';
const SOCKET = import.meta.env.VITE_SOCKET_URL || undefined;

let socket = null;

// Sonda de conexão: chamada uma única vez na inicialização (main.jsx).
// Se o backend não responder, o app inteiro opera em modo offline.
// Duas tentativas porque o Render gratuito pode estar "acordando".
export function initConnection() {
  if (!API) return Promise.resolve(false);
  const ping = (ms) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(API + '/api/health', { signal: ctrl.signal })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => clearTimeout(t));
  };
  return ping(10000)
    .then((ok) => (ok ? true : ping(20000)))
    .then((ok) => {
      setServerStatus(ok ? 'up' : 'down');
      console.info(`[conexao] servidor ${ok ? 'online' : 'indisponível — modo local ativado'}`);
      return ok;
    });
}

const TOKEN_KEY = 'cbr_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('cbr_player');
  localStorage.removeItem('cbr_player_name');
}

// Cópia local de potionItem (mesma estrutura do servidor).
function potionItem(id) {
  const p = POTIONS[id];
  return { id, nome: p.nome, tipo: 'pocao', cura: p.cura || null, mana: p.mana || null };
}

/* ─── Mock Socket for offline mode ─── */
class MockSocket {
  constructor() {
    this._handlers = {};
    this.connected = true;
  }
  on(event, fn) {
    (this._handlers[event] = this._handlers[event] || []).push(fn);
    return this;
  }
  off(event, fn) {
    if (!this._handlers[event]) return this;
    this._handlers[event] = this._handlers[event].filter((f) => f !== fn);
    return this;
  }
  _emit(event, data) {
    for (const fn of this._handlers[event] || []) fn(data);
  }
  emit(event, payload, ack) {
    if (typeof payload === 'function') { ack = payload; payload = undefined; }

    if (event === 'authenticate' || event === 'setIdentity' || event === 'joinLobby') return;
    if (event === 'joinRoom' || event === 'leaveRoom') return;

    if (event === 'getBattle') {
      const state = offlineBattle.getState();
      if (ack) ack({ ok: true, battle: state });
      return;
    }

    if (event === 'createBattle') {
      try {
        const battleId = offlineBattle.create(
          payload.playerId,
          payload.character,
          payload.mode || 'mestre',
          payload.aiEnabled,
          { dungeonId: payload.dungeonId || null, calendario: payload.calendario || estadoMundo(), name: payload.name },
        );
        if (ack) ack({ ok: true, battleId });
      } catch (e) {
        if (ack) ack({ ok: false, error: e.message });
      }
      return;
    }

    if (event === 'addMonster') {
      try {
        offlineBattle.addMonster(payload.monsterId || payload.monsterPick, payload.modoChefeDinamico);
        const state = offlineBattle.getState();
        if (ack) ack({ ok: true, battle: state });
      } catch (e) {
        if (ack) ack({ ok: false, error: e.message });
      }
      return;
    }

    if (event === 'toggleDrunk') {
      try {
        offlineBattle.toggleDrunk(payload.participantId || payload.characterId);
        const state = offlineBattle.getState();
        if (ack) ack({ ok: true, battle: state });
      } catch (e) {
        if (ack) ack({ ok: false, error: e.message });
      }
      return;
    }

    if (event === 'startBattle') {
      (async () => {
        try {
          offlineBattle.start();
          const state = offlineBattle.getState();
          if (ack) ack({ ok: true, battle: state });
        } catch (e) {
          if (ack) ack({ ok: false, error: e.message });
        }
      })();
      return;
    }

    if (event === 'battleAction') {
      (async () => {
        try {
          await offlineBattle.playerAction(payload.characterId, payload.action);
          const state = offlineBattle.getState();
          if (ack) ack({ ok: true, battle: state });
        } catch (e) {
          if (ack) ack({ ok: false, error: e.message });
        }
      })();
      return;
    }

    if (event === 'removeMonster') {
      if (ack) ack({ ok: true });
      return;
    }

    if (event === 'quickChat') {
      const charName = 'Jogador';
      const listeners = this._listeners?.quickChatMessage || [];
      for (const fn of listeners) fn({ charName, phrase: payload.phrase });
      if (ack) ack({ ok: true });
      return;
    }

    if (event === 'leaveBattle') {
      if (ack) ack({ ok: true });
      return;
    }

    // ── Calendário do mundo / Eclipse (mock) ──
    if (event === 'getCalendario') {
      if (ack) ack({ ok: true, calendario: estadoMundo() });
      return;
    }
    if (event === 'avancarDia') {
      const estado = avancarDiaLocal(payload?.dias || 1);
      this._emit('calendarioUpdate', estado);
      if (ack) ack({ ok: true, calendario: estado });
      return;
    }
    if (event === 'setDia') {
      setDiaLocal(payload?.dia);
      const estado = estadoMundo();
      this._emit('calendarioUpdate', estado);
      if (ack) ack({ ok: true, calendario: estado });
      return;
    }
    if (event === 'setTipoEclipse') {
      setTipoEclipseLocal(payload?.tipo);
      const estado = estadoMundo();
      this._emit('calendarioUpdate', estado);
      if (ack) ack({ ok: true, calendario: estado });
      return;
    }
  }
}

const mockSocket = new MockSocket();

// Aplica recompensas de batalha a um personagem offline (espelho do grantRewards do servidor).
export function applyOfflineRewards(charId, xpGained, wins = 0) {
  if (!isOffline()) return;
  const chars = getOfflineCharacters();
  const c = chars.find((ch) => ch.id === charId);
  if (!c) return;
  let xp = (c.xp || 0) + xpGained;
  let level = c.level || 1;
  while (xp >= level * 100) { xp -= level * 100; level += 1; }
  const levelsGained = level - (c.level || 1);
  const attributes = { ...c.attributes };
  if (levelsGained > 0) {
    const primary = (c.classes || []).find((cl) => cl.primary) || (c.classes || [])[0] || {};
    const upAttr = primary.levelUp || 'forca';
    attributes[upAttr] = Math.min((attributes[upAttr] || 0) + levelsGained, 14);
  }
  const stats = applyMaxMults(
    deriveStats(c.classes || [], level, attributes, c.equipment || {}, c.races || []),
    efeitosDaFicha(c),
  );
  c.level = level;
  c.xp = xp;
  c.wins = (c.wins || 0) + wins;
  c.hp_max = stats.hpMax;
  c.mp_max = stats.mpMax;
  c.hp_current = Math.min(c.hp_current ?? stats.hpMax, stats.hpMax);
  c.mp_current = Math.min(c.mp_current ?? stats.mpMax, stats.mpMax);
  c.attributes = attributes;
  localStorage.setItem('cbr_offline_chars', JSON.stringify(chars));
}

/* ─── Socket (online or mock) ─── */
export function getSocket() {
  if (isOffline()) {
    return mockSocket;
  }
  if (!socket) {
    socket = io(SOCKET, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 8000,
    });
    socket.on('disconnect', () => console.warn('[socket] desconectado'));
    socket.on('connect', () => {
      const token = getToken();
      const playerName = localStorage.getItem('cbr_player_name');
      if (token) socket.emit('authenticate', { token });
      if (playerName) socket.emit('setIdentity', { playerName });
    });
  }
  return socket;
}

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(API + url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Servidor indisponível. Recarregue a página — se persistir, o modo local será usado no próximo acesso.');
  }
  const json = await res.json().catch(() => ({ ok: false, error: 'Resposta inválida' }));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || 'Erro na requisição');
  }
  return json;
}

function auth(url, options = {}) {
  const token = getToken();
  return request(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
}

/* ─── API (online or offline) ─── */
export const api = {
  createPlayer: (name, password) => {
    if (isOffline()) {
      const player = saveOfflinePlayer(name, password);
      return Promise.resolve({ ok: true, player: { id: player.id, name: player.name }, token: player.token });
    }
    return request('/api/players', { method: 'POST', body: JSON.stringify({ name, password }) });
  },
  listCharacters: (playerId) => {
    if (isOffline()) {
      return Promise.resolve({ ok: true, characters: getOfflineCharacters() });
    }
    return auth(`/api/players/${playerId}/characters`);
  },
  createCharacter: (payload) => {
    if (isOffline()) {
      const chars = getOfflineCharacters();
      const id = 'offline-char-' + Date.now();
      const stats = applyMaxMults(
        deriveStats(payload.classes || [], 1, payload.attributes, payload.equipment || {}, payload.races || []),
        efeitosDaFicha(payload),
      );
      const skills = [...(payload.skills || [])];
      const character = {
        id,
        ...payload,
        playerId: payload.playerId || 'offline',
        level: 1,
        xp: 0,
        hp_current: stats.hpMax,
        hp_max: stats.hpMax,
        mp_current: stats.mpMax,
        mp_max: stats.mpMax,
        defesa: stats.defesa,
        inventory: [
          potionItem('pocao_cura'),
          potionItem('pocao_cura'),
          potionItem('elixir_mana'),
        ],
        spells: skills.map((s) => s.id),
      };
      chars.push(character);
      localStorage.setItem('cbr_offline_chars', JSON.stringify(chars));
      return Promise.resolve({ ok: true, character });
    }
    return auth('/api/characters', { method: 'POST', body: JSON.stringify(payload) });
  },
  getCharacter: (id) => {
    if (isOffline()) {
      const chars = getOfflineCharacters();
      return Promise.resolve({ ok: true, character: chars.find((c) => c.id === id) || null });
    }
    return request(`/api/characters/${id}`);
  },
  equipItem: (id, slot, itemId) => {
    if (isOffline()) {
      const chars = getOfflineCharacters();
      const c = chars.find((ch) => ch.id === id);
      if (c) {
        let item = null;
        if (itemId) {
          // Guarda a definição COMPLETA do item (dano/defesa/bônus/slots de gema),
          // igual ao servidor — antes salvava só { id } e as stats zeravam.
          const catalog = slot === 'arma' ? EQUIPMENT.armas : EQUIPMENT.armaduras;
          const def = catalog[itemId];
          item = def ? { id: itemId, ...def } : null;
        }
        c.equipment = c.equipment || {};
        c.equipment[slot] = item;
        const stats = applyMaxMults(
          deriveStats(c.classes || [], c.level || 1, c.attributes, c.equipment, c.races || []),
          efeitosDaFicha(c),
        );
        c.hp_max = stats.hpMax;
        c.mp_max = stats.mpMax;
        c.hp_current = Math.min(c.hp_current ?? stats.hpMax, stats.hpMax);
        c.mp_current = Math.min(c.mp_current ?? stats.mpMax, stats.mpMax);
        c.defesa = stats.defesa;
        localStorage.setItem('cbr_offline_chars', JSON.stringify(chars));
      }
      return Promise.resolve({ ok: true, character: c });
    }
    return request(`/api/characters/${id}/equip`, { method: 'POST', body: JSON.stringify({ slot, itemId }) });
  },
  getGameData: () => {
    if (isOffline()) {
      return Promise.resolve(gameData);
    }
    return request('/api/gamedata');
  },

  // ── Calendário do mundo / Eclipse ──
  calendario: () => {
    if (isOffline()) return Promise.resolve(estadoMundo());
    return request('/api/calendario');
  },
  avancarDia: (dias = 1) => {
    if (isOffline()) {
      const estado = avancarDiaLocal(dias);
      return Promise.resolve({ ok: true, ...estado });
    }
    return auth('/api/calendario/avancar', { method: 'POST', body: JSON.stringify({ dias }) });
  },
  setDia: (dia) => {
    if (isOffline()) {
      setDiaLocal(dia);
      return Promise.resolve({ ok: true, ...estadoMundo() });
    }
    return auth('/api/calendario/dia', { method: 'POST', body: JSON.stringify({ dia }) });
  },
  setTipoEclipse: (tipo) => {
    if (isOffline()) {
      setTipoEclipseLocal(tipo);
      return Promise.resolve({ ok: true, ...estadoMundo() });
    }
    return auth('/api/calendario/tipo', { method: 'POST', body: JSON.stringify({ tipo }) });
  },

  // ── Dungeons ──
  getDungeons: () => {
    if (isOffline()) {
      return Promise.resolve({ ok: true, dungeons: DUNGEONS, calendario: estadoMundo() });
    }
    return request('/api/dungeons');
  },
  getRanking: () => {
    if (isOffline()) {
      const chars = getOfflineCharacters().map((c) => ({
        id: c.id, name: c.name, level: c.level || 1, xp: c.xp || 0, wins: c.wins || 0, gender: c.gender, race: c.race, class: c.class,
      }));
      chars.sort((a, b) => (b.wins - a.wins) || (b.xp - a.xp));
      return Promise.resolve({ ok: true, ranking: chars.slice(0, 20) });
    }
    return request('/api/ranking');
  },
  getWallet: () => {
    if (isOffline()) {
      return Promise.resolve({ ok: true, wallet: getOfflineWallet() });
    }
    return auth('/api/wallet');
  },
  getShop: () => {
    if (isOffline()) {
      return Promise.resolve({ ok: true, items: [] });
    }
    return auth('/api/shop');
  },
  buyItem: (itemId) => {
    if (isOffline()) {
      return Promise.resolve({ ok: true });
    }
    return auth('/api/shop/buy', { method: 'POST', body: JSON.stringify({ itemId }) });
  },
  listCustomClasses: () => {
    if (isOffline()) return Promise.resolve({ ok: true, classes: [] });
    return request('/api/custom-classes');
  },
  createCustomClass: (payload) => {
    if (isOffline()) return Promise.resolve({ ok: true, class: payload });
    return auth('/api/custom-classes', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateCustomClass: (id, payload) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth(`/api/custom-classes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteCustomClass: (id) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth(`/api/custom-classes/${id}`, { method: 'DELETE' });
  },
  listCustomMonsters: () => {
    if (isOffline()) return Promise.resolve({ ok: true, monsters: [] });
    return request('/api/custom-monsters');
  },
  createCustomMonster: (payload) => {
    if (isOffline()) return Promise.resolve({ ok: true, monster: payload });
    return auth('/api/custom-monsters', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteCustomMonster: (id) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth(`/api/custom-monsters/${id}`, { method: 'DELETE' });
  },
  listCustomRaces: () => {
    if (isOffline()) return Promise.resolve({ ok: true, races: [] });
    return request('/api/custom-races');
  },
  createCustomRace: (payload) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth('/api/custom-races', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteCustomRace: (id) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth(`/api/custom-races/${id}`, { method: 'DELETE' });
  },
  listCustomEquipment: () => {
    if (isOffline()) return Promise.resolve({ ok: true, equipment: [] });
    return request('/api/custom-equipment');
  },
  createCustomEquipment: (payload) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth('/api/custom-equipment', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteCustomEquipment: (id) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth(`/api/custom-equipment/${id}`, { method: 'DELETE' });
  },
  listCustomSkills: () => {
    if (isOffline()) return Promise.resolve({ ok: true, skills: [] });
    return request('/api/custom-skills');
  },
  createCustomSkill: (payload) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth('/api/custom-skills', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteCustomSkill: (id) => {
    if (isOffline()) return Promise.resolve({ ok: true });
    return auth(`/api/custom-skills/${id}`, { method: 'DELETE' });
  },

  // ── Gemas ──────────────────────────────────────────

  getCharacterGems: (characterId) => {
    if (isOffline()) {
      return Promise.resolve({ ok: true, gems: getOfflineGems(characterId) });
    }
    return auth(`/api/characters/${characterId}/gems`);
  },
  socketGem: (characterId, slot, gemId) => {
    if (isOffline()) {
      const chars = getOfflineCharacters();
      const c = chars.find((ch) => ch.id === characterId);
      if (!c) return Promise.reject(new Error('Personagem não encontrado.'));
      const [equipSlot, slotIndexStr] = slot.split('_');
      const slotIndex = parseInt(slotIndexStr, 10);
      const item = c.equipment?.[equipSlot];
      if (!item) return Promise.reject(new Error('Nenhum equipamento.'));
      const socketedGems = item.socketedGems || [];
      if (socketedGems[slotIndex]) return Promise.reject(new Error('Slot ocupado.'));
      const gems = getOfflineGems(characterId);
      const gemIdx = gems.indexOf(gemId);
      if (gemIdx === -1) return Promise.reject(new Error('Gema não encontrada.'));
      if (gemIsRaw(gemId)) return Promise.reject(new Error('⚠️ Requer polimento antes de usar'));
      removeOfflineGem(characterId, gemId);
      socketedGems[slotIndex] = gemId;
      c.equipment[equipSlot] = { ...item, socketedGems };
      localStorage.setItem('cbr_offline_chars', JSON.stringify(chars));
      return Promise.resolve({ ok: true, character: c });
    }
    return auth(`/api/characters/${characterId}/socket`, { method: 'POST', body: JSON.stringify({ slot, gemId }) });
  },
  unsocketGem: (characterId, slot) => {
    if (isOffline()) {
      const chars = getOfflineCharacters();
      const c = chars.find((ch) => ch.id === characterId);
      if (!c) return Promise.reject(new Error('Personagem não encontrado.'));
      const [equipSlot, slotIndexStr] = slot.split('_');
      const slotIndex = parseInt(slotIndexStr, 10);
      const item = c.equipment?.[equipSlot];
      if (!item) return Promise.reject(new Error('Nenhum equipamento.'));
      const socketedGems = item.socketedGems || [];
      const gemId = socketedGems[slotIndex];
      if (!gemId) return Promise.reject(new Error('Slot vazio.'));
      addOfflineGem(characterId, gemId);
      socketedGems[slotIndex] = null;
      c.equipment[equipSlot] = { ...item, socketedGems };
      localStorage.setItem('cbr_offline_chars', JSON.stringify(chars));
      return Promise.resolve({ ok: true, character: c });
    }
    return auth(`/api/characters/${characterId}/socket`, { method: 'DELETE', body: JSON.stringify({ slot }) });
  },
};

// Funções de autenticação da sessão atual.
export function getPlayer() {
  const raw = localStorage.getItem('cbr_player');
  return raw ? JSON.parse(raw) : null;
}

export function setPlayerSession(player, token) {
  localStorage.setItem('cbr_player', JSON.stringify(player));
  localStorage.setItem('cbr_player_name', player.name);
  setToken(token);
}

export function logout() {
  clearToken();
}

export function emitAck(event, payload) {
  return new Promise((resolve, reject) => {
    getSocket().emit(event, payload, (ack) => {
      if (ack && ack.ok) resolve(ack);
      else reject(new Error((ack && ack.error) || 'Erro no servidor'));
    });
  });
}

export { isOffline };
