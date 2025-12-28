-- =====================================================
-- JOURNALSCOPE - SCHEMA DE SUBMISSÕES
-- Sistema de Gestão de Submissões de Artigos Acadêmicos
-- =====================================================

-- Criar schema dedicado
CREATE SCHEMA IF NOT EXISTS journalscope;

-- =====================================================
-- TABELA: users (Usuários do Sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Armazenar hash bcrypt
    name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX idx_users_email ON journalscope.users(email);
CREATE INDEX idx_users_created_at ON journalscope.users(created_at);

-- =====================================================
-- TABELA: submissions (Submissões de Artigos)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES journalscope.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    journal VARCHAR(500) NOT NULL,
    abstract TEXT,
    keywords TEXT[], -- Array de palavras-chave
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'under_review', 'revision_requested', 'accepted', 'rejected')
    )
);

-- Índices para performance
CREATE INDEX idx_submissions_user_id ON journalscope.submissions(user_id);
CREATE INDEX idx_submissions_status ON journalscope.submissions(status);
CREATE INDEX idx_submissions_submitted_at ON journalscope.submissions(submitted_at);
CREATE INDEX idx_submissions_journal ON journalscope.submissions(journal);

-- =====================================================
-- TABELA: authors (Autores dos Artigos)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES journalscope.submissions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    institution VARCHAR(255),
    order_position INTEGER NOT NULL, -- Ordem dos autores (1º, 2º, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não haja autores duplicados na mesma posição
    CONSTRAINT unique_author_position UNIQUE (submission_id, order_position)
);

-- Índices para performance
CREATE INDEX idx_authors_submission_id ON journalscope.authors(submission_id);
CREATE INDEX idx_authors_email ON journalscope.authors(email);

-- =====================================================
-- TABELA: reviews (Revisões dos Artigos)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES journalscope.submissions(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255),
    comment TEXT NOT NULL,
    recommendation VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_recommendation CHECK (
        recommendation IN ('accept', 'revision', 'reject')
    )
);

-- Índices para performance
CREATE INDEX idx_reviews_submission_id ON journalscope.reviews(submission_id);
CREATE INDEX idx_reviews_created_at ON journalscope.reviews(created_at);

-- =====================================================
-- TABELA: submission_shares (Links de Compartilhamento)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.submission_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES journalscope.submissions(id) ON DELETE CASCADE,
    share_token VARCHAR(100) UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES journalscope.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = nunca expira
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_shares_submission_id ON journalscope.submission_shares(submission_id);
CREATE INDEX idx_shares_token ON journalscope.submission_shares(share_token);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION journalscope.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON journalscope.users
    FOR EACH ROW
    EXECUTE FUNCTION journalscope.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON journalscope.submissions
    FOR EACH ROW
    EXECUTE FUNCTION journalscope.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON journalscope.reviews
    FOR EACH ROW
    EXECUTE FUNCTION journalscope.update_updated_at_column();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Submissões com contagem de autores e revisões
CREATE OR REPLACE VIEW journalscope.submissions_summary AS
SELECT 
    s.id,
    s.user_id,
    s.title,
    s.journal,
    s.status,
    s.submitted_at,
    s.created_at,
    s.updated_at,
    COUNT(DISTINCT a.id) as author_count,
    COUNT(DISTINCT r.id) as review_count,
    u.name as submitter_name,
    u.email as submitter_email
FROM journalscope.submissions s
LEFT JOIN journalscope.authors a ON s.id = a.submission_id
LEFT JOIN journalscope.reviews r ON s.id = r.submission_id
LEFT JOIN journalscope.users u ON s.user_id = u.id
GROUP BY s.id, u.name, u.email;

-- View: Estatísticas por usuário
CREATE OR REPLACE VIEW journalscope.user_statistics AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(s.id) as total_submissions,
    COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN s.status = 'under_review' THEN 1 END) as under_review_count,
    COUNT(CASE WHEN s.status = 'revision_requested' THEN 1 END) as revision_requested_count,
    COUNT(CASE WHEN s.status = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected_count,
    CASE 
        WHEN COUNT(s.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN s.status = 'accepted' THEN 1 END)::NUMERIC / COUNT(s.id)::NUMERIC) * 100, 2)
        ELSE 0 
    END as acceptance_rate
