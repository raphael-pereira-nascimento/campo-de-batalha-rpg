-- Fase C/D: autenticação por senha + token e carteira de moedas.
-- Idempotente: usa ADD COLUMN IF NOT EXISTS.

ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS wallet_cents BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_players_token ON players(token);

-- Garante que o email/name continue único (name já é UNIQUE).
