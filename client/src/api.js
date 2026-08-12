import { io } from 'socket.io-client';

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

export function getSocket() {
  if (!socket) {
    socket = io();
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
  const res = await fetch(url, {
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

export const api = {
  createPlayer: (name, password) =>
    request('/api/players', { method: 'POST', body: JSON.stringify({ name, password }) }),
  listCharacters: (playerId) => auth(`/api/players/${playerId}/characters`),
  createCharacter: (payload) => auth('/api/characters', { method: 'POST', body: JSON.stringify(payload) }),
  getCharacter: (id) => request(`/api/characters/${id}`),
  equipItem: (id, slot, itemId) => request(`/api/characters/${id}/equip`, { method: 'POST', body: JSON.stringify({ slot, itemId }) }),
  getGameData: () => request('/api/gamedata'),
  getWallet: () => auth('/api/wallet'),
  getShop: () => auth('/api/shop'),
  buyItem: (itemId) => auth('/api/shop/buy', { method: 'POST', body: JSON.stringify({ itemId }) }),
  listCustomClasses: () => request('/api/custom-classes'),
  createCustomClass: (payload) => auth('/api/custom-classes', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomClass: (id, payload) => auth(`/api/custom-classes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCustomClass: (id) => auth(`/api/custom-classes/${id}`, { method: 'DELETE' }),
  listCustomMonsters: () => request('/api/custom-monsters'),
  createCustomMonster: (payload) => auth('/api/custom-monsters', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomMonster: (id) => auth(`/api/custom-monsters/${id}`, { method: 'DELETE' }),
  listCustomRaces: () => request('/api/custom-races'),
  createCustomRace: (payload) => auth('/api/custom-races', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomRace: (id) => auth(`/api/custom-races/${id}`, { method: 'DELETE' }),
  listCustomEquipment: () => request('/api/custom-equipment'),
  createCustomEquipment: (payload) => auth('/api/custom-equipment', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomEquipment: (id) => auth(`/api/custom-equipment/${id}`, { method: 'DELETE' }),
  listCustomSkills: () => request('/api/custom-skills'),
  createCustomSkill: (payload) => auth('/api/custom-skills', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomSkill: (id) => auth(`/api/custom-skills/${id}`, { method: 'DELETE' }),
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