FROM journalscope.users u
LEFT JOIN journalscope.submissions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE journalscope.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.submission_shares ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
    ON journalscope.users
    FOR SELECT
    USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON journalscope.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Políticas para SUBMISSIONS
-- Usuários podem ver apenas suas próprias submissões
CREATE POLICY "Users can view own submissions"
    ON journalscope.submissions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar submissões
CREATE POLICY "Users can create submissions"
    ON journalscope.submissions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias submissões
CREATE POLICY "Users can update own submissions"
    ON journalscope.submissions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Usuários podem deletar apenas suas próprias submissões
CREATE POLICY "Users can delete own submissions"
    ON journalscope.submissions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para AUTHORS
-- Usuários podem ver autores de suas submissões
CREATE POLICY "Users can view authors of own submissions"
    ON journalscope.authors
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM journalscope.submissions s
            WHERE s.id = authors.submission_id
            AND s.user_id = auth.uid()
        )
    );

-- Usuários podem criar autores para suas submissões
CREATE POLICY "Users can create authors for own submissions"
    ON journalscope.authors
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM journalscope.submissions s
            WHERE s.id = submission_id
            AND s.user_id = auth.uid()
        )
    );

-- Usuários podem deletar autores de suas submissões
CREATE POLICY "Users can delete authors of own submissions"
    ON journalscope.authors
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM journalscope.submissions s
            WHERE s.id = authors.submission_id
            AND s.user_id = auth.uid()
        )
    );

-- Políticas para REVIEWS
-- Usuários podem ver revisões de suas submissões
CREATE POLICY "Users can view reviews of own submissions"
    ON journalscope.reviews
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM journalscope.submissions s
            WHERE s.id = reviews.submission_id
            AND s.user_id = auth.uid()
        )
    );

-- Usuários podem criar revisões para suas submissões
CREATE POLICY "Users can create reviews for own submissions"
    ON journalscope.reviews
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM journalscope.submissions s
            WHERE s.id = submission_id
            AND s.user_id = auth.uid()
        )
    );

-- Políticas para SUBMISSION_SHARES
-- Usuários podem ver shares de suas submissões
CREATE POLICY "Users can view shares of own submissions"
    ON journalscope.submission_shares
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM journalscope.submissions s
            WHERE s.id = submission_shares.submission_id
            AND s.user_id = auth.uid()
        )
    );

-- Usuários podem criar shares para suas submissões
CREATE POLICY "Users can create shares for own submissions"
    ON journalscope.submission_shares
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM journalscope.submissions s
            WHERE s.id = submission_id
            AND s.user_id = auth.uid()
        )
    );

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTAR EM PRODUÇÃO)
-- =====================================================

-- Inserir usuário de exemplo
-- NOTA: Em produção, use Supabase Auth ao invés de inserir diretamente
-- INSERT INTO journalscope.users (id, email, password_hash, name, institution)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     'joao@example.com',
--     '$2a$10$...',  -- Hash bcrypt de '123456'
--     'Dr. João Silva',
--     'Universidade Federal'
-- );

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON SCHEMA journalscope IS 'Schema para sistema de gestão de submissões de artigos acadêmicos';

COMMENT ON TABLE journalscope.users IS 'Usuários do sistema de submissões';
COMMENT ON TABLE journalscope.submissions IS 'Submissões de artigos para periódicos';
COMMENT ON TABLE journalscope.authors IS 'Autores dos artigos submetidos';
COMMENT ON TABLE journalscope.reviews IS 'Revisões recebidas para os artigos';
COMMENT ON TABLE journalscope.submission_shares IS 'Links de compartilhamento de submissões';

COMMENT ON COLUMN journalscope.submissions.status IS 'Status: pending, under_review, revision_requested, accepted, rejected';
COMMENT ON COLUMN journalscope.reviews.recommendation IS 'Recomendação: accept, revision, reject';
COMMENT ON COLUMN journalscope.authors.order_position IS 'Posição do autor na lista (1 = primeiro autor)';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
