# Requirements Document

## Introduction

Este documento define os requisitos para atualizar a imagem Docker do JournalScope com os dados mais recentes dos journals. O arquivo `embeddedJournals.js` contém os dados corretos e atualizados com 8,222 journals, enquanto o arquivo JSON está desatualizado. O sistema precisa ser atualizado para refletir as melhorias nos dados, incluindo novos registros JCR e informações aprimoradas sobre journals predatórios.

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, eu quero atualizar a imagem Docker com os dados mais recentes, para que os usuários tenham acesso às informações mais atualizadas dos journals.

#### Acceptance Criteria

1. WHEN os dados são atualizados THEN a imagem Docker SHALL ser reconstruída com os novos dados
2. WHEN a imagem é construída THEN ela SHALL incluir os 8,222 journals atualizados
3. WHEN a aplicação é executada THEN ela SHALL carregar os dados atualizados automaticamente

### Requirement 2

**User Story:** Como usuário final, eu quero que a aplicação reflita os dados mais recentes dos journals, para que eu possa tomar decisões baseadas em informações atualizadas.

#### Acceptance Criteria

1. WHEN eu acesso a aplicação THEN ela SHALL mostrar o total de 8,222 journals
2. WHEN eu pesquiso por journals THEN os resultados SHALL incluir os novos dados JCR (2,482 journals)
3. WHEN eu visualizo journals predatórios THEN eles SHALL mostrar informações detalhadas da fonte

### Requirement 3

**User Story:** Como administrador do sistema, eu quero um processo automatizado para atualizar e deployar a imagem Docker, para que as atualizações sejam consistentes e confiáveis.

#### Acceptance Criteria

1. WHEN eu executo o processo de build THEN a imagem SHALL ser criada com uma nova tag baseada na data
2. WHEN a imagem é construída THEN ela SHALL ser otimizada para produção
3. WHEN o deploy é executado THEN a nova versão SHALL substituir a versão anterior sem downtime