# 🚀 README DEPLOY - JournalScope v3.0

## 📋 Informações do Deploy

### 🔗 **Links Importantes:**
- **Repositório GitHub:** https://github.com/betjuliano/journalscope
- **Portainer:** https://portainer.iaprojetos.com.br
- **Site Principal:** https://periodicos.iaprojetos.com.br
- **Site Secundário:** https://periodicos.iatranscreve.com.br

### 🔑 **Credenciais:**
- **Usuário Portainer:** iaprojetos
- **Senha Portainer:** Admjuliano1@
- **Token Portainer:** yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (pode precisar atualizar)

---

## 🎯 MÉTODO 1: Deploy via Git Repository (RECOMENDADO)

### ✅ **Pré-requisitos:**
- [x] Repositório GitHub público
- [x] Portainer funcionando
- [x] Rede `iaprojetos` configurada

### 📝 **Passo a Passo:**

#### **1.1 Acessar Portainer**
1. Abra: https://portainer.iaprojetos.com.br
2. Login: `iaprojetos` / `Admjuliano1@`
3. Selecione o ambiente Docker

#### **1.2 Build da Imagem**
1. Vá em: **"Images"** → **"Build a new image"**
2. Preencha:
   - **Name:** `periodicos:3v`
   - **Build method:** `Git Repository`
   - **Repository URL:** `https://github.com/betjuliano/journalscope`
   - **Reference:** `master`
   - **Dockerfile path:** `Dockerfile`
3. Clique: **"Build the image"**
4. **Aguarde 3-5 minutos** (acompanhe os logs)

#### **1.3 Atualizar Stack**
1. Vá em: **"Stacks"** → Selecione sua stack atual
2. Clique: **"Editor"**
3. Altere a linha:
   ```yaml
   # DE:
   image: periodicos:2v
   # PARA:
   image: periodicos:3v
   ```
4. Clique: **"Update the stack"**

### 🚨 **Se der erro no Método 1:**

#### **Erro: "Could not be recognized as URL"**
**Solução A:** Tente com `.git`:
```
https://github.com/betjuliano/journalscope.git
```

**Solução B:** Tente com referência completa:
- **Reference:** `refs/heads/master`

**Solução C:** Vá para o **MÉTODO 2**

---

## 🎯 MÉTODO 2: Deploy via Upload ZIP

### 📝 **Passo a Passo:**

#### **2.1 Baixar o Projeto**
1. Vá em: https://github.com/betjuliano/journalscope
2. Clique: **"Code"** → **"Download ZIP"**
3. Salve: `journalscope-master.zip`

#### **2.2 Build via Upload**
1. No Portainer: **"Images"** → **"Build a new image"**
2. Preencha:
   - **Name:** `periodicos:3v`
   - **Build method:** `Upload`
   - **File:** Selecione o ZIP baixado
   - **Dockerfile path:** `Dockerfile`
3. Clique: **"Build the image"**

#### **2.3 Continuar com Passo 1.3**
- Siga o passo 1.3 do Método 1 para atualizar a stack

### 🚨 **Se der erro no Método 2:**

#### **Erro: "Invalid tar header"**
**Solução A:** Use Dockerfile alternativo:
- **Dockerfile path:** `Dockerfile.simple`

**Solução B:** Vá para o **MÉTODO 3**

---

## 🎯 MÉTODO 3: Deploy Manual via SSH

### 📝 **Pré-requisitos:**
- Acesso SSH ao servidor
- Docker instalado no servidor

### 📝 **Passo a Passo:**

#### **3.1 Conectar ao Servidor**
```bash
ssh usuario@servidor
```

#### **3.2 Baixar o Projeto**
```bash
# Opção A: Via Git
git clone https://github.com/betjuliano/journalscope.git
cd journalscope

# Opção B: Via wget
wget https://github.com/betjuliano/journalscope/archive/refs/heads/master.zip
unzip master.zip
cd journalscope-master
```

#### **3.3 Build da Imagem**
```bash
# Build padrão
docker build -t periodicos:3v .

# Se der erro, tente o Dockerfile simples:
docker build -f Dockerfile.simple -t periodicos:3v .
```

#### **3.4 Verificar Imagem**
```bash
docker images | grep periodicos
```

#### **3.5 Atualizar Stack**
```bash
# Parar container atual
docker-compose down

# Subir novo container
docker-compose up -d

# Verificar status
docker-compose ps
docker-compose logs
```

---

## 🎯 MÉTODO 4: Deploy via Docker Hub

### 📝 **Passo a Passo:**

