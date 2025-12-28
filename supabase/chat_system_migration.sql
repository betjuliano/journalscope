-- =====================================================
-- JOURNALSCOPE - CHAT SYSTEM & JOURNALS TABLE
-- Sistema de Chat entre Autores e Tabela de Periódicos
-- =====================================================

-- =====================================================
-- TABELA: journals (Lista de Periódicos)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) UNIQUE NOT NULL,
    abdc VARCHAR(10),
    abs VARCHAR(10),
    sjr_quartile VARCHAR(10),
    sjr_score DECIMAL(10, 4),
    sjr_h_index INTEGER,
    jcr_quartile VARCHAR(10),
    jcr_impact_factor DECIMAL(10, 4),
    jcr_issn VARCHAR(50),
    qualis VARCHAR(10),
    is_predatory BOOLEAN DEFAULT FALSE,
    wiley_subject VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_journals_name ON journalscope.journals(name);
CREATE INDEX idx_journals_abdc ON journalscope.journals(abdc);
CREATE INDEX idx_journals_abs ON journalscope.journals(abs);
CREATE INDEX idx_journals_qualis ON journalscope.journals(qualis);

-- =====================================================
-- ATUALIZAR TABELA: authors (Adicionar campos para convite)
-- =====================================================
ALTER TABLE journalscope.authors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES journalscope.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invite_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS invite_token VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMP WITH TIME ZONE;

-- Constraint para status de convite
ALTER TABLE journalscope.authors
ADD CONSTRAINT valid_invite_status CHECK (
    invite_status IN ('pending', 'sent', 'accepted', 'declined')
);

-- Índice para performance
CREATE INDEX idx_authors_user_id ON journalscope.authors(user_id);
CREATE INDEX idx_authors_invite_token ON journalscope.authors(invite_token);
CREATE INDEX idx_authors_invite_status ON journalscope.authors(invite_status);

-- =====================================================
-- TABELA: submission_chats (Salas de Chat por Submissão)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.submission_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES journalscope.submissions(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir apenas um chat por submissão
    CONSTRAINT unique_submission_chat UNIQUE (submission_id)
);

-- Índice para performance
CREATE INDEX idx_submission_chats_submission_id ON journalscope.submission_chats(submission_id);

