-- =====================================================
-- TABELAS PARA PRODUÇÃO TÉCNICA E PERFIL LATTES
-- =====================================================

-- Tabela principal para armazenar currículos importados
CREATE TABLE IF NOT EXISTS journalscope.lattes_curriculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lattes_id VARCHAR(50) UNIQUE,
    nome_completo VARCHAR(500) NOT NULL,
    nome_citacao VARCHAR(500),
    orcid VARCHAR(50),
    instituicao VARCHAR(500),
    departamento VARCHAR(500),
    unidade VARCHAR(500),
    nacionalidade VARCHAR(100),
    data_atualizacao_lattes DATE,
    xml_hash VARCHAR(64), -- Para detectar se o currículo mudou
    dados_completos JSONB, -- Dados parseados do XML (backup)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para buscas
CREATE INDEX IF NOT EXISTS idx_lattes_curriculos_user ON journalscope.lattes_curriculos(user_id);
CREATE INDEX IF NOT EXISTS idx_lattes_curriculos_lattes_id ON journalscope.lattes_curriculos(lattes_id);

-- Tabela de produção técnica
CREATE TABLE IF NOT EXISTS journalscope.lattes_producao_tecnica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculo_id UUID REFERENCES journalscope.lattes_curriculos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- software, patent, tech_product, process, technical_work, didactic_material
    categoria VARCHAR(50), -- produto_tecnologico, producao_tecnica
    titulo VARCHAR(1000) NOT NULL,
    ano INTEGER,
    natureza VARCHAR(200),
    descricao TEXT,
    instituicao VARCHAR(500),
    disponibilidade VARCHAR(200),
    numero_registro VARCHAR(200),
    data_deposito DATE,
    pais VARCHAR(100),
    situacao VARCHAR(100),
    plataforma VARCHAR(200),
    cidade VARCHAR(200),
    -- Marcação manual do pesquisador
    is_produto_tecnologico BOOLEAN DEFAULT FALSE,
    destaque_pagina_inicial BOOLEAN DEFAULT FALSE,
    ordem_exibicao INTEGER DEFAULT 0,
    -- Metadados
    dados_extras JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_producao_tecnica_curriculo ON journalscope.lattes_producao_tecnica(curriculo_id);
CREATE INDEX IF NOT EXISTS idx_producao_tecnica_tipo ON journalscope.lattes_producao_tecnica(tipo);
CREATE INDEX IF NOT EXISTS idx_producao_tecnica_produto ON journalscope.lattes_producao_tecnica(is_produto_tecnologico) WHERE is_produto_tecnologico = TRUE;
CREATE INDEX IF NOT EXISTS idx_producao_tecnica_destaque ON journalscope.lattes_producao_tecnica(destaque_pagina_inicial) WHERE destaque_pagina_inicial = TRUE;

-- Tabela de artigos (para pontuação Qualis)
CREATE TABLE IF NOT EXISTS journalscope.lattes_artigos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculo_id UUID REFERENCES journalscope.lattes_curriculos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) DEFAULT 'published', -- published, accepted
    titulo VARCHAR(1000) NOT NULL,
    titulo_ingles VARCHAR(1000),
    ano INTEGER,
    doi VARCHAR(200),
    issn VARCHAR(20),
    periodico VARCHAR(500),
    volume VARCHAR(50),
    fasciculo VARCHAR(50),
    paginas VARCHAR(50),
    idioma VARCHAR(50),
    -- Classificação Qualis
    qualis_2021_2024_estrato VARCHAR(10),
    qualis_2021_2024_pontos INTEGER,
    qualis_2025_2028_classificacao VARCHAR(10),
    qualis_2025_2028_pontos INTEGER,
    fontes_classificacao JSONB, -- Fontes usadas para classificar (ABDC, ABS, JCR, etc.)
    -- Autores
    autores JSONB,
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_artigos_curriculo ON journalscope.lattes_artigos(curriculo_id);
CREATE INDEX IF NOT EXISTS idx_artigos_ano ON journalscope.lattes_artigos(ano);
CREATE INDEX IF NOT EXISTS idx_artigos_issn ON journalscope.lattes_artigos(issn);

-- Tabela de orientações
CREATE TABLE IF NOT EXISTS journalscope.lattes_orientacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculo_id UUID REFERENCES journalscope.lattes_curriculos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL, -- phd, master
    status VARCHAR(20) NOT NULL, -- completed, ongoing
    titulo VARCHAR(1000) NOT NULL,
    ano INTEGER,
    nome_orientando VARCHAR(500),
    instituicao VARCHAR(500),
    programa VARCHAR(500),
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orientacoes_curriculo ON journalscope.lattes_orientacoes(curriculo_id);
CREATE INDEX IF NOT EXISTS idx_orientacoes_status ON journalscope.lattes_orientacoes(status);
CREATE INDEX IF NOT EXISTS idx_orientacoes_ongoing ON journalscope.lattes_orientacoes(status) WHERE status = 'ongoing';

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS journalscope.lattes_projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculo_id UUID REFERENCES journalscope.lattes_curriculos(id) ON DELETE CASCADE,
    tipo VARCHAR(50), -- research, extension, development
    nome VARCHAR(1000) NOT NULL,
    descricao TEXT,
    ano_inicio INTEGER,
    ano_fim INTEGER,
    situacao VARCHAR(50),
    natureza VARCHAR(100),
    financiadores JSONB,
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_projetos_curriculo ON journalscope.lattes_projetos(curriculo_id);
CREATE INDEX IF NOT EXISTS idx_projetos_ativos ON journalscope.lattes_projetos(ano_fim) WHERE ano_fim IS NULL;

