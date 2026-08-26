-- Vitórias e recompensas: coluna wins para ranking.
ALTER TABLE characters ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0;