#### **4.1 Build Local (no seu PC)**
```bash
# Build da imagem
docker build -t betjuliano/journalscope:3v .

# Login no Docker Hub
docker login

# Push para Docker Hub
docker push betjuliano/journalscope:3v
```

#### **4.2 No Portainer**
1. **"Stacks"** → Sua stack atual → **"Editor"**
2. Altere para:
   ```yaml
   image: betjuliano/journalscope:3v
   ```
3. **"Update the stack"**

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### 🔍 **Checklist Obrigatório:**
- [ ] **Sites carregando:**
  - [ ] https://periodicos.iaprojetos.com.br
  - [ ] https://periodicos.iatranscreve.com.br
- [ ] **Hero Section:** 7 cards de estatísticas visíveis
- [ ] **Footer:** Logos UFSM, PPGOP e CNPq visíveis
- [ ] **Filtros:** Botão "Excluir Predatórios" funcionando
- [ ] **Busca:** Campo de busca funcionando
- [ ] **Estatísticas:** Botão "Stats" mostra dados detalhados
- [ ] **Responsivo:** Funciona em mobile

### 🔍 **Verificação Técnica:**
- [ ] **Container Status:** Running
- [ ] **Logs:** Sem erros críticos
- [ ] **Memória:** < 300MB de uso
- [ ] **CPU:** < 10% em idle

### 📊 **Dados Esperados:**
- **Total Journals:** 8,222
- **Com ABDC:** ~2,680
- **Com ABS:** ~1,822
- **Com JCR:** ~2,482
- **Com SJR:** ~1,716
- **Predatórios:** ~1,361

---

## 🚨 TROUBLESHOOTING

### **Problema: Site não carrega**
**Diagnóstico:**
```bash
# Verificar container
docker ps | grep periodicos

# Verificar logs
docker logs <container_id>

# Verificar rede
docker network ls | grep iaprojetos
```

**Soluções:**
1. Reiniciar container: `docker restart <container_id>`
2. Verificar configuração Traefik
3. Verificar DNS dos domínios

### **Problema: Build falha**
**Diagnóstico:**
- Verificar logs do build no Portainer
- Verificar se todos os arquivos estão no repositório

**Soluções:**
1. Tentar Dockerfile.simple
2. Verificar dependências no package.json
3. Limpar cache: `docker system prune`

### **Problema: Dados não carregam**
**Diagnóstico:**
- Verificar se arquivos em `data-sources/` existem
- Verificar se `npm run generate-data` executou

**Soluções:**
1. Rebuild da imagem
2. Verificar script `generateEmbeddedData.js`
3. Verificar permissões dos arquivos

### **Problema: SSL/HTTPS não funciona**
**Diagnóstico:**
- Verificar configuração Traefik
- Verificar certificados Let's Encrypt

**Soluções:**
1. Verificar labels do docker-compose
2. Reiniciar Traefik
3. Verificar DNS dos domínios

---

## 📞 CONTATOS DE SUPORTE

### **Desenvolvedor:**
- **Nome:** Juliano Alves
- **Email:** juliano.alves@ufsm.br
- **LinkedIn:** https://www.linkedin.com/in/juliano-alves-66657b17/

### **Repositório:**
- **GitHub:** https://github.com/betjuliano/journalscope
- **Issues:** https://github.com/betjuliano/journalscope/issues

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### **Arquivos de Referência:**
- `DEPLOY_INSTRUCTIONS.md` - Instruções detalhadas
- `DEPLOYMENT_COMPARISON.md` - Comparação v2 vs v3
- `docker-compose.yml` - Configuração principal
- `docker-compose-simple.yml` - Configuração alternativa

### **Comandos Úteis:**
```bash
# Verificar imagens
docker images

# Verificar containers
docker ps -a

# Logs em tempo real
docker logs -f <container_id>

# Limpar sistema
docker system prune -a

# Backup da stack
docker-compose config > backup-stack.yml
```

---

## 🎉 SUCESSO!

Se chegou até aqui e tudo está funcionando:

**🎊 PARABÉNS! JournalScope v3.0 está no ar!**

**📈 Melhorias implementadas:**
- Interface moderna e profissional
- 8,222 journals únicos (vs 6,000 da v2)
- JCR 2024 atualizado
- Logos institucionais (UFSM, PPGOP, CNPq)
- Filtro de journals predatórios
- Estatísticas detalhadas
- Performance otimizada

**🌐 Acesse e aproveite:**
- https://periodicos.iaprojetos.com.br
- https://periodicos.iatranscreve.com.br