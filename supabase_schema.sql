-- =============================================
-- SCHEMA: CNC - Gestão de Documentos de Corte
-- Cole este SQL no Supabase > SQL Editor > New Query
-- =============================================

-- Tabela principal de PGMs
CREATE TABLE pgms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item SERIAL,
  pgm TEXT NOT NULL,
  commessa TEXT NOT NULL,
  espessura_mm NUMERIC,
  maquina TEXT GENERATED ALWAYS AS (
    CASE
      WHEN espessura_mm IS NULL OR espessura_mm = 0 THEN NULL
      WHEN espessura_mm < 23 THEN 'PLASMA'
      ELSE 'OXICORTE'
    END
  ) STORED,
  peso_kg NUMERIC,
  data_emissao DATE,
  data_inicio_corte TIMESTAMPTZ,
  data_corte TIMESTAMPTZ,
  rev TEXT DEFAULT '00',
  material TEXT,
  cr TEXT,
  fornecedor TEXT,
  status TEXT DEFAULT 'Aguardando Corte',
  mes_corte TEXT GENERATED ALWAYS AS (
    TO_CHAR(data_corte, 'Mon/YYYY')
  ) STORED,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pgms_updated_at
BEFORE UPDATE ON pgms
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilita Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pgms;

-- RLS (Row Level Security) — permite leitura/escrita autenticada
ALTER TABLE pgms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler"
  ON pgms FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir"
  ON pgms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar"
  ON pgms FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar"
  ON pgms FOR DELETE
  USING (auth.role() = 'authenticated');

-- Índices para filtros comuns
CREATE INDEX idx_pgms_commessa ON pgms(commessa);
CREATE INDEX idx_pgms_status ON pgms(status);
CREATE INDEX idx_pgms_data_emissao ON pgms(data_emissao);
CREATE INDEX idx_pgms_data_corte ON pgms(data_corte);
CREATE INDEX idx_pgms_maquina ON pgms(maquina);
