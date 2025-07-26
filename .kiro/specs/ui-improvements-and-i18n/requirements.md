# Requirements Document

## Introduction

Este documento define os requisitos para implementar melhorias na interface do usuário do JournalScope, incluindo otimizações na tabela de resultados, melhorias de performance e implementação de um sistema de internacionalização (i18n) com suporte ao inglês. As melhorias visam proporcionar uma experiência mais fluida e acessível para usuários brasileiros e internacionais.

## Requirements

### Requirement 1

**User Story:** Como usuário do sistema, quero que a tabela de journals expanda automaticamente para duas linhas quando necessário, para que eu possa visualizar nomes completos sem precisar clicar em botões.

#### Acceptance Criteria

1. WHEN um nome de journal exceder 40 caracteres THEN o sistema SHALL quebrar automaticamente o texto em duas linhas
2. WHEN a tabela for renderizada THEN o sistema SHALL remover todos os botões de expandir/recolher existentes
3. WHEN um journal tiver nome longo THEN o sistema SHALL exibir o nome completo em no máximo duas linhas com quebra automática
4. WHEN a quebra de linha ocorrer THEN o sistema SHALL manter a legibilidade e alinhamento da tabela

### Requirement 2

**User Story:** Como usuário do sistema, quero que a aplicação carregue mais rapidamente, para que eu possa acessar os dados sem demora.

#### Acceptance Criteria

1. WHEN a aplicação for iniciada THEN o sistema SHALL otimizar o carregamento inicial dos dados
2. WHEN os componentes forem renderizados THEN o sistema SHALL implementar lazy loading onde apropriado
3. WHEN dados forem processados THEN o sistema SHALL utilizar memoização para evitar recálculos desnecessários
4. WHEN a aplicação estiver em produção THEN o tempo de carregamento inicial SHALL ser reduzido em pelo menos 30%

### Requirement 3

**User Story:** Como usuário internacional, quero poder alternar o idioma da interface para inglês, para que eu possa usar o sistema em minha língua preferida.

#### Acceptance Criteria

1. WHEN a página for carregada THEN o sistema SHALL exibir um botão "EN" no canto superior direito do hero
2. WHEN o botão "EN" for clicado THEN o sistema SHALL traduzir todo o conteúdo da interface para inglês
3. WHEN o idioma for alterado THEN o sistema SHALL traduzir o hero, seções principais e rodapé
4. WHEN em modo inglês THEN o sistema SHALL manter a tabela de resultados inalterada exceto pelo termo "AÇÕES" que deve ser "Actions"
5. WHEN em modo inglês THEN o sistema SHALL ocultar a coluna "Qualis" e exibir a coluna "SJR H-Index" no lugar

### Requirement 4

**User Story:** Como usuário do sistema, quero que as alterações na tabela sejam mais intuitivas e informativas, para que eu possa entender melhor os dados apresentados.

#### Acceptance Criteria

1. WHEN a tabela estiver em português THEN o sistema SHALL exibir "AÇÕES" como cabeçalho da coluna de ações
2. WHEN a tabela estiver em inglês THEN o sistema SHALL exibir "Actions" como cabeçalho da coluna de ações
3. WHEN o idioma for português THEN o sistema SHALL exibir a coluna "Qualis" normalmente
4. WHEN o idioma for inglês THEN o sistema SHALL ocultar a coluna "Qualis" e mostrar "SJR H-Index" no lugar
5. WHEN a coluna SJR H-Index for exibida THEN o sistema SHALL mostrar os valores de H-Index do SJR quando disponíveis

### Requirement 5

**User Story:** Como usuário do sistema, quero que o estado do idioma seja persistido, para que eu não precise selecionar novamente a cada visita.

#### Acceptance Criteria

1. WHEN o usuário selecionar um idioma THEN o sistema SHALL salvar a preferência no localStorage
2. WHEN a página for recarregada THEN o sistema SHALL carregar o idioma previamente selecionado
3. WHEN não houver preferência salva THEN o sistema SHALL usar português como idioma padrão
4. WHEN o idioma for alterado THEN o sistema SHALL atualizar imediatamente toda a interface sem necessidade de reload