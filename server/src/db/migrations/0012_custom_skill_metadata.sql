-- Metadados dos golpes personalizados do Registro do Mundo que já existiam
-- nas fichas (characters.skills) mas se perdiam ao publicar/importar.
-- Nenhuma regra nova: apenas colunas para os campos já normalizados por
-- `normalizeSkill` e usados pelo motor de combate.

ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS status JSONB;
ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS afeta_aliados BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS buff_tipo TEXT;
ALTER TABLE custom_skills ADD COLUMN IF NOT EXISTS duracao INTEGER;
