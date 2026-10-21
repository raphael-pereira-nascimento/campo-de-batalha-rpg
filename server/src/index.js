import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setupSockets } from './sockets.js';
import { testConnection } from './db/index.js';
import { requireAuth, optionalAuth } from './middleware/auth.js';
import { query } from './db/index.js';
import {
  createPlayer,
  createCharacter,
  listCharacters,
  getCharacter,
  levelUpCharacter,
  setCharacterLevel,
  equipItem,
  getWallet,
  formatCoins,
  SHOP_ITEMS,
  getCharacterGems,
  getCharacterGemsDetailed,
  addGemToInventory,
  removeGemFromInventory,
  socketGem,
  unsocketGem,
} from './services/characters.js';
import { gemIsRaw, getGemById, GEMS, pickGemByWeight, mineGem, rollGemDrop, getInitialGem, MINERA_VEIOS } from './game/gems.js';
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
  updateCustomMonster,
  deleteCustomMonster,
  createCustomRace,
  listCustomRaces,
  updateCustomRace,
  deleteCustomRace,
  createCustomEquipment,
  listCustomEquipment,
  updateCustomEquipment,
  deleteCustomEquipment,
  createCustomSkill,
  listCustomSkills,
  updateCustomSkill,
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

// ── Taverna: bebidas e comidas (consumíveis de batalha) ──
app.get('/api/tavern', async (_req, res) => {
  const { TAVERN_FOODS } = await import('./game/data.js');
  res.json({ ok: true, items: Object.assign({}, TAVERN_DRINKS, TAVERN_FOODS) });
});

