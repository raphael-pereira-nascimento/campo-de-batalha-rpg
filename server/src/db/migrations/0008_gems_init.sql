-- Gemas iniciais para novos personagens (Fase 3).
-- Ganha 1 gema bruta aleatória baseada em raridade ponderada pelo dropWeight.
UPDATE characters
SET inventory = COALESCE(inventory, '{}'::jsonb)
WHERE inventory IS NULL;
