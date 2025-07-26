# Design Document

## Overview

Este documento descreve o design técnico para implementar melhorias na interface do usuário do JournalScope, incluindo otimizações na tabela de resultados, melhorias de performance e um sistema de internacionalização (i18n) com suporte ao inglês. O design foca em manter a compatibilidade com a arquitetura existente enquanto introduz novas funcionalidades de forma eficiente.

## Architecture

### Current Architecture Analysis
- **Frontend**: React 18 com hooks customizados
- **Styling**: Tailwind CSS com CSS customizado
- **State Management**: React hooks (useState, useMemo, useCallback)
- **Data Processing**: Hooks customizados (useEmbeddedData, useJournalData)
- **Performance**: Memoização com React.memo e useMemo

### New Architecture Components
1. **I18n Context Provider**: Gerenciamento global do idioma
2. **Language Toggle Component**: Botão de alternância de idioma
3. **Enhanced Table Component**: Tabela otimizada com quebra automática
4. **Performance Optimizations**: Lazy loading e memoização aprimorada

## Components and Interfaces

### 1. I18n System

#### I18nContext
```javascript
interface I18nContextType {
  language: 'pt' | 'en';
  setLanguage: (lang: 'pt' | 'en') => void;
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
}
```

#### Translation Structure
```javascript
interface Translations {
  pt: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
    };
    table: {
      actions: string;
      columns: {
        journal: string;
        abdc: string;
        abs: string;
        sjrQuartile: string;
        jcrQuartile: string;
        qualis: string;
        sjrHIndex: string;
      };
    };
    footer: {
      developedBy: string;
      // ... outros campos
    };
  };
  en: {
    // Estrutura espelhada em inglês
  };
}
```

### 2. Enhanced Table Component

#### JournalTableCell Component
```javascript
interface JournalTableCellProps {
  journal: Journal;
  index: number;
  searchTerm: string;
  maxCharacters: number; // 40 caracteres
  autoExpand: boolean; // true para expansão automática
}
```

#### Table Configuration
```javascript
interface TableConfig {
  language: 'pt' | 'en';
  visibleColumns: string[];
  columnMappings: {
    pt: ColumnConfig[];
    en: ColumnConfig[];
  };
}
```

### 3. Language Toggle Component

#### LanguageToggle Component
```javascript
interface LanguageToggleProps {
  currentLanguage: 'pt' | 'en';
  onLanguageChange: (lang: 'pt' | 'en') => void;
  position: 'hero' | 'header';
}
```

## Data Models

### Translation Keys Structure
```javascript
const translationKeys = {
  // Hero Section
  'hero.title': 'JournalScope',
  'hero.subtitle': 'Sistema Integrado de Consulta de Journals Acadêmicos',
  'hero.description': 'Plataforma unificada para consulta...',
  
  // Table Headers
  'table.actions': 'AÇÕES',
  'table.journal': 'Journal',
  'table.abdc': 'ABDC',
  'table.abs': 'ABS',
  'table.sjrQuartile': 'SJR Quartile',
  'table.jcrQuartile': 'JCR Quartile',
  'table.qualis': 'Qualis',
  'table.sjrHIndex': 'SJR H-Index',
  
  // Stats
  'stats.totalJournals': 'Total Journals',
  'stats.withABDC': 'Com ABDC',
  'stats.withABS': 'Com ABS',
  
  // Footer
  'footer.developedBy': 'Desenvolvido por',
  'footer.contact': 'Contato',
};
```

### Column Configuration
```javascript
const columnConfigurations = {
  pt: {
    visible: ['journal', 'abdc', 'abs', 'sjrQuartile', 'jcrQuartile', 'qualis'],
    hidden: ['sjrHIndex']
  },
  en: {
    visible: ['journal', 'abdc', 'abs', 'sjrQuartile', 'jcrQuartile', 'sjrHIndex'],
    hidden: ['qualis']
  }
};
```

## Error Handling

### I18n Error Handling
1. **Missing Translation Keys**: Fallback para chave original ou texto padrão
2. **Language Loading Errors**: Fallback para português
3. **Storage Errors**: Graceful degradation sem persistência

