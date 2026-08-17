const PLAYER_KEY = 'cbr_offline_player';
const CHAR_KEY = 'cbr_offline_chars';
const WALLET_KEY = 'cbr_offline_wallet';

let _idCounter = parseInt(localStorage.getItem('cbr_offline_id') || '1', 10);
function nextId() {
  const id = 'offline-' + _idCounter;
  _idCounter++;
  localStorage.setItem('cbr_offline_id', String(_idCounter));
  return id;
}

export function isOffline() {
  return !import.meta.env.VITE_API_URL;
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
