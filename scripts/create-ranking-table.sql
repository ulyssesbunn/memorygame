-- Criar tabela para o ranking público
CREATE TABLE IF NOT EXISTS ranking_politicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  jogadas INTEGER NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tempo INTEGER DEFAULT 0
);

-- Atualizar índice para incluir tempo como critério de desempate
DROP INDEX IF EXISTS idx_ranking_jogadas;
CREATE INDEX IF NOT EXISTS idx_ranking_jogadas_tempo ON ranking_politicos(jogadas, tempo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE ranking_politicos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública" ON ranking_politicos
FOR SELECT USING (true);

-- Política para permitir inserção pública
CREATE POLICY "Permitir inserção pública" ON ranking_politicos
FOR INSERT WITH CHECK (true);
