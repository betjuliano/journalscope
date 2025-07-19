# Implementation Plan - JournalScope Enhancement

## Task Overview

Este plano de implementação detalha as tarefas necessárias para expandir o JournalScope com 4 novas bases de dados, redesign da interface, sistema de paginação avançado e filtros expandidos. As tarefas são organizadas de forma incremental para permitir testes e validação contínua.

## Implementation Tasks

- [x] 1. Preparar estrutura de dados expandida


  - Atualizar schema de dados para incluir campos SJR, JCR, CiteScore e Predatory
  - Modificar interfaces TypeScript existentes
  - Atualizar constantes e configurações para novas fontes
  - _Requirements: 1.1, 1.2_





- [ ] 2. Implementar processadores de dados para novas bases
  - [ ] 2.1 Criar processador para dados SJR
    - Implementar função processJSRData() seguindo padrão existente

    - Extrair quartis, scores, H-index e documentos citáveis
    - Adicionar validação e tratamento de erros específicos
    - _Requirements: 1.1, 1.3_

  - [x] 2.2 Criar processador para dados JCR

    - Implementar função processJCRData() para fatores de impacto
    - Extrair impact factor, quartis e categorias
    - Implementar lógica de mapeamento de colunas específicas
    - _Requirements: 1.1, 1.3_


  - [ ] 2.3 Criar processador para dados CiteScore
    - Implementar função processCiteScoreData() para métricas de citação
    - Extrair scores, percentis e dados de citação
    - Adicionar validação de dados numéricos


    - _Requirements: 1.1, 1.3_

  - [ ] 2.4 Criar processador para base de journals predatórios
    - Implementar função processPredatoryData() para identificação
    - Extrair status, fonte e razões de classificação



    - Implementar sistema de flags booleanos
    - _Requirements: 1.1, 1.3_

- [x] 3. Implementar sistema de merge inteligente de dados


  - Criar função unifyAllDataSources() expandida para 6 fontes
  - Implementar sistema de prioridade para resolução de conflitos
  - Adicionar lógica de merge sem duplicação de journals
  - Implementar validação de integridade dos dados mesclados
  - _Requirements: 1.2, 1.5_

- [ ] 4. Atualizar script de geração de dados embarcados
  - Modificar generateEmbeddedData.js para processar 6 fontes
  - Implementar processamento paralelo otimizado
  - Adicionar geração de estatísticas expandidas
  - Implementar validação de completude dos dados
  - _Requirements: 1.3, 5.1_

- [ ] 5. Criar hook avançado useEnhancedJournalData
  - Implementar gerenciamento de estado para 6 fontes de dados
  - Adicionar lógica de filtros expandidos e combinados
  - Implementar sistema de paginação com loadMore
  - Adicionar cálculo de estatísticas em tempo real
  - _Requirements: 2.1, 2.2, 4.1, 5.2_

- [ ] 6. Implementar sistema de paginação avançado
  - [ ] 6.1 Criar lógica de paginação incremental
    - Implementar carregamento de 100 registros por vez
    - Adicionar estado de controle hasMoreResults
    - Implementar função loadMoreResults() otimizada
    - _Requirements: 2.1, 2.2_

  - [ ] 6.2 Criar componente LoadMoreButton
    - Implementar botão "Carregar Mais" com estados de loading
    - Adicionar indicadores visuais de progresso
    - Implementar desabilitação quando não há mais dados
    - _Requirements: 2.3, 2.6_

- [ ] 7. Redesenhar componente Hero Section
  - Implementar layout com logo e título conforme design
  - Criar 5 cards estatísticos (Total, Filtrados, ABS, SJR, Wiley)
  - Aplicar cores específicas: cinza, laranja, verde, laranja, roxo
  - Implementar atualização dinâmica do card "Filtrados"
  - _Requirements: 8.1, 8.2, 9.1_

- [ ] 8. Implementar filtros rápidos expandidos
  - [ ] 8.1 Criar componentes QuickFilterButton
    - Implementar botões com ícones e descrições
    - Adicionar lógica para Top Tier (A* + 4*)
    - Adicionar lógica para Alta Qualidade (A + 4)
    - _Requirements: 4.1, 4.2_

  - [ ] 8.2 Implementar filtros rápidos avançados
    - Adicionar Alto Impacto JCR (>10)
    - Implementar Qualis MB (ABS 2+, ABDC A/A*, SJR Q1)
    - Implementar Qualis B (ABDC B, ABS 1, SJR Q2)
    - Adicionar SJR (Q1+Q2) e Quartis SJR (Q1 e Q2)
    - _Requirements: 4.1, 4.3_

- [ ] 9. Expandir filtros dropdown
  - [ ] 9.1 Atualizar filtro ABDC
    - Adicionar opções: Todas, A*, A, A ou A*, B, C
    - Implementar lógica OR para combinações (A ou A*)
    - _Requirements: 6.1, 6.5_

  - [ ] 9.2 Atualizar filtro ABS
    - Adicionar opções: Todas, 4*, 4, 3, 2, 2 ou mais, 1
    - Implementar lógica OR para "2 ou mais"
    - _Requirements: 6.2, 6.5_

  - [ ] 9.3 Criar filtro SJR
    - Implementar dropdown com Q1, Q2, Q3, Q4
    - Adicionar combinações: Q1 ou Q2, Q1/Q2/Q3
    - Implementar lógica de quartis
    - _Requirements: 6.3, 6.5_

