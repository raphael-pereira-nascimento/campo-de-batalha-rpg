const PLAYER_KEY = 'cbr_offline_player';
const CHAR_KEY = 'cbr_offline_chars';
const WALLET_KEY = 'cbr_offline_wallet';
const GEMS_KEY = 'cbr_offline_gems';

let _idCounter = parseInt(localStorage.getItem('cbr_offline_id') || '1', 10);
function nextId() {
  const id = 'offline-' + _idCounter;
  _idCounter++;
  localStorage.setItem('cbr_offline_id', String(_idCounter));
  return id;
}

// Estado do servidor backend: 'off' (sem URL configurada), 'probing', 'up', 'down'.
// O modo offline é qualquer estado que não seja 'up' — assim, se o servidor
// não responder na inicialização, o app cai no modo local sem quebrar.
let _serverStatus = import.meta.env.VITE_API_URL ? 'probing' : 'off';

export function isOffline() {
  return _serverStatus !== 'up';
}

export function setServerStatus(status) {
  if (['off', 'probing', 'up', 'down'].includes(status)) _serverStatus = status;
}

export function getOfflinePlayer() {
  const raw = localStorage.getItem(PLAYER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveOfflinePlayer(name, password) {
  let existing = getOfflinePlayer();
  if (existing && existing.name === name) {
    return { ...existing, token: 'offline-token' };
  }
  const player = { id: nextId(), name, token: 'offline-token' };
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  return player;
}

export function getOfflineCharacters() {
  const raw = localStorage.getItem(CHAR_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveOfflineCharacter(character) {
  const chars = getOfflineCharacters();
  const existing = chars.findIndex((c) => c.id === character.id);
  if (existing >= 0) {
    chars[existing] = character;
  } else {
    chars.push(character);
  }
  localStorage.setItem(CHAR_KEY, JSON.stringify(chars));
  return character;
}

export function getOfflineWallet() {
  return Number(localStorage.getItem(WALLET_KEY) || '1000');
}

export function addOfflineCoins(amount) {
  const current = getOfflineWallet();
  localStorage.setItem(WALLET_KEY, String(current + amount));
  return current + amount;
}

// ── Gemas offline ──────────────────────────────────

function _getAllGems() {
  const raw = localStorage.getItem(GEMS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function _saveAllGems(gems) {
  localStorage.setItem(GEMS_KEY, JSON.stringify(gems));
}

export function getOfflineGems(characterId) {
  const all = _getAllGems();
  return all[characterId] || [];
}

export function addOfflineGem(characterId, gemId) {
  const all = _getAllGems();
  if (!all[characterId]) all[characterId] = [];
  all[characterId].push(gemId);
  _saveAllGems(all);
}

export function removeOfflineGem(characterId, gemId) {
  const all = _getAllGems();
  const gems = all[characterId] || [];
  const idx = gems.indexOf(gemId);
  if (idx !== -1) gems.splice(idx, 1);
  all[characterId] = gems;
  _saveAllGems(all);
}

// ── Conteúdo customizado offline (Registro do Mundo) ────────────────────
// Guarda as criações no navegador para o Registro do Mundo funcionar sem
// servidor. A forma de cada entrada espelha o retorno do backend online
// (incluindo creator_id, creator_name, is_public e created_at).

const CUSTOM_KEY = 'cbr_offline_custom';

function _getAllCustom() {
  const raw = localStorage.getItem(CUSTOM_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function _saveAllCustom(all) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
}

// kind: 'classes' | 'monsters' | 'races' | 'equipment' | 'skills'
export function listOfflineCustom(kind) {
  const all = _getAllCustom();
  return all[kind] || [];
}

export function saveOfflineCustom(kind, item, player) {
  const all = _getAllCustom();
  const list = all[kind] || [];
  const stamped = {
    ...item,
    id: item.id || `${kind}-${nextId()}`,
    creator_id: item.creator_id || player?.id || 'offline',
    creator_name: item.creator_name || player?.name || 'Jogador',
    is_public: !!item.is_public,
    created_at: item.created_at || new Date().toISOString(),
  };
  const idx = list.findIndex((x) => x.id === stamped.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...stamped };
  else list.unshift(stamped);
  all[kind] = list;
  _saveAllCustom(all);
  return stamped;
}

export function removeOfflineCustom(kind, id) {
  const all = _getAllCustom();
  all[kind] = (all[kind] || []).filter((x) => x.id !== id);
  _saveAllCustom(all);
}
