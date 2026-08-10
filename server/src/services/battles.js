import { query } from '../db/index.js';

export async function saveBattle(battle) {
  const summary = battleToSummary(battle);
  await query(
    `INSERT INTO battles
      (id, name, status, turn_order, current_turn_index, log, winner, finished_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       turn_order = EXCLUDED.turn_order,
       current_turn_index = EXCLUDED.current_turn_index,
       log = EXCLUDED.log,
       winner = EXCLUDED.winner,
       finished_at = EXCLUDED.finished_at`,
    [
      battle.id,
      battle.name,
      battle.status,
      JSON.stringify(battle.turnOrder),
      battle.currentTurnIndex,
      JSON.stringify(battle.log),
      battle.winner,
      battle.finishedAt ? new Date(battle.finishedAt) : null,
    ],
  );

  for (const p of battle.participants) {
    await query(
      `INSERT INTO battle_participants
        (battle_id, character_id, hp_current, mp_current, alive, is_monster, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (battle_id, character_id) DO UPDATE SET
         hp_current = EXCLUDED.hp_current,
         mp_current = EXCLUDED.mp_current,
         alive = EXCLUDED.alive,
         is_monster = EXCLUDED.is_monster,
         role = EXCLUDED.role`,
      [
        battle.id,
        p.isMonster ? null : p.characterId,
        p.hp,
        p.mp,
        p.alive,
        p.isMonster || false,
        p.role || 'hero',
      ],
    );
  }
  void summary;
}

function battleToSummary(battle) {
  return {
    id: battle.id,
    name: battle.name,
    status: battle.status,
    winner: battle.winner,
    participants: battle.participants.length,
  };
}

export async function listFinishedBattles(limit = 10) {
  const { rows } = await query(
    `SELECT b.id, b.name, b.status, b.winner, b.created_at, b.finished_at,
            count(bp.id) AS players
     FROM battles b
     LEFT JOIN battle_participants bp ON bp.battle_id = b.id
     GROUP BY b.id
     ORDER BY b.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows;
}
