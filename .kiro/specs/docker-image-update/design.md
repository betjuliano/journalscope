# Design Document

## Overview

Este documento descreve o design para atualizar a imagem Docker do JournalScope com os dados mais recentes. O processo seguirá o mesmo padrão que funcionou na versão 3v, utilizando o Dockerfile principal com nginx e o processo de build em duas etapas.

## Architecture

### Build Process Flow
```
Dados Atualizados (embeddedJournals.js) 
    ↓
Docker Build (Multi-stage)
    ↓
Geração de Dados (npm run generate-data)
    ↓
Build da Aplicação (npm run build)
    ↓
Nginx Production Image
    ↓
Deploy via Docker Compose
    ↓
Portainer/Traefik (Multi-domain)
```

### Current Working Configuration
- **Image Tag**: `periodicos:3v` → `periodicos:4v` (nova versão)
- **Dockerfile**: Usar o Dockerfile principal (multi-stage com nginx)
- **Compose**: docker-compose.yml (configuração completa com Traefik)
- **Domains**: periodicos.iaprojetos.com.br + periodicos.iatranscreve.com.br

## Components and Interfaces

### 1. Docker Build System
**Dockerfile (Multi-stage)**:
- **Stage 1 (Builder)**: Node.js 18-alpine
  - Instala dependências
  - Executa `npm run generate-data` (processa embeddedJournals.js)
  - Executa `npm run build` (gera dist/)
- **Stage 2 (Production)**: Nginx alpine
  - Copia arquivos built
  - Configura nginx otimizado

### 2. Data Processing
**Script de Geração**:
- Input: `src/data/embeddedJournals.js` (8,222 journals)
- Process: `scripts/generateEmbeddedData.js`
- Output: Dados otimizados para produção

### 3. Deployment System
**Docker Compose Configuration**:
- Service: `journalscope-multidominio`
- Network: `iaprojetos` (external)
- Labels: Traefik configuration for SSL + multi-domain
- Resources: 512M limit, 256M reservation

### 4. Reverse Proxy Setup
**Traefik Integration**:
- SSL certificates via Let's Encrypt
- Multi-domain routing
- Security headers
- HTTP to HTTPS redirect

## Data Models

### Journal Data Structure (Updated)
```javascript
{
  "version": "1.0.0",
  "generatedAt": "2025-07-19T14:06:13.377Z",
  "stats": {
    "total": 8222,           // +737 journals
    "withJCR": 2482,         // +794 JCR entries
    "withPredatory": 1361,   // Enhanced predatory info
    // ... other stats
  },
  "data": [
    {
      "journal": "Journal Name",
      "predatory": {
        "isPredatory": true,
        "source": "The Predatory Journals List",  // Enhanced
        "reason": "Listed as predatory journal", // Enhanced
        "lastChecked": "2025-07-19"
      }
      // ... other fields
    }
  ]
}
```

### Build Configuration
```dockerfile
# Dockerfile structure (proven working)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run generate-data  # Processes embeddedJournals.js
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Error Handling

### Build Process
1. **Data Generation Failure**: 
   - Validate embeddedJournals.js syntax
   - Check file permissions
   - Verify script dependencies

2. **Docker Build Failure**:
   - Check Dockerfile syntax
   - Verify base image availability
   - Monitor build logs

3. **Deployment Failure**:
   - Validate docker-compose.yml
   - Check network connectivity
   - Verify Traefik configuration

### Runtime Monitoring
- Container health checks
- Nginx error logs
- Application performance metrics
- SSL certificate validation

## Testing Strategy

### Pre-deployment Testing
1. **Local Build Test**:
   ```bash
   docker build -t periodicos:4v-test .
   docker run -p 8080:80 periodicos:4v-test
   ```

2. **Data Validation**:
   - Verify 8,222 journals loaded
   - Check JCR data (2,482 entries)
   - Validate predatory information

3. **Functionality Test**:
   - Search functionality
   - Filter operations
   - Export features
   - Responsive design

### Deployment Process
1. **Staging Deployment**:
   - Test on development environment
   - Validate SSL certificates
   - Check multi-domain routing

2. **Production Deployment**:
   - Blue-green deployment strategy
   - Monitor application metrics
   - Rollback plan if needed

### Post-deployment Validation
- [ ] Both domains accessible (https)
- [ ] Data statistics correct (8,222 journals)
- [ ] All filters working
- [ ] Performance acceptable
- [ ] SSL certificates valid

## Implementation Notes

### Version Management
- Current: `periodicos:3v`
- New: `periodicos:4v`
- Tag format: `periodicos:Xv` where X is version number

### Deployment Method (Proven Working)
1. **Via Portainer** (Recommended):
   - Access: https://portainer.iaprojetos.com.br
   - Update stack with new image tag
   - Monitor deployment progress

2. **Via SSH** (Alternative):
   - Use deploy.sh script
   - Manual docker commands
   - Direct server access

### Data Synchronization
- Ensure `embeddedJournals.js` is the source of truth
- Update `embeddedJournals.json` if needed for compatibility
- Maintain data consistency across environments