import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, Download, ExternalLink, Settings, Eye, EyeOff } from 'lucide-react';

const ResultsTable = ({
  data = [],
  onExportCSV,
  onExportExcel,
  searchTerm = '',
  maxDisplayed = 100
}) => {
  const [sortField, setSortField] = useState('journal');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedJournals, setSelectedJournals] = useState(new Set());
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  // Definição das colunas obrigatórias e opcionais
  const MANDATORY_COLUMNS = {
    journal: { label: 'Journal', field: 'journal', sortable: true },
    abdc: { label: 'ABDC', field: 'abdc', sortable: true },
    abs: { label: 'ABS', field: 'abs', sortable: true },
    sjrQuartile: { label: 'SJR Quartile', field: 'sjr.quartile', sortable: true },
    jcrQuartile: { label: 'JCR Quartile', field: 'jcr.quartile', sortable: true },
    qualis: { label: 'Qualis', field: 'qualis', sortable: true }
  };

  const MOBILE_MANDATORY_COLUMNS = {
    journal: MANDATORY_COLUMNS.journal,
    abdc: MANDATORY_COLUMNS.abdc,
    abs: MANDATORY_COLUMNS.abs,
    sjrQuartile: MANDATORY_COLUMNS.sjrQuartile,
    jcrQuartile: MANDATORY_COLUMNS.jcrQuartile,
    qualis: MANDATORY_COLUMNS.qualis
  };

  const OPTIONAL_COLUMNS = {
    predatory: { label: 'Predatório', field: 'predatory.isPredatory', sortable: true },
    sjrScore: { label: 'SJR Score', field: 'sjr.score', sortable: true },
    sjrHIndex: { label: 'SJR H-Index', field: 'sjr.hIndex', sortable: true },
    sjrCitableDocs: { label: 'SJR Citable Docs', field: 'sjr.citableDocs', sortable: true },
    jcrImpactFactor: { label: 'JCR Impact Factor', field: 'jcr.impactFactor', sortable: true },
    jcrCategory: { label: 'JCR Category', field: 'jcr.category', sortable: true },
    jcrCitations: { label: 'JCR Citations', field: 'jcr.citations', sortable: true },
    citeScoreScore: { label: 'CiteScore Score', field: 'citeScore.score', sortable: true },
    citeScoreSnip: { label: 'CiteScore SNIP', field: 'citeScore.snip', sortable: true },
    issn: { label: 'ISSN', field: 'jcr.issn', sortable: false },
    wileySubject: { label: 'Área Wiley', field: 'wileySubject', sortable: true }
  };

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

  // Processar dados com Qualis
  const processedData = useMemo(() => {
    return data.map(journal => ({
      ...journal,
      qualis: calculateQualis(journal)
    }));
  }, [data]);

  // Função para obter valor aninhado
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Função para ordenar dados
  const sortedData = useMemo(() => {
    if (!processedData.length) return [];

    return [...processedData].sort((a, b) => {
      let aValue = getNestedValue(a, sortField) || '';
      let bValue = getNestedValue(b, sortField) || '';

      // Ordenação especial para classificações
      if (sortField === 'abdc') {
        const abdcOrder = { 'A*': 4, 'A': 3, 'B': 2, 'C': 1 };
        aValue = abdcOrder[aValue] || 0;
        bValue = abdcOrder[bValue] || 0;
      } else if (sortField === 'abs') {
        const absOrder = { '4*': 5, '4': 4, '3': 3, '2': 2, '1': 1 };
        aValue = absOrder[aValue] || 0;
        bValue = absOrder[bValue] || 0;
      } else if (sortField === 'qualis') {
        const qualisOrder = { 'MB': 4, 'B': 3, 'R': 2, 'F': 1 };
        aValue = qualisOrder[aValue] || 0;
        bValue = qualisOrder[bValue] || 0;
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

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [processedData, sortField, sortDirection]);

  // Colunas visíveis baseadas no contexto (mobile/desktop)
  const visibleColumns = useMemo(() => {
    const mandatoryColumns = isMobile ? MOBILE_MANDATORY_COLUMNS : MANDATORY_COLUMNS;
    const enabledOptionalColumns = Object.keys(OPTIONAL_COLUMNS)
      .filter(key => optionalColumns[key])
      .reduce((acc, key) => ({ ...acc, [key]: OPTIONAL_COLUMNS[key] }), {});

    return { ...mandatoryColumns, ...enabledOptionalColumns };
  }, [isMobile, optionalColumns]);

  // Função para alternar coluna opcional
  const toggleOptionalColumn = (columnKey) => {
    setOptionalColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  // Função para renderizar conteúdo da célula
  const renderCellContent = (journal, columnKey, column, searchTerm) => {
    const value = getNestedValue(journal, column.field);

    switch (columnKey) {
      case 'journal':
        return (
          <div className="max-w-xs font-medium text-gray-900">
            {highlightSearchTerm(journal.journal, searchTerm)}
          </div>
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

  // Função para ordenar coluna
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para selecionar/deselecionar journal
  const toggleJournalSelection = (index) => {
    const newSelected = new Set(selectedJournals);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedJournals(newSelected);
  };

  // Função para selecionar/deselecionar todos
  const toggleSelectAll = () => {
    if (selectedJournals.size === displayedData.length) {
      setSelectedJournals(new Set());
    } else {
      setSelectedJournals(new Set(displayedData.map((_, index) => index)));
    }
  };

  // Dados a serem exibidos com paginação
  const totalItems = currentPage * itemsPerPage;
  const displayedData = sortedData.slice(0, Math.min(totalItems, sortedData.length));
  const hasMoreData = sortedData.length > totalItems;

  // Função para exportar selecionados
  const exportSelected = (format) => {
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
  };

  // Componente de cabeçalho ordenável
  const SortableHeader = ({ field, children, className = '' }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ?
            <ChevronUp className="h-3 w-3" /> :
            <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </th>
  );

  // Componente de badge de classificação
  const ClassificationBadge = ({ type, value }) => {
    if (!value) return null;

    const getClassName = () => {
      if (type === 'abdc') {
        return `classification-badge abdc-${value.toLowerCase().replace('*', '-star')}`;
      } else if (type === 'abs') {
        return `classification-badge abs-${value.replace('*', '-star')}`;
      }
      return 'classification-badge';
    };

    return (
      <span className={getClassName()}>
        {value}
      </span>
    );
  };

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-12 text-center text-gray-500">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum journal encontrado
          </h3>
          <p className="text-gray-500">
            Tente ajustar os filtros ou termo de busca
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
              title="Configurar colunas"
            >
              <Settings className="h-4 w-4" />
              Colunas
            </button>

            {/* Dropdown de configuração de colunas */}
            {showColumnSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Colunas Opcionais
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
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="journal-table">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedJournals.size === displayedData.length && displayedData.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              {Object.entries(visibleColumns).map(([key, column]) => (
                <SortableHeader key={key} field={column.field}>
                  {column.label}
                </SortableHeader>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((journal, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${selectedJournals.has(index) ? 'bg-blue-50' : ''
                  }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedJournals.has(index)}
                    onChange={() => toggleJournalSelection(index)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>

                {Object.entries(visibleColumns).map(([key, column]) => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm">
                    {renderCellContent(journal, key, column, searchTerm)}
                  </td>
                ))}

                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const searchUrl = `https://scholar.google.com/scholar?q="${encodeURIComponent(journal.journal)}"`;
                        window.open(searchUrl, '_blank');
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      title="Buscar no Google Scholar"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(journal.journal + ' scope')}"`;
                        window.open(searchUrl, '_blank');
                      }}
                      className="text-green-600 hover:text-green-800 transition-colors p-1"
                      title="Buscar Scope no Google"
                    >
                      <Search className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(journal.journal + ' length words')}"`;
                        window.open(searchUrl, '_blank');
                      }}
                      className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                      title="Buscar Length Words no Google"
                    >
                      <Search className="h-3 w-3" />
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
                Mostrando {displayedData.length} de {sortedData.length} journals
              </span>
              {sortedData.length !== data.length && (
                <span className="text-blue-600 ml-2">
                  (filtrados de {data.length} total)
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
                Ordenado por: <strong>{sortField}</strong> ({sortDirection === 'asc' ? 'crescente' : 'decrescente'})
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
                Carregar mais {Math.min(itemsPerPage, sortedData.length - displayedData.length)} journals
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
