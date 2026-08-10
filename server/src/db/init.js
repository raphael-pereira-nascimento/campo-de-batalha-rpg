import 'dotenv/config';
import { initDb, testConnection, query } from '../db/index.js';
import { RACES } from '../game/races.js';
import { CLASSES, SPELLS } from '../game/data.js';

// Converte fichas do modelo antigo (race/class/spells) para o novo
// modelo (races[], classes[], skills[], passiva, ultimate, especial).
async function migrateCharacters() {
  const { rows } = await query(
    `SELECT id, race, class, attributes, spells, races, classes, skills, ultimate, especial
     FROM characters WHERE races IS NULL OR classes IS NULL`,
  );
  let migrated = 0;
  for (const row of rows) {
    let races = row.races;
    if (!races || races.length === 0) {
      const race = RACES[row.race] || RACES.humano;
      const choice =
        'escolha' in race.bonus ? row.attributes._raceChoice || 'forca' : null;
      races = [
        {
          id: race.id,
          nome: race.nome,
          bonus: race.bonus,
          passiva: race.passiva,
          efeito: race.efeito || {},
          ...(choice ? { choice } : {}),
        },
      ];
    }
    let classes = row.classes;
    if (!classes || classes.length === 0) {
      const cls = CLASSES[row.class] || CLASSES.guerreiro;
      classes = [
        {
          id: cls.id,
          nome: cls.nome,
          bonus: cls.bonus,
          hpPerLevel: cls.hpPerLevel,
          mpPerLevel: cls.mpPerLevel,
          levelUp: cls.levelUp,
          spellList: cls.spellList,
          archetype: cls.id,
          primary: true,
        },
      ];
    }
    let skills = row.skills;
    if (!skills || skills.length === 0) {
      skills = (row.spells || [])
        .map((id) => SPELLS[id])
        .filter(Boolean)
        .map((s) => ({
          id: s.nome,
          nome: s.nome,
          tipo: s.tipo === 'ataque' ? 'magia' : s.tipo,
          poder: Math.round((s.poder || 1) * 100),
          custo: s.custo || 0,
          cooldown: 0,
          todos: s.nome === 'Cura em Massa',
          desc: s.desc || '',
        }));
    }
    await query(
      `UPDATE characters
       SET races = $1, classes = $2, skills = $3,
           passiva = COALESCE(passiva, ''),
           ultimate = COALESCE(ultimate, 'null')::jsonb,
           especial = COALESCE(especial, 'null')::jsonb
       WHERE id = $4`,
      [JSON.stringify(races), JSON.stringify(classes), JSON.stringify(skills), row.id],
    );
    migrated += 1;
  }
  return migrated;
}

try {
  await testConnection();
  await initDb();
  const migrated = await migrateCharacters();
  const { rows } = await query('SELECT count(*)::int AS n FROM characters');
  console.log(`[db] Conexão OK. Personagens cadastrados: ${rows[0].n}`);
  if (migrated > 0) console.log(`[db] Fichas migradas para o novo modelo: ${migrated}`);
  process.exit(0);
} catch (err) {
  console.error('[db] Falha ao inicializar:', err.message);
  console.error('Verifique se o PostgreSQL está rodando e a DATABASE_URL.');
  process.exit(1);
}
