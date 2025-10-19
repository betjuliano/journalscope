# 🚀 Guia Rápido de Inicialização

## ⚠️ IMPORTANTE: Você precisa rodar 2 servidores!

### Opção 1: Scripts Automáticos (Recomendado)

#### Windows:
```bash
# Terminal 1: Journalscope (porta 5173)
npm run dev

# Terminal 2: Sistema SUB (porta 3001)
.\start-sub.bat
```

### Opção 2: Manual

#### Terminal 1 - Journalscope
```bash
npm run dev
```
Aguarde a mensagem: `Local: http://localhost:5173/`

#### Terminal 2 - Sistema SUB
```bash
cd sub
npm run dev
```
Aguarde a mensagem: `Ready on http://0.0.0.0:3001`

## ✅ Verificação

Abra seu navegador:
1. **Journalscope:** http://localhost:5173 ✓
2. **Sistema SUB:** http://localhost:3001 ✓

Se ambos abrirem, está tudo OK!

## 🐛 Se o SUB não iniciar

### Problema: Porta 3001 em uso
```bash
# Verificar o que está usando a porta
netstat -ano | findstr ":3001"

# Matar o processo (substitua PID pelo número que aparecer)
taskkill /PID <número> /F
```

### Problema: Dependências faltando
```bash
cd sub
npm install
npm run dev
```

### Problema: Erro ao compilar TypeScript
```bash
cd sub
npm install tsx --save-dev
npm run dev
```

## 📋 Checklist

- [ ] Terminal 1 rodando `npm run dev` (Journalscope)
- [ ] Terminal 2 rodando `cd sub && npm run dev` (SUB)
- [ ] http://localhost:5173 abre sem erros
- [ ] http://localhost:3001 abre sem erros
- [ ] Botão SUB no Journalscope funciona

## 💡 Dica

Mantenha ambos os terminais abertos enquanto usa o sistema!

