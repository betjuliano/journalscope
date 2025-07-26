import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Search, ChevronUp, ChevronDown, Download, ExternalLink, Settings, Eye, EyeOff } from 'lucide-react';
import { 
  truncateJournalName, 
  needsTruncation, 
  validateJournalData, 
  getSafeJournalNameForRendering,
  createJournalCellFallback,
  sanitizeJournalName
} from '../../utils';
import { useI18n } from '../contexts/I18nContext';

// Memoized constants to avoid recreation
const PERFORMANCE_THRESHOLDS = {
  FILTER_TIME_WARNING: 10,
  STATS_TIME_WARNING: 5,
  RENDER_TIME_WARNING: 20
};

const ResultsTable = ({
  data = [],
  onExportCSV,
  onExportExcel,
  searchTerm = '',
  maxDisplayed = 100,
  // Additional props for filter tracking
  filterABDC = '',
  filterABS = '',
  filterWiley = false,
  filterSJR = ''
}) => {
  // I18n context for dynamic column management
  const { t, language } = useI18n();
  const [sortField, setSortField] = useState('journal');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedJournals, setSelectedJournals] = useState(new Set());
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  
  // Remove expansion state management as we're implementing auto-expanding

  // Dynamic column configuration based on language
  const getColumnConfiguration = useMemo(() => {
    const baseColumns = {
      journal: { label: t('table.columns.journal'), field: 'journal', sortable: true },
      abdc: { label: t('table.columns.abdc'), field: 'abdc', sortable: true },
      abs: { label: t('table.columns.abs'), field: 'abs', sortable: true },
      sjrQuartile: { label: t('table.columns.sjrQuartile'), field: 'sjr.quartile', sortable: true },
      jcrQuartile: { label: t('table.columns.jcrQuartile'), field: 'jcr.quartile', sortable: true }
    };

    // Language-specific columns
    if (language === 'en') {
      // English: Hide Qualis, show SJR H-Index
      return {
        ...baseColumns,
        sjrHIndex: { label: t('table.columns.sjrHIndex'), field: 'sjr.hIndex', sortable: true }
      };
    } else {
      // Portuguese: Show Qualis, hide SJR H-Index
      return {
        ...baseColumns,
        qualis: { label: t('table.columns.qualis'), field: 'qualis', sortable: true }
      };
    }
  }, [language, t]);

  // Mandatory columns for desktop and mobile
  const MANDATORY_COLUMNS = getColumnConfiguration;
  const MOBILE_MANDATORY_COLUMNS = getColumnConfiguration;

  // Optional columns with translations
  const OPTIONAL_COLUMNS = useMemo(() => ({
    predatory: { label: language === 'en' ? 'Predatory' : 'Predatório', field: 'predatory.isPredatory', sortable: true },
    sjrScore: { label: 'SJR Score', field: 'sjr.score', sortable: true },
    // Note: sjrHIndex is now handled in mandatory columns for English
    sjrCitableDocs: { label: 'SJR Citable Docs', field: 'sjr.citableDocs', sortable: true },
    jcrImpactFactor: { label: 'JCR Impact Factor', field: 'jcr.impactFactor', sortable: true },
    jcrCategory: { label: 'JCR Category', field: 'jcr.category', sortable: true },
    jcrCitations: { label: 'JCR Citations', field: 'jcr.citations', sortable: true },
    citeScoreScore: { label: 'CiteScore Score', field: 'citeScore.score', sortable: true },
    citeScoreSnip: { label: 'CiteScore SNIP', field: 'citeScore.snip', sortable: true },
    issn: { label: 'ISSN', field: 'jcr.issn', sortable: false },
    wileySubject: { label: language === 'en' ? 'Wiley Subject' : 'Área Wiley', field: 'wileySubject', sortable: true }
  }), [language]);

  // Estado das colunas opcionais (carregado do localStorage)
  const [optionalColumns, setOptionalColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('journalTable_optionalColumns');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Salvar preferências no localStorage
  useEffect(() => {
    localStorage.setItem('journalTable_optionalColumns', JSON.stringify(optionalColumns));
  }, [optionalColumns]);

  // Auto-expanding doesn't need reset logic

  // Resetar expansões durante mudança de página
  // Comentado para preservar estado durante paginação na mesma página
  // useEffect(() => {
  //   setExpandedJournals(new Set());
  // }, [currentPage]);

  // Função para calcular Qualis
  const calculateQualis = (journal) => {
    const abdc = journal.abdc;
    const abs = journal.abs;
    const jcrQuartile = journal.jcr?.quartile;
    const sjrQuartile = journal.sjr?.quartile;

    // MB: ABDC = A/A* OU ABS ≥ 2 OU JCR = Q1 OU SJR = Q1
    if (
      abdc === 'A' || abdc === 'A*' ||
      (abs && (abs === '2' || abs === '3' || abs === '4' || abs === '4*')) ||
      jcrQuartile === 'Q1' ||
      sjrQuartile === 'Q1'
    ) {
      return 'MB';
    }

    // B: ABDC = B OU ABS = 1 OU JCR = Q2 OU SJR = Q2
    if (
      abdc === 'B' ||
      abs === '1' ||
      jcrQuartile === 'Q2' ||
      sjrQuartile === 'Q2'
    ) {
      return 'B';
    }

    // R: ABDC = C OU JCR = Q3 OU SJR = Q3
    if (
      abdc === 'C' ||
      jcrQuartile === 'Q3' ||
      sjrQuartile === 'Q3'
    ) {
      return 'R';
    }

    // F: JCR = Q4 OU SJR = Q4
    if (jcrQuartile === 'Q4' || sjrQuartile === 'Q4') {
      return 'F';
    }

    return '-';
  };

  // Memoized Qualis calculation function
  const calculateQualisMemoized = useCallback((journal) => {
    const abdc = journal.abdc;
    const abs = journal.abs;
    const jcrQuartile = journal.jcr?.quartile;
    const sjrQuartile = journal.sjr?.quartile;

    // MB: ABDC = A/A* OU ABS ≥ 2 OU JCR = Q1 OU SJR = Q1
    if (
      abdc === 'A' || abdc === 'A*' ||
      (abs && (abs === '2' || abs === '3' || abs === '4' || abs === '4*')) ||
      jcrQuartile === 'Q1' ||
      sjrQuartile === 'Q1'
    ) {
      return 'MB';
    }

    // B: ABDC = B OU ABS = 1 OU JCR = Q2 OU SJR = Q2
    if (
      abdc === 'B' ||
      abs === '1' ||
      jcrQuartile === 'Q2' ||
      sjrQuartile === 'Q2'
    ) {
      return 'B';
    }

    // R: ABDC = C OU JCR = Q3 OU SJR = Q3
    if (
      abdc === 'C' ||
      jcrQuartile === 'Q3' ||
      sjrQuartile === 'Q3'
    ) {
      return 'R';
    }

    // F: JCR = Q4 OU SJR = Q4
    if (jcrQuartile === 'Q4' || sjrQuartile === 'Q4') {
      return 'F';
    }

    return '-';
  }, []);

  // Processar dados com Qualis - optimized with performance monitoring
  const processedData = useMemo(() => {
    const startTime = performance.now();
    
    const processed = data.map(journal => ({
      ...journal,
      qualis: calculateQualisMemoized(journal)
    }));

    const processingTime = performance.now() - startTime;
    if (import.meta.env.DEV && processingTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
      console.log(`⚠️ Data processing took ${processingTime.toFixed(2)}ms for ${data.length} journals`);
    }

    return processed;
  }, [data, calculateQualisMemoized]);

  // Função para obter valor aninhado
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Memoized sort orders to avoid recreation
  const sortOrders = useMemo(() => ({
    abdc: { 'A*': 4, 'A': 3, 'B': 2, 'C': 1 },
    abs: { '4*': 5, '4': 4, '3': 3, '2': 2, '1': 1 },
    qualis: { 'MB': 4, 'B': 3, 'R': 2, 'F': 1 }
  }), []);

  // Optimized sorting function
  const sortedData = useMemo(() => {
    if (!processedData.length) return [];

    const startTime = performance.now();

    const sorted = [...processedData].sort((a, b) => {
      let aValue = getNestedValue(a, sortField) || '';
      let bValue = getNestedValue(b, sortField) || '';

      // Ordenação especial para classificações
      if (sortField === 'abdc') {
        aValue = sortOrders.abdc[aValue] || 0;
        bValue = sortOrders.abdc[bValue] || 0;
      } else if (sortField === 'abs') {
        aValue = sortOrders.abs[aValue] || 0;
        bValue = sortOrders.abs[bValue] || 0;
      } else if (sortField === 'qualis') {
        aValue = sortOrders.qualis[aValue] || 0;
        bValue = sortOrders.qualis[bValue] || 0;
      } else if (sortField === 'wileyAPC' || sortField === 'citeScore.score' || sortField === 'sjr.hIndex' || sortField === 'jcr.impactFactor') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortField === 'predatory.isPredatory') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }

      const result = sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0)
        : (aValue < bValue ? 1 : aValue > bValue ? -1 : 0);

      return result;
    });

    const sortTime = performance.now() - startTime;
    if (import.meta.env.DEV && sortTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
      console.log(`⚠️ Sorting took ${sortTime.toFixed(2)}ms for ${processedData.length} journals`);
    }

    return sorted;
  }, [processedData, sortField, sortDirection, sortOrders]);

  // Colunas visíveis baseadas no contexto (mobile/desktop) e idioma
  const visibleColumns = useMemo(() => {
    const mandatoryColumns = isMobile ? MOBILE_MANDATORY_COLUMNS : MANDATORY_COLUMNS;
    
    // Filter optional columns to exclude sjrHIndex if it's already in mandatory (for English)
    const filteredOptionalColumns = Object.keys(OPTIONAL_COLUMNS)
      .filter(key => {
        // Skip sjrHIndex in optional if it's already in mandatory columns (English mode)
        if (key === 'sjrHIndex' && language === 'en') {
          return false;
        }
        return optionalColumns[key];
      })
      .reduce((acc, key) => ({ ...acc, [key]: OPTIONAL_COLUMNS[key] }), {});

    return { ...mandatoryColumns, ...filteredOptionalColumns };
  }, [isMobile, optionalColumns, MANDATORY_COLUMNS, MOBILE_MANDATORY_COLUMNS, OPTIONAL_COLUMNS, language]);

  // Função para alternar coluna opcional com useCallback para performance
  const toggleOptionalColumn = useCallback((columnKey) => {
    setOptionalColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  }, []);



  // Componente memoizado para célula de journal com auto-expansão
  const JournalCell = memo(({ 
    journal, 
    index, 
    searchTerm
  }) => {
    // Validar dados do journal antes do processamento
    const validationResult = useMemo(() => {
      return validateJournalData(journal);
    }, [journal]);

    // Memoizar cálculos de display para auto-expansão
    const displayData = useMemo(() => {
      try {
        // Usar função segura para obter nome do journal
        const journalName = getSafeJournalNameForRendering(journal);
        const needsAutoExpand = journalName.length > 40; // 40 characters as per requirements
        
        return {
          journalName,
          needsAutoExpand,
          isValid: true
        };
      } catch (error) {
        console.error(`[ResultsTable] Erro ao processar dados de display para journal ${index}:`, error);
        
        // Fallback para dados de display
        const safeName = getSafeJournalNameForRendering(journal, 'Erro no nome');
        return {
          journalName: safeName,
          needsAutoExpand: false,
          isValid: false,
          error: error.message
        };
      }
    }, [journal, index]);

    // Memoizar texto destacado para evitar re-processamento
    const highlightedText = useMemo(() => {
      return highlightSearchTerm(displayData.journalName, searchTerm);
    }, [displayData.journalName, searchTerm]);

    // Se houve erro no processamento, usar fallback
    if (!displayData.isValid) {
      return (
        <div className="journal-cell-container">
          <div className="journal-cell-fallback" data-testid={`journal-cell-fallback-${index}`}>
            <span className="text-gray-900">{displayData.journalName}</span>
            <span 
              className="text-xs text-red-500 ml-2" 
              title={`Modo de fallback ativo: ${displayData.error || 'Erro desconhecido'}`}
            >
              ⚠
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="journal-cell-container">
        <div 
          className={`journal-cell-auto-expand ${displayData.needsAutoExpand ? 'two-line' : 'single-line'}`}
          title={displayData.journalName}
          role="gridcell"
          aria-label={`Journal: ${displayData.journalName}`}
        >
          <span>
            {highlightedText}
          </span>
        </div>
      </div>
    );
  });

  // Função para renderizar conteúdo da célula com tratamento de erros
  const renderCellContent = (journal, columnKey, column, searchTerm, index) => {
    try {
      const value = getNestedValue(journal, column.field);

      switch (columnKey) {
        case 'journal':
          // Usar o componente memoizado JournalCell com auto-expansão
          try {
            return (
              <JournalCell
                journal={journal}
                index={index}
                searchTerm={searchTerm}
              />
            );
          } catch (error) {
            console.error(`[ResultsTable] Erro ao renderizar JournalCell para índice ${index}:`, error);
            
            // Fallback para renderização de journal
            const safeName = getSafeJournalNameForRendering(journal);
            return (
              <div className="journal-cell-fallback" data-testid={`journal-cell-fallback-${index}`}>
                <span className="text-gray-900">{safeName}</span>
                <span 
                  className="text-xs text-red-500 ml-2" 
                  title={`Erro na renderização: ${error.message}`}
                >
                  ⚠
                </span>
              </div>
            );
          }

      case 'abdc':
        return <ClassificationBadge type="abdc" value={value} />;

      case 'abs':
        return <ClassificationBadge type="abs" value={value} />;

      case 'sjrQuartile':
      case 'jcrQuartile':
        return value ? (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'Q1' ? 'bg-green-100 text-green-800' :
              value === 'Q2' ? 'bg-blue-100 text-blue-800' :
                value === 'Q3' ? 'bg-yellow-100 text-yellow-800' :
                  value === 'Q4' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
            }`}>
            {value}
          </span>
        ) : <span className="text-gray-400">-</span>;

      case 'qualis':
        return value && value !== '-' ? (
          <span className={`px-2 py-1 text-xs font-bold rounded-full ${value === 'MB' ? 'bg-purple-100 text-purple-800' :
              value === 'B' ? 'bg-blue-100 text-blue-800' :
                value === 'R' ? 'bg-yellow-100 text-yellow-800' :
                  value === 'F' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
            }`}>
            {value}
          </span>
        ) : <span className="text-gray-400">-</span>;

      case 'predatory':
        return value !== null && value !== undefined ? (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {value ? 'Sim' : 'Não'}
          </span>
        ) : <span className="text-gray-400">-</span>;

      case 'wileyAPC':
        return value ? (
          <span className="font-medium text-green-600">
            ${value}
          </span>
        ) : <span className="text-gray-400">-</span>;

      case 'sjrScore':
      case 'sjrHIndex':
      case 'sjrCitableDocs':
      case 'jcrImpactFactor':
      case 'jcrCitations':
      case 'citeScoreScore':
      case 'citeScoreSnip':
        return value ? (
          <span className="text-gray-900 font-medium">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        ) : <span className="text-gray-400">-</span>;

      case 'jcrCategory':
      case 'wileySubject':
        return (
          <div className="max-w-xs truncate text-gray-600" title={value}>
            {value || '-'}
          </div>
        );

      case 'issn':
        return (
          <span className="text-gray-600 font-mono text-xs">
            {value || '-'}
          </span>
        );

      default:
        return (
          <span className="text-gray-600">
            {value || '-'}
          </span>
        );
    }
  } catch (error) {
    console.error(`[ResultsTable] Erro ao renderizar célula para coluna ${columnKey}, índice ${index}:`, error);
    
    // Fallback genérico para qualquer erro de renderização
    return (
      <div className="cell-error-fallback" data-testid={`cell-error-fallback-${columnKey}-${index}`}>
        <span className="text-gray-500">Erro</span>
        <span 
          className="text-xs text-red-500 ml-1" 
          title={`Erro na renderização da coluna ${columnKey}: ${error.message}`}
        >
          ⚠
        </span>
      </div>
    );
  }
};

  // Função para destacar termo de busca
  const highlightSearchTerm = (text, term) => {
    if (!term || !text) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : part
    );
  };

  // Função para ordenar coluna com useCallback para performance
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Função para selecionar/deselecionar journal com useCallback para performance
  const toggleJournalSelection = useCallback((index) => {
    setSelectedJournals(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      return newSelected;
    });
  }, []);

  // Dados a serem exibidos com paginação (memoizado para performance)
  const displayedData = useMemo(() => {
    const totalItems = currentPage * itemsPerPage;
    return sortedData.slice(0, Math.min(totalItems, sortedData.length));
  }, [sortedData, currentPage, itemsPerPage]);

  // Verificar se há mais dados (memoizado para performance)
  const hasMoreData = useMemo(() => {
    return sortedData.length > currentPage * itemsPerPage;
  }, [sortedData.length, currentPage, itemsPerPage]);

  // Função para selecionar/deselecionar todos com useCallback para performance
  const toggleSelectAll = useCallback(() => {
    setSelectedJournals(prev => {
      if (prev.size === displayedData.length) {
        return new Set();
      } else {
        return new Set(displayedData.map((_, index) => index));
      }
    });
  }, [displayedData]);



  // Função para exportar selecionados com useCallback para performance
  const exportSelected = useCallback((format) => {
    const selectedData = displayedData.filter((_, index) =>
      selectedJournals.has(index)
    );

    if (selectedData.length === 0) {
      alert('Selecione pelo menos um journal para exportar');
      return;
    }

    if (format === 'csv' && onExportCSV) {
      onExportCSV(selectedData);
    } else if (format === 'excel' && onExportExcel) {
      onExportExcel(selectedData);
    }
  }, [displayedData, selectedJournals, onExportCSV, onExportExcel]);

  // Componente de cabeçalho ordenável memoizado para performance
  const SortableHeader = memo(({ field, children, className = '' }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(field)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort(field);
        }
      }}
      role="columnheader"
      scope="col"
      tabIndex={0}
      aria-sort={
        sortField === field 
          ? (sortDirection === 'asc' ? 'ascending' : 'descending')
          : 'none'
      }
      aria-label={`${children}. ${
        sortField === field 
          ? `${t('table.sorting.currentlySorted')} ${sortDirection === 'asc' ? t('table.sorting.ascending') : t('table.sorting.descending')}. ${t('table.sorting.clickToReverse')}`
          : t('table.sorting.clickToSort')
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ?
            <ChevronUp className="h-3 w-3" aria-hidden="true" /> :
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
        )}
        <span className="sr-only">
          {sortField === field 
            ? `${t('table.sorting.sorted')} ${sortDirection === 'asc' ? t('table.sorting.ascending') : t('table.sorting.descending')}`
            : t('table.sorting.notSorted')
          }
        </span>
      </div>
    </th>
  ));

  // Componente de badge de classificação memoizado para performance
  const ClassificationBadge = memo(({ type, value }) => {
    if (!value) return null;

    // Memoizar cálculo da classe CSS
    const className = useMemo(() => {
      if (type === 'abdc') {
        return `classification-badge abdc-${value.toLowerCase().replace('*', '-star')}`;
      } else if (type === 'abs') {
        return `classification-badge abs-${value.replace('*', '-star')}`;
      }
      return 'classification-badge';
    }, [type, value]);

    return (
      <span className={className}>
        {value}
      </span>
    );
  });

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-12 text-center text-gray-500">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum journal encontrado
          </h3>
          <p className="text-gray-500">
            {language === 'en' ? 'Try adjusting the filters or search term' : `Tente ajustar os filtros ou ${t('search.term')} de busca`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header da tabela */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Resultados ({data.length} journals)
          </h2>

          {selectedJournals.size > 0 && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {selectedJournals.size} selecionados
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {/* Botão de configuração de colunas */}
          <div className="relative">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="btn btn-outline text-sm"
              title={t('table.columnSettings.configure')}
            >
              <Settings className="h-4 w-4" />
              {t('table.columnSettings.title')}
            </button>

            {/* Dropdown de configuração de colunas */}
            {showColumnSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    {t('table.columnSettings.optionalColumns')}
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(OPTIONAL_COLUMNS).map(([key, column]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={optionalColumns[key] || false}
                          onChange={() => toggleOptionalColumn(key)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{column.label}</span>
                        {optionalColumns[key] && (
                          <Eye className="h-3 w-3 text-green-500" />
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setShowColumnSettings(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {t('table.columnSettings.close')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto" role="region" aria-label="Tabela de resultados de journals">
        <table 
          className="journal-table" 
          role="table"
          aria-label={`Tabela com ${displayedData.length} journals encontrados`}
          aria-describedby="table-description"
        >
          <caption className="sr-only" id="table-description">
            Tabela de journals acadêmicos com classificações ABDC, ABS, SJR, JCR e Qualis. 
            Use as setas do teclado para navegar e Enter para interagir com elementos.
            {selectedJournals.size > 0 && ` ${selectedJournals.size} journals selecionados.`}
          </caption>
          <thead role="rowgroup">
            <tr role="row">
              <th 
                className="px-6 py-3 text-left"
                role="columnheader"
                aria-label="Seleção de journals"
                scope="col"
              >
                <input
                  type="checkbox"
                  checked={selectedJournals.size === displayedData.length && displayedData.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  aria-label={
                    selectedJournals.size === displayedData.length && displayedData.length > 0
                      ? "Desmarcar todos os journals"
                      : "Selecionar todos os journals visíveis"
                  }
                  aria-describedby="select-all-help"
                />
                <div id="select-all-help" className="sr-only">
                  {selectedJournals.size === displayedData.length && displayedData.length > 0
                    ? `Todos os ${displayedData.length} journals estão selecionados. Clique para desmarcar todos.`
                    : `Nenhum journal selecionado. Clique para selecionar todos os ${displayedData.length} journals visíveis.`
                  }
                </div>
              </th>
              {Object.entries(visibleColumns).map(([key, column]) => (
                <SortableHeader key={key} field={column.field}>
                  {column.label}
                </SortableHeader>
              ))}
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                role="columnheader"
                scope="col"
                aria-label={t('table.actionsColumnLabel')}
              >
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {displayedData.map((journal, index) => (
              <tr
                key={index}
                role="row"
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${selectedJournals.has(index) ? 'bg-blue-50' : ''
                  }`}
                aria-selected={selectedJournals.has(index)}
                aria-describedby={`journal-row-${index}`}
              >
                <td 
                  className="px-6 py-4 whitespace-nowrap"
                  role="cell"
                >
                  <input
                    type="checkbox"
                    checked={selectedJournals.has(index)}
                    onChange={() => toggleJournalSelection(index)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label={`Selecionar journal "${journal.journal || 'Sem nome'}"`}
                    aria-describedby={`journal-row-${index}`}
                  />
                  <div id={`journal-row-${index}`} className="sr-only">
                    Journal: {journal.journal || 'Sem nome'}. 
                    ABDC: {journal.abdc || 'Não classificado'}. 
                    ABS: {journal.abs || 'Não classificado'}. 
                    {selectedJournals.has(index) ? 'Selecionado' : 'Não selecionado'}.
                  </div>
                </td>

                {Object.entries(visibleColumns).map(([key, column]) => (
                  <td 
                    key={key} 
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    role="cell"
                    aria-label={`${column.label}: ${getNestedValue(journal, column.field) || 'Não disponível'}`}
                  >
                    {renderCellContent(journal, key, column, searchTerm, index)}
                  </td>
                ))}

                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  role="cell"
                  aria-label={t('table.actionsLabel')}
                >
                  <div className="flex gap-1" role="group" aria-label={t('table.actionsGroupLabel', { name: journal.journal || (language === 'en' ? 'unnamed' : 'sem nome') })}>
                    <button
                      onClick={() => {
                        const searchUrl = `https://scholar.google.com/scholar?q="${encodeURIComponent(journal.journal)}"`;
                        window.open(searchUrl, '_blank');
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      title={`Buscar "${journal.journal}" no Google Scholar`}
                      aria-label={`Buscar journal "${journal.journal}" no Google Scholar`}
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(journal.journal + ' scope')}"`;
                        window.open(searchUrl, '_blank');
                      }}
                      className="text-green-600 hover:text-green-800 transition-colors p-1"
                      title={`Buscar scope do journal "${journal.journal}" no Google`}
                      aria-label={`Buscar scope do journal "${journal.journal}" no Google`}
                    >
                      <Search className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(journal.journal + ' length words')}"`;
                        window.open(searchUrl, '_blank');
                      }}
                      className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                      title={`Buscar informações sobre tamanho de artigos do journal "${journal.journal}" no Google`}
                      aria-label={`Buscar informações sobre tamanho de artigos do journal "${journal.journal}" no Google`}
                    >
                      <Search className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer com informações e paginação */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex flex-col gap-4">
          {/* Informações */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <span>
                {t('table.showingResults', { count: displayedData.length, total: sortedData.length })}
              </span>
              {sortedData.length !== data.length && (
                <span className="text-blue-600 ml-2">
                  ({t('table.filteredFrom', { total: data.length })})
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {selectedJournals.size > 0 && (
                <button
                  onClick={() => setSelectedJournals(new Set())}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Limpar seleção
                </button>
              )}

              <span>
                {t('table.sorting.sortedBy')} <strong>{sortField}</strong> ({sortDirection === 'asc' ? t('table.sorting.ascending') : t('table.sorting.descending')})
              </span>
            </div>
          </div>

          {/* Botão Carregar Mais */}
          {hasMoreData && (
            <div className="text-center">
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="btn btn-outline"
              >
                {t('categories.loadMore').replace('100', Math.min(itemsPerPage, sortedData.length - displayedData.length).toString())}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
