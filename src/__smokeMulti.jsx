// Arquivo temporário só para smoke-test do render da batalha multi-alvo.
// Não faz parte do app — apagar depois.
import React from 'react';
import { createRoot } from 'react-dom/client';
import Battle from './pages/Battle.jsx';
import { gameData } from './offline/gameData.js';
import { emitAck } from './api.js';
import { MONSTERS } from './game/monsters.js';

export async function run() {
  const out = { windowErrors: [] };
  window.onerror = (m) => { out.windowErrors.push(String(m)); };
  const playerId = 'p-teste';
  const keys = Object.keys(MONSTERS);
  const monsterId = keys.find((k) => k === 'goblin') || keys[0];
  const character = {
    id: 'c-teste', name: 'Heroi', level: 1, race: 'humano',
    races: [{ id: 'humano', nome: 'Humano', bonus: { escolha: 1 }, passiva: '', efeito: {} }],
    classes: [{ id: 'mago', nome: 'Mago', bonus: { inteligencia: 3, destreza: 1 }, hpPerLevel: 8, mpPerLevel: 6, levelUp: 'inteligencia', spellList: [], archetype: 'mago', primary: true }],
    attributes: { forca: 5, inteligencia: 8, resistencia: 6, destreza: 6, reflexos: 6 },
    equipment: {}, inventory: [],
    skills: [
      { id: 'golpe_teste', nome: 'Onda Arcana', tipo: 'magia', poder: 180, custo: 0, cooldown: 0, todos: false, alvo: 'cone', alvos: 3, splash: 0.5, status: null, desc: 'teste' },
      { id: 'golpe_area', nome: 'Explosao Total', tipo: 'magia', poder: 150, custo: 0, cooldown: 0, todos: false, alvo: 'area', alvos: 3, splash: 0.5, status: null, desc: 'teste' },
      { id: 'golpe_unico', nome: 'Raio', tipo: 'magia', poder: 200, custo: 0, cooldown: 0, todos: false, alvo: 'unico', alvos: 3, splash: 0.5, status: null, desc: 'teste' },
    ],
    spells: ['golpe_teste', 'golpe_area', 'golpe_unico'],
    ultimate: { nome: 'Despertar', tipo: 'magia', poder: 300, custo: 0, alvo: 'explosao', alvos: 3, splash: 0.5, modo: { turnos: 3, danoMultPct: 50 }, condicao: null },
    especial: null,
    habilidades: [],
  };

  const cr = await emitAck('createBattle', { playerId, character, mode: 'mestre', aiEnabled: false, name: 'Teste Multi' });
  out.battleId = cr && cr.battleId;
  await emitAck('addMonster', { monsterId });
  await emitAck('addMonster', { monsterId });
  const sr = await emitAck('startBattle', {});
  out.status = sr && sr.battle && sr.battle.status;

  const host = document.createElement('div');
  host.id = 'teste-battle';
  host.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#111;overflow:auto;color:#eee';
  document.body.appendChild(host);
  createRoot(host).render(
    React.createElement(Battle, {
      battleId: cr.battleId,
      player: { id: playerId, name: 'Testador' },
      gameData,
      onExit: () => {},
      onBackToSheets: () => {},
    }),
  );
  await new Promise((r) => setTimeout(r, 700));

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const setSel = (sel, val) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, val);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const tab = [...host.querySelectorAll('.action-tabs button')].find((b) => b.innerText.includes('Magia'));
  tab.click();
  await wait(150);

  const readUi = () => ({
    hint: (host.querySelector('.alvo-hint') || {}).innerText || null,
    extraLabel: (host.querySelector('.extra-targets .field-label') || {}).innerText || null,
    conjurar: [...host.querySelectorAll('.action-body > button')].map((b) => b.innerText.trim()).filter(Boolean),
  });

  const selFor = () => [...host.querySelectorAll('.action-body select')].find((s) => s.options[0] && s.options[0].text.includes('magia'));
  setSel(selFor(), 'golpe_teste'); await wait(150); out.cone = readUi();
  setSel(selFor(), 'golpe_area'); await wait(150); out.area = readUi();
  setSel(selFor(), 'golpe_unico'); await wait(150); out.unico = readUi();
  out.stepOptions = tab ? 'ok' : 'sem aba';
  const errEl = host.querySelector('.error');
  out.errorText = errEl ? errEl.innerText : null;
  return out;
}
