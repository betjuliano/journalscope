# Requirements Document - JournalScope Enhancement

## Introduction

Esta especificação define as melhorias e novas funcionalidades para o sistema JournalScope, incluindo integração de novas bases de dados acadêmicas, melhorias na interface do usuário, sistema de paginação avançado e filtros mais robustos. O objetivo é expandir significativamente as capacidades do sistema mantendo a performance e usabilidade existentes.

## Requirements

### Requirement 1: Integração de Novas Bases de Dados

**User Story:** Como um pesquisador acadêmico, eu quero acessar informações de múltiplas bases de dados (JSR, JCR, CiteScore e Predatórios) em uma única interface, para que eu possa ter uma visão completa da qualidade e impacto dos journals.

#### Acceptance Criteria

1. WHEN o sistema processa os dados THEN deve integrar as seguintes bases adicionais:
   - JSR (Scimago Journal Rank) com classificações Q1, Q2, Q3, Q4
   - JCR (Journal Citation Reports) com fatores de impacto
   - CiteScore com métricas de citação
   - Base de Journals Predatórios com status de classificação
2. WHEN os dados são unificados THEN journals duplicados devem ser mesclados mantendo todas as informações das diferentes bases
3. WHEN o embedding é regenerado THEN deve manter compatibilidade com o sistema de cache existente
4. WHEN novos dados são processados THEN estatísticas devem incluir contadores para todas as bases
5. WHEN há conflitos de dados THEN deve priorizar a fonte mais confiável (ABDC > ABS > JSR > JCR > CiteScore)

### Requirement 2: Sistema de Paginação Avançado

**User Story:** Como um usuário do sistema, eu quero poder carregar mais resultados sob demanda, para que eu possa navegar por grandes conjuntos de dados sem impacto na performance inicial.

#### Acceptance Criteria

1. WHEN a lista inicial é carregada THEN deve mostrar os primeiros 100 resultados
2. WHEN o usuário clica em "Carregar Mais" THEN deve adicionar os próximos 100 resultados à lista existente
3. WHEN não há mais resultados THEN o botão "Carregar Mais" deve ser desabilitado ou oculto
4. WHEN filtros são aplicados THEN a paginação deve ser reiniciada
5. WHEN resultados são carregados THEN deve manter o estado de seleção dos journals
6. WHEN há muitos resultados THEN deve mostrar indicador de progresso durante carregamento

### Requirement 3: Interface Redesenhada

**User Story:** Como um usuário, eu quero uma interface moderna e consistente seguindo padrões de design específicos, para que eu tenha uma experiência visual aprimorada e intuitiva.

#### Acceptance Criteria

1. WHEN a página é carregada THEN deve seguir o padrão visual fornecido na imagem de referência
2. WHEN componentes são renderizados THEN devem usar Tailwind CSS de forma consistente
3. WHEN a interface é exibida THEN deve manter responsividade em todos os dispositivos
4. WHEN elementos interativos são usados THEN devem ter feedback visual adequado
5. WHEN cores são aplicadas THEN devem seguir a paleta definida no design system

### Requirement 4: Filtros Rápidos Expandidos

**User Story:** Como um pesquisador, eu quero filtros rápidos mais específicos e intuitivos, para que eu possa encontrar journals que atendam critérios acadêmicos específicos rapidamente.

#### Acceptance Criteria

1. WHEN filtros rápidos são exibidos THEN deve incluir as seguintes opções:
   - Top Tier: A* + 4*
   - Alta Qualidade: A + 4
   - Alto Impacto JCR: >10
   - Qualis MB: ABS 2+, ABDC A/A*, SJR Q1
   - Qualis B: ABDC B, ABS 1, SJR Q2
   - SJR: Q1+Q2
   - Quartis SJR: Q1 e Q2
2. WHEN "Apenas Wiley" é selecionado THEN deve filtrar apenas journals da editora Wiley
3. WHEN filtros são aplicados THEN deve combinar critérios de múltiplas bases
4. WHEN filtros são limpos THEN deve restaurar visualização completa
5. WHEN filtros são ativados THEN deve atualizar contadores em tempo real

### Requirement 5: Carregamento Completo com Filtros

**User Story:** Como um usuário, eu quero que todos os dados sejam carregados inicialmente e os filtros sejam aplicados localmente, para que eu tenha resposta instantânea aos filtros sem necessidade de recarregamento.

#### Acceptance Criteria

1. WHEN a aplicação inicia THEN deve carregar todos os dados disponíveis
2. WHEN filtros são aplicados THEN deve processar dados localmente sem requisições adicionais
3. WHEN dados são filtrados THEN deve manter performance otimizada mesmo com grandes datasets
4. WHEN filtros são alterados THEN deve atualizar resultados instantaneamente
5. WHEN cache é usado THEN deve incluir todos os dados das novas bases

### Requirement 6: Filtros Dropdown Expandidos

**User Story:** Como um usuário avançado, eu quero opções de filtro mais granulares e combinações específicas, para que eu possa fazer buscas muito precisas.

#### Acceptance Criteria

1. WHEN filtros ABDC são exibidos THEN deve incluir: Todas, A*, A, A ou A*, B, C
2. WHEN filtros ABS são exibidos THEN deve incluir: Todas, 4*, 4, 3, 2, 2 ou mais, 1
3. WHEN filtros SJR são exibidos THEN deve incluir: Todas, Q1, Q2, Q3, Q4, Q1 ou Q2, Q1/Q2/Q3
4. WHEN "Apenas Wiley" é selecionado THEN deve funcionar como filtro independente
5. WHEN combinações são selecionadas THEN deve aplicar lógica OR dentro do mesmo filtro
6. WHEN múltiplos filtros são ativos THEN deve aplicar lógica AND entre diferentes tipos

