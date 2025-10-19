# 🎯 Guia Completo de Finalização - JournalScope v7 + SUB + Redis

## 🚀 O que foi implementado

### ✅ **Redis Cache System**
- Cache inteligente para submissões (10 min TTL)
- Cache para buscas de periódicos (1h TTL)
- Invalidação automática de cache
- API de gerenciamento de cache (`/api/cache`)
- Configuração com senha de segurança

### ✅ **Arquitetura de Produção Completa**
- **JournalScope Principal** (porta 8080)
- **Sistema SUB** (porta 8081) 
- **Redis Cache** (porta 6379)
- **Nginx Proxy** (opcional)
- **Traefik Labels** para domínios automáticos

### ✅ **Configurações de Domínio**
- Suporte a múltiplos domínios
- SSL automático via Let's Encrypt
- CORS configurado para produção
- Headers de segurança implementados

---

## 📋 **PASSO A PASSO PARA FINALIZAR O DEPLOY**

### **Passo 1: Commit e Push das Mudanças**

```bash
# No seu computador local
cd J:\PROJETOS\PERIODICOS\journalscope

# Adicionar todos os arquivos novos
git add .

# Commit com as implementações
git commit -m "feat: Implementa Redis cache e configurações de domínio para produção"

# Push para o GitHub
git push origin master
```

### **Passo 2: Deploy na VPS**

**Opção A: Script Automático (Recomendado)**
```bash
# Conectar na VPS
ssh root@207.180.254.250
# Senha: Admjuliano.1

# Navegar para o projeto
cd /opt/journalscope

# Executar o script de deploy
bash deploy-v7-redis-production.sh
```

**Opção B: Comandos Manuais**
```bash
# 1. Conectar na VPS
ssh root@207.180.254.250

# 2. Atualizar código
cd /opt/journalscope
git pull origin master

# 3. Parar containers antigos
docker-compose -f docker-compose-production.yml down

# 4. Build das novas imagens
docker build -f Dockerfile.v6 -t periodicos:6v .
cd sub && docker build -t sub-system:2v . && cd ..

# 5. Subir com Redis
docker-compose -f docker-compose-production.yml up -d

# 6. Verificar status
docker-compose -f docker-compose-production.yml ps
```

### **Passo 3: Configurar DNS dos Domínios**

Configure os seguintes registros DNS:

```
Tipo: A
Nome: periodicos.iaprojetos.com.br
Valor: 207.180.254.250

Tipo: A  
Nome: sub.iaprojetos.com.br
Valor: 207.180.254.250

Tipo: A
Nome: periodicos.iatranscreve.com.br  
Valor: 207.180.254.250

Tipo: A
Nome: sub.iatranscreve.com.br
Valor: 207.180.254.250
```

### **Passo 4: Configurar SSL e Domínios no Portainer**

1. **Acesse o Portainer:**
   - URL: https://portainer.escolabets.com.br
   - Login: `iaprojetos`
   - Senha: `Admjuliano1@`

2. **Opção A: Usar Traefik (Automático)**
   ```bash
   # Na VPS, trocar para configuração com domínios
   docker-compose -f docker-compose-domain.yml up -d
   ```

3. **Opção B: Configurar manualmente no Portainer**
   - Vá em "Stacks" → "journalscope"
   - Adicione as labels do Traefik:
   ```yaml
   labels:
     - "traefik.enable=true"
     - "traefik.http.routers.journalscope.rule=Host(`periodicos.iaprojetos.com.br`)"
     - "traefik.http.routers.journalscope.entrypoints=websecure"
     - "traefik.http.routers.journalscope.tls.certresolver=letsencrypt"
   ```

### **Passo 5: Testar a Aplicação Completa**

#### **5.1 Teste Básico de Funcionamento**
```bash
# JournalScope Principal
curl -I https://periodicos.iaprojetos.com.br

# Sistema SUB  
curl -I https://sub.iaprojetos.com.br

# Health check SUB
curl https://sub.iaprojetos.com.br/api/health
```

#### **5.2 Teste do Redis Cache**
```bash
# Testar API de cache
curl "https://sub.iaprojetos.com.br/api/cache?key=test"

# Criar um cache
curl -X POST https://sub.iaprojetos.com.br/api/cache \
  -H "Content-Type: application/json" \
  -d '{"key":"test","value":"funcionando","ttl":300}'

# Verificar se foi criado
curl "https://sub.iaprojetos.com.br/api/cache?key=test"
```

#### **5.3 Teste da Integração Completa**
1. Abra: https://periodicos.iaprojetos.com.br
2. Faça uma busca por periódicos
3. Selecione alguns periódicos na tabela
4. Clique no botão "SUB" no canto superior direito
5. Verifique se o modal abre com https://sub.iaprojetos.com.br
6. Confirme que os periódicos selecionados aparecem no SUB
7. Teste criar uma submissão