-- Tabela de indicadores bibliográficos
CREATE TABLE IF NOT EXISTS journalscope.lattes_indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculo_id UUID REFERENCES journalscope.lattes_curriculos(id) ON DELETE CASCADE UNIQUE,
    -- Contagens
    artigos_total INTEGER DEFAULT 0,
    artigos_internacionais INTEGER DEFAULT 0,
    artigos_nacionais INTEGER DEFAULT 0,
    livros_completos INTEGER DEFAULT 0,
    capitulos_livro INTEGER DEFAULT 0,
    producao_tecnica_total INTEGER DEFAULT 0,
    produtos_tecnologicos INTEGER DEFAULT 0,
    orientacoes_concluidas INTEGER DEFAULT 0,
    orientacoes_andamento INTEGER DEFAULT 0,
    projetos_ativos INTEGER DEFAULT 0,
    -- Pontuação Qualis
    pontuacao_2021_2024 INTEGER DEFAULT 0,
    pontuacao_2025_2028 INTEGER DEFAULT 0,
    -- Índices (se informados pelo pesquisador)
    h_index INTEGER,
    citacoes_total INTEGER,
    -- Resumo do CV
    resumo_cv TEXT,
    -- Metadados
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE journalscope.lattes_curriculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.lattes_producao_tecnica ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.lattes_artigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.lattes_orientacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.lattes_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.lattes_indicadores ENABLE ROW LEVEL SECURITY;

-- Políticas para currículos (usuário vê apenas seus próprios dados)
CREATE POLICY "Users can view own curriculo" ON journalscope.lattes_curriculos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own curriculo" ON journalscope.lattes_curriculos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own curriculo" ON journalscope.lattes_curriculos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own curriculo" ON journalscope.lattes_curriculos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para produção técnica
CREATE POLICY "Users can view own producao tecnica" ON journalscope.lattes_producao_tecnica
    FOR SELECT USING (
        curriculo_id IN (SELECT id FROM journalscope.lattes_curriculos WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own producao tecnica" ON journalscope.lattes_producao_tecnica
    FOR INSERT WITH CHECK (
        curriculo_id IN (SELECT id FROM journalscope.lattes_curriculos WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own producao tecnica" ON journalscope.lattes_producao_tecnica
    FOR UPDATE USING (
        curriculo_id IN (SELECT id FROM journalscope.lattes_curriculos WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own producao tecnica" ON journalscope.lattes_producao_tecnica
    FOR DELETE USING (
        curriculo_id IN (SELECT id FROM journalscope.lattes_curriculos WHERE user_id = auth.uid())
    );

-- Políticas similares para artigos
CREATE POLICY "Users can manage own artigos" ON journalscope.lattes_artigos
    FOR ALL USING (
        curriculo_id IN (SELECT id FROM journalscope.lattes_curriculos WHERE user_id = auth.uid())
    );

-- Políticas para orientações
CREATE POLICY "Users can manage own orientacoes" ON journalscope.lattes_orientacoes
    FOR ALL USING (
        curriculo_id IN (SELECT id FROM journalscope.lattes_curriculos WHERE user_id = auth.uid())
    );

-- Políticas para projetos
CREATE POLICY "Users can manage own projetos" ON journalscope.lattes_projetos
    FOR ALL USING (
        curriculo_id IN (SELECT id FROM journalscope.lattes_curriculos WHERE user_id = auth.uid())
    );

-- Políticas para indicadores
CREATE POLICY "Users can manage own indicadores" ON journalscope.lattes_indicadores
    FOR ALL USING (
        curriculo_id IN (SELECT id FROM journalscope.lattes_curriculos WHERE user_id = auth.uid())
    );

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION journalscope.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_lattes_curriculos_updated_at ON journalscope.lattes_curriculos;
CREATE TRIGGER update_lattes_curriculos_updated_at
    BEFORE UPDATE ON journalscope.lattes_curriculos
    FOR EACH ROW EXECUTE FUNCTION journalscope.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lattes_producao_tecnica_updated_at ON journalscope.lattes_producao_tecnica;
CREATE TRIGGER update_lattes_producao_tecnica_updated_at
    BEFORE UPDATE ON journalscope.lattes_producao_tecnica
    FOR EACH ROW EXECUTE FUNCTION journalscope.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lattes_artigos_updated_at ON journalscope.lattes_artigos;
CREATE TRIGGER update_lattes_artigos_updated_at
    BEFORE UPDATE ON journalscope.lattes_artigos
    FOR EACH ROW EXECUTE FUNCTION journalscope.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lattes_orientacoes_updated_at ON journalscope.lattes_orientacoes;
CREATE TRIGGER update_lattes_orientacoes_updated_at
    BEFORE UPDATE ON journalscope.lattes_orientacoes
    FOR EACH ROW EXECUTE FUNCTION journalscope.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lattes_projetos_updated_at ON journalscope.lattes_projetos;
CREATE TRIGGER update_lattes_projetos_updated_at
    BEFORE UPDATE ON journalscope.lattes_projetos
    FOR EACH ROW EXECUTE FUNCTION journalscope.update_updated_at_column();
