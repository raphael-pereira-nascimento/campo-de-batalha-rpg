import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io();
    socket.on('disconnect', () => console.warn('[socket] desconectado'));
    socket.on('connect', () => {
      const playerName = localStorage.getItem('cbr_player_name');
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

export const api = {
  createPlayer: (name) => request('/api/players', { method: 'POST', body: JSON.stringify({ name }) }),
  listCharacters: (playerId) => request(`/api/players/${playerId}/characters`),
  createCharacter: (payload) => request('/api/characters', { method: 'POST', body: JSON.stringify(payload) }),
  getCharacter: (id) => request(`/api/characters/${id}`),
  equipItem: (id, slot, itemId) =>
    request(`/api/characters/${id}/equip`, { method: 'POST', body: JSON.stringify({ slot, itemId }) }),
  getGameData: () => request('/api/gamedata'),
  listCustomClasses: () => request('/api/custom-classes'),
  createCustomClass: (payload) => request('/api/custom-classes', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomClass: (id, payload) => request(`/api/custom-classes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCustomClass: (id, creatorId) => request(`/api/custom-classes/${id}`, { method: 'DELETE', body: JSON.stringify({ creatorId }) }),
  listCustomMonsters: () => request('/api/custom-monsters'),
  createCustomMonster: (payload) => request('/api/custom-monsters', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomMonster: (id, creatorId) => request(`/api/custom-monsters/${id}`, { method: 'DELETE', body: JSON.stringify({ creatorId }) }),
  listCustomRaces: () => request('/api/custom-races'),
  createCustomRace: (payload) => request('/api/custom-races', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomRace: (id, creatorId) => request(`/api/custom-races/${id}`, { method: 'DELETE', body: JSON.stringify({ creatorId }) }),
  listCustomEquipment: () => request('/api/custom-equipment'),
  createCustomEquipment: (payload) => request('/api/custom-equipment', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomEquipment: (id, creatorId) => request(`/api/custom-equipment/${id}`, { method: 'DELETE', body: JSON.stringify({ creatorId }) }),
  listCustomSkills: () => request('/api/custom-skills'),
  createCustomSkill: (payload) => request('/api/custom-skills', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomSkill: (id, creatorId) => request(`/api/custom-skills/${id}`, { method: 'DELETE', body: JSON.stringify({ creatorId }) }),
};

export function emitAck(event, payload) {
  return new Promise((resolve, reject) => {
    getSocket().emit(event, payload, (ack) => {
      if (ack && ack.ok) resolve(ack);
      else reject(new Error((ack && ack.error) || 'Erro no servidor'));
    });
  });
}