-- =====================================================
-- TABELA: chat_messages (Mensagens do Chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES journalscope.submission_chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES journalscope.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_chat_messages_chat_id ON journalscope.chat_messages(chat_id);
CREATE INDEX idx_chat_messages_user_id ON journalscope.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON journalscope.chat_messages(created_at);
CREATE INDEX idx_chat_messages_is_read ON journalscope.chat_messages(is_read);

-- =====================================================
-- TABELA: chat_participants (Participantes do Chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS journalscope.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES journalscope.submission_chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES journalscope.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    
    -- Garantir que um usuário não participe duas vezes do mesmo chat
    CONSTRAINT unique_chat_participant UNIQUE (chat_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_chat_participants_chat_id ON journalscope.chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON journalscope.chat_participants(user_id);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at em journals
CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON journalscope.journals
    FOR EACH ROW
    EXECUTE FUNCTION journalscope.update_updated_at_column();

-- Trigger para atualizar updated_at em submission_chats
CREATE TRIGGER update_submission_chats_updated_at
    BEFORE UPDATE ON journalscope.submission_chats
    FOR EACH ROW
    EXECUTE FUNCTION journalscope.update_updated_at_column();

-- Trigger para atualizar updated_at em chat_messages
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON journalscope.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION journalscope.update_updated_at_column();

-- Função para criar chat automaticamente quando submissão é criada
CREATE OR REPLACE FUNCTION journalscope.create_chat_for_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar chat para a nova submissão
    INSERT INTO journalscope.submission_chats (submission_id)
    VALUES (NEW.id);
    
    -- Adicionar o criador como participante
    INSERT INTO journalscope.chat_participants (chat_id, user_id)
    SELECT id, NEW.user_id
    FROM journalscope.submission_chats
    WHERE submission_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar chat automaticamente
CREATE TRIGGER auto_create_submission_chat
    AFTER INSERT ON journalscope.submissions
    FOR EACH ROW
    EXECUTE FUNCTION journalscope.create_chat_for_submission();

-- Função para adicionar autor ao chat quando convite é aceito
CREATE OR REPLACE FUNCTION journalscope.add_author_to_chat_on_invite_accept()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'accepted' e há um user_id
    IF NEW.invite_status = 'accepted' AND NEW.user_id IS NOT NULL AND 
       (OLD.invite_status IS NULL OR OLD.invite_status != 'accepted') THEN
        
        -- Adicionar ao chat da submissão
        INSERT INTO journalscope.chat_participants (chat_id, user_id)
        SELECT sc.id, NEW.user_id
        FROM journalscope.submission_chats sc
        WHERE sc.submission_id = NEW.submission_id
        ON CONFLICT (chat_id, user_id) DO NOTHING;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para adicionar autor ao chat
CREATE TRIGGER auto_add_author_to_chat
    AFTER UPDATE ON journalscope.authors
    FOR EACH ROW
    EXECUTE FUNCTION journalscope.add_author_to_chat_on_invite_accept();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Chat com informações de submissão e participantes
CREATE OR REPLACE VIEW journalscope.chats_with_details AS
SELECT 
    sc.id as chat_id,
    sc.submission_id,
    s.title as submission_title,
    s.journal,
    s.status as submission_status,
    sc.is_active,
    sc.created_at as chat_created_at,
    COUNT(DISTINCT cp.user_id) as participant_count,
    COUNT(DISTINCT cm.id) as message_count,
    MAX(cm.created_at) as last_message_at
FROM journalscope.submission_chats sc
JOIN journalscope.submissions s ON sc.submission_id = s.id
LEFT JOIN journalscope.chat_participants cp ON sc.id = cp.chat_id
LEFT JOIN journalscope.chat_messages cm ON sc.id = cm.chat_id
GROUP BY sc.id, s.title, s.journal, s.status;

-- View: Mensagens não lidas por usuário
CREATE OR REPLACE VIEW journalscope.unread_messages_by_user AS
SELECT 
    cp.user_id,
    cm.chat_id,
    COUNT(cm.id) as unread_count
FROM journalscope.chat_participants cp
JOIN journalscope.chat_messages cm ON cp.chat_id = cm.chat_id
WHERE cm.is_read = FALSE 
  AND cm.user_id != cp.user_id
  AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at)
GROUP BY cp.user_id, cm.chat_id;

-- View: Autores pendentes de convite por submissão
CREATE OR REPLACE VIEW journalscope.pending_author_invites AS
SELECT 
    s.id as submission_id,
    s.title as submission_title,
    s.user_id as submitter_id,
    u.name as submitter_name,
    a.id as author_id,
    a.name as author_name,
    a.email as author_email,
    a.invite_status,
    a.invite_sent_at,
    a.invite_token
FROM journalscope.submissions s
JOIN journalscope.users u ON s.user_id = u.id
JOIN journalscope.authors a ON s.id = a.submission_id
WHERE a.invite_status IN ('pending', 'sent')
  AND a.user_id IS NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE journalscope.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.submission_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalscope.chat_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para JOURNALS (todos podem ler)
CREATE POLICY "Anyone can view journals"
    ON journalscope.journals
    FOR SELECT
    USING (true);

-- Políticas para SUBMISSION_CHATS
-- Usuários podem ver chats de suas submissões ou onde são participantes
CREATE POLICY "Users can view chats they participate in"
    ON journalscope.submission_chats
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM journalscope.chat_participants cp
            WHERE cp.chat_id = id
            AND cp.user_id = auth.uid()
        )
    );

-- Políticas para CHAT_MESSAGES
-- Usuários podem ver mensagens de chats que participam
CREATE POLICY "Users can view messages in their chats"
    ON journalscope.chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM journalscope.chat_participants cp
            WHERE cp.chat_id = chat_id
            AND cp.user_id = auth.uid()
        )
    );

-- Usuários podem criar mensagens em chats que participam
CREATE POLICY "Users can create messages in their chats"
    ON journalscope.chat_messages
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM journalscope.chat_participants cp
            WHERE cp.chat_id = chat_id
            AND cp.user_id = auth.uid()
        )
    );

-- Usuários podem atualizar suas próprias mensagens
CREATE POLICY "Users can update own messages"
    ON journalscope.chat_messages
    FOR UPDATE
    USING (user_id = auth.uid());

-- Políticas para CHAT_PARTICIPANTS
-- Usuários podem ver participantes de chats que participam
CREATE POLICY "Users can view participants of their chats"
    ON journalscope.chat_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM journalscope.chat_participants cp
            WHERE cp.chat_id = chat_id
            AND cp.user_id = auth.uid()
        )
    );

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE journalscope.journals IS 'Lista de periódicos acadêmicos disponíveis';
COMMENT ON TABLE journalscope.submission_chats IS 'Salas de chat por submissão';
COMMENT ON TABLE journalscope.chat_messages IS 'Mensagens trocadas entre autores';
COMMENT ON TABLE journalscope.chat_participants IS 'Participantes de cada chat';

COMMENT ON COLUMN journalscope.authors.invite_status IS 'Status do convite: pending, sent, accepted, declined';
COMMENT ON COLUMN journalscope.authors.invite_token IS 'Token único para aceitar convite';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
