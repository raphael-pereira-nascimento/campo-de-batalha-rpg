import { Server } from 'socket.io';
import { BattleManager } from './game/battleManager.js';
import { MONSTERS, defFromCustomMonster } from './game/monsters.js';
import { getCharacter } from './services/characters.js';
import { query } from './db/index.js';
import { saveBattle, listFinishedBattles } from './services/battles.js';
import { grantRewards } from './services/characters.js';
import { getCustomMonster } from './services/customContent.js';

export function setupSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const manager = new BattleManager({
    emit: (battle, deletedId) => {
      const id = battle ? battle.id : deletedId;
      if (battle) io.to(id).emit('battleUpdate', serializeBattle(battle));
      if (deletedId) io.to(deletedId).emit('battleUpdate', null);
      io.emit('lobbyUpdate', manager.listBattles());
    },
    saveBattle: (battle) => {
      saveBattle(battle).catch((err) => console.error('[battle] falha ao salvar:', err.message));
    },
    onBattleEnd: (battle) => {
      grantRewards(battle).catch((err) => console.error('[battle] falha ao dar XP:', err.message));
    },
  });

  async function authenticate(socket, token, ack) {
    if (!token) return ack && ack({ ok: false, error: 'Token ausente.' });
    try {
      const { rows } = await query('SELECT id, name FROM players WHERE token = $1', [token]);
      if (!rows.length) return ack && ack({ ok: false, error: 'Token inválido.' });
      socket.data.playerId = rows[0].id;
      socket.data.playerName = rows[0].name;
      return ack && ack({ ok: true });
    } catch (err) {
      ack && ack({ ok: false, error: err.message });
    }
  }

  io.on('connection', (socket) => {
    socket.emit('lobbyUpdate', manager.listBattles());

    socket.on('authenticate', (payload, ack) => authenticate(socket, payload && payload.token, ack));

    const me = () => socket.data.playerId;
    function assertAuthed() {
      if (!socket.data.playerId) throw new Error('Você precisa estar autenticado.');
    }

    socket.on('joinLobby', () => {
      socket.emit('lobbyUpdate', manager.listBattles());
    });

    socket.on('joinRoom', ({ battleId }) => {
      if (battleId) socket.join(battleId);
    });

    socket.on('leaveRoom', ({ battleId }) => {
      if (battleId) socket.leave(battleId);
    });

    socket.on('getBattle', ({ battleId }, ack) => {
      try {
        const battle = manager.getBattle(battleId);
        ack({ ok: true, battle: battle ? serializeBattle(battle) : null });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('createBattle', async ({ name, mode, characterId }, ack) => {
      try {
        assertAuthed();
        const character = await getCharacter(characterId);
        if (!character) throw new Error('Personagem não encontrado.');
        if (character.player_id !== me()) throw new Error('Este personagem não é seu.');
        const battle = manager.createBattle({ name, mode, host: me(), hostName: socket.data.playerName || 'Anfitrião', character });
        socket.join(battle.id);
        publishBattle(io, manager, battle);
        ack({ ok: true, battleId: battle.id });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('joinBattle', async ({ battleId, characterId, team }, ack) => {
      try {
        assertAuthed();
        const character = await getCharacter(characterId);
        if (!character) throw new Error('Personagem não encontrado.');
        if (character.player_id !== me()) throw new Error('Este personagem não é seu.');
        const battle = manager.joinBattle({ battleId, playerId: me(), playerName: socket.data.playerName || character.name, character, team });
        socket.join(battleId);
        publishBattle(io, manager, battle);
        ack({ ok: true, battleId: battle.id });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('leaveBattle', ({ battleId, characterId }, ack) => {
      try {
        const result = manager.leaveBattle({ battleId, characterId });
        socket.leave(battleId);
        if (result === null) {
          io.to(battleId).emit('battleUpdate', null);
          io.emit('lobbyUpdate', manager.listBattles());
        } else {
          publishBattle(io, manager, result);
        }
        ack({ ok: true });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('startBattle', ({ battleId }, ack) => {
      try {
        assertAuthed();
        const battle = manager.startBattle({ battleId, playerId: me() });
        ack({ ok: true, battle });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('addMonster', async ({ battleId, monsterId, customMonsterId }, ack) => {
      try {
        assertAuthed();
        let def = null;
        if (customMonsterId) {
          const row = await getCustomMonster(customMonsterId);
          if (!row) throw new Error('Monstro customizado não encontrado.');
          if (row.creator_id !== me()) throw new Error('Este monstro não é seu.');
          def = defFromCustomMonster(row);
        } else if (MONSTERS[monsterId]) {
          def = MONSTERS[monsterId];
        } else {
          throw new Error('Monstro desconhecido.');
        }
        const battle = manager.addMonster({ battleId, hostId: me(), monsterDef: def });
        publishBattle(io, manager, battle);
        ack({ ok: true, battleId: battle.id });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('removeMonster', ({ battleId, participantId }, ack) => {
      try {
        const battle = manager.removeMonster({ battleId, hostId: me(), participantId });
        publishBattle(io, manager, battle);
        ack({ ok: true });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('battleAction', ({ battleId, characterId, action }, ack) => {
      try {
        assertAuthed();
        const battle = manager.getBattle(battleId);
        if (!battle) throw new Error('Batalha não encontrada.');
        const participant = battle.participants.find(
          (q) => q.characterId === characterId || q.uid === characterId,
        );
        if (!participant) throw new Error('Participante não está na batalha.');
        if (participant.isMonster) {
          if (me() !== battle.host) throw new Error('Somente o mestre controla os inimigos.');
        } else if (participant.playerId !== me()) {
          throw new Error('Este personagem não é seu.');
        }
        const managed = manager.handleAction({ battleId, characterId, playerId: me(), action });
        ack({ ok: true, battle: managed ? serializeBattle(managed) : null });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('getHistory', async (ack) => {
      try {
        const rows = await listFinishedBattles();
        ack({ ok: true, battles: rows });
      } catch (err) {
        ack({ ok: false, error: err.message });
      }
    });

    socket.on('setIdentity', ({ playerName }) => {
      socket.data.playerName = playerName;
    });
  });

  return { io, manager };
}

function publishBattle(io, manager, battle) {
  io.to(battle.id).emit('battleUpdate', serializeBattle(battle));
  io.emit('lobbyUpdate', manager.listBattles());
}

function serializeBattle(battle) {
  if (!battle) return null;
  return {
    id: battle.id,
    name: battle.name,
    mode: battle.mode,
    status: battle.status,
    host: battle.host,
    hostName: battle.hostName,
    winner: battle.winner,
    participants: battle.participants,
    turnOrder: battle.turnOrder,
    currentTurnIndex: battle.currentTurnIndex,
    log: battle.log.slice(-80),
    createdAt: battle.createdAt,
    finishedAt: battle.finishedAt,
  };
}
