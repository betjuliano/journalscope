# 📚 Sistema de Gestão de Submissões Acadêmicas (SUB)

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Funcionalidades Completas](#funcionalidades-completas)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
6. [API Endpoints](#api-endpoints)
7. [Integração com Journalscope](#integração-com-journalscope)
8. [Guia de Uso](#guia-de-uso)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Sistema de Gestão de Submissões Acadêmicas (SUB)** é uma aplicação completa para gerenciar todo o ciclo de vida de submissões de artigos científicos, desde a criação até a publicação ou reencaminhamento para periódicos alternativos.

### Principais Objetivos

- **Organizar** submissões de artigos para múltiplos periódicos
- **Rastrear** o status de cada submissão em tempo real
- **Gerenciar** revisões e feedback de revisores
- **Sugerir** periódicos alternativos inteligentemente em caso de rejeição
- **Integrar** com base de dados de periódicos (Journalscope)
- **Facilitar** reencaminhamento automático e manual de artigos

---

## 🏗️ Arquitetura e Tecnologias

### Stack Tecnológica

#### Frontend
- **Next.js 15.3.5** - Framework React com Server-Side Rendering
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **Shadcn/ui** - Componentes UI modernos e acessíveis

#### Backend
- **Next.js API Routes** - Endpoints REST
- **Prisma 6.11.1** - ORM para banco de dados
- **SQLite** - Banco de dados (desenvolvimento)
- **Socket.IO 4.8.1** - Comunicação real-time

#### Comunicação
- **PostMessage API** - Integração com Journalscope via iframe
- **REST API** - Comunicação cliente-servidor
- **WebSocket** - Atualizações em tempo real

### Estrutura de Diretórios

```
sub/
├── prisma/
│   ├── schema.prisma          # Esquema do banco de dados
│   └── custom.db              # Banco SQLite
├── src/
│   ├── app/
│   │   ├── api/               # Endpoints da API
│   │   │   ├── dashboard/     # Estatísticas gerais
│   │   │   ├── periodicos/    # CRUD periódicos
│   │   │   ├── submissoes/    # CRUD submissões
│   │   │   ├── revisoes/      # Gestão de revisões
│   │   │   ├── sugestoes/     # IA para sugestões
│   │   │   ├── reencaminhar/  # Reencaminhamento inteligente
│   │   │   └── usuarios/      # Gestão de usuários
│   │   ├── page.tsx           # Dashboard principal
│   │   ├── periodicos-pesquisa/ # Busca de periódicos
│   │   ├── revisoes/          # Gestão de revisões
│   │   └── reencaminhar/      # Reencaminhamento
│   ├── components/
│   │   ├── forms/             # Formulários
│   │   ├── ui/                # Componentes Shadcn
│   │   ├── RevisoesManager.tsx
│   │   ├── ReencaminhamentoInteligente.tsx
│   │   ├── PeriodicopesquisaManager.tsx
│   │   └── PeriodicoMultiSelector.tsx
│   ├── hooks/
│   │   ├── useJournalscopeIntegration.ts  # Integração
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   └── lib/
│       ├── db.ts              # Cliente Prisma
│       ├── socket.ts          # Configuração Socket.IO
│       └── utils.ts           # Utilitários
├── server.ts                  # Servidor customizado
├── package.json
└── tsconfig.json
```

---

## ✨ Funcionalidades Completas

### 1. 📊 Dashboard Principal

**Localização:** `/` (página principal)

#### Estatísticas em Tempo Real
- **Total de Submissões** - Contador geral
- **Em Avaliação** - Artigos aguardando parecer
- **Aprovadas** - Submissões aceitas para publicação
- **Rejeitadas** - Submissões não aceitas
- **Revisão Solicitada** - Artigos que precisam de ajustes

#### Visualizações
- Lista de submissões recentes
- Periódicos mais utilizados
- Alertas de prazo (em desenvolvimento)
- Estatísticas por pesquisador

#### Integrações
- ✅ **Integração com Journalscope** - Recebe periódicos selecionados
- ✅ **Badge de integração** - Mostra quando há periódicos importados
- ✅ **Cards de periódicos** - Exibe periódicos do Journalscope com informações completas

### 2. 📝 Gestão de Submissões

**Localização:** Formulário acessível pelo botão "Nova Submissão"

#### Criação de Submissão

**Informações Básicas:**
- Título do artigo
- Resumo/Abstract
- Palavras-chave (separadas por vírgula)
- Autor responsável (seleção de usuários cadastrados)

**Autores:**
- Adicionar múltiplos autores
- Nome completo
- Email (opcional)
- Instituição (opcional)
- Remover autores dinamicamente

**Seleção de Periódicos:**

1. **Periódico Principal (Prioridade 1)**
   - Seleção única obrigatória
   - Lista de periódicos cadastrados
   - Filtro por nome e área

2. **Periódicos Alternativos (Prioridades 2, 3, 4...)**
   - Multi-seletor com ordem de prioridade
   - Sistema de drag-and-drop para reorganizar
   - Justificativa para cada periódico alternativo
   - Sugestões automáticas baseadas em:
     - Área do artigo
     - Palavras-chave
     - Classificação Qualis
     - Popularidade do periódico

**Busca Avançada de Periódicos:**
- Integração com base do Journalscope
- Busca por nome, ISSN, área
- Filtros por:
  - Classificação ABDC
  - Classificação ABS
  - Quartil SJR
  - Quartil JCR
  - Qualis
  - Excluir predatórios

**Plano de Ação:**
- Campo para estratégia de submissão
- Cronograma de revisões
- Observações importantes

#### Estados da Submissão

```
EM_AVALIACAO        → Aguardando parecer dos revisores
APROVADO            → Aceito para publicação
REJEITADO           → Não aceito
REVISAO_SOLICITADA  → Precisa de ajustes/correções
SUBMETIDO_NOVAMENTE → Resubmetido após correções
```

#### Ações Disponíveis

- ✅ Visualizar detalhes completos
- ✅ Editar informações (se em avaliação)
- ✅ Adicionar revisões
- ✅ Reencaminhar para periódico alternativo (se rejeitado)
- ✅ Mudar status manualmente
- ✅ Exportar dados da submissão

### 3. 🔄 Sistema de Reencaminhamento Inteligente

**Localização:** `/reencaminhar?submissaoId={id}`

#### Funcionalidades

**1. Análise da Submissão Rejeitada:**
- Carrega dados completos da submissão
- Identifica motivo da rejeição
- Analisa palavras-chave e área

**2. Geração Inteligente de Sugestões:**

O sistema analisa e pontua periódicos baseado em:

- **Alinhamento de Área** (40%)
  - Correspondência exata: 100 pontos
  - Áreas relacionadas: 60 pontos
  - Outras áreas: 20 pontos

- **Classificação Qualis** (30%)
  - A1: 100 pontos
  - A2: 90 pontos
  - B1: 75 pontos
  - B2: 60 pontos
  - B3: 45 pontos
  - Sem classificação: 30 pontos

- **Popularidade** (20%)
  - Baseado no número de submissões no sistema
  - Periódicos mais utilizados recebem mais pontos

- **Palavras-chave** (10%)
  - Análise de similaridade semântica
  - Correspondência de termos técnicos

**Classificação de Alinhamento:**
- 🟢 **Alto** (≥ 80 pontos): Excelente match
- 🟡 **Médio** (60-79 pontos): Bom match
- 🔴 **Baixo** (< 60 pontos): Match fraco

**3. Seleção e Ajustes:**
- Visualização de top 10 sugestões
- Cards informativos com:
  - Nome do periódico
  - Área e classificação
  - Motivo da sugestão
  - Pontuação e alinhamento
  - Descrição do periódico
- Seleção do periódico de destino
- Opção de manter dados originais ou ajustar:
  - Título
  - Resumo
  - Palavras-chave

**4. Relatório de Reencaminhamento:**
- Geração automática de relatório
- Histórico de submissões
- Motivos de rejeição
- Mudanças realizadas
- Estratégia de resubmissão

**5. Confirmação e Criação:**
- Nova submissão criada automaticamente
- Vínculo com submissão original
- Atualização de status
- Notificações (em desenvolvimento)

### 4. 📋 Gestão de Revisões

**Localização:** `/revisoes`

#### Funcionalidades

**Cadastro de Revisão:**
- Data de recebimento do parecer
- Número de revisores
- Comentários detalhados dos revisores
- Associação com submissão
- Associação com revisor (opcional)

**Visualização:**
- Lista de todas as revisões
- Filtros por submissão
- Filtros por revisor
- Ordenação por data
- Status da submissão associada

**Timeline de Revisões:**
- Histórico completo de cada submissão
- Todas as rodadas de revisão
- Comentários agregados
- Evolução do status

**Ações:**
- ✅ Adicionar nova revisão
- ✅ Editar revisão existente
- ✅ Visualizar detalhes completos
- ✅ Ver contexto da submissão
- ✅ Gerar relatório de revisões

### 5. 🔍 Pesquisa de Periódicos

**Localização:** `/periodicos-pesquisa`

#### Funcionalidades

**Busca e Filtros:**
- Seleção por dropdown (todos os periódicos cadastrados)
- Busca por nome
- Filtro por URL (query parameter `?search={nome}`)

**Visualização de Periódico:**

**Informações Exibidas:**
- Nome completo
- ISSN
- Área de conhecimento
- Classificação Qualis
- Descrição (se disponível)

**Estatísticas do Periódico:**
- Total de submissões
- Submissões em avaliação
- Submissões aprovadas
- Submissões rejeitadas
- Submissões com revisão solicitada
- Submissões reencaminhadas

**Lista de Submissões:**
- Todas as submissões para aquele periódico
- Filtro por status
- Ordenação por data
- Cards detalhados com:
  - Título do artigo
  - Autor responsável
  - Data de submissão
  - Status atual
  - Lista de autores
  - Revisões recebidas
  - Plano de ação

**Ações:**
- ✅ Criar nova submissão para o periódico
- ✅ Ver histórico completo
- ✅ Exportar dados
- ✅ Comparar estatísticas

### 6. 👥 Gestão de Usuários

**Localização:** Formulário acessível pelo botão "Usuário"

#### Perfis de Usuário

**Tipos (Roles):**
1. **PESQUISADOR** - Pesquisador/autor de artigos
2. **EDITOR** - Editor de periódico
3. **ADMIN** - Administrador do sistema

**Campos:**
- Nome completo
- Email (único)
- Perfil/Role
- Data de criação
- Última atualização

**Funcionalidades:**
- ✅ Criar novo usuário
- ✅ Listar todos os usuários
- ✅ Editar usuário existente
- ✅ Filtrar por perfil
- ✅ Ver submissões por usuário
- ✅ Ver revisões por usuário (se revisor)

### 7. 📖 Gestão de Periódicos

**Localização:** Formulário acessível pelo botão "Periódico"

#### Campos do Periódico

- Nome completo do periódico
- ISSN (único, opcional)
- Área de conhecimento
- Classificação Qualis (A1, A2, B1, B2, B3, B4, B5, C)
- Descrição/Escopo editorial
- Data de criação
- Última atualização

#### Funcionalidades

- ✅ Cadastrar novo periódico
- ✅ Editar periódico existente
- ✅ Listar todos os periódicos
- ✅ Buscar por nome ou ISSN
- ✅ Filtrar por área
- ✅ Filtrar por Qualis
- ✅ Ver estatísticas do periódico
- ✅ Ver submissões associadas

### 8. 🔗 Integração com Journalscope

**Tecnologia:** PostMessage API + Hooks personalizados

#### Comunicação Bidirecional

**Do Journalscope para o SUB:**

```javascript
// Mensagens enviadas
JOURNALSCOPE_INIT {
  language: 'pt' | 'en',
  theme: 'journalscope-theme',
  parentUrl: string,
  selectedJournals: Journal[]
}

JOURNALSCOPE_JOURNALS_UPDATE {
  journals: Journal[]
}

JOURNALSCOPE_THEME_UPDATE {
  language: 'pt' | 'en'
}
```

**Do SUB para o Journalscope:**

```javascript
// Mensagens enviadas
SUB_SYSTEM_READY {
  status: 'ready'
}

SUB_SYSTEM_ERROR {
  message: string
}

SUB_SYSTEM_ACTIVITY {
  timestamp: string
}

SUB_SYSTEM_CLOSE_REQUEST {}
```

#### Hook de Integração

**useJournalscopeIntegration.ts**

```typescript
const {
  isIntegrated,      // boolean - Se está integrado
  selectedJournals,  // Journal[] - Periódicos selecionados
  language,          // 'pt' | 'en' - Idioma
  parentUrl,         // string - URL do parent
  sendToParent,      // Função para enviar mensagens
  requestClose,      // Solicitar fechamento
  notifyActivity     // Notificar atividade
} = useJournalscopeIntegration();
```

#### Dados do Periódico Importado

```typescript
interface Journal {
  journal: string;        // Nome
  issn?: string;          // ISSN
  abdc?: string;          // Classificação ABDC
  abs?: string;           // Classificação ABS
  jcr?: {
    issn?: string;
    quartile?: string;    // Q1, Q2, Q3, Q4
    impactFactor?: number;
  };
  sjr?: {
    quartile?: string;    // Q1, Q2, Q3, Q4
    score?: number;
  };
  publisher?: string;     // Editora
  [key: string]: any;
}
```

#### Fluxo de Integração

1. **Seleção no Journalscope:**
   - Usuário seleciona periódicos na tabela (checkboxes)
   - Clica em "Enviar para SUB"
   - Modal do SUB abre automaticamente

2. **Recebimento no SUB:**
   - Hook detecta mensagem `JOURNALSCOPE_INIT`
   - Armazena periódicos selecionados
   - Exibe badge de integração
   - Mostra seção com periódicos importados

3. **Visualização:**
   - Cards com informações completas
   - ISSN, ABDC, ABS, SJR, JCR
   - Botão "Criar Submissão" em cada card

4. **Criação de Submissão:**
   - Clique no botão abre formulário
   - Periódico pré-selecionado automaticamente
   - Dados do periódico preenchidos

### 9. 🔔 Sistema de Notificações (Em Desenvolvimento)

#### Tipos de Notificações Planejadas

- Nova revisão recebida
- Mudança de status da submissão
- Deadline próximo
- Sugestão de reencaminhamento
- Aprovação de artigo

### 10. 📊 Relatórios e Estatísticas

#### Relatórios Disponíveis

**Dashboard Geral:**
- Estatísticas globais do sistema
- Submissões por status
- Periódicos mais populares
- Taxa de aprovação

**Por Pesquisador:**
- Submissões totais
- Taxa de sucesso
- Periódicos favoritos
- Tempo médio de avaliação

**Por Periódico:**
- Total de submissões recebidas
- Taxa de aprovação/rejeição
- Distribuição por status
- Tempo médio de resposta

**Relatório de Reencaminhamento:**
- Submissões reencaminhadas
- Sucesso após reencaminhamento
- Periódicos alternativos mais efetivos
- Tempo economizado

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 18+ ou 20+
- **npm** ou **yarn**
- **Git**

### Instalação

#### 1. Clone o Repositório

```bash
cd J:\PROJETOS\PERIODICOS\journalscope
```

#### 2. Instalar Dependências

```bash
cd sub
npm install
```

#### 3. Configurar Banco de Dados

**Criar arquivo `.env`:**

```bash
# Na pasta sub/
touch .env
```

**Conteúdo do `.env`:**

```env
# Database
DATABASE_URL="file:./prisma/custom.db"

# Server
NODE_ENV=development
PORT=3001

# CORS (adicionar mais conforme necessário)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

#### 4. Gerar Cliente Prisma

```bash
npm run db:generate
```

#### 5. Criar Banco de Dados

```bash
npm run db:push
```

Ou, se quiser usar migrations:

```bash
npm run db:migrate
```

#### 6. Popular Banco (Opcional)

Criar arquivo `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Criar usuários
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN'
    }
  });

  const pesquisador = await prisma.user.create({
    data: {
      name: 'Pesquisador Exemplo',
      email: 'pesquisador@example.com',
      role: 'PESQUISADOR'
    }
  });

  // Criar periódicos
  await prisma.periodico.createMany({
    data: [
      {
        nome: 'Journal of Computer Science',
        issn: '1234-5678',
        area: 'Computação',
        qualis: 'A1'
      },
      {
        nome: 'Management Review',
        issn: '8765-4321',
        area: 'Administração',
        qualis: 'A2'
      }
    ]
  });

  console.log('✅ Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Execute:

```bash
npx tsx prisma/seed.ts
```

### Iniciar Servidor

#### Desenvolvimento

```bash
npm run dev
```

Servidor estará em: `http://localhost:3001`

#### Produção

```bash
npm run build
npm start
```

---

## 🗄️ Estrutura do Banco de Dados

### Modelos (Entities)

#### User
```prisma
id        String   @id @default(cuid())
email     String   @unique
name      String
role      UserRole @default(PESQUISADOR)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relacionamentos
submissoesCriadas Submissao[]
revisoes          Revisao[]
```

#### Periodico
```prisma
id          String   @id @default(cuid())
nome        String
issn        String?  @unique
area        String
qualis      String?
descricao   String?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt

// Relacionamentos
submissoes Submissao[]
```

#### Submissao
```prisma
id              String          @id @default(cuid())
titulo          String
resumo          String
palavrasChave   String
dataSubmissao   DateTime        @default(now())
status          StatusSubmissao @default(EM_AVALIACAO)
planoAcao       String?
criadorId       String
periodicoId     String
createdAt       DateTime        @default(now())
updatedAt       DateTime        @updatedAt

// Relacionamentos
criador                User
periodico              Periodico
autores                Autor[]
revisoes               Revisao[]
historico              HistoricoStatus[]
periodicosAlternativos PeriodicoAlternativo[]
```

#### Autor
```prisma
id          String @id @default(cuid())
nome        String
email       String?
instituicao String?
submissaoId String

// Relacionamentos
submissao Submissao
```

#### Revisao
```prisma
id                String   @id @default(cuid())
dataRecebimento   DateTime
numeroRevisores   Int
comentarios       String
revisorId         String?
submissaoId       String
createdAt         DateTime @default(now())
updatedAt         DateTime @updatedAt

// Relacionamentos
revisor   User?
submissao Submissao
```

#### PeriodicoAlternativo
```prisma
id              String   @id @default(cuid())
submissaoId     String
periodicoNome   String
periodicoISSN   String?
periodicoArea   String?
prioridade      Int
motivo          String?
createdAt       DateTime @default(now())

// Relacionamentos
submissao Submissao
```

#### HistoricoStatus
```prisma
id          String          @id @default(cuid())
status      StatusSubmissao
data        DateTime        @default(now())
submissaoId String

// Relacionamentos
submissao Submissao
```

### Relacionamentos

```
User 1:N Submissao (como criador)
User 1:N Revisao (como revisor)

Periodico 1:N Submissao

Submissao 1:N Autor
Submissao 1:N Revisao
Submissao 1:N HistoricoStatus
Submissao 1:N PeriodicoAlternativo

Revisao N:1 User (revisor)
Revisao N:1 Submissao
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Dashboard

#### GET `/api/dashboard`
Retorna estatísticas gerais e dados recentes.

**Response:**
```json
{
  "stats": {
    "totalSubmissoes": 45,
    "emAvaliacao": 12,
    "aprovadas": 20,
    "rejeitadas": 8,
    "revisaoSolicitada": 5
  },
  "submissoesRecentes": [...],
  "periodicosMaisUtilizados": [...]
}
```

### Usuários

#### GET `/api/usuarios`
Lista todos os usuários.

**Response:**
```json
[
  {
    "id": "cuid",
    "name": "Nome",
    "email": "email@example.com",
    "role": "PESQUISADOR",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### POST `/api/usuarios`
Cria novo usuário.

**Request:**
```json
{
  "name": "Nome Completo",
  "email": "email@example.com",
  "role": "PESQUISADOR"
}
```

### Periódicos

#### GET `/api/periodicos`
Lista todos os periódicos.

#### POST `/api/periodicos`
Cria novo periódico.

**Request:**
```json
{
  "nome": "Journal Name",
  "issn": "1234-5678",
  "area": "Computação",
  "qualis": "A1",
  "descricao": "Descrição do periódico"
}
```

#### GET `/api/periodicos/search?q={query}`
Busca periódicos por nome ou ISSN.

#### GET `/api/periodicos/[id]/submissoes`
Lista submissões de um periódico específico.

### Submissões

#### GET `/api/submissoes`
Lista todas as submissões.

**Query Parameters:**
- `status` - Filtrar por status
- `criadorId` - Filtrar por criador
- `periodicoId` - Filtrar por periódico

#### POST `/api/submissoes`
Cria nova submissão.

**Request:**
```json
{
  "titulo": "Título do Artigo",
  "resumo": "Resumo completo...",
  "palavrasChave": "palavra1, palavra2, palavra3",
  "criadorId": "user-cuid",
  "periodicoId": "periodico-cuid",
  "autores": [
    {
      "nome": "Autor 1",
      "email": "autor1@example.com",
      "instituicao": "Universidade X"
    }
  ],
  "periodicosAlternativos": [
    {
      "periodicoNome": "Journal Alternative",
      "periodicoISSN": "8765-4321",
      "prioridade": 2,
      "motivo": "Boa classificação na área"
    }
  ],
  "planoAcao": "Estratégia de submissão..."
}
```

#### GET `/api/submissoes/[id]`
Detalhes de uma submissão específica.

#### PATCH `/api/submissoes/[id]`
Atualiza submissão.

### Revisões

#### GET `/api/revisoes`
Lista todas as revisões.

#### POST `/api/revisoes`
Cria nova revisão.

**Request:**
```json
{
  "submissaoId": "submissao-cuid",
  "dataRecebimento": "2025-01-01T00:00:00.000Z",
  "numeroRevisores": 2,
  "comentarios": "Comentários detalhados dos revisores...",
  "revisorId": "user-cuid"
}
```

### Sugestões (IA)

#### POST `/api/sugestoes`
Gera sugestões inteligentes de periódicos alternativos.

**Request:**
```json
{
  "submissaoId": "submissao-cuid"
}
```

**Response:**
```json
{
  "submissao": {...},
  "sugestoes": [
    {
      "periodicoId": "periodico-cuid",
      "motivo": "Excelente alinhamento de área e palavras-chave",
      "pontuacao": 92,
      "alinhamento": "alto",
      "periodico": {
        "id": "...",
        "nome": "...",
        "area": "...",
        "qualis": "A2"
      }
    }
  ]
}
```

### Reencaminhamento

#### POST `/api/reencaminhar`
Reencaminha submissão para novo periódico.

**Request:**
```json
{
  "submissaoOriginalId": "submissao-cuid",
  "novoPeriodicoId": "periodico-cuid",
  "manterDados": true,
  "ajustes": {
    "titulo": "Novo título (opcional)",
    "resumo": "Novo resumo (opcional)",
    "palavrasChave": "novas, palavras (opcional)"
  },
  "relatorio": "Relatório de reencaminhamento..."
}
```

---

## 🔗 Integração com Journalscope

### Configuração

#### 1. Journalscope (Parent)

**Porta:** 5173 ou 5174 (ajustável)

**Componentes:**
- `JournalSearchApp.jsx` - App principal
- `SimpleResultsTable.jsx` - Tabela com seleção
- `SubSystemContainer.jsx` - Container do iframe

#### 2. SUB (Child/Iframe)

**Porta:** 3001 (fixa)

**Componentes:**
- `useJournalscopeIntegration.ts` - Hook de integração
- `page.tsx` - Dashboard que exibe periódicos

### Configuração de CORS

**Arquivo:** `sub/server.ts`

```typescript
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
]);
```

### Fluxo Completo

1. **Usuário no Journalscope:**
   - Pesquisa periódicos
   - Seleciona usando checkboxes
   - Clica em "Enviar para SUB"

2. **Abertura do SUB:**
   - Modal abre com iframe
   - URL: `http://localhost:3001`
   - Envia mensagem `JOURNALSCOPE_INIT`

3. **Recebimento no SUB:**
   - Hook detecta mensagem
   - Armazena periódicos
   - Exibe na interface

4. **Criação de Submissão:**
   - Usuário clica em "Criar Submissão"
   - Formulário abre com periódico pré-selecionado
   - Salva no banco de dados

### Debug

**No Console do Journalscope:**
```javascript
// Ver mensagens enviadas
console.log('Enviando para SUB:', selectedJournals);
```

**No Console do SUB:**
```javascript
// Ver mensagens recebidas
console.log('📡 Recebido:', selectedJournals);
```

---

## 📘 Guia de Uso

### Caso de Uso 1: Submeter Artigo Novo

1. **Preparar Informações:**
   - Título do artigo
   - Resumo completo
   - Palavras-chave
   - Lista de autores

2. **Pesquisar Periódicos no Journalscope:**
   - Acesse `http://localhost:5173`
   - Use filtros para encontrar periódicos ideais
   - Selecione 3-5 periódicos (checkbox)
   - Clique em "Enviar para SUB"

3. **Criar Submissão no SUB:**
   - SUB abrirá automaticamente
   - Veja os periódicos selecionados
   - Clique em "Criar Submissão" no periódico desejado
   - Preencha o formulário:
     - Título
     - Resumo
     - Palavras-chave
     - Adicione autores
     - Defina periódicos alternativos
     - Escreva plano de ação
   - Clique em "Criar Submissão"

4. **Acompanhar Status:**
   - Dashboard mostrará a submissão
   - Status inicial: "EM_AVALIACAO"

### Caso de Uso 2: Registrar Revisão

1. **Receber Parecer:**
   - Email com feedback dos revisores

2. **Registrar no Sistema:**
   - Acesse `/revisoes`
   - Clique em "Nova Revisão"
   - Selecione a submissão
   - Preencha:
     - Data de recebimento
     - Número de revisores
     - Comentários completos
   - Salvar

3. **Atualizar Status:**
   - Baseado no feedback, mudar status:
     - APROVADO → Artigo aceito
     - REJEITADO → Artigo não aceito
     - REVISAO_SOLICITADA → Precisa ajustes

### Caso de Uso 3: Reencaminhar Artigo Rejeitado

1. **Identificar Rejeição:**
   - Dashboard mostra submissão rejeitada

2. **Acessar Reencaminhamento:**
   - Clique no botão "Reencaminhar"
   - Ou acesse `/reencaminhar?submissaoId={id}`

3. **Analisar Sugestões:**
   - Sistema gera 10 sugestões automaticamente
   - Analise:
     - Pontuação
     - Alinhamento
     - Área
     - Qualis
     - Motivo da sugestão

4. **Selecionar Periódico:**
   - Clique no card do periódico escolhido
   - Revise informações

5. **Ajustar Conteúdo (Opcional):**
   - Mantenha dados originais OU
   - Ajuste título, resumo, palavras-chave

6. **Gerar Relatório:**
   - Sistema cria relatório automático
   - Edite se necessário

7. **Confirmar:**
   - Clique em "Reencaminhar"
   - Nova submissão criada
   - Histórico mantido

### Caso de Uso 4: Pesquisar Histórico de Periódico

1. **Acessar Pesquisa:**
   - Menu → "Pesquisar Periódico"
   - Ou direto: `/periodicos-pesquisa`

2. **Selecionar Periódico:**
   - Dropdown com todos os periódicos
   - Ou busca por URL: `?search=nome`

3. **Visualizar Estatísticas:**
   - Total de submissões
   - Distribuição por status
   - Taxa de sucesso

4. **Ver Submissões:**
   - Lista completa
   - Detalhes de cada uma
   - Revisões recebidas

---

## 🐛 Troubleshooting

### Problema 1: Servidor não inicia

**Erro:** `Port 3001 is already in use`

**Solução:**
```bash
# Windows
netstat -ano | findstr ":3001"
taskkill /PID <número> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Problema 2: Prisma não conecta

**Erro:** `Can't reach database server`

**Solução:**
```bash
cd sub
npm run db:generate
npm run db:push
```

### Problema 3: Integração não funciona

**Erro:** `A conexão foi recusada`

**Verificar:**
1. SUB está rodando? `http://localhost:3001`
2. Journalscope está rodando?
3. CORS configurado em `server.ts`?

**Solução:**
```bash
# Terminal 1
npm run dev

# Terminal 2
cd sub
npm run dev
```

### Problema 4: Periódicos não aparecem no SUB

**Verificar:**
1. Console do Journalscope: mensagem enviada?
2. Console do SUB: mensagem recebida?
3. Badge "periódicos selecionados" aparece?

**Debug:**
```javascript
// No SUB, adicionar console.log
useEffect(() => {
  console.log('Periódicos recebidos:', selectedJournals);
}, [selectedJournals]);
```

### Problema 5: Dependências faltando

**Erro:** `Module not found`

**Solução:**
```bash
cd sub
rm -rf node_modules
rm package-lock.json
npm install
```

### Problema 6: TypeScript errors

**Erro:** `Type error: ...`

**Solução:**
```bash
npm install --save-dev @types/node @types/react
npm run build
```

---

## 📈 Roadmap Futuro

### Funcionalidades Planejadas

- [ ] Sistema de notificações por email
- [ ] Alertas de prazo automáticos
- [ ] Dashboard analytics avançado
- [ ] Exportação de relatórios PDF
- [ ] Integração com Google Scholar
- [ ] API pública com autenticação
- [ ] Aplicativo mobile
- [ ] Colaboração em tempo real
- [ ] Versionamento de artigos
- [ ] Sistema de templates

### Melhorias Técnicas

- [ ] Migrar para PostgreSQL (produção)
- [ ] Implementar cache Redis
- [ ] Testes unitários (Jest)
- [ ] Testes E2E (Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Docker/Docker Compose
- [ ] Kubernetes deploy
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Logging centralizado
- [ ] Backup automático

---

## 📄 Licença

Este projeto é parte do ecossistema **Journalscope** desenvolvido para o **PPGOP UFSM**.

**Desenvolvido por:** Juliano Alves  
**Email:** juliano.alves@ufsm.br  
**Site:** www.iaprojetos.com.br

---

## 🤝 Contribuindo

### Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- **TypeScript** para type safety
- **ESLint** para linting
- **Prettier** para formatação
- **Conventional Commits** para mensagens

---

## 📞 Suporte

### Contato

- **Email:** juliano.alves@ufsm.br
- **LinkedIn:** [Juliano Alves](https://www.linkedin.com/in/juliano-alves-66657b17/)
- **Site:** [IA Projetos](https://www.iaprojetos.com.br)

### Links Úteis

- [Documentação Next.js](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Versão:** 1.0.0  
**Última atualização:** 19/10/2025
