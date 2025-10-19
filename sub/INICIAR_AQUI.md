# 🚀 COMO INICIAR O SISTEMA SUB

## ⚠️ ATENÇÃO: Leia Antes de Iniciar!

Você precisa ter **2 servidores rodando simultaneamente**:
1. **Journalscope** (porta 5173 ou 5174)
2. **Sistema SUB** (porta 3001) ← **ESTE QUE ESTÁ DANDO ERRO!**

---

## 📋 Passo a Passo

### Passo 1: Instalar Dependências (Primeira Vez)

Abra o PowerShell/Terminal nesta pasta (`sub/`):

```powershell
npm install
```

Aguarde a instalação terminar...

### Passo 2: Configurar Banco de Dados (Primeira Vez)

```powershell
npm run db:generate
npm run db:push
```

### Passo 3: Iniciar o Servidor

```powershell
npm run dev
```

**Aguarde aparecer:**
```
> Ready on http://0.0.0.0:3001
> Socket.IO server running at ws://0.0.0.0:3001/api/socketio
```

---

## ✅ Como Saber se Funcionou?

1. Abra o navegador
2. Vá para: http://localhost:3001
3. Deve aparecer o Dashboard do SUB
4. Se aparecer, está FUNCIONANDO! ✅

---

## 🐛 Se Não Funcionar

### Erro: "Porta 3001 em uso"

```powershell
# Ver o que está usando a porta
netstat -ano | findstr ":3001"

# Matar o processo (substitua <PID> pelo número que aparecer)
taskkill /PID <PID> /F

# Tentar novamente
npm run dev
```

### Erro: "Module not found"

```powershell
# Reinstalar tudo
rm -rf node_modules
npm install
npm run dev
```

### Erro: Database

```powershell
npm run db:push
npm run dev
```

---

## 🎯 Usar o Sistema

### Opção 1: SUB Standalone

Acesse diretamente: http://localhost:3001

### Opção 2: Integrado com Journalscope

1. Journalscope deve estar rodando (http://localhost:5174)
2. Selecione periódicos na tabela
3. Clique em "Enviar para SUB"
4. Modal abre automaticamente

---

## 📞 Precisa de Ajuda?

1. Verifique o console do terminal para erros
2. Abra o navegador em http://localhost:3001
3. Pressione F12 para ver erros no console
4. Email: juliano.alves@ufsm.br

---

## 📚 Documentação Completa

- [README Completo](./README.md) - Todas as funcionalidades
- [Quick Start](./QUICK_START.md) - Início rápido

---

**IMPORTANTE:** Mantenha este terminal aberto enquanto usa o sistema!

