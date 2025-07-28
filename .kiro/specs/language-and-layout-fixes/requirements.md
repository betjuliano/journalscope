# Requirements Document

## Introduction

Este documento define os requisitos para corrigir problemas críticos de internacionalização e layout no JournalScope. Os problemas identificados incluem: (1) inversão de idiomas onde a versão PT mostra conteúdo em inglês e vice-versa, e (2) problemas de layout onde a interface não está carregando com o padrão moderno de estilo esperado.

## Requirements

### Requirement 1

**User Story:** Como usuário da versão portuguesa, quero que a interface seja exibida em português quando seleciono PT, para que eu possa usar o sistema no meu idioma nativo.

#### Acceptance Criteria

1. WHEN o usuário acessa a versão PT THEN o sistema SHALL exibir todo o conteúdo da interface em português
2. WHEN o usuário clica no botão "EN" na versão PT THEN o sistema SHALL alternar para inglês
3. WHEN o usuário acessa a versão EN THEN o sistema SHALL exibir todo o conteúdo da interface em inglês  
4. WHEN o usuário clica no botão "PT" na versão EN THEN o sistema SHALL alternar para português
5. WHEN o idioma for alterado THEN o sistema SHALL persistir a preferência no localStorage

### Requirement 2

**User Story:** Como usuário do sistema, quero que a tabela de resultados exiba as colunas corretas baseadas no idioma selecionado, para que eu veja informações relevantes para minha região.

#### Acceptance Criteria

1. WHEN o idioma for português THEN o sistema SHALL exibir a coluna "Qualis" na tabela
2. WHEN o idioma for português THEN o sistema SHALL ocultar a coluna "SJR H-Index"
3. WHEN o idioma for inglês THEN o sistema SHALL ocultar a coluna "Qualis"
4. WHEN o idioma for inglês THEN o sistema SHALL exibir a coluna "SJR H-Index"
5. WHEN o idioma for alterado THEN o sistema SHALL atualizar as colunas da tabela imediatamente

### Requirement 3

**User Story:** Como usuário do sistema, quero que a interface carregue com o layout moderno e estilizado, para que eu tenha uma experiência visual consistente e profissional.

#### Acceptance Criteria

1. WHEN a aplicação for carregada THEN o sistema SHALL aplicar todos os estilos CSS corretamente
2. WHEN a aplicação for carregada THEN o sistema SHALL exibir o gradiente de fundo moderno
3. WHEN a aplicação for carregada THEN o sistema SHALL exibir cards com sombras e bordas arredondadas
4. WHEN a aplicação for carregada THEN o sistema SHALL aplicar a tipografia Inter corretamente
5. WHEN a aplicação for carregada THEN o sistema SHALL exibir botões com estilos modernos e transições

### Requirement 4

**User Story:** Como usuário do sistema, quero que os cabeçalhos da tabela sejam traduzidos corretamente, para que eu entenda claramente o que cada coluna representa.

#### Acceptance Criteria

1. WHEN o idioma for português THEN o sistema SHALL exibir "AÇÕES" como cabeçalho da coluna de ações
2. WHEN o idioma for inglês THEN o sistema SHALL exibir "Actions" como cabeçalho da coluna de ações
3. WHEN o idioma for português THEN o sistema SHALL exibir "SJR Quartil" e "JCR Quartil"
4. WHEN o idioma for inglês THEN o sistema SHALL exibir "SJR Quartile" e "JCR Quartile"
5. WHEN o idioma for alterado THEN o sistema SHALL atualizar todos os cabeçalhos imediatamente

### Requirement 5

**User Story:** Como desenvolvedor, quero que o sistema de debug e logging funcione corretamente, para que eu possa identificar e resolver problemas de idioma e layout rapidamente.

#### Acceptance Criteria

1. WHEN a aplicação for carregada THEN o sistema SHALL registrar o idioma atual no console (modo desenvolvimento)
2. WHEN o idioma for alterado THEN o sistema SHALL registrar a mudança no console (modo desenvolvimento)
3. WHEN houver erro de tradução THEN o sistema SHALL registrar o erro e usar fallback
4. WHEN houver erro de CSS THEN o sistema SHALL registrar o erro no console
5. WHEN a aplicação for carregada THEN o sistema SHALL validar se todas as traduções necessárias estão disponíveis