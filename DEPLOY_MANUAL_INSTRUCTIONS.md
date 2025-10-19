# 🚀 Instruções de Deploy Manual - JournalScope v6 + SUB

## 📋 Passo a Passo para Deploy na VPS

### 1. Conectar na VPS
```bash
ssh root@207.180.254.250
# Senha: Admjuliano.1
```

### 2. Navegar para o projeto
```bash
cd /opt/journalscope
```

### 3. Atualizar código do GitHub
```bash
git pull origin master
```

### 4. Parar containers antigos
```bash
docker-compose -f docker-compose-simple.yml down 2>/dev/null || true
docker-compose -f docker-compose-production.yml down 2>/dev/null || true
```

### 5. Build da imagem JournalScope v6
```bash
docker build -f Dockerfile.v6 -t periodicos:6v .
```

### 6. Build da imagem Sistema SUB
```bash
cd sub
docker build -t sub-system:1v .
cd ..
```

### 7. Verificar imagens criadas
```bash
docker images | grep -E "(periodicos:6v|sub-system:1v)"
```

### 8. Subir containers em produção
```bash
docker-compose -f docker-compose-production.yml up -d
```

### 9. Aguardar inicialização (30 segundos)
```bash
sleep 30
```

### 10. Verificar status dos containers
```bash
docker-compose -f docker-compose-production.yml ps
```

### 11. Testar health checks
```bash
# JournalScope
curl -f http://localhost:8080

# Sistema SUB
curl -f http://localhost:8081/api/health
```

### 12. Verificar logs (se necessário)
```bash
# JournalScope
docker logs --tail=20 journalscope-v6

# Sistema SUB
docker logs --tail=20 sub-system-v1
```

## ✅ Verificação Final

Após executar todos os comandos, verifique:

1. **Containers rodando:**
   ```bash
   docker ps
   ```

2. **Acessos funcionando:**
   - JournalScope: http://207.180.254.250:8080
   - Sistema SUB: http://207.180.254.250:8081

3. **Integração funcionando:**
   - Abra o JournalScope
   - Selecione alguns periódicos
   - Clique em "SUB" no canto superior direito
   - Verifique se o modal abre e os periódicos aparecem

## 🔧 Comandos Úteis de Monitoramento

```bash
# Ver todos os containers
docker ps -a

# Logs em tempo real
docker-compose -f docker-compose-production.yml logs -f

# Reiniciar um container específico
docker restart journalscope-v6
docker restart sub-system-v1

# Ver uso de recursos
docker stats
```

## 🌐 Configuração no Portainer

1. Acesse: https://portainer.escolabets.com.br
2. Login: iaprojetos / Admjuliano1@
3. Configure os domínios:
   - `periodicos.iaprojetos.com.br` → porta 8080
   - `sub.iaprojetos.com.br` → porta 8081

## 🎉 Pronto!

Seu sistema estará rodando em:
- **JournalScope:** http://207.180.254.250:8080
- **Sistema SUB:** http://207.180.254.250:8081

Com integração completa entre os dois sistemas!
