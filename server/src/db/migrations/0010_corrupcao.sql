-- Corrupção do Ruidium (0 a 100 pontos) persistida por personagem.
-- O valor é a pontuação atual; o estágio e as penalidades são derivados pelas
-- regras de `src/game/corrupcao.js` (não gravamos estágio nem bônus mágicos).

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS corrupcao INTEGER NOT NULL DEFAULT 0;

ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS characters_corrupcao_check;

ALTER TABLE characters
  ADD CONSTRAINT characters_corrupcao_check CHECK (corrupcao >= 0 AND corrupcao <= 100);

CREATE INDEX IF NOT EXISTS idx_characters_corrupcao ON characters(corrupcao);
