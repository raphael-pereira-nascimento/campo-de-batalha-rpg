-- Gênero e habilidades extras (compradas com pontos excedentes) na ficha.
ALTER TABLE characters ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS habilidades JSONB;
