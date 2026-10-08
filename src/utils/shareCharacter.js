import { api } from '../api.js';
import { isOffline } from '../api.js';

export function sanitizeForShare(character) {
  if (!character) return {};
  const { id, ownerId, createdAt, updatedAt, ...data } = character;
  return {
    version: '1.0',
    type: 'campo-de-batalha-rpg-character',
    exportedAt: Date.now(),
    data,
  };
}

export function buildShareJson(character) {
  return JSON.stringify(sanitizeForShare(character), null, 2);
}

export async function shareCharacter(character) {
  const payload = sanitizeForShare(character);
  if (isOffline()) {
    return { url: null, json: buildShareJson(character), offline: true };
  }
  const res = await api.shareCharacter(payload);
  return { url: res.url, id: res.id, json: buildShareJson(character), offline: false };
}

export async function resolveSharedCharacter(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) throw new Error('Cole um link ou JSON válido.');

  const match = trimmed.match(/\/share\/characters\/([A-Za-z0-9_-]+)/);
  if (match) {
    const id = match[1];
    if (isOffline()) throw new Error('Não é possível abrir links compartilhados no modo offline.');
    const res = await api.getSharedCharacter(id);
    const ch = res.character || res.data?.data || res.data;
    return ch;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.data) return parsed.data;
    if (parsed && parsed.type === 'campo-de-batalha-rpg-character') return parsed.data;
    return parsed;
  } catch {
    throw new Error('Não foi possível reconhecer o link ou JSON da ficha.');
  }
}