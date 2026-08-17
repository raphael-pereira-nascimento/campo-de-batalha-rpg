import { io } from 'socket.io-client';
import { gameData } from './offline/gameData.js';
import { isOffline, saveOfflinePlayer, getOfflinePlayer, getOfflineCharacters, saveOfflineCharacter, getOfflineWallet, addOfflineCoins } from './offline/storage.js';
import { offlineBattle } from './offline/battle.js';
import { MONSTERS } from './game/monsters.js';

const API = import.meta.env.VITE_API_URL || '';
const SOCKET = import.meta.env.VITE_SOCKET_URL || undefined;

let socket = null;

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
        const battleId = offlineBattle.create(payload.playerId, payload.character, payload.mode || 'mestre');
        if (ack) ack({ ok: true, battleId });
      } catch (e) {
        if (ack) ack({ ok: false, error: e.message });
      }
      return;
    }

    if (event === 'addMonster') {
      try {
        offlineBattle.addMonster(payload.monsterId || payload.monsterPick);
        if (ack) ack({ ok: true });
      } catch (e) {
        if (ack) ack({ ok: false, error: e.message });
      }
      return;
    }

    if (event === 'startBattle') {
      (async () => {
        try {
          offlineBattle.start();
          if (ack) ack({ ok: true });
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
          if (ack) ack({ ok: true });
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

    if (event === 'leaveBattle') {
      if (ack) ack({ ok: true });
      return;
    }
  }
}

const mockSocket = new MockSocket();

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
  const res = await fetch(API + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
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
      const character = { id, ...payload, playerId: payload.playerId || 'offline', level: payload.level || 1 };
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
        c.equipment = c.equipment || {};
        c.equipment[slot] = itemId ? { id: itemId } : undefined;
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
