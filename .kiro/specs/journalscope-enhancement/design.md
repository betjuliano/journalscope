# Design Document - JournalScope Enhancement

## Overview

Este documento detalha a arquitetura e design das melhorias do JournalScope, incluindo integração de 4 novas bases de dados acadêmicas, redesign da interface seguindo padrões visuais específicos, sistema de paginação avançado e filtros expandidos. O design mantém a performance existente enquanto expande significativamente as funcionalidades.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JournalScope V3.0                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React 18 + Tailwind CSS)                        │
│  ├── Components (Redesigned)                               │
│  ├── Hooks (Enhanced)                                      │
│  ├── Utils (Extended)                                      │
│  └── Data Layer (Expanded)                                 │
├─────────────────────────────────────────────────────────────┤
│  Data Processing Layer                                      │
│  ├── Excel Processors (6 sources)                         │
│  ├── Data Merger & Conflict Resolution                     │
│  ├── Embedded Data Generator                               │
│  └── Cache Management                                      │
├─────────────────────────────────────────────────────────────┤
│  Data Sources (6 total)                                   │
│  ├── ABDC 2022 (existing)                                 │
│  ├── ABS 2024 (existing)                                  │
│  ├── Wiley (existing)                                     │
│  ├── SJR (new)                                            │
│  ├── JCR (new)                                            │
│  ├── CiteScore (new)                                      │
│  └── Predatory Journals (new)                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Integration Strategy

#### Unified Journal Schema
```javascript
{
  journal: string,           // Nome do journal (chave primária)
  
  // Existing fields
  abdc: string,             // A*, A, B, C
  abs: string,              // 4*, 4, 3, 2, 1
  wileySubject: string,     // Área temática
  wileyAPC: string,         // Custo APC USD
  
  // New fields
  sjr: {
    quartile: string,       // Q1, Q2, Q3, Q4
    score: number,          // SJR Score
    hIndex: number,         // H-Index
    year: number            // Ano da classificação
  },
  jcr: {
    impactFactor: number,   // Fator de impacto
    quartile: string,       // Q1, Q2, Q3, Q4
    category: string,       // Categoria JCR
    year: number            // Ano da classificação
  },
  citeScore: {
    score: number,          // CiteScore value
    percentile: number,     // Percentil
    year: number            // Ano da classificação
  },
  predatory: {
    status: boolean,        // true se predatório
    source: string,         // Fonte da classificação
    lastUpdated: string     // Data da última atualização
  },
  
  // Metadata
  sources: string[],        // Lista de fontes que contêm este journal
  lastUpdated: string,      // Última atualização
  conflicts: object         // Registro de conflitos resolvidos
}
```

#### Data Merge Priority System
1. **ABDC** (highest priority) - Mais rigoroso
2. **ABS** - Bem estabelecido
3. **SJR** - Ampla cobertura
4. **JCR** - Tradicional
5. **CiteScore** - Mais recente
6. **Predatory** - Informação crítica mas específica

## Components and Interfaces

### Enhanced Hook Architecture

#### useEnhancedJournalData Hook
```javascript
const useEnhancedJournalData = () => {
  // State management for all 7 data sources
  // Advanced filtering logic
  // Pagination management
  // Real-time statistics calculation
  
  return {
    // Data
    journalsData: Journal[],
    filteredData: Journal[],
    paginatedData: Journal[],
    
    // Pagination
    currentPage: number,
    hasMoreResults: boolean,
    loadMoreResults: () => void,
    
    // Enhanced filters
    filters: {
      search: string,
      abdc: string[],
      abs: string[],
      sjr: string[],
      wiley: boolean,
      predatory: 'exclude' | 'include' | 'only'
    },
    
    // Quick filters
    applyQuickFilter: (preset: string) => void,
    
    // Statistics
    stats: {
      total: number,
      filtered: number,
      bySource: {
        abdc: number,
        abs: number,
        sjr: number,
        jcr: number,
        citeScore: number,
        wiley: number,
        predatory: number
      }
    }
  }
}
```

### Component Redesign

#### 1. Hero Section Component
```jsx
const HeroSection = ({ stats }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-100 py-8">
    <div className="container mx-auto px-4">
      {/* Logo and Title */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Journal Scope</h1>
        </div>
        <p className="text-gray-600 mb-2">Sistema de Consulta de Journals Acadêmicos</p>
        <p className="text-sm text-gray-500">Mostrando 3 de 5170 journals</p>
      </div>
      
      {/* Statistics Cards - 5 cards total */}
      <div className="flex justify-center gap-4 mb-8">
        <StatCard label="Total" value={stats.total} color="gray" />
        <StatCard label="Filtrados" value={stats.filtered} color="orange" />
        <StatCard label="ABS" value={stats.abs} color="green" />
        <StatCard label="SJR" value={stats.sjr} color="orange" />
        <StatCard label="Wiley" value={stats.wiley} color="purple" />
      </div>
    </div>
  </div>
)
```

#### 2. Enhanced Filters Component
```jsx
const EnhancedFilters = ({ filters, onFilterChange }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
    {/* Quick Filters */}
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros Rápidos</h3>
      <div className="flex flex-wrap gap-2">
        <QuickFilterButton 
          icon="👑" 
          label="Top Tier" 
          description="A* + 4*"
          onClick={() => onFilterChange('quick', 'top-tier')}
        />
        <QuickFilterButton 
          icon="⭐" 
          label="Alta Qualidade" 
          description="A + 4"
          onClick={() => onFilterChange('quick', 'high-quality')}
        />
        {/* More quick filters... */}
      </div>
    </div>
    
    {/* Search and Dropdowns */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <SearchInput />
      <ClassificationSelect type="abdc" />
      <ClassificationSelect type="abs" />
      <ClassificationSelect type="sjr" />
    </div>
    
    {/* Active Filters Display */}
    <ActiveFilters filters={filters} onRemove={onFilterChange} />
  </div>
)
```

#### 3. Enhanced Results Table
```jsx
const EnhancedResultsTable = ({ 
  data, 
  hasMore, 
  onLoadMore, 
  loading 
}) => (
  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
    <div className="px-6 py-4 border-b bg-gray-50">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Resultados ({data.length} journals)
        </h2>
        <div className="flex gap-2">
          <ExportButton type="csv" />
          <ExportButton type="excel" />
        </div>
      </div>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">Journal</th>
            <th className="px-6 py-3 text-left">ABDC</th>
            <th className="px-6 py-3 text-left">ABS</th>
            <th className="px-6 py-3 text-left">SJR Score</th>
            <th className="px-6 py-3 text-left">SJR Quartile</th>
            <th className="px-6 py-3 text-left">H Index</th>
            <th className="px-6 py-3 text-left">Citable Docs</th>
            <th className="px-6 py-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((journal, index) => (
            <JournalRow key={index} journal={journal} />
          ))}
        </tbody>
      </table>
    </div>
    
    {hasMore && (
      <div className="px-6 py-4 border-t bg-gray-50 text-center">
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Carregar Mais'}
        </button>
      </div>
    )}
  </div>
)
```

#### 4. Enhanced Footer Component
```jsx
const InstitutionalFooter = () => (
  <footer className="bg-white border-t border-gray-200 py-8 mt-12">
    <div className="container mx-auto px-4">
      <div className="text-center space-y-2 text-sm text-gray-600">
        <p>
          <strong>Idealizado e Desenvolvido por</strong>{' '}
          <a 
            href="https://ufsmpublica.ufsm.br/docente/25667"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Prof. Juliano Nunes Alves
          </a>
        </p>
        
        <p>
          <a 
            href="https://www.iaprojetos.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Grupo de Pesquisas em Inteligência Artificial - IaProjetos
          </a>
        </p>
        
        {/* More institutional links... */}
        
        <div className="pt-4 border-t border-gray-200 mt-4">
          <p>Contato: juliano.alves@ufsm.br</p>
          <p>© 2025 JournalScope V.3.0</p>
        </div>
      </div>
    </div>
  </footer>
)
```

## Data Models

### Enhanced Journal Interface
```typescript
interface Journal {
  // Core identification
  journal: string;
  
  // Existing classifications
  abdc?: 'A*' | 'A' | 'B' | 'C';
  abs?: '4*' | '4' | '3' | '2' | '1';
  wileySubject?: string;
  wileyAPC?: string;
  
  // New classifications
  sjr?: {
    quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    score: number;
    hIndex: number;
    citableDocs: number;
    year: number;
  };
  
  jcr?: {
    impactFactor: number;
    quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    category: string;
    citations: number;
    year: number;
  };
  
  citeScore?: {
    score: number;
    percentile: number;
    citations: number;
    year: number;
  };
  
  predatory?: {
    isPredatory: boolean;
    source: string;
    reason?: string;
    lastChecked: string;
  };
  
  // Metadata
  sources: DataSource[];
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
}

type DataSource = 'ABDC' | 'ABS' | 'Wiley' | 'SJR' | 'JCR' | 'CiteScore' | 'Predatory';
```

