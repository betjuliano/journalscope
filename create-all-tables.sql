-- JournalScope - Schema e Tabelas
-- Para executar: docker exec $DB_CONTAINER psql -U postgres -f /tmp/create-all-tables.sql

-- Garantir que o schema existe
CREATE SCHEMA IF NOT EXISTS journalscope;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS journalscope.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de periódicos
CREATE TABLE IF NOT EXISTS journalscope.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL UNIQUE,
    abdc VARCHAR(10),
    abs VARCHAR(10),
    qualis VARCHAR(10),
    sjr_quartile VARCHAR(10),
    jcr_quartile VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de submissões
CREATE TABLE IF NOT EXISTS journalscope.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES journalscope.users(id),
    title TEXT NOT NULL,
    journal VARCHAR(500),
    status VARCHAR(50) DEFAULT 'Em Elaboração',
    abstract TEXT,
    keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de autores
CREATE TABLE IF NOT EXISTS journalscope.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES journalscope.submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES journalscope.users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    order_position INTEGER NOT NULL,
    invite_status VARCHAR(50) DEFAULT 'pending',
    invite_token VARCHAR(255) UNIQUE,
    invite_sent_at TIMESTAMP WITH TIME ZONE,
    invite_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de chats
CREATE TABLE IF NOT EXISTS journalscope.submission_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES journalscope.submissions(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de participantes do chat
CREATE TABLE IF NOT EXISTS journalscope.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES journalscope.submission_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES journalscope.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS journalscope.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES journalscope.submission_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES journalscope.users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de reviews
CREATE TABLE IF NOT EXISTS journalscope.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES journalscope.submissions(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255),
    comments TEXT,
    decision VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de compartilhamentos
CREATE TABLE IF NOT EXISTS journalscope.submission_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES journalscope.submissions(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    created_by UUID REFERENCES journalscope.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissões
GRANT ALL ON ALL TABLES IN SCHEMA journalscope TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA journalscope TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA journalscope TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA journalscope TO authenticated;

-- Mostrar resultado
SELECT 'Tabelas criadas com sucesso!' AS status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'journalscope' ORDER BY table_name;
