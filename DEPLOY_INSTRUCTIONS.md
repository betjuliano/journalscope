# 🚀 Instruções de Deploy - JournalScope v4.0

## Novidades da Versão 4.0:

- ✅ Dados atualizados com 8,222 journals únicos
- ✅ JCR 2024 expandido com 2,482 journals (794 novos registros)
- ✅ Informações predatórias aprimoradas com fonte detalhada
- ✅ Processo de geração de dados otimizado
- ✅ Build otimizado com compressão de 91% (2.3MB → 202KB gzip)
- ✅ Validação completa de estrutura de dados
- ✅ Performance aprimorada no carregamento
- ✅ Todas as funcionalidades da v3.0 mantidas

## Como fazer o deploy:

### Opção 1: Via Portainer Web Interface

1. Acesse: https://portainer.iaprojetos.com.br
2. Login: iaprojetos / Admjuliano1@
3. Vá em "Stacks" → Selecione a stack atual
4. Clique em "Editor" e cole o conteúdo do docker-compose.yml
5. Clique em "Update the stack"

### Opção 2: Via SSH no servidor

```bash
# 1. Fazer upload dos arquivos para o servidor
scp -r . usuario@servidor:/path/to/project/

# 2. Conectar via SSH
ssh usuario@servidor

# 3. Navegar para o diretório
cd /path/to/project/

# 4. Executar o deploy
chmod +x deploy.sh
./deploy.sh
```

### Opção 3: Build manual

```bash
# 1. Build da imagem
docker build -t periodicos:4v .

# 2. Parar container anterior
docker-compose down

# 3. Subir novo container
docker-compose up -d

# 4. Verificar status
docker-compose ps
docker-compose logs
```

## Verificações pós-deploy:

- [ ] Aplicação carregando em https://periodicos.iaprojetos.com.br
- [ ] Aplicação carregando em https://periodicos.iatranscreve.com.br
- [ ] Hero section com 7 cards de estatísticas
- [ ] Footer com logos da UFSM e CNPq
- [ ] Filtro "Excluir Predatórios" funcionando
- [ ] Estatísticas detalhadas com 8,222 journals
- [ ] Colunas SJR, JCR e CiteScore disponíveis

## Dados da aplicação:

- **Total de journals**: 8,222 únicos
- **Bases integradas**: 7 (ABDC, ABS, JCR, SJR, CiteScore, Wiley, Predatory)
- **Tamanho da imagem**: ~50MB (otimizada)
- **Tempo de build**: ~2-3 minutos
- **Performance**: Carregamento instantâneo dos dados

## Troubleshooting:

- Se o container não subir, verificar logs: `docker-compose logs`
- Se SSL não funcionar, verificar configuração do Traefik
- Se dados não carregarem, verificar se o build incluiu os arquivos embarcados

## Contato:

- Desenvolvedor: Juliano Alves
- Email: juliano.alves@ufsm.br
- LinkedIn: https://www.linkedin.com/in/juliano-alves-66657b17/