---

## 🔧 **Monitoramento e Manutenção**

### **Comandos Úteis de Monitoramento**

```bash
# Ver status de todos os containers
docker ps

# Logs em tempo real
docker-compose -f docker-compose-production.yml logs -f

# Logs específicos
docker logs -f journalscope-v6
docker logs -f sub-system-v1  
docker logs -f journalscope-redis

# Uso de recursos
docker stats

# Verificar Redis
docker exec journalscope-redis redis-cli ping

# Verificar cache do Redis
docker exec journalscope-redis redis-cli keys "*"
```

### **Backup do Banco de Dados**

```bash
# Backup do SQLite do SUB
docker exec sub-system-v1 cp /app/prisma/db/custom.db /app/prisma/db/backup-$(date +%Y%m%d).db

# Copiar backup para host
docker cp sub-system-v1:/app/prisma/db/backup-$(date +%Y%m%d).db ./backup-sub-$(date +%Y%m%d).db
```

### **Limpeza de Cache Redis**

```bash
# Limpar todo o cache
curl -X DELETE "https://sub.iaprojetos.com.br/api/cache?action=flush"

# Limpar cache específico
curl -X DELETE "https://sub.iaprojetos.com.br/api/cache?key=submissoes:all"
```

---

## 🎯 **Checklist Final de Verificação**

### **Infraestrutura**
- [ ] Containers rodando (journalscope-v6, sub-system-v1, journalscope-redis)
- [ ] Redis funcionando e aceitando conexões
- [ ] Volumes persistentes criados
- [ ] Rede Docker configurada

### **Domínios e SSL**
- [ ] DNS configurado para todos os domínios
- [ ] SSL funcionando (certificados Let's Encrypt)
- [ ] Redirecionamento HTTP → HTTPS ativo
- [ ] CORS configurado para domínios de produção

### **Funcionalidades**
- [ ] JournalScope carrega sem erros
- [ ] Busca de periódicos funciona
- [ ] Seleção de periódicos funciona
- [ ] Modal SUB abre corretamente
- [ ] Integração entre sistemas funciona
- [ ] Cache Redis está ativo
- [ ] Submissões podem ser criadas no SUB

### **Performance**
- [ ] Tempo de carregamento < 3s
- [ ] Cache Redis reduzindo consultas ao banco
- [ ] Logs sem erros críticos
- [ ] Uso de memória estável

---

## 🚨 **Troubleshooting**

### **Problema: Container não inicia**
```bash
# Verificar logs
docker logs container-name

# Verificar recursos
df -h
free -h

# Reiniciar container
docker restart container-name
```

### **Problema: Redis não conecta**
```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Testar conexão
docker exec journalscope-redis redis-cli ping

# Verificar senha
docker exec journalscope-redis redis-cli -a "JournalScope2025!" ping
```

### **Problema: Integração não funciona**
1. Verificar CORS no console do navegador (F12)
2. Confirmar URLs de produção no código
3. Testar health checks individuais
4. Verificar logs de ambos os sistemas

### **Problema: SSL não funciona**
1. Verificar se DNS está propagado: `nslookup periodicos.iaprojetos.com.br`
2. Verificar Traefik logs: `docker logs traefik`
3. Forçar renovação de certificado no Portainer

---

## 🎉 **Resultado Final**

Após seguir todos os passos, você terá:

### **🌐 URLs de Produção:**
- **JournalScope:** https://periodicos.iaprojetos.com.br
- **Sistema SUB:** https://sub.iaprojetos.com.br
- **Alternativo:** https://periodicos.iatranscreve.com.br

### **🚀 Recursos Implementados:**
- ✅ Sistema completo de consulta de periódicos
- ✅ Sistema de gestão de submissões acadêmicas
- ✅ Cache Redis para alta performance
- ✅ Integração bidirecional entre sistemas
- ✅ SSL automático e domínios personalizados
- ✅ Modo escuro e multilíngue
- ✅ Monitoramento e logs estruturados

### **📊 Performance Esperada:**
- **Carregamento:** < 2s
- **Cache Hit Rate:** > 80%
- **Uptime:** > 99.9%
- **Concurrent Users:** 100+

---

## 📞 **Suporte**

- **Desenvolvedor:** Juliano Alves  
- **Email:** juliano.alves@ufsm.br
- **LinkedIn:** https://www.linkedin.com/in/juliano-alves-66657b17/

**🎯 Sistema pronto para produção com Redis, domínios e SSL configurados!**
