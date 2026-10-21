-- Forja de Gemas (Fase 4): persistir estado da gema (bruta/polido/perfeita)
-- e permitir polimento/fusão gravados no servidor/cliente.

ALTER TABLE character_gems ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'bruta';
ALTER TABLE character_gems ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Índice para busca por estado
CREATE INDEX IF NOT EXISTS idx_character_gems_estado ON character_gems(estado);