### Filter State Interface
```typescript
interface FilterState {
  search: string;
  
  // Classification filters
  abdc: ('A*' | 'A' | 'B' | 'C')[];
  abs: ('4*' | '4' | '3' | '2' | '1')[];
  sjr: ('Q1' | 'Q2' | 'Q3' | 'Q4')[];
  
  // Special filters
  wileyOnly: boolean;
  predatoryFilter: 'exclude' | 'include' | 'only';
  
  // Quick filters
  activeQuickFilter?: string;
  
  // Advanced filters
  jcrImpactMin?: number;
  citeScoreMin?: number;
  hIndexMin?: number;
}
```

## Error Handling

### Data Processing Errors
```javascript
class DataProcessingError extends Error {
  constructor(source, message, details) {
    super(`${source}: ${message}`);
    this.source = source;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Error handling strategy
const processDataWithErrorHandling = async (sources) => {
  const results = {};
  const errors = [];
  
  for (const [name, processor] of sources) {
    try {
      results[name] = await processor();
    } catch (error) {
      errors.push(new DataProcessingError(name, error.message, error));
      // Continue with other sources
      results[name] = {};
    }
  }
  
  return { results, errors };
};
```

### UI Error Boundaries
```jsx
class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={() => window.location.reload()}
          supportEmail="juliano.alves@ufsm.br"
        />
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Strategy

### Unit Testing
- **Data processors**: Test each Excel processor independently
- **Filter logic**: Test all filter combinations
- **Merge logic**: Test conflict resolution
- **Pagination**: Test edge cases

### Integration Testing
- **End-to-end data flow**: From Excel to UI
- **Filter interactions**: Complex filter combinations
- **Performance**: Large dataset handling

### Visual Testing
- **Component rendering**: Match design specifications
- **Responsive behavior**: All screen sizes
- **Color accuracy**: Match provided design

## Performance Optimizations

### Data Loading Strategy
```javascript
// Lazy loading for large datasets
const useLazyDataLoading = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  
  const loadMore = useCallback(async () => {
    setLoading(true);
    const newData = await loadDataPage(page, 100);
    setData(prev => [...prev, ...newData]);
    setPage(prev => prev + 1);
    setLoading(false);
  }, [page]);
  
  return { data, loading, loadMore, hasMore: data.length < totalCount };
};
```

### Filtering Optimization
```javascript
// Memoized filtering for performance
const useOptimizedFiltering = (data, filters) => {
  return useMemo(() => {
    if (!data.length) return [];
    
    // Pre-compile filter functions
    const filterFunctions = compileFilters(filters);
    
    // Use Web Workers for large datasets
    if (data.length > 10000) {
      return filterWithWebWorker(data, filterFunctions);
    }
    
    return data.filter(journal => 
      filterFunctions.every(fn => fn(journal))
    );
  }, [data, filters]);
};
```

## Security Considerations

### Data Validation
- Validate all Excel inputs before processing
- Sanitize journal names and descriptions
- Validate URLs before creating external links

### XSS Prevention
- Escape all user inputs in search
- Sanitize journal names in table display
- Validate filter parameters

## Deployment Strategy

### Build Process Enhancement
```javascript
// Enhanced build script
const buildProcess = {
  1: 'Generate embedded data from all 7 sources',
  2: 'Validate data integrity and completeness',
  3: 'Optimize bundle size with new dependencies',
  4: 'Generate source maps for debugging',
  5: 'Run comprehensive test suite',
  6: 'Deploy to staging for validation',
  7: 'Deploy to production with rollback plan'
};
```

### Monitoring and Analytics
- Track filter usage patterns
- Monitor performance metrics
- Log data processing errors
- Track user engagement with new features

This design provides a comprehensive foundation for implementing all the requested enhancements while maintaining the existing system's strengths and performance characteristics.