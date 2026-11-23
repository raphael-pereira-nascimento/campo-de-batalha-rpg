-- Descrição livre da ficha (já pedida no formulário de criação).
-- DEFAULT '' preserva as fichas existentes sem reescrita.
ALTER TABLE characters ADD COLUMN IF NOT EXISTS descricao TEXT NOT NULL DEFAULT '';
