-- Metadados da árvore de habilidades e do elemento mágico dos golpes
-- personalizados do Registro do Mundo. Estrutura técnica provisória: nível
-- manual 1–30 e flag de desbloqueio, sem custo oficial de XP (P-01/P-15).
-- Valores padrão preservam golpes já registrados (físicos, nível 1, livres).

ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS elemento TEXT NOT NULL DEFAULT 'fisico';
ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS nivel INTEGER NOT NULL DEFAULT 1;
ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS desbloqueado BOOLEAN NOT NULL DEFAULT true;
