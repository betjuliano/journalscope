# ⚡ Guia de Início Rápido - Sistema SUB

## 🚦 Iniciar em 5 Minutos

### 1️⃣ Pré-requisitos
- Node.js 18+ instalado
- Terminal/PowerShell aberto

### 2️⃣ Instalação Rápida

```bash
# Na pasta do projeto journalscope
cd sub

# Instalar dependências (primeira vez)
npm install

# Gerar cliente Prisma
npm run db:generate

# Criar banco de dados
npm run db:push
```

### 3️⃣ Iniciar Servidores

**Você precisa de 2 terminais abertos!**

#### Terminal 1 - Journalscope
```bash
# Na raiz do projeto
npm run dev
```
✅ Acesse: http://localhost:5174 (ou 5173)

#### Terminal 2 - Sistema SUB
```bash
# Na pasta sub
cd sub
npm run dev
```
✅ Acesse: http://localhost:3001

### 4️⃣ Testar

1. Abra o Journalscope: http://localhost:5174
2. Selecione alguns periódicos (checkboxes)
3. Clique em "Enviar para SUB"
4. ✅ SUB deve abrir e mostrar os periódicos!

---

## 🎯 Funcionalidades Principais

### 📝 Criar Submissão
1. Dashboard → Botão "Nova Submissão"
2. Preencher formulário
3. Adicionar autores
4. Selecionar periódico principal
5. Adicionar periódicos alternativos
6. Salvar

### 🔄 Reencaminhar Artigo
1. Dashboard → Submissão rejeitada
2. Botão "Reencaminhar"
3. Ver sugestões inteligentes
4. Selecionar novo periódico
5. Ajustar conteúdo (opcional)
6. Confirmar

### 📋 Adicionar Revisão
1. Menu → "Revisões"
2. Botão "Nova Revisão"
3. Selecionar submissão
4. Preencher dados
5. Salvar

### 🔍 Pesquisar Periódico
1. Menu → "Pesquisar Periódico"
2. Selecionar no dropdown
3. Ver estatísticas e submissões

---

## ❗ Problemas Comuns

### Porta 3001 em uso
```bash
# Matar processo
netstat -ano | findstr ":3001"
taskkill /PID <número> /F
```

### SUB não carrega
```bash
# Reinstalar dependências
cd sub
rm -rf node_modules
npm install
npm run dev
```

### Erro de banco de dados
```bash
cd sub
npm run db:push
```

---

## 📚 Documentação Completa

Ver: `sub/README.md`

---

## 🆘 Suporte

**Email:** juliano.alves@ufsm.br  
**Erro?** Veja o console do navegador (F12)

