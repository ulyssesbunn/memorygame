-- Adicionar coluna tempo se ela não existir
ALTER TABLE ranking_politicos 
ADD COLUMN IF NOT EXISTS tempo INTEGER DEFAULT 0;

-- Atualizar registros existentes que não têm tempo
UPDATE ranking_politicos 
SET tempo = 0 
WHERE tempo IS NULL;

-- Recriar índice para incluir tempo como critério de desempate
DROP INDEX IF EXISTS idx_ranking_jogadas;
DROP INDEX IF EXISTS idx_ranking_jogadas_tempo;
CREATE INDEX IF NOT EXISTS idx_ranking_jogadas_tempo ON ranking_politicos(jogadas, tempo);
