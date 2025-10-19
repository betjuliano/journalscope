# 🚀 Deploy JournalScope v6 + SUB - Resumo de Produção

## ✅ Arquivos Criados para Produção

### 1. **Dockerfile para Sistema SUB**
- `sub/Dockerfile` - Container otimizado para produção
- Build em multi-stage com Node.js 18 Alpine
- Prisma Client gerado automaticamente
- Health check integrado
- Usuário não-root para segurança

### 2. **Docker Compose de Produção**
- `docker-compose-production.yml` - Orquestração completa
- JournalScope (porta 8080) + SUB (porta 8081)
- Nginx reverse proxy opcional
- Volumes persistentes para dados e logs
- Rede interna para comunicação entre containers

### 3. **Configurações de Produção**
- `Dockerfile.v6` - JournalScope otimizado
- `nginx-production.conf` - Proxy reverso com CORS
- `sub/env.production.example` - Variáveis de ambiente
- `sub/next.config.ts` - Configuração Next.js para produção

### 4. **Script de Deploy Automatizado**
- `deploy-v6-production.sh` - Deploy completo na VPS
- Build automático das imagens
- Health checks integrados
- Logs de monitoramento

## 🏗️ Arquitetura de Produção

```
┌─────────────────────────────────────────────────┐
│                    VPS                          │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐              │
│  │ JournalScope│  │ Sistema SUB │              │
│  │   (8080)    │  │   (8081)    │              │
│  └─────────────┘  └─────────────┘              │
│           │               │                     │
│  ┌─────────────────────────────────────────┐   │
│  │        Nginx Proxy (80/443)            │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 📊 Especificações Técnicas

### JournalScope Principal
- **Imagem:** `periodicos:6v`
- **Porta:** 8080
- **Base:** Nginx Alpine
- **Dados:** 8,217+ journals embarcados
- **Recursos:** Busca, filtros, exportação, modo escuro

### Sistema SUB
- **Imagem:** `sub-system:1v`
- **Porta:** 8081
- **Base:** Node.js 18 + Next.js
- **Banco:** SQLite (Prisma)
- **Recursos:** Gestão de submissões, Socket.IO, API REST

### Integração
- **Comunicação:** PostMessage API + CORS
- **Dados:** Periódicos selecionados enviados via iframe
- **Tempo real:** WebSocket para atualizações
- **Segurança:** Headers de segurança, CORS configurado

## 🔧 Configurações de Produção

### Variáveis de Ambiente
```bash
# JournalScope
NODE_ENV=production
VITE_APP_VERSION=6.0.0
VITE_SUB_SYSTEM_URL=http://localhost:8081

# Sistema SUB
NODE_ENV=production
PORT=3001
DATABASE_URL=file:./prisma/db/custom.db
```

### Portas Expostas
- **80/443:** Nginx Proxy (opcional)
- **8080:** JournalScope Principal
- **8081:** Sistema SUB

## 🚀 Processo de Deploy

### 1. Preparação Local
```bash
# Verificar arquivos
git add .
git commit -m "Deploy v6 com integração SUB"
git push origin master
```

### 2. Deploy na VPS
```bash
# Executar script de deploy
./deploy-v6-production.sh
```

### 3. Verificação
- ✅ JournalScope: http://207.180.254.250:8080
- ✅ Sistema SUB: http://207.180.254.250:8081
- ✅ Health checks passando
- ✅ Integração funcionando

## 🔍 Monitoramento

### Logs dos Containers
```bash
# Todos os serviços
docker-compose -f docker-compose-production.yml logs -f

# Apenas JournalScope
docker logs -f journalscope-v6

# Apenas SUB
docker logs -f sub-system-v1
```

### Health Checks
```bash
# JournalScope
curl -f http://localhost:8080

# Sistema SUB
curl -f http://localhost:8081/api/health
```

## 🌐 Configuração de Domínios

### Portainer (Recomendado)
1. Acesse: https://portainer.escolabets.com.br
2. Login: iaprojetos / Admjuliano1@
3. Configure os domínios:
   - `periodicos.iaprojetos.com.br` → porta 8080
   - `sub.iaprojetos.com.br` → porta 8081

### Traefik Labels (Alternativo)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.journalscope.rule=Host(`periodicos.iaprojetos.com.br`)"
  - "traefik.http.services.journalscope.loadbalancer.server.port=8080"
```

## 🔒 Segurança Implementada

### Headers de Segurança
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### CORS Configurado
- Origins permitidas configuráveis
- Credentials habilitadas para integração
- Métodos HTTP específicos

### Container Security
- Usuário não-root nos containers
- Volumes com permissões adequadas
- Health checks para monitoramento

## 📈 Performance

### Otimizações Implementadas
- **Build multi-stage:** Imagens menores
- **Nginx caching:** Assets estáticos otimizados
- **Gzip compression:** Redução de bandwidth
- **Standalone output:** Next.js otimizado

### Métricas Esperadas
- **Tempo de carregamento:** < 2s
- **Tamanho da imagem:** ~70MB (JournalScope) + ~150MB (SUB)
- **Uso de memória:** ~100MB por container
- **Uso de CPU:** < 5% em idle

## 🐛 Troubleshooting

### Container não inicia
```bash
# Verificar logs
docker logs journalscope-v6
docker logs sub-system-v1

# Verificar recursos
docker stats
```

### Integração não funciona
1. Verificar CORS no console do navegador
2. Confirmar portas 8080 e 8081 acessíveis
3. Testar health checks individuais

### Banco de dados SUB
```bash
# Acessar container SUB
docker exec -it sub-system-v1 sh

# Verificar banco
ls -la /app/prisma/db/
```

## 📞 Suporte

- **Desenvolvedor:** Juliano Alves
- **Email:** juliano.alves@ufsm.br
- **LinkedIn:** https://www.linkedin.com/in/juliano-alves-66657b17/

---

**✅ Deploy v6 + SUB preparado para produção em 19/10/2025**
