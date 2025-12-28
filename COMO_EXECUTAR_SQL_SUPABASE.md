# 🚀 GUIA RÁPIDO: Executar SQL no Supabase

## ⚡ Passo a Passo (5 minutos)

### 1️⃣ Acessar o Supabase

1. Abra [https://supabase.com](https://supabase.com)
2. Faça login
3. Selecione seu projeto **periodicos**

### 2️⃣ Abrir SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"** (ícone de código)
2. Clique no botão **"New Query"** (canto superior direito)

### 3️⃣ Copiar o SQL

**Copie TODO o conteúdo do arquivo:** `supabase/schema.sql`

Ou copie diretamente daqui (360 linhas):

```sql
-- Cole TUDO do arquivo supabase/schema.sql aqui
-- O arquivo completo está em: e:\PROJETOS\periodicos\journalscope\supabase\schema.sql
```

### 4️⃣ Colar e Executar

1. **Cole** todo o SQL no editor
2. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
3. Aguarde a execução (leva ~5 segundos)

### 5️⃣ Verificar Sucesso

Você verá mensagens como:
```
✅ CREATE SCHEMA
✅ CREATE TABLE
✅ CREATE INDEX
✅ CREATE TRIGGER
✅ CREATE VIEW
✅ ALTER TABLE
✅ CREATE POLICY
```

---

## 📊 O que será criado

### Tabelas (5)

1. **journalscope.users**
   - id, email, password_hash, name, institution
   - Para: Login e perfil de usuários

2. **journalscope.submissions**
   - id, user_id, title, journal, abstract, keywords, status
   - Para: Submissões de artigos

3. **journalscope.authors**
   - id, submission_id, name, email, institution, order_position
   - Para: Autores dos artigos

4. **journalscope.reviews**
   - id, submission_id, reviewer_name, comment, recommendation
   - Para: Revisões recebidas

5. **journalscope.submission_shares**
   - id, submission_id, share_token, created_by
   - Para: Links de compartilhamento

### Views (2)

1. **submissions_summary** - Submissões com contagens
2. **user_statistics** - Estatísticas por usuário

### Segurança

- ✅ RLS (Row Level Security) habilitado
- ✅ 12 políticas de acesso
- ✅ Usuários só veem seus próprios dados

---

## 🔍 Verificar se Funcionou

### Opção 1: Via Interface

1. Vá em **"Table Editor"** no menu lateral
2. Você deve ver as tabelas:
   - `users`
   - `submissions`
   - `authors`
   - `reviews`
   - `submission_shares`

### Opção 2: Via SQL

Execute este SQL para testar:

```sql
-- Ver todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'journalscope';
```

Deve retornar:
```
users
submissions
authors
reviews
submission_shares
```

---

## ⚙️ Configurar Variáveis de Ambiente

Depois de criar as tabelas, configure o `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Onde encontrar:**
1. No painel do Supabase, vá em **"Settings"** → **"API"**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

---

## 🧪 Testar a Integração

Depois de configurar o `.env`:

```bash
# Reiniciar servidor
npm run dev
```

Agora o sistema usará Supabase ao invés de localStorage!

---

## 🐛 Problemas Comuns

### Erro: "permission denied for schema journalscope"

**Solução**: Execute este SQL adicional:

```sql
GRANT USAGE ON SCHEMA journalscope TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA journalscope TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA journalscope TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA journalscope TO postgres, anon, authenticated, service_role;
```

### Erro: "relation already exists"

**Solução**: As tabelas já foram criadas. Tudo certo!

### Erro: "syntax error"

**Solução**: Certifique-se de copiar TODO o arquivo, incluindo os comentários.

---

## 📝 Próximos Passos

Após executar o SQL:

1. ✅ Configurar `.env` com credenciais
2. ✅ Reiniciar `npm run dev`
3. ✅ Testar login/registro
4. ✅ Criar uma submissão
5. ✅ Verificar dados no Supabase

---

## 💡 Dica Importante

O sistema tem **fallback automático**:
- ✅ Se Supabase configurado → usa Supabase
- ✅ Se não configurado → usa localStorage

Então você pode testar sem pressa!

---

**Precisa de ajuda? Me avise se encontrar algum erro!** 🚀
