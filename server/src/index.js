import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setupSockets } from './sockets.js';
import { testConnection } from './db/index.js';
import { requireAuth } from './middleware/auth.js';
import { query } from './db/index.js';
import {
  createPlayer,
  createCharacter,
  listCharacters,
  getCharacter,
  equipItem,
  getWallet,
  formatCoins,
  SHOP_ITEMS,
} from './services/characters.js';
import { CLASSES, SPELLS, EQUIPMENT, POTIONS, STATUS_DEFS } from './game/data.js';
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

// Healthcheck (usado pelo start-server.bat e por ferramentas de monitoramento)
app.get('/api/health', async (_req, res) => {
  try {
    const dbUp = await testConnection();
    res.json({ ok: true, db: dbUp ? 'up' : 'down', uptime: Math.round(process.uptime()) });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'down', uptime: Math.round(process.uptime()), error: err.message });
  }
});

// API
app.post('/api/players', async (req, res) => {
  try {
    const { token, ...player } = await createPlayer(req.body.name, req.body.password);
    res.json({ ok: true, player, token });
  } catch (err) {
    const status = err.message.includes('incorreta') || err.message.includes('senha') ? 401 : 400;
    res.status(status).json({ ok: false, error: err.message });
  }
});

// Rotas protegidas: exigem Authorization: Bearer <token>.
// Listagens públicas (gamedata, listas de custom content) permanecem abertas.
app.get('/api/wallet', requireAuth, async (req, res) => {
  try {
    const wallet = await getWallet(req.player.id);
    res.json({ ok: true, wallet });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/shop', (_req, res) => {
  res.json({ ok: true, items: SHOP_ITEMS });
});

app.post('/api/shop/buy', requireAuth, async (req, res) => {
  try {
    const { itemId, characterId } = req.body;
    const item = SHOP_ITEMS[itemId];
    if (!item) throw new Error('Item de loja inválido.');
    const { rows } = await query(
      'SELECT wallet_cents FROM players WHERE id = $1 FOR UPDATE',
      [req.player.id],
    );
    if (!rows.length) throw new Error('Jogador não encontrado.');
    if (Number(rows[0].wallet_cents) < item.preco) throw new Error('Ouro insuficiente.');
    await query('UPDATE players SET wallet_cents = wallet_cents - $1 WHERE id = $2', [
      item.preco,
      req.player.id,
    ]);
    if (characterId) {
      const { rows: charRows } = await query(
        'SELECT inventory FROM characters WHERE id = $1 AND player_id = $2',
        [characterId, req.player.id],
      );
      if (charRows.length) {
        const inventory = typeof charRows[0].inventory === 'string'
          ? JSON.parse(charRows[0].inventory)
          : (charRows[0].inventory || []);
        inventory.push({
          id: itemId,
          nome: item.nome,
          tipo: item.tipo,
          cura: item.cura || null,
          mana: item.mana || null,
          removeStatus: item.removeStatus || null,
        });
        await query('UPDATE characters SET inventory = $1 WHERE id = $2', [
          JSON.stringify(inventory),
          characterId,
        ]);
      }
    }
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/players/:id/characters', requireAuth, async (req, res) => {
  try {
    if (req.params.id !== req.player.id) return res.status(403).json({ ok: false, error: 'Acesso negado.' });
    const chars = await listCharacters(req.params.id);
    res.json({ ok: true, characters: chars });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/characters', requireAuth, async (req, res) => {
  try {
    const body = { ...req.body, playerId: req.player.id };
    const character = await createCharacter(body);
    res.json({ ok: true, character });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/characters/:id', requireAuth, async (req, res) => {
  try {
    const character = await getCharacter(req.params.id);
    if (!character) return res.status(404).json({ ok: false, error: 'Não encontrado' });
    res.json({ ok: true, character });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/characters/:id/equip', requireAuth, async (req, res) => {
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
    statuses: STATUS_DEFS,
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

app.post('/api/custom-classes', requireAuth, async (req, res) => {
  try {
    const cls = await createCustomClass(req.player.id, req.body);
    res.json({ ok: true, cls });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.put('/api/custom-classes/:id', requireAuth, async (req, res) => {
  try {
    const cls = await updateCustomClass(req.params.id, req.player.id, req.body);
    res.json({ ok: true, cls });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-classes/:id', requireAuth, async (req, res) => {
  try {
    await deleteCustomClass(req.params.id, req.player.id);
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

app.post('/api/custom-monsters', requireAuth, async (req, res) => {
  try {
    const monster = await createCustomMonster(req.player.id, req.body);
    res.json({ ok: true, monster });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-monsters/:id', requireAuth, async (req, res) => {
  try {
    await deleteCustomMonster(req.params.id, req.player.id);
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

app.post('/api/custom-races', requireAuth, async (req, res) => {
  try {
    const race = await createCustomRace(req.player.id, req.body);
    res.json({ ok: true, race });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-races/:id', requireAuth, async (req, res) => {
  try {
    await deleteCustomRace(req.params.id, req.player.id);
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

app.post('/api/custom-equipment', requireAuth, async (req, res) => {
  try {
    const item = await createCustomEquipment(req.player.id, req.body);
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-equipment/:id', requireAuth, async (req, res) => {
  try {
    await deleteCustomEquipment(req.params.id, req.player.id);
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

app.post('/api/custom-skills', requireAuth, async (req, res) => {
  try {
    const skill = await createCustomSkill(req.player.id, req.body);
    res.json({ ok: true, skill });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/custom-skills/:id', requireAuth, async (req, res) => {
  try {
    await deleteCustomSkill(req.params.id, req.player.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Frontend build (produção)
const clientDist = path.join(__dirname, '../../dist');
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
