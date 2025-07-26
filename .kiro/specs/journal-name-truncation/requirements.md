# Documento de Requisitos - Limitação de Caracteres no Campo Journal

## Introdução

Esta especificação define a implementação de uma funcionalidade para limitar a exibição do nome dos journals na tabela de resultados a 30 caracteres, com opção de expansão manual pelo usuário. O objetivo é melhorar a legibilidade da tabela, evitando sobreposição com outras colunas (especialmente ABDC), mantendo a possibilidade de visualizar o nome completo quando necessário.

## Requirements

### Requirement 1: Limitação Visual de Caracteres

**User Story:** Como um usuário visualizando a tabela de resultados, eu quero que os nomes dos journals sejam limitados a 30 caracteres na exibição inicial, para que a tabela mantenha um layout organizado e legível sem sobreposição de colunas.

#### Acceptance Criteria

1. WHEN a tabela de resultados é carregada THEN nomes de journals com mais de 30 caracteres devem ser truncados
2. WHEN um nome é truncado THEN deve exibir "..." (reticências) ao final para indicar truncamento
3. WHEN um nome tem 30 caracteres ou menos THEN deve ser exibido completamente sem alterações
4. WHEN a tabela é renderizada THEN deve manter alinhamento adequado com outras colunas
5. WHEN múltiplos journals são exibidos THEN todos devem seguir a mesma regra de truncamento

### Requirement 2: Funcionalidade de Expansão Manual

**User Story:** Como um usuário interessado no nome completo de um journal, eu quero poder clicar no nome truncado para expandir e ver o título completo, para que eu possa acessar a informação completa quando necessário.

#### Acceptance Criteria

1. WHEN um nome de journal está truncado THEN deve ser clicável
2. WHEN o usuário clica em um nome truncado THEN deve expandir para mostrar o nome completo
3. WHEN um nome está expandido THEN deve permitir clicar novamente para recolher
4. WHEN o nome está expandido THEN deve quebrar linha se necessário para não afetar outras colunas
5. WHEN o usuário interage com um journal THEN apenas aquele journal específico deve ser afetado

### Requirement 3: Indicadores Visuais de Interatividade

**User Story:** Como um usuário navegando pela tabela, eu quero indicadores visuais claros de que posso interagir com nomes truncados, para que eu entenda intuitivamente como acessar informações completas.

#### Acceptance Criteria

1. WHEN o cursor passa sobre um nome truncado THEN deve mostrar cursor pointer
2. WHEN o cursor está sobre um nome truncado THEN deve exibir sublinhado ou mudança de cor
3. WHEN um nome está truncado THEN deve mostrar tooltip com o nome completo
4. WHEN um nome não está truncado THEN não deve ter indicadores de interatividade
5. WHEN o estado muda (expandido/recolhido) THEN deve haver transição visual suave

### Requirement 4: Preservação da Funcionalidade Existente

**User Story:** Como um usuário do sistema, eu quero que todas as funcionalidades existentes da tabela continuem funcionando normalmente, para que a nova funcionalidade não interfira na experiência atual.

#### Acceptance Criteria

1. WHEN a funcionalidade é implementada THEN filtros devem continuar funcionando normalmente
2. WHEN journals são filtrados THEN estado de expansão deve ser resetado
3. WHEN dados são exportados THEN deve incluir nomes completos independente do estado visual
4. WHEN paginação é usada THEN estado de expansão deve ser mantido por página
5. WHEN busca é realizada THEN deve considerar nome completo, não apenas a parte visível

### Requirement 5: Responsividade e Performance

**User Story:** Como um usuário acessando o sistema em diferentes dispositivos, eu quero que a funcionalidade de truncamento funcione adequadamente em todas as telas, para que eu tenha uma experiência consistente.

#### Acceptance Criteria

1. WHEN acessado em dispositivos móveis THEN truncamento deve se adaptar ao espaço disponível
2. WHEN a tela é redimensionada THEN layout deve permanecer funcional
3. WHEN há muitos journals na tabela THEN performance não deve ser impactada
4. WHEN animações são aplicadas THEN devem ser suaves e não causar lag
5. WHEN múltiplos journals são expandidos THEN não deve afetar performance da página

## Considerações Técnicas

### Implementação CSS
- Utilizar `text-overflow: ellipsis` para truncamento visual
- Implementar classes CSS para estados expandido/recolhido
- Garantir que `max-width` seja respeitado para manter layout

### Gerenciamento de Estado
- Manter estado de expansão por journal individual
- Resetar estados quando filtros são aplicados
- Preservar estado durante paginação na mesma página

### Acessibilidade
- Garantir que funcionalidade seja acessível via teclado
- Implementar ARIA labels apropriados
- Manter contraste adequado para indicadores visuais

## Critérios de Sucesso

1. **Usabilidade**: 100% dos nomes longos truncados adequadamente
2. **Interatividade**: Expansão/recolhimento funcionando em todos os casos
3. **Performance**: Sem impacto perceptível na velocidade da tabela
4. **Compatibilidade**: Funcionamento em todos os navegadores suportados
5. **Responsividade**: Layout adequado em dispositivos móveis e desktop

## Dependências

1. Estrutura atual da tabela de resultados
2. Sistema de CSS/Tailwind existente
3. Componentes React da tabela atual
4. Funcionalidades de filtro e busca existentes