-- Campo de Batalha RPG - Schema PostgreSQL
-- Execute com: npm run init-db --prefix server
-- (ou use psql -f schema.sql)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  race TEXT NOT NULL DEFAULT 'humano',
  custom_class_name TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  hp_current INTEGER NOT NULL,
  hp_max INTEGER NOT NULL,
  mp_current INTEGER NOT NULL,
  mp_max INTEGER NOT NULL,
  attributes JSONB NOT NULL,
  equipment JSONB NOT NULL DEFAULT '{}',
  inventory JSONB NOT NULL DEFAULT '[]',
  spells JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby', -- lobby | in_progress | finished
  mode TEXT NOT NULL DEFAULT 'todos',   -- todos | equipes | mestre
  turn_order JSONB NOT NULL DEFAULT '[]',
  current_turn_index INTEGER NOT NULL DEFAULT 0,
  log JSONB NOT NULL DEFAULT '[]',
  winner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Participantes: personagens de jogadores E monstros do mestre.
-- character_id é NULL para monstros (identificados por is_monster).
CREATE TABLE IF NOT EXISTS battle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  hp_current INTEGER NOT NULL,
  mp_current INTEGER NOT NULL,
  alive BOOLEAN NOT NULL DEFAULT TRUE,
  is_monster BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'hero',    -- hero | enemy
  UNIQUE (battle_id, character_id)
);

-- Registro de classes customizadas (Fase 3).
CREATE TABLE IF NOT EXISTS custom_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  funcao TEXT NOT NULL DEFAULT '',
  passiva TEXT NOT NULL DEFAULT '',
  forcas TEXT NOT NULL DEFAULT '',
  fraquezas TEXT NOT NULL DEFAULT '',
  archetype TEXT NOT NULL,               -- uma das 6 classes mecânicas base
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monstros criados pelo mestre.
CREATE TABLE IF NOT EXISTS custom_monsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  attributes JSONB NOT NULL,
  arma JSONB,
  spells JSONB NOT NULL DEFAULT '[]',
  passiva TEXT NOT NULL DEFAULT '',
  escala_chefe BOOLEAN NOT NULL DEFAULT FALSE,
  multiplicador_hp NUMERIC DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raças criadas pelos jogadores (Fase 4).
CREATE TABLE IF NOT EXISTS custom_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  bonus JSONB NOT NULL DEFAULT '{}',
  passiva TEXT NOT NULL DEFAULT '',
  efeito JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Equipamentos (armas e armaduras) criados pelos jogadores (Fase 4).
CREATE TABLE IF NOT EXISTS custom_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,                    -- arma | armadura
  dano_base INTEGER DEFAULT 0,
  defesa INTEGER DEFAULT 0,
  bonus JSONB NOT NULL DEFAULT '{}',
  penalidade JSONB NOT NULL DEFAULT '{}',
  maleficio TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Golpes customizados registrados no mundo (Fase 4).
CREATE TABLE IF NOT EXISTS custom_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,                    -- fisico | magia | cura | buff | defesa
  poder INTEGER NOT NULL DEFAULT 100,    -- em % (ex.: 250 = 250% de dano)
  custo INTEGER NOT NULL DEFAULT 0,      -- MP
  cooldown INTEGER NOT NULL DEFAULT 0,   -- turnos de recarga
  todos BOOLEAN NOT NULL DEFAULT FALSE,  -- AoE (cura em massa, etc.)
  descricao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colunas idempotentes (para re-execução do schema)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'race') THEN
    ALTER TABLE characters ADD COLUMN race TEXT NOT NULL DEFAULT 'humano';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'custom_class_name') THEN
    ALTER TABLE characters ADD COLUMN custom_class_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'battles' AND column_name = 'mode') THEN
    ALTER TABLE battles ADD COLUMN mode TEXT NOT NULL DEFAULT 'todos';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'battle_participants' AND column_name = 'character_id' AND is_nullable = 'NO') THEN
    ALTER TABLE battle_participants ALTER COLUMN character_id DROP NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'battle_participants' AND column_name = 'is_monster') THEN
    ALTER TABLE battle_participants ADD COLUMN is_monster BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'battle_participants' AND column_name = 'role') THEN
    ALTER TABLE battle_participants ADD COLUMN role TEXT NOT NULL DEFAULT 'hero';
  END IF;

  -- Fase 4: criação livre de personagem (duas/três raças, duas classes, golpes próprios).
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'races') THEN
    ALTER TABLE characters ADD COLUMN races JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'classes') THEN
    ALTER TABLE characters ADD COLUMN classes JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'passiva') THEN
    ALTER TABLE characters ADD COLUMN passiva TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'skills') THEN
    ALTER TABLE characters ADD COLUMN skills JSONB NOT NULL DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'ultimate') THEN
    ALTER TABLE characters ADD COLUMN ultimate JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'especial') THEN
    ALTER TABLE characters ADD COLUMN especial JSONB;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_characters_player ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_participants_battle ON battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_custom_classes_creator ON custom_classes(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_creator ON custom_monsters(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_races_creator ON custom_races(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_equipment_creator ON custom_equipment(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_skills_creator ON custom_skills(creator_id);