### Table Rendering Error Handling
1. **Long Journal Names**: Quebra automática com CSS word-break
2. **Missing Data**: Exibição de placeholder "-"
3. **Rendering Errors**: Fallback components com indicadores visuais

## Testing Strategy

### Unit Tests
1. **I18n Context**: Teste de mudança de idioma e persistência
2. **Translation Function**: Teste de fallbacks e chaves inexistentes
3. **Table Cell Component**: Teste de quebra automática de texto
4. **Language Toggle**: Teste de interação e acessibilidade

### Integration Tests
1. **Full Language Switch**: Teste de mudança completa da interface
2. **Table Performance**: Teste com datasets grandes
3. **Persistence**: Teste de localStorage e recuperação

### Performance Tests
1. **Initial Load Time**: Medição de tempo de carregamento
2. **Language Switch Time**: Medição de tempo de troca de idioma
3. **Table Rendering**: Medição de performance com muitos dados

## Implementation Details

### 1. CSS Enhancements for Auto-Expanding Text

```css
.journal-cell-auto-expand {
  max-width: 300px;
  word-break: break-word;
  white-space: normal;
  line-height: 1.4;
  max-height: 2.8em; /* Aproximadamente 2 linhas */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.journal-cell-auto-expand.expanded {
  max-height: none;
  -webkit-line-clamp: none;
}
```

### 2. Performance Optimizations

#### Memoization Strategy
```javascript
// Memoizar traduções computadas
const memoizedTranslations = useMemo(() => {
  return computeTranslations(language, translationKeys);
}, [language]);

// Memoizar configuração de colunas
const memoizedColumnConfig = useMemo(() => {
  return getColumnConfiguration(language);
}, [language]);

// Memoizar dados processados da tabela
const memoizedTableData = useMemo(() => {
  return processTableData(data, language, searchTerm);
}, [data, language, searchTerm]);
```

#### Lazy Loading Implementation
```javascript
// Lazy loading de traduções
const loadTranslations = useCallback(async (lang) => {
  if (translationsCache[lang]) {
    return translationsCache[lang];
  }
  
  const translations = await import(`./translations/${lang}.js`);
  translationsCache[lang] = translations.default;
  return translations.default;
}, []);
```

### 3. Accessibility Considerations

#### ARIA Labels for Language Toggle
```javascript
<button
  aria-label={`Switch to ${targetLanguage === 'en' ? 'English' : 'Portuguese'}`}
  aria-pressed={currentLanguage === 'en'}
  role="switch"
>
  EN
</button>
```

#### Screen Reader Support for Table Changes
```javascript
<div 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {language === 'en' ? 
    'Table language changed to English. Qualis column hidden, SJR H-Index column visible.' :
    'Idioma da tabela alterado para português. Coluna Qualis visível, coluna SJR H-Index oculta.'
  }
</div>
```

### 4. Storage Strategy

#### LocalStorage Schema
```javascript
const storageSchema = {
  'journalscope_language': 'pt' | 'en',
  'journalscope_table_preferences': {
    language: 'pt' | 'en',
    lastChanged: timestamp,
    columnPreferences: object
  }
};
```

## Migration Strategy

### Phase 1: I18n Infrastructure
1. Criar contexto de internacionalização
2. Implementar sistema de traduções
3. Adicionar botão de alternância de idioma

### Phase 2: Table Enhancements
1. Remover botões de expandir/recolher existentes
2. Implementar quebra automática de texto
3. Configurar limite de 40 caracteres

### Phase 3: Column Management
1. Implementar lógica de exibição/ocultação de colunas
2. Configurar mapeamento Qualis ↔ SJR H-Index
3. Atualizar cabeçalhos de tabela

### Phase 4: Performance Optimizations
1. Implementar lazy loading
2. Otimizar memoização
3. Melhorar tempo de carregamento inicial

## Backward Compatibility

### Existing Functionality Preservation
- Todos os filtros existentes continuam funcionando
- Funcionalidade de exportação mantida
- Estrutura de dados inalterada
- APIs internas preservadas

### Graceful Degradation
- Sistema funciona sem JavaScript (conteúdo estático)
- Fallback para português se localStorage falhar
- Tabela funciona mesmo se i18n falhar
- Performance mantida em dispositivos antigos