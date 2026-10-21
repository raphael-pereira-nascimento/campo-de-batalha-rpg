-- Registro do Mundo (Fase 2): visibilidade pública e campos que se perdiam.
--
-- 1) is_public: separa "minhas criações" (privadas por padrão, só o dono vê)
--    do "catálogo do mundo" (publicadas, visíveis/uso por todos).
-- 2) campos antes descartados: golpes (alvo/alvos/splash) e monstros
--    (elemento/fraquezas/resistencias), além de efeito da raça no front.

ALTER TABLE custom_classes   ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE custom_monsters  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE custom_races     ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE custom_equipment ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE custom_skills    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE custom_monsters ADD COLUMN IF NOT EXISTS elemento      TEXT;
ALTER TABLE custom_monsters ADD COLUMN IF NOT EXISTS fraquezas     JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE custom_monsters ADD COLUMN IF NOT EXISTS resistencias  JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS alvo   TEXT    NOT NULL DEFAULT 'unico';
ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS alvos  INTEGER NOT NULL DEFAULT 3;
ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS splash NUMERIC NOT NULL DEFAULT 0.5;

-- Índice para separar "minhas criações" (creator_id + is_public) rapidamente.
CREATE INDEX IF NOT EXISTS idx_custom_classes_public   ON custom_classes(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_public  ON custom_monsters(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_races_public     ON custom_races(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_equipment_public ON custom_equipment(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_skills_public    ON custom_skills(is_public);
