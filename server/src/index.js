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
  getCharacterGems,
  socketGem,
  unsocketGem,
} from './services/characters.js';
import { CLASSES, SPELLS, EQUIPMENT, POTIONS, STATUS_DEFS } from './game/data.js';
import { RACES } from './game/races.js';
import { MONSTERS } from './game/monsters.js';
import { DUNGEONS } from './game/dungeons.js';
import { ECLIPSE_PERIODO } from './game/eclipse.js';
import { createSharedCharacter, getSharedCharacter } from './game/sharedStore.js';
import * as calendario from './game/calendar.js';
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

app.get('/api/characters/:id/gems', requireAuth, async (req, res) => {
  try {
    const gems = await getCharacterGems(req.params.id);
    res.json({ ok: true, gems });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/characters/:id/socket', requireAuth, async (req, res) => {
  try {
    const { slot, gemId } = req.body;
    const character = await socketGem(req.params.id, slot, gemId);
    res.json({ ok: true, character });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/characters/:id/socket', requireAuth, async (req, res) => {
  try {
    const { slot } = req.body;
    const character = await unsocketGem(req.params.id, slot);
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
    dungeons: DUNGEONS,
  });
});

// ---- Calendário do mundo / Eclipse ----
app.get('/api/calendario', (_req, res) => {
  res.json({ ok: true, ...calendario.estado() });
});

app.post('/api/calendario/avancar', requireAuth, (req, res) => {
  const dias = Number(req.body?.dias) || 1;
  res.json({ ok: true, ...calendario.avancarDia(dias) });
});

app.post('/api/calendario/dia', requireAuth, (req, res) => {
  res.json({ ok: true, ...calendario.setDia(req.body?.dia) });
});

app.post('/api/calendario/tipo', requireAuth, (req, res) => {
  res.json({ ok: true, ...calendario.setTipo(req.body?.tipo) });
});

// ---- Dungeons ----
app.get('/api/dungeons', (_req, res) => {
  res.json({
    ok: true,
    periodoEclipse: ECLIPSE_PERIODO,
    calendario: calendario.estado(),
    dungeons: DUNGEONS,
  });
});

// ---- Compartilhamento de fichas ----
app.post('/api/share/characters', requireAuth, (req, res) => {
  try {
    const rec = createSharedCharacter(req.body || {});
    const host = req.get('host');
    const proto = req.protocol || 'http';
    const base = `${proto}://${host}`;
    res.json({ ok: true, id: rec.id, url: `${base}/share/${rec.id}` });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.get('/api/share/characters/:id', (req, res) => {
  const rec = getSharedCharacter(req.params.id);
  if (!rec) return res.status(404).json({ ok: false, error: 'Ficha não encontrada ou expirada.' });
  const ch = rec.data?.data || rec.data;
  res.json({ ok: true, character: ch });
});

app.get('/api/ranking', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, level, xp, wins, gender, race, class
       FROM characters
       ORDER BY wins DESC, xp DESC
       LIMIT 20`,
    );
    res.json({ ok: true, ranking: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
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
  // SPA catch-all: apenas páginas — nunca serve index.html no lugar de assets.
  // (um /assets/* pedido quando o arquivo ainda não existe vira 404, não HTML.)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && (req.path.startsWith('/assets/') || req.path.startsWith('/icon-') || req.path.startsWith('/manifest'))) {
      return res.status(404).type('text').send('Not found');
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Sem build do frontend, a API continua funcionando e a raiz explica o problema
  // (evita a tela em branco ao abrir http://localhost:3000).
  app.get('/', (_req, res) => {
    res
      .status(503)
      .type('html')
      .send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Campo de Batalha RPG</title>
<style>body{background:#0b0e1a;color:#e8e9f5;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}
.box{max-width:620px;padding:32px;border:1px solid #343b63;border-radius:16px;background:#1a1f35}
h1{margin:0 0 12px;font-size:22px}code{background:#232a4a;padding:2px 8px;border-radius:6px}</style></head>
<body><div class="box">
<h1>⚔️ Campo de Batalha RPG</h1>
<p>O frontend ainda não foi compilado, por isso a página fica em branco.</p>
<p>Rode <code>npm run build</code> na pasta do projeto e recarregue esta página.<br>
Para desenvolver com recarga automática use <code>npm run dev</code> e abra <code>http://localhost:5173</code>.</p>
<p>A API do servidor continua no ar (porta ${PORT}).</p>
</div></body></html>`);
  });
  console.warn('[web] AVISO: pasta dist/ não encontrada — rode `npm run build` para o frontend aparecer em http://localhost:' + PORT);
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