### Requirement 7: Ações de Busca Expandidas

**User Story:** Como um pesquisador, eu quero múltiplas opções de busca externa para cada journal, para que eu possa acessar diferentes fontes de informação rapidamente.

#### Acceptance Criteria

1. WHEN ações são exibidas THEN deve incluir duas opções de busca (baseado na imagem):
   - Ícone de link externo (Google Scholar - existente)
   - Ícone de busca/lupa (busca adicional)
2. WHEN links são clicados THEN devem abrir em nova aba
3. WHEN buscas são realizadas THEN devem usar o nome exato do journal
4. WHEN URLs são geradas THEN devem incluir parâmetros de busca apropriados
5. WHEN ações são renderizadas THEN devem ter ícones distintos conforme padrão da imagem

### Requirement 8: Hero Section com Cards Estatísticos

**User Story:** Como um usuário, eu quero visualizar estatísticas resumidas em cards organizados, para que eu possa entender rapidamente a composição e status dos dados filtrados.

#### Acceptance Criteria

1. WHEN a hero section é exibida THEN deve mostrar 5 cards alinhados horizontalmente conforme imagem:
   - Total: 5170 (fundo cinza)
   - Filtrados: 3 (fundo laranja/amarelo)
   - ABS: 1822 (fundo verde)
   - SJR: 1716 (fundo laranja)
   - Wiley: 1279 (fundo roxo)
2. WHEN filtros são aplicados THEN card "Filtrados" deve atualizar em tempo real
3. WHEN dados são carregados THEN todos os contadores devem refletir valores reais
4. WHEN cards são exibidos THEN devem seguir o padrão de cores da imagem
5. WHEN valores mudam THEN deve haver transição visual suave

### Requirement 9: Padrão Visual e Cores

**User Story:** Como um usuário, eu quero uma interface que siga exatamente o padrão visual mostrado na imagem de referência, para que eu tenha uma experiência consistente e profissional.

#### Acceptance Criteria

1. WHEN a interface é carregada THEN deve usar fundo azul claro (#E8F4FD ou similar)
2. WHEN cards são exibidos THEN devem ter bordas arredondadas e sombras suaves
3. WHEN filtros rápidos são mostrados THEN devem ter ícones coloridos e texto descritivo
4. WHEN tabela é exibida THEN deve ter fundo branco com bordas sutis
5. WHEN classificações são mostradas THEN devem usar badges coloridos (A* verde, 3 amarelo, Q2 azul)
6. WHEN elementos interativos são usados THEN devem ter hover states apropriados

### Requirement 10: Rodapé Institucional

**User Story:** Como um visitante do sistema, eu quero ver informações completas sobre os responsáveis e instituições envolvidas, para que eu possa entender a credibilidade e origem acadêmica do projeto.

#### Acceptance Criteria

1. WHEN o rodapé é exibido THEN deve incluir as seguintes informações com links:
   - "Idealizado e Desenvolvido por Prof. Juliano Nunes Alves" (link: https://ufsmpublica.ufsm.br/docente/25667)
   - "Grupo de Pesquisas em Inteligência Artificial - IaProjetos" (link: https://www.iaprojetos.com.br/)
   - "Programa de Pós-Graduação em Gestão de Organizações Públicas (PPGOP)" (link: https://www.ufsm.br/cursos/pos-graduacao/santa-maria/ppgop)
   - "Departamento de Ciências Administrativas - DCA" (link: https://www.ufsm.br/unidades-universitarias/ccsh/departamentos/dcad)
   - "Universidade Federal de Santa Maria (UFSM)" (link: https://www.ufsm.br/)
2. WHEN contato é mostrado THEN deve exibir "Contato: juliano.alves@ufsm.br"
3. WHEN copyright é exibido THEN deve mostrar "© 2025 JournalScope V.3.0"
4. WHEN links são clicados THEN devem abrir em nova aba
5. WHEN rodapé é renderizado THEN deve ter design limpo e profissional

## Technical Considerations

### Data Integration Strategy
- Manter estrutura de dados existente expandindo com novos campos
- Implementar sistema de merge inteligente para journals duplicados
- Criar mapeamento de prioridades para resolução de conflitos
- Manter compatibilidade com sistema de cache atual

### Performance Requirements
- Carregamento inicial deve permanecer < 6 segundos
- Filtros devem responder em < 200ms
- Paginação deve carregar em < 1 segundo
- Cache deve suportar datasets expandidos

### Compatibility Requirements
- Manter compatibilidade com navegadores modernos
- Preservar funcionalidade PWA existente
- Manter responsividade em dispositivos móveis
- Preservar funcionalidades de exportação existentes

## Success Metrics

1. **Funcionalidade**: Todas as 4 novas bases integradas com sucesso
2. **Performance**: Tempo de resposta de filtros < 200ms
3. **Usabilidade**: Redução de 50% no tempo para encontrar journals específicos
4. **Dados**: Aumento de 40-60% no número total de journals únicos
5. **Adoção**: 90% dos usuários utilizando novos filtros rápidos

## Dependencies

1. Arquivos Excel das novas bases (JSR, JCR, CiteScore, Predatórios)
2. Definição clara dos critérios de merge de dados
3. Imagem de referência para padrões de design
4. Especificações detalhadas dos URLs de busca externa
5. Validação dos valores estatísticos esperados nos cards