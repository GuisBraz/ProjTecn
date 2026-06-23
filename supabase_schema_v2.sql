-- =============================================
-- SCHEMA CORRIGIDO: CNC - Gestão de Documentos
-- Cole este SQL no Supabase > SQL Editor > New Query
-- =============================================

-- Tabela principal de PGMs
CREATE TABLE pgms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item SERIAL,
  pgm TEXT NOT NULL,
  commessa TEXT NOT NULL,
  espessura_mm NUMERIC,
  maquina TEXT,
  peso_kg NUMERIC,
  data_emissao DATE,
  data_inicio_corte TIMESTAMPTZ,
  data_corte TIMESTAMPTZ,
  rev TEXT DEFAULT '00',
  material TEXT,
  cr TEXT,
  fornecedor TEXT,
  status TEXT DEFAULT 'Aguardando Corte',
  mes_corte TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função que calcula maquina e mes_corte automaticamente
CREATE OR REPLACE FUNCTION calcular_campos_pgm()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcula máquina com base na espessura
  IF NEW.espessura_mm IS NULL OR NEW.espessura_mm = 0 THEN
    NEW.maquina := NULL;
  ELSIF NEW.espessura_mm < 23 THEN
    NEW.maquina := 'PLASMA';
  ELSE
    NEW.maquina := 'OXICORTE';
  END IF;

  -- Calcula mês/ano do corte
  IF NEW.data_corte IS NOT NULL THEN
    NEW.mes_corte := TO_CHAR(NEW.data_corte, 'Mon/YYYY');
  ELSE
    NEW.mes_corte := NULL;
  END IF;

  -- Atualiza updated_at
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que dispara antes de INSERT ou UPDATE
CREATE TRIGGER trg_pgms_calculos
BEFORE INSERT OR UPDATE ON pgms
FOR EACH ROW EXECUTE FUNCTION calcular_campos_pgm();

-- Habilita Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pgms;

-- RLS (Row Level Security)
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
