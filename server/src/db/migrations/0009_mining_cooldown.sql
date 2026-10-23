-- Mineração (Fase 5): cooldown por personagem + veio.
-- Garante que o botão "Minerar" não possa ser usado em loop infinito.

CREATE TABLE IF NOT EXISTS character_mining (
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  veio_id TEXT NOT NULL,
  last_mined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, veio_id)
);

CREATE INDEX IF NOT EXISTS idx_character_mining_last ON character_mining(character_id, last_mined_at DESC);
