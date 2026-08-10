import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setupSockets } from './sockets.js';
import { testConnection } from './db/index.js';
import {
  createPlayer,
  createCharacter,
  listCharacters,
  getCharacter,
  equipItem,
} from './services/characters.js';
import { CLASSES, SPELLS, EQUIPMENT, POTIONS } from './game/data.js';
import { RACES } from './game/races.js';
import { MONSTERS } from './game/monsters.js';
import {
  createCustomClass,
  listCustomClasses,
  updateCustomClass,
  deleteCustomClass,
  createCustomMonster,
  listCustomMonsters,
  deleteCustomMonster,
  createCustomRace,
  listCustomRaces,
  deleteCustomRace,
  createCustomEquipment,
  listCustomEquipment,
  deleteCustomEquipment,
  createCustomSkill,
  listCustomSkills,
  deleteCustomSkill,
} from './services/customContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// API
app.post('/api/players', async (req, res) => {
  try {
    const player = await createPlayer(req.body.name);
    res.json({ ok: true, player });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/players/:id/characters', async (req, res) => {
  try {
    const chars = await listCharacters(req.params.id);
    res.json({ ok: true, characters: chars });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/characters', async (req, res) => {
  try {
    const character = await createCharacter(req.body);
    res.json({ ok: true, character });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/characters/:id', async (req, res) => {
  try {
    const character = await getCharacter(req.params.id);
    if (!character) return res.status(404).json({ ok: false, error: 'Não encontrado' });
    res.json({ ok: true, character });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/characters/:id/equip', async (req, res) => {
  try {
    const { slot, itemId } = req.body;
    const character = await equipItem(req.params.id, slot, itemId);
    res.json({ ok: true, character });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/gamedata', (_req, res) => {
  res.json({
    classes: CLASSES,
    spells: SPELLS,
    equipment: EQUIPMENT,
    potions: POTIONS,
    races: RACES,
    monsters: MONSTERS,
  });
});

// ---- Conteúdo customizado (Fase 3) ----

app.get('/api/custom-classes', async (_req, res) => {
  try {
    const classes = await listCustomClasses();
    res.json({ ok: true, classes });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/custom-classes', async (req, res) => {
  try {
    const { creatorId, ...data } = req.body;
    const cls = await createCustomClass(creatorId, data);
    res.json({ ok: true, cls });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.put('/api/custom-classes/:id', async (req, res) => {
  try {
    const { creatorId, ...data } = req.body;
    const cls = await updateCustomClass(req.params.id, creatorId, data);
    res.json({ ok: true, cls });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-classes/:id', async (req, res) => {
  try {
    const { creatorId } = req.body;
    await deleteCustomClass(req.params.id, creatorId);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/custom-monsters', async (_req, res) => {
  try {
    const monsters = await listCustomMonsters();
    res.json({ ok: true, monsters });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/custom-monsters', async (req, res) => {
  try {
    const { creatorId, ...data } = req.body;
    const monster = await createCustomMonster(creatorId, data);
    res.json({ ok: true, monster });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-monsters/:id', async (req, res) => {
  try {
    const { creatorId } = req.body;
    await deleteCustomMonster(req.params.id, creatorId);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ---- Raças, equipamentos e golpes customizados (Fase 4) ----

app.get('/api/custom-races', async (_req, res) => {
  try {
    const races = await listCustomRaces();
    res.json({ ok: true, races });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/custom-races', async (req, res) => {
  try {
    const { creatorId, ...data } = req.body;
    const race = await createCustomRace(creatorId, data);
    res.json({ ok: true, race });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-races/:id', async (req, res) => {
  try {
    const { creatorId } = req.body;
    await deleteCustomRace(req.params.id, creatorId);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/custom-equipment', async (_req, res) => {
  try {
    const equipment = await listCustomEquipment();
    res.json({ ok: true, equipment });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/custom-equipment', async (req, res) => {
  try {
    const { creatorId, ...data } = req.body;
    const item = await createCustomEquipment(creatorId, data);
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-equipment/:id', async (req, res) => {
  try {
    const { creatorId } = req.body;
    await deleteCustomEquipment(req.params.id, creatorId);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/custom-skills', async (_req, res) => {
  try {
    const skills = await listCustomSkills();
    res.json({ ok: true, skills });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/custom-skills', async (req, res) => {
  try {
    const { creatorId, ...data } = req.body;
    const skill = await createCustomSkill(creatorId, data);
    res.json({ ok: true, skill });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-skills/:id', async (req, res) => {
  try {
    const { creatorId } = req.body;
    await deleteCustomSkill(req.params.id, creatorId);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Frontend build (produção)
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const httpServer = http.createServer(app);
const { io } = setupSockets(httpServer);

httpServer.listen(PORT, async () => {
  console.log(`⚔️  Servidor do Campo de Batalha rodando em http://localhost:${PORT}`);
  try {
    await testConnection();
    console.log('[db] PostgreSQL conectado.');
  } catch (err) {
    console.error('[db] AVISO: não consegui conectar no PostgreSQL.');
    console.error('  -> ' + err.message);
    console.error('  -> Configure DATABASE_URL e rode `npm run init-db --prefix server`.');
  }
});

export { app, io };