- [ ] 10. Redesenhar tabela de resultados
  - Atualizar colunas para incluir SJR Score, SJR Quartile, H Index, Citable Docs
  - Implementar badges coloridos para classificações
  - Adicionar sistema de ordenação por colunas
  - Implementar seleção múltipla mantendo estado na paginação
  - _Requirements: 3.1, 3.2, 9.5_

- [ ] 11. Implementar ações de busca expandidas
  - Manter ação Google Scholar existente
  - Adicionar segunda ação de busca (ícone lupa)
  - Implementar tooltips explicativos para cada ação
  - Garantir abertura em nova aba para todas as ações
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 12. Criar rodapé institucional completo
  - Implementar links para Prof. Juliano Nunes Alves
  - Adicionar link para Grupo IaProjetos
  - Incluir links para PPGOP e DCA
  - Adicionar link para UFSM
  - Implementar copyright "© 2025 JournalScope V.3.0"
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 13. Aplicar padrão visual da imagem de referência
  - Implementar fundo azul claro (#E8F4FD)
  - Aplicar bordas arredondadas e sombras suaves
  - Implementar cores específicas para badges e elementos
  - Adicionar hover states para elementos interativos
  - _Requirements: 9.1, 9.2, 9.3, 9.6_

- [ ] 14. Implementar carregamento completo com filtros locais
  - Modificar sistema para carregar todos os dados na inicialização
  - Implementar filtros aplicados localmente sem requisições
  - Otimizar performance para grandes datasets
  - Garantir resposta instantânea aos filtros
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 15. Atualizar sistema de exportação
  - Modificar exportação CSV para incluir novos campos
  - Atualizar exportação Excel com colunas expandidas
  - Manter funcionalidade de seleção múltipla
  - Adicionar estatísticas das novas bases nos exports
  - _Requirements: 1.4, 2.5_

- [ ] 16. Implementar testes para novas funcionalidades
  - [ ] 16.1 Criar testes unitários para processadores de dados
    - Testar processamento de cada nova fonte independentemente
    - Validar tratamento de erros e dados inválidos
    - Testar sistema de merge e resolução de conflitos
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 16.2 Criar testes de integração para filtros
    - Testar combinações complexas de filtros
    - Validar filtros rápidos e suas lógicas
    - Testar performance com datasets grandes
    - _Requirements: 4.1, 4.3, 6.5_

  - [ ] 16.3 Criar testes visuais para componentes
    - Validar renderização conforme design de referência
    - Testar responsividade em diferentes telas
    - Verificar cores e espaçamentos
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 17. Otimizar performance para dados expandidos
  - Implementar lazy loading para componentes pesados
  - Otimizar algoritmos de filtros para 6 fontes
  - Implementar memoização avançada para cálculos
  - Adicionar Web Workers para processamento pesado
  - _Requirements: 5.3, 2.6_

- [ ] 18. Atualizar documentação e configurações
  - Atualizar README com novas funcionalidades
  - Modificar configurações de build para novas dependências
  - Atualizar guia de performance
  - Criar documentação para novas bases de dados
  - _Requirements: 1.4, 8.4_

## Testing and Validation Strategy

### Phase 1: Data Integration Testing
- Validar processamento individual de cada nova fonte
- Testar sistema de merge com dados reais
- Verificar integridade e completude dos dados unificados

### Phase 2: UI Component Testing
- Validar renderização de novos componentes
- Testar responsividade e padrão visual
- Verificar funcionalidade de filtros e paginação

### Phase 3: Integration Testing
- Testar fluxo completo de dados até interface
- Validar performance com datasets expandidos
- Testar cenários de erro e recuperação

### Phase 4: User Acceptance Testing
- Validar usabilidade dos novos filtros
- Testar eficiência na busca de journals
- Verificar satisfação com nova interface

## Success Criteria

1. **Funcionalidade**: Todas as 4 novas bases integradas e funcionais
2. **Performance**: Filtros respondem em < 200ms
3. **Usabilidade**: Interface segue exatamente o padrão da imagem
4. **Dados**: Sistema processa e exibe corretamente dados de 6 fontes
5. **Compatibilidade**: Mantém funcionalidades existentes sem regressões

## Risk Mitigation

### Data Quality Risks
- Implementar validação rigorosa de dados de entrada
- Criar sistema de fallback para dados corrompidos
- Manter logs detalhados de processamento

### Performance Risks
- Implementar monitoramento de performance em tempo real
- Criar sistema de cache inteligente para filtros
- Implementar lazy loading para grandes datasets

### UI/UX Risks
- Realizar testes visuais automatizados
- Implementar sistema de feedback do usuário
- Manter compatibilidade com versões anteriores

Este plano garante implementação incremental e testável de todas as melhorias solicitadas, mantendo a qualidade e performance do sistema existente.