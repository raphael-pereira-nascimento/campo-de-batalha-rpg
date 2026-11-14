-- Histórico de Corrupção do Ruidium por personagem.
-- Cada linha registra a pontuação anterior, a nova e o motivo (ganho,
-- recuperação ou ajuste manual do mestre). O estágio continua sendo derivado
-- de `game/corrupcao.js` e não é gravado aqui.

CREATE TABLE IF NOT EXISTS character_corruption_history (
  id BIGSERIAL PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  pontos_anteriores INTEGER NOT NULL,
  pontos_novos INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  motivo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corruption_history_character
  ON character_corruption_history(character_id, criado_em DESC);