app.post('/api/tavern/buy', requireAuth, async (req, res) => {
  try {
    const { itemId, characterId } = req.body;
    const { TAVERN_FOODS } = await import('./game/data.js');
    const item = TAVERN_DRINKS[itemId] || TAVERN_FOODS[itemId] || null;
    if (!item) throw new Error('Item inválido.');
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
          emoji: item.emoji || null,
          cura: item.cura || null,
          mana: item.mana || null,
          removeStatus: item.removeStatus || null,
          status: item.status || null,
          buffFisico: item.buffFisico || null,
          buffMagico: item.buffMagico || null,
          buffTurns: item.buffTurns || null,
          drunk: item.drunk || false,
          drunkTurns: item.drunkTurns || 0,
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
    // Gemas iniciais para todo personagem novo (Fase 3)
    try {
      const gems = await getCharacterGemsDetailed(character.id);
      if (gems.length === 0) {
        const gemId = getInitialGem();
        await addGemToInventory(character.id, gemId, 'bruta');
      }
    } catch (e) {
      // não bloqueia criação da ficha se falhar ao dar gema inicial
    }
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

app.post('/api/characters/:id/level-up', requireAuth, async (req, res) => {
  try {
    const character = await levelUpCharacter(req.params.id, req.player.id);
    res.json({ ok: true, character });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/characters/:id/level', requireAuth, async (req, res) => {
  try {
    const character = await setCharacterLevel(req.params.id, req.player.id, req.body?.level);
    res.json({ ok: true, character });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ── Sistema de Gemas: obtenção (drop/mineração/loja/iniciais) ──────────────
app.get('/api/gems/catalog', (_req, res) => {
  try {
    const catalog = Object.values(GEMS).map((g) => ({
      id: g.id,
      nome: g.nome,
      raridade: g.raridade,
      estado: g.estado,
      bioma: g.bioma,
      dropWeight: g.dropWeight,
      efeitos: g.efeitos,
      preco: g.preco || (g.raridade === 'lendaria' ? 5000 : g.raridade === 'epica' ? 2500 : g.raridade === 'rara' ? 1200 : g.raridade === 'incomum' ? 600 : 250),
    }));
    res.json({ ok: true, gems: catalog, veios: MINERA_VEIOS });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/characters/:id/gems/detailed', requireAuth, async (req, res) => {
  try {
    const gems = await getCharacterGemsDetailed(req.params.id);
    res.json({ ok: true, gems });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/gems/mine', requireAuth, async (req, res) => {
  try {
    const { characterId, veioId } = req.body || {};
    if (!characterId) throw new Error('Informe o personagem.');
    const char = await getCharacter(characterId);
    if (!char) throw new Error('Personagem não encontrado.');
    if (char.player_id !== req.player.id) throw new Error('Este personagem não é seu.');

    const veio = MINERA_VEIOS.find((v) => v.id === veioId) || MINERA_VEIOS[0];
    const { rows } = await query('SELECT wallet_cents FROM players WHERE id = $1 FOR UPDATE', [req.player.id]);
    if (Number(rows[0]?.wallet_cents || 0) < (veio.custoCents || 0)) {
      throw new Error(`Ouro insuficiente. Custo: ${veio.custoCents} moedas.`);
    }
    if ((veio.custoCents || 0) > 0) {
      await query('UPDATE players SET wallet_cents = wallet_cents - $1 WHERE id = $2', [veio.custoCents, req.player.id]);
    }

    const result = mineGem(veio.id);
    // Gema minerada vai pro inventário do personagem (começa bruta, incentivando polimento)
    await addGemToInventory(characterId, result.gemId, 'bruta');
    res.json({ ok: true, gemId: result.gemId, veio: result.veio });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/gems/shop/buy', requireAuth, async (req, res) => {
  try {
    const { characterId, gemId } = req.body || {};
    const g = getGemById(gemId);
    if (!g) throw new Error('Gema inválida.');
    if (!characterId) throw new Error('Informe o personagem.');
    const char = await getCharacter(characterId);
    if (!char) throw new Error('Personagem não encontrado.');
    if (char.player_id !== req.player.id) throw new Error('Este personagem não é seu.');

    const preco = g.preco || (g.raridade === 'lendaria' ? 5000 : g.raridade === 'epica' ? 2500 : g.raridade === 'rara' ? 1200 : g.raridade === 'incomum' ? 600 : 250);
    const { rows } = await query('SELECT wallet_cents FROM players WHERE id = $1 FOR UPDATE', [req.player.id]);
    if (Number(rows[0]?.wallet_cents || 0) < preco) throw new Error('Ouro insuficiente.');

    await query('UPDATE players SET wallet_cents = wallet_cents - $1 WHERE id = $2', [preco, req.player.id]);
    // Compra vem bruta para incentivar o uso da Forja
    await addGemToInventory(characterId, gemId, 'bruta');
    res.json({ ok: true, gemId });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/gems/fuse', requireAuth, async (req, res) => {
  try {
    const { characterId, gemA, gemB, resultado } = req.body || {};
    if (!characterId) throw new Error('Informe o personagem.');
    if (!gemA || !gemB || !resultado) throw new Error('Dados inválidos para fusão.');
    const char = await getCharacter(characterId);
    if (!char || char.player_id !== req.player.id) throw new Error('Acesso negado.');
    const gems = await getCharacterGemsDetailed(characterId);
    const hasA = gems.some((g) => g.gem_id === gemA.id && g.estado === gemA.estado);
    const hasB = gems.some((g) => g.gem_id === gemB.id && g.estado === gemB.estado);
    if (!hasA || !hasB) throw new Error('Gemas não encontradas no inventário.');
    await removeGemFromInventory(characterId, gemA.id, gemA.estado);
    await removeGemFromInventory(characterId, gemB.id, gemB.estado);
    await addGemToInventory(characterId, resultado.id, 'bruta');
    res.json({ ok: true, resultadoId: resultado.id });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/gems/polish', requireAuth, async (req, res) => {
  try {
    const { characterId, gemId, fromEstado, toEstado } = req.body || {};
    if (!characterId || !gemId || !fromEstado || !toEstado) throw new Error('Dados inválidos para polimento.');
    const char = await getCharacter(characterId);
    if (!char || char.player_id !== req.player.id) throw new Error('Acesso negado.');
    const gems = await getCharacterGemsDetailed(characterId);
    const has = gems.some((g) => g.gem_id === gemId && g.estado === fromEstado);
    if (!has) throw new Error('Gema não encontrada no inventário.');
    await removeGemFromInventory(characterId, gemId, fromEstado);
    await addGemToInventory(characterId, gemId, toEstado);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/gems/initial', requireAuth, async (req, res) => {
  try {
    const { characterId } = req.body || {};
    if (!characterId) throw new Error('Informe o personagem.');
    const char = await getCharacter(characterId);
    if (!char) throw new Error('Personagem não encontrado.');
    if (char.player_id !== req.player.id) throw new Error('Este personagem não é seu.');
    const gems = await getCharacterGemsDetailed(characterId);
    if (gems.length > 0) return res.json({ ok: true, already: true });
    const gemId = getInitialGem();
    await addGemToInventory(characterId, gemId, 'bruta');
    res.json({ ok: true, gemId });
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

// ---- Conteúdo customizado (Registro do Mundo) ----
//
// Visibilidade: as listagens mostram o catálogo público (is_public) de todos
// MAIS as criações privadas do próprio jogador (?mine=1 filtra só as minhas).
// A identidade vem do token opcional (optionalAuth).

const registryViews = {
  classes: {
    list: listCustomClasses, key: 'classes',
    create: createCustomClass, update: updateCustomClass, remove: deleteCustomClass, singular: 'cls',
  },
  monsters: {
    list: listCustomMonsters, key: 'monsters',
    create: createCustomMonster, update: updateCustomMonster, remove: deleteCustomMonster, singular: 'monster',
  },
  races: {
    list: listCustomRaces, key: 'races',
    create: createCustomRace, update: updateCustomRace, remove: deleteCustomRace, singular: 'race',
  },
  equipment: {
    list: listCustomEquipment, key: 'equipment',
    create: createCustomEquipment, update: updateCustomEquipment, remove: deleteCustomEquipment, singular: 'item',
  },
  skills: {
    list: listCustomSkills, key: 'skills',
    create: createCustomSkill, update: updateCustomSkill, remove: deleteCustomSkill, singular: 'skill',
  },
};

for (const [route, view] of Object.entries(registryViews)) {
  for (const [route, view] of Object.entries(registryViews)) {
  app.get(`/api/custom-${route}`, optionalAuth, async (req, res) => {
    try {
      let rows = await view.list(req.player?.id);
      if (req.query.mine === '1') {
        if (!req.player) return res.status(401).json({ ok: false, error: 'Entre na sua conta para ver suas criações.' });
        rows = rows.filter((row) => row.creator_id === req.player.id);
      }
      res.json({ ok: true, [view.key]: rows });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post(`/api/custom-${route}`, requireAuth, async (req, res) => {
    try {
      const item = await view.create(req.player.id, req.body);
      res.json({ ok: true, [view.singular]: item });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.put(`/api/custom-${route}/:id`, requireAuth, async (req, res) => {
    try {
      const item = await view.update(req.params.id, req.player.id, req.body);
      res.json({ ok: true, [view.singular]: item });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.delete(`/api/custom-${route}/:id`, requireAuth, async (req, res) => {
    try {
      await view.remove(req.params.id, req.player.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });
}

// Frontend build (produção)
const clientDist = path.join(__dirname, '../../dist');
if (fs.existsSync(clientDist)) {
  // Cache inteligente: a "casca" (index.html) nunca fica em cache (sempre
  // revalida, pois muda a cada build) e os assets hasheados (/assets/*) são
  // imutáveis — o nome do arquivo contém o hash do conteúdo.
  const staticOpts = {
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  };
  app.use(express.static(clientDist, staticOpts));
  // SPA catch-all: apenas páginas — nunca serve index.html no lugar de assets.
  // (um /assets/* pedido quando o arquivo ainda não existe vira 404, não HTML.)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && (req.path.startsWith('/assets/') || req.path.startsWith('/icon-') || req.path.startsWith('/manifest'))) {
      return res.status(404).type('text').set('Cache-Control', 'no-store').send('Not found');
    }
    res.set('Cache-Control', 'no-cache');
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
