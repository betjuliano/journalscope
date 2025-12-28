import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Search, ChevronUp, ChevronDown, Download, ExternalLink, Settings, Eye, EyeOff } from 'lucide-react';
import {
  truncateJournalName,
  needsTruncation,
  validateJournalData,
  getSafeJournalNameForRendering,
  createJournalCellFallback,
  sanitizeJournalName
} from '../../utils/textUtils';
import { useI18n } from '../contexts/I18nContext';
import { recordRenderOperation, recordFilterOperation } from '../utils/performance';
import JournalCellWithExpansion from './JournalCellWithExpansion';

// Memoized constants to avoid recreation
const PERFORMANCE_THRESHOLDS = {
  FILTER_TIME_WARNING: 10,
  STATS_TIME_WARNING: 5,
  RENDER_TIME_WARNING: 20
};

// Memoized sort orders to avoid recreation on every render
const SORT_ORDERS = {
  abdc: { 'A*': 4, 'A': 3, 'B': 2, 'C': 1 },
  abs: { '4*': 5, '4': 4, '3': 3, '2': 2, '1': 1 },
  qualis: { 'MB': 4, 'B': 3, 'R': 2, 'F': 1 }
};

// Qualis calculation function (not memoized as memo() is for components)
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

// Memoized component for classification badges
const ClassificationBadge = memo(({ type, value }) => {
  if (!value) return <span className="text-gray-400">-</span>;

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

// Memoized component for journal cell with auto-expansion
const JournalCell = memo(({
  journal,
  index,
  searchTerm
}) => {
  // Memoized display data calculation
  const displayData = useMemo(() => {
    try {
      // Get journal name safely with fallback
      const journalName = journal?.journal || journal?.name || journal?.title || 'Nome não disponível';

      // Validate and sanitize the name
      if (!journalName || typeof journalName !== 'string') {
        return {
          journalName: 'Nome não disponível',
          needsAutoExpand: false,
          isValid: true
        };
      }

      const sanitizedName = journalName.trim();

      // Debug log for development
      if (import.meta.env.DEV && index < 5) {
        console.log(`Journal ${index}: "${sanitizedName}" (${sanitizedName.length} chars)`);
      }

      // Use a more reasonable threshold for auto-expansion
      const needsAutoExpand = sanitizedName.length > 50;

      return {
        journalName: sanitizedName,
        needsAutoExpand,
        isValid: true
      };
    } catch (error) {
      console.error(`[OptimizedResultsTable] Error processing display data for journal ${index}:`, error);

      return {
        journalName: 'Erro no nome',
        needsAutoExpand: false,
        isValid: false,
        error: error.message
      };
    }
  }, [journal, index]);

  // Memoized highlighted text
  const highlightedText = useMemo(() => {
    if (!searchTerm || !displayData.journalName) return displayData.journalName;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = displayData.journalName.split(regex);

    return parts.map((part, partIndex) =>
      regex.test(part) ? (
        <mark key={partIndex} className="search-highlight bg-yellow-200">
          {part}
        </mark>
      ) : part
    );
  }, [displayData.journalName, searchTerm]);

  // Error fallback
  if (!displayData.isValid) {
    return (
      <div className="journal-cell-container">
        <div className="journal-cell-fallback" data-testid={`journal-cell-fallback-${index}`}>
          <span className="text-gray-900">{displayData.journalName}</span>
          <span
            className="text-xs text-red-500 ml-2"
            title={`Fallback mode active: ${displayData.error || 'Unknown error'}`}
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

// Memoized sortable header component
const SortableHeader = memo(({ field, children, className = '', onSort, sortField, sortDirection, t }) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
    onClick={() => onSort(field)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSort(field);
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
    aria-label={`${children}. ${sortField === field
        ? `Currently sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}. Click to reverse`
        : 'Click to sort'
      }`}
  >
    <div className="flex items-center gap-2">
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ?
          <ChevronUp className="h-3 w-3" aria-hidden="true" /> :
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
      )}
    </div>
  </th>
));

const OptimizedResultsTable = ({
  data = [],
  onExportCSV,
  onExportExcel,
  searchTerm = '',
  maxDisplayed = 100,
  filterABDC = '',
  filterABS = '',
  filterWiley = false,
  filterSJR = ''
}) => {
  const { t, language } = useI18n();
  const [sortField, setSortField] = useState('journal');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedJournals, setSelectedJournals] = useState(new Set());
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  // Estado para controlar journals expandidos
  const [expandedJournals, setExpandedJournals] = useState(new Set());

  // Memoized column configuration based on language
  const columnConfiguration = useMemo(() => {
    const baseColumns = {
      journal: { label: t('table.columns.journal'), field: 'journal', sortable: true },
      abdc: { label: t('table.columns.abdc'), field: 'abdc', sortable: true },
      abs: { label: t('table.columns.abs'), field: 'abs', sortable: true },
      sjrQuartile: { label: t('table.columns.sjrQuartile'), field: 'sjr.quartile', sortable: true },
      jcrQuartile: { label: t('table.columns.jcrQuartile'), field: 'jcr.quartile', sortable: true }
    };

    // Language-specific columns
    if (language === 'en') {
      return {
        ...baseColumns,
        sjrHIndex: { label: t('table.columns.sjrHIndex'), field: 'sjr.hIndex', sortable: true }
      };
    } else {
      return {
        ...baseColumns,
        qualis: { label: t('table.columns.qualis'), field: 'qualis', sortable: true }
      };
    }
  }, [language, t]);

  // Memoized optional columns
  const optionalColumns = useMemo(() => ({
    predatory: { label: language === 'en' ? 'Predatory' : 'Predatório', field: 'predatory.isPredatory', sortable: true },
    sjrScore: { label: 'SJR Score', field: 'sjr.score', sortable: true },
    sjrCitableDocs: { label: 'SJR Citable Docs', field: 'sjr.citableDocs', sortable: true },
    jcrImpactFactor: { label: 'JCR Impact Factor', field: 'jcr.impactFactor', sortable: true },
    jcrCategory: { label: 'JCR Category', field: 'jcr.category', sortable: true },
    jcrCitations: { label: 'JCR Citations', field: 'jcr.citations', sortable: true },
    citeScoreScore: { label: 'CiteScore Score', field: 'citeScore.score', sortable: true },
    citeScoreSnip: { label: 'CiteScore SNIP', field: 'citeScore.snip', sortable: true },
    issn: { label: 'ISSN', field: 'jcr.issn', sortable: false },
    wileySubject: { label: language === 'en' ? 'Wiley Subject' : 'Área Wiley', field: 'wileySubject', sortable: true }
  }), [language]);

  // State for optional columns (loaded from localStorage)
  const [enabledOptionalColumns, setEnabledOptionalColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('journalTable_optionalColumns');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('journalTable_optionalColumns', JSON.stringify(enabledOptionalColumns));
  }, [enabledOptionalColumns]);

  // Reset expansão quando filtros mudam
  useEffect(() => {
    setExpandedJournals(new Set());
  }, [searchTerm, filterABDC, filterABS, filterWiley, filterSJR]);

  // Reset expansão em mudança de página
  useEffect(() => {
    setExpandedJournals(new Set());
  }, [currentPage]);

  // Memoized processed data with Qualis calculation and performance monitoring
  const processedData = useMemo(() => {
    const startTime = performance.now();

    const processed = data.map(journal => ({
      ...journal,
      qualis: calculateQualis(journal)
    }));

    const processingTime = performance.now() - startTime;
    recordRenderOperation(processingTime, 'DataProcessing');

    if (import.meta.env.DEV && processingTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
      console.log(`⚠️ Data processing took ${processingTime.toFixed(2)}ms for ${data.length} journals`);
    }

    return processed;
  }, [data]);

  // Optimized nested value getter
  const getNestedValue = useCallback((obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }, []);

  // Memoized sorted data with performance monitoring
  const sortedData = useMemo(() => {
    if (!processedData.length) return [];

    const startTime = performance.now();

    const sorted = [...processedData].sort((a, b) => {
      let aValue = getNestedValue(a, sortField) || '';
      let bValue = getNestedValue(b, sortField) || '';

      // Special sorting for classifications
      if (sortField === 'abdc') {
        aValue = SORT_ORDERS.abdc[aValue] || 0;
        bValue = SORT_ORDERS.abdc[bValue] || 0;
      } else if (sortField === 'abs') {
        aValue = SORT_ORDERS.abs[aValue] || 0;
        bValue = SORT_ORDERS.abs[bValue] || 0;
      } else if (sortField === 'qualis') {
        aValue = SORT_ORDERS.qualis[aValue] || 0;
        bValue = SORT_ORDERS.qualis[bValue] || 0;
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
    recordRenderOperation(sortTime, 'TableSorting');

    if (import.meta.env.DEV && sortTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
      console.log(`⚠️ Sorting took ${sortTime.toFixed(2)}ms for ${processedData.length} journals`);
    }

    return sorted;
  }, [processedData, sortField, sortDirection, getNestedValue]);

  // Memoized visible columns
  const visibleColumns = useMemo(() => {
    const mandatoryColumns = columnConfiguration;

    const filteredOptionalColumns = Object.keys(optionalColumns)
      .filter(key => {
        // Skip sjrHIndex in optional if it's already in mandatory columns (English mode)
        if (key === 'sjrHIndex' && language === 'en') {
          return false;
        }
        return enabledOptionalColumns[key];
      })
      .reduce((acc, key) => ({ ...acc, [key]: optionalColumns[key] }), {});

    return { ...mandatoryColumns, ...filteredOptionalColumns };
  }, [columnConfiguration, optionalColumns, enabledOptionalColumns, language]);

  // Memoized displayed data with pagination
  const displayedData = useMemo(() => {
    const totalItems = currentPage * itemsPerPage;
    return sortedData.slice(0, Math.min(totalItems, sortedData.length));
  }, [sortedData, currentPage, itemsPerPage]);

  // Memoized has more data check
  const hasMoreData = useMemo(() => {
    return sortedData.length > currentPage * itemsPerPage;
  }, [sortedData.length, currentPage, itemsPerPage]);

  // Optimized sort handler
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Optimized journal selection toggle
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

  // Optimized select all toggle
  const toggleSelectAll = useCallback(() => {
    setSelectedJournals(prev => {
      if (prev.size === displayedData.length) {
        return new Set();
      } else {
        return new Set(displayedData.map((_, index) => index));
      }
    });
  }, [displayedData]);

  // Optimized optional column toggle
  const toggleOptionalColumn = useCallback((columnKey) => {
    setEnabledOptionalColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  }, []);

  // Função para alternar expansão de journals
  const toggleJournalExpansion = useCallback((index) => {
    setExpandedJournals(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      return newExpanded;
    });
  }, []);

  // Memoized cell content renderer
  const renderCellContent = useCallback((journal, columnKey, column, searchTerm, index) => {
    try {
      const value = getNestedValue(journal, column.field);

      switch (columnKey) {
        case 'journal':
          return (
            <JournalCellWithExpansion
              journal={journal}
              index={index}
              searchTerm={searchTerm}
              isExpanded={expandedJournals.has(index)}
              onToggleExpansion={toggleJournalExpansion}
            />
          );

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
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
              {value ? 'Yes' : 'No'}
            </span>
          ) : <span className="text-gray-400">-</span>;

        default:
          return (
            <span className="text-gray-600">
              {value || '-'}
            </span>
          );
      }
    } catch (error) {
      console.error(`[OptimizedResultsTable] Error rendering cell for column ${columnKey}, index ${index}:`, error);

      return (
        <div className="cell-error-fallback" data-testid={`cell-error-fallback-${columnKey}-${index}`}>
          <span className="text-gray-500">Error</span>
          <span
            className="text-xs text-red-500 ml-1"
            title={`Error rendering column ${columnKey}: ${error.message}`}
          >
            ⚠
          </span>
        </div>
      );
    }
  }, [getNestedValue]);

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-12 text-center text-gray-500">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No journals found
          </h3>
          <p className="text-gray-500">
            Try adjusting the filters or search term
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Table header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Results ({data.length} journals)
          </h2>

          {selectedJournals.size > 0 && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {selectedJournals.size} selected
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {/* Export buttons */}
          <button
            onClick={() => onExportCSV(data)}
            className="btn btn-outline text-sm"
            title="Exportar como CSV"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>

          <button
            onClick={() => onExportExcel(data)}
            className="btn btn-outline text-sm"
            title="Exportar como Excel"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>

          {/* Column settings button */}
          <div className="relative">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="btn btn-outline text-sm"
              title="Columns Settings"
            >
              <Settings className="h-4 w-4" />
              Columns
            </button>

            {/* Column settings dropdown */}
            {showColumnSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Optional Columns
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(optionalColumns).map(([key, column]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={enabledOptionalColumns[key] || false}
                          onChange={() => toggleOptionalColumn(key)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{column.label}</span>
                        {enabledOptionalColumns[key] && (
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
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" role="region" aria-label="Journal results table">
        <table
          className="journal-table min-w-full divide-y divide-gray-200"
          role="table"
          aria-label={`Table with ${displayedData.length} journals found`}
        >
          <thead className="bg-gray-50" role="rowgroup">
            <tr role="row">
              <th
                className="px-6 py-3 text-left"
                role="columnheader"
                scope="col"
              >
                <input
                  type="checkbox"
                  checked={selectedJournals.size === displayedData.length && displayedData.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  aria-label={
                    selectedJournals.size === displayedData.length && displayedData.length > 0
                      ? "Unselect all journals"
                      : "Select all visible journals"
                  }
                />
              </th>
              {Object.entries(visibleColumns).map(([key, column]) => (
                <SortableHeader
                  key={key}
                  field={column.field}
                  onSort={handleSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  t={t}
                >
                  {column.label}
                </SortableHeader>
              ))}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                role="columnheader"
                scope="col"
              >
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
            {displayedData.map((journal, index) => (
              <tr
                key={index}
                role="row"
                className={`hover:bg-gray-50 transition-colors ${selectedJournals.has(index) ? 'bg-blue-50' : ''
                  }`}
                aria-selected={selectedJournals.has(index)}
              >
                <td className="px-6 py-4 whitespace-nowrap" role="cell">
                  <input
                    type="checkbox"
                    checked={selectedJournals.has(index)}
                    onChange={() => toggleJournalSelection(index)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label={`Select journal ${journal.journal}`}
                  />
                </td>
                {Object.entries(visibleColumns).map(([columnKey, column]) => (
                  <td key={columnKey} className="px-6 py-4 whitespace-nowrap" role="cell">
                    {renderCellContent(journal, columnKey, column, searchTerm, index)}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" role="cell">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Disparar evento customizado para criar submissão
                        const event = new CustomEvent('createSubmissionFromJournal', {
                          detail: { journalName: journal.journal }
                        });
                        window.dispatchEvent(event);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                      title={`Criar submissão para ${journal.journal || 'journal'}`}
                      aria-label={`Criar submissão para ${journal.journal || 'journal'}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Submeter</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more button */}
      {hasMoreData && (
        <div className="px-6 py-4 bg-gray-50 border-t text-center">
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="btn btn-primary"
          >
            Load 100 more journals
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(OptimizedResultsTable);