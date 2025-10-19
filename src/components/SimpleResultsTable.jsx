import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ExternalLink, ChevronUp, ChevronDown, Settings, Eye, EyeOff, FileText, CheckSquare, Square } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

// Componente simples para célula de journal com expansão
const JournalCell = ({ journal, index, searchTerm, isExpanded, onToggleExpansion, language = 'pt' }) => {
  const journalName = journal?.journal || 'Nome não disponível';
  const shouldTruncate = journalName.length > 30;
  const isDuplicate = journal?.isDuplicate || false;
  
  const displayName = (!shouldTruncate || isExpanded) 
    ? journalName 
    : journalName.substring(0, 30) + '...';

  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    );
  };

  return (
    <div className="flex items-center gap-2 min-w-[300px] max-w-[500px]">
      <span 
        className={`${isExpanded ? 'whitespace-normal break-words' : 'whitespace-nowrap'} ${shouldTruncate ? 'cursor-pointer hover:text-blue-600' : ''}`}
        onClick={shouldTruncate ? () => onToggleExpansion(index) : undefined}
        title={shouldTruncate ? journalName : undefined}
      >
        {highlightText(displayName, searchTerm)}
      </span>
      
      {isDuplicate && (
        <span 
          className="text-red-600 font-bold text-xs cursor-help" 
          title={language === 'pt' ? `Duplicata encontrada (${journal.duplicateCount || 1} registros)` : `Duplicate found (${journal.duplicateCount || 1} records)`}
        >
          *
        </span>
      )}
      
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpansion(index);
          }}
          className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors flex-shrink-0"
          title={isExpanded ? (language === 'pt' ? 'Recolher' : 'Collapse') : (language === 'pt' ? 'Expandir' : 'Expand')}
        >
          {isExpanded ? '−' : '+'}
        </button>
      )}
    </div>
  );
};

// Componente para badge de classificação
const ClassificationBadge = ({ type, value }) => {
  if (!value) return <span className="text-gray-400">-</span>;

  const getColorClass = () => {
    if (type === 'abdc') {
      switch (value) {
        case 'A*': return 'bg-green-100 text-green-800';
        case 'A': return 'bg-blue-100 text-blue-800';
        case 'B': return 'bg-yellow-100 text-yellow-800';
        case 'C': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (type === 'abs') {
      switch (value) {
        case '4*': return 'bg-green-100 text-green-800';
        case '4': return 'bg-blue-100 text-blue-800';
        case '3': return 'bg-yellow-100 text-yellow-800';
        case '2': return 'bg-orange-100 text-orange-800';
        case '1': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getColorClass()}`}>
      {value}
    </span>
  );
};

// Componente para quartil
const QuartileBadge = ({ value }) => {
  if (!value) return <span className="text-gray-400">-</span>;

  const colorClass = {
    'Q1': 'bg-green-100 text-green-800',
    'Q2': 'bg-blue-100 text-blue-800',
    'Q3': 'bg-yellow-100 text-yellow-800',
    'Q4': 'bg-red-100 text-red-800'
  }[value] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {value}
    </span>
  );
};

// Componente para Qualis
const QualisBadge = ({ value }) => {
  if (!value || value === '-') return <span className="text-gray-400">-</span>;

  const colorClass = {
    'A1': 'bg-green-100 text-green-800',
    'A2': 'bg-blue-100 text-blue-800', 
    'B1': 'bg-yellow-100 text-yellow-800',
    'B2': 'bg-orange-100 text-orange-800',
    'B3': 'bg-red-100 text-red-800',
    'B4': 'bg-red-200 text-red-900',
    'B5': 'bg-gray-100 text-gray-800',
    'C': 'bg-gray-200 text-gray-900'
  }[value] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs font-bold rounded-full ${colorClass}`}>
      {value}
    </span>
  );
};

// Função para calcular Qualis baseado nas classificações
const calculateQualis = (journal) => {
  const abdc = journal.abdc;
  const abs = journal.abs;
  const jcrQuartile = journal.jcr?.quartile;
  const sjrQuartile = journal.sjr?.quartile;

  // A1: ABDC A* ou ABS 4*
  if (abdc === 'A*' || abs === '4*') {
    return 'A1';
  }

  // A2: ABDC A ou ABS 4 ou JCR/SJR Q1
  if (abdc === 'A' || abs === '4' || jcrQuartile === 'Q1' || sjrQuartile === 'Q1') {
    return 'A2';
  }

  // B1: ABDC B ou ABS 3 ou JCR/SJR Q2
  if (abdc === 'B' || abs === '3' || jcrQuartile === 'Q2' || sjrQuartile === 'Q2') {
    return 'B1';
  }

  // B2: ABS 2 ou JCR/SJR Q3
  if (abs === '2' || jcrQuartile === 'Q3' || sjrQuartile === 'Q3') {
    return 'B2';
  }

  // B3: ABDC C ou ABS 1 ou JCR/SJR Q4
  if (abdc === 'C' || abs === '1' || jcrQuartile === 'Q4' || sjrQuartile === 'Q4') {
    return 'B3';
  }

  return '-';
};

const SimpleResultsTable = ({
  data = [],
  searchTerm = '',
  onSendToSub = null
}) => {
  const { t, language } = useI18n();
  const [sortField, setSortField] = useState('journal');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedJournals, setExpandedJournals] = useState(new Set());
  const [selectedJournals, setSelectedJournals] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const itemsPerPage = 100;

  // Configuração de colunas disponíveis
  const availableColumns = useMemo(() => ({
    issn: { label: 'ISSN', required: true },
    journal: { label: 'Journal', required: true },
    abdc: { label: 'ABDC', required: false },
    abs: { label: 'ABS', required: false },
    sjrQuartile: { label: language === 'pt' ? 'SJR Quartil' : 'SJR Quartile', required: false },
    jcrQuartile: { label: language === 'pt' ? 'JCR Quartil' : 'JCR Quartile', required: false },
    ...(language === 'pt' ? { qualis: { label: 'Qualis', required: false } } : {}),
    sjrScore: { label: 'SJR Score', required: false },
    jcrImpactFactor: { label: 'JCR Impact Factor', required: false },
    publisher: { label: language === 'pt' ? 'Editora' : 'Publisher', required: false },
    predatory: { label: language === 'pt' ? 'Predatório' : 'Predatory', required: false }
  }), [language]);

  // Colunas visíveis (carregadas do localStorage)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('journalTable_visibleColumns');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Garantir que colunas obrigatórias estejam sempre visíveis
        return { issn: true, journal: true, abdc: true, abs: true, sjrQuartile: true, jcrQuartile: true, ...(language === 'pt' ? { qualis: true } : {}), ...parsed };
      }
    } catch (error) {
      console.error('Error loading column settings:', error);
    }
    // Configuração padrão
    return {
      issn: true,
      journal: true,
      abdc: true,
      abs: true,
      sjrQuartile: true,
      jcrQuartile: true,
      ...(language === 'pt' ? { qualis: true } : {})
    };
  });

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('journalTable_visibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Função para alternar expansão
  const toggleJournalExpansion = useCallback((index) => {
    setExpandedJournals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Função para alternar seleção
  const toggleJournalSelection = useCallback((index) => {
    setSelectedJournals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Função de ordenação
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Utilidades de ISSN
  const normalizeISSN = useCallback((issn) => {
    if (!issn) return '';
    return issn.toUpperCase().trim();
  }, []);

  const isValidISSN = useCallback((issn) => {
    if (!issn) return false;
    const s = normalizeISSN(issn);
    const match = s.match(/^\d{4}-\d{3}[0-9X]$/);
    if (!match) return false;
    // validação de dígito verificador
    const digits = s.replace('-', '').split('');
    const weights = [8,7,6,5,4,3,2];
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(digits[i], 10) * weights[i];
    const remainder = sum % 11;
    const check = (11 - remainder);
    const checkChar = check === 10 ? 'X' : (check === 11 ? '0' : String(check));
    return digits[7] === checkChar;
  }, [normalizeISSN]);

  const duplicateIssnMap = useMemo(() => {
    const counts = {};
    (data || []).forEach(j => {
      const issn = normalizeISSN(j.issn);
      if (isValidISSN(issn)) {
        counts[issn] = (counts[issn] || 0) + 1;
      }
    });
    return counts;
  }, [data, normalizeISSN, isValidISSN]);

  // Dados processados com Qualis
  const processedData = useMemo(() => {
    return data.map(journal => ({
      ...journal,
      qualis: calculateQualis(journal)
    }));
  }, [data]);

  // Dados ordenados
  const sortedData = useMemo(() => {
    if (!processedData.length) return [];

    return [...processedData].sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';

      // Tratamento especial para campos aninhados
      if (sortField === 'sjrQuartile') {
        aValue = a.sjr?.quartile || '';
        bValue = b.sjr?.quartile || '';
      } else if (sortField === 'jcrQuartile') {
        aValue = a.jcr?.quartile || '';
        bValue = b.jcr?.quartile || '';
      }

      // Ordenação para classificações
      if (sortField === 'abdc') {
        const order = { 'A*': 4, 'A': 3, 'B': 2, 'C': 1 };
        aValue = order[aValue] || 0;
        bValue = order[bValue] || 0;
      } else if (sortField === 'abs') {
        const order = { '4*': 5, '4': 4, '3': 3, '2': 2, '1': 1 };
        aValue = order[aValue] || 0;
        bValue = order[bValue] || 0;
      } else if (sortField === 'qualis') {
        const order = { 'A1': 8, 'A2': 7, 'B1': 6, 'B2': 5, 'B3': 4, 'B4': 3, 'B5': 2, 'C': 1 };
        aValue = order[aValue] || 0;
        bValue = order[bValue] || 0;
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
  }, [data, sortField, sortDirection]);

  // Dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  // Verificar se há mais dados
  const hasMoreData = sortedData.length > currentPage * itemsPerPage;

  // Reset expansão quando dados mudam
  React.useEffect(() => {
    setExpandedJournals(new Set());
  }, [processedData, searchTerm]);

  // Função para alternar visibilidade de coluna
  const toggleColumnVisibility = useCallback((columnKey) => {
    if (availableColumns[columnKey]?.required) return; // Não permitir ocultar colunas obrigatórias
    
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  }, [availableColumns]);

  // Cabeçalho ordenável
  const SortableHeader = ({ field, children }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
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

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-500">{t('table.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {t('table.results', { count: data.length })}
          </h2>
          {selectedJournals.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {selectedJournals.size} {language === 'pt' ? 'selecionados' : 'selected'}
              </span>
              {onSendToSub && (
                <button
                  onClick={() => {
                    const selectedData = Array.from(selectedJournals).map(idx => paginatedData[idx]).filter(Boolean);
                    onSendToSub(selectedData);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                  title={language === 'pt' ? 'Enviar periódicos selecionados para o sistema SUB' : 'Send selected journals to SUB system'}
                >
                  <FileText className="h-4 w-4" />
                  {language === 'pt' ? 'Enviar para SUB' : 'Send to SUB'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            <Settings className="h-4 w-4" />
            {language === 'pt' ? 'Configurar Colunas' : 'Columns Settings'}
          </button>

          {/* Dropdown de configuração de colunas */}
          {showColumnSettings && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {language === 'pt' ? 'Colunas Visíveis' : 'Visible Columns'}
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(availableColumns).map(([key, column]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key] || false}
                        onChange={() => toggleColumnVisibility(key)}
                        disabled={column.required}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className={`text-gray-700 ${column.required ? 'font-medium' : ''}`}>
                        {column.label}
                        {column.required && <span className="text-xs text-gray-500 ml-1">({language === 'pt' ? 'obrigatória' : 'required'})</span>}
                      </span>
                      {visibleColumns[key] && (
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
                    {language === 'pt' ? 'Fechar' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedJournals.size === paginatedData.length && paginatedData.length > 0}
                  onChange={() => {
                    if (selectedJournals.size === paginatedData.length) {
                      setSelectedJournals(new Set());
                    } else {
                      setSelectedJournals(new Set(paginatedData.map((_, i) => i)));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {visibleColumns.issn && <SortableHeader field="issn">ISSN</SortableHeader>}
              {visibleColumns.journal && <SortableHeader field="journal">Journal</SortableHeader>}
              {visibleColumns.abdc && <SortableHeader field="abdc">ABDC</SortableHeader>}
              {visibleColumns.abs && <SortableHeader field="abs">ABS</SortableHeader>}
              {visibleColumns.sjrQuartile && <SortableHeader field="sjrQuartile">{language === 'pt' ? 'SJR Quartil' : 'SJR Quartile'}</SortableHeader>}
              {visibleColumns.jcrQuartile && <SortableHeader field="jcrQuartile">{language === 'pt' ? 'JCR Quartil' : 'JCR Quartile'}</SortableHeader>}
              {visibleColumns.qualis && language === 'pt' && <SortableHeader field="qualis">Qualis</SortableHeader>}
              {visibleColumns.sjrScore && <SortableHeader field="sjrScore">SJR Score</SortableHeader>}
              {visibleColumns.jcrImpactFactor && <SortableHeader field="jcrImpactFactor">JCR Impact Factor</SortableHeader>}
              {visibleColumns.publisher && <SortableHeader field="publisher">{language === 'pt' ? 'Editora' : 'Publisher'}</SortableHeader>}
              {visibleColumns.predatory && <SortableHeader field="predatory">{language === 'pt' ? 'Predatório' : 'Predatory'}</SortableHeader>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {language === 'pt' ? 'Buscar & Ações' : 'Search & Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((journal, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedJournals.has(index)}
                    onChange={() => toggleJournalSelection(index)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                
                {visibleColumns.issn && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const issn = journal.issn || journal.jcr?.issn || '';
                      const displayIssn = issn ? issn : '-';
                      const isDuplicate = journal.isDuplicate || false;
                      
                      return (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 font-mono text-xs">{displayIssn}</span>
                          {isDuplicate && (
                            <span 
                              className="text-red-600 font-bold text-xs cursor-help" 
                              title={language === 'pt' ? `Duplicata encontrada (${journal.duplicateCount || 1} registros)` : `Duplicate found (${journal.duplicateCount || 1} records)`}
                            >
                              *
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                )}

                {visibleColumns.journal && (
                  <td className="px-6 py-4">
                    <JournalCell
                      journal={journal}
                      index={index}
                      searchTerm={searchTerm}
                      isExpanded={expandedJournals.has(index)}
                      onToggleExpansion={toggleJournalExpansion}
                      language={language}
                    />
                  </td>
                )}
                
                {visibleColumns.abdc && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ClassificationBadge type="abdc" value={journal.abdc} />
                  </td>
                )}
                
                {visibleColumns.abs && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ClassificationBadge type="abs" value={journal.abs} />
                  </td>
                )}
                
                {visibleColumns.sjrQuartile && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <QuartileBadge value={journal.sjr?.quartile} />
                  </td>
                )}
                
                {visibleColumns.jcrQuartile && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <QuartileBadge value={journal.jcr?.quartile} />
                  </td>
                )}

                {visibleColumns.qualis && language === 'pt' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <QualisBadge value={journal.qualis} />
                  </td>
                )}

                {visibleColumns.sjrScore && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-600">{journal.sjr?.score || '-'}</span>
                  </td>
                )}

                {visibleColumns.jcrImpactFactor && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-600">{journal.jcr?.impactFactor || '-'}</span>
                  </td>
                )}

                {visibleColumns.publisher && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-600">{journal.publisher || '-'}</span>
                  </td>
                )}

                {visibleColumns.predatory && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {journal.predatory?.isPredatory !== null && journal.predatory?.isPredatory !== undefined ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        journal.predatory.isPredatory ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {journal.predatory.isPredatory ? (language === 'pt' ? 'Sim' : 'Yes') : (language === 'pt' ? 'Não' : 'No')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                )}
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {/* Botão Google */}
                    <button
                      onClick={() => {
                        const searchQuery = encodeURIComponent(`"${journal.journal}" journal`);
                        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                      }}
                      className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                      title={language === 'pt' ? `Buscar "${journal.journal}" no Google` : `Search "${journal.journal}" on Google`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </button>

                    {/* Botão Google Acadêmico */}
                    <button
                      onClick={() => {
                        const searchQuery = encodeURIComponent(`"${journal.journal}"`);
                        window.open(`https://scholar.google.com/scholar?q=${searchQuery}`, '_blank');
                      }}
                      className="inline-flex items-center justify-center p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                      title={language === 'pt' ? `Buscar "${journal.journal}" no Google Acadêmico` : `Search "${journal.journal}" on Google Scholar`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>
                      </svg>
                    </button>

                    {/* Botão Google Scope */}
                    <button
                      onClick={() => {
                        const searchQuery = encodeURIComponent(`"${journal.journal}" scope area field research`);
                        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                      }}
                      className="inline-flex items-center justify-center p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-md transition-colors"
                      title={language === 'pt' ? `Buscar escopo/área de "${journal.journal}" no Google` : `Search scope/area of "${journal.journal}" on Google`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                      </svg>
                    </button>

                    {/* Botão Google Length Words */}
                    <button
                      onClick={() => {
                        const searchQuery = encodeURIComponent(`"${journal.journal}" length words limit guidelines submission`);
                        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                      }}
                      className="inline-flex items-center justify-center p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-md transition-colors"
                      title={language === 'pt' ? `Buscar diretrizes de tamanho/palavras de "${journal.journal}" no Google` : `Search length/word guidelines for "${journal.journal}" on Google`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                    </button>

                    {/* Botão Ver Submissões no SUB */}
                    <button
                      onClick={() => {
                        const journalData = encodeURIComponent(JSON.stringify({
                          nome: journal.journal,
                          issn: journal.issn,
                          area: journal.category || 'N/A',
                          qualis: journal.qualis || null
                        }));
                        window.open(`http://localhost:3001/periodicos-pesquisa?search=${encodeURIComponent(journal.journal)}`, '_blank');
                      }}
                      className="inline-flex items-center justify-center p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                      title={language === 'pt' ? `Ver submissões de "${journal.journal}" no sistema SUB` : `View submissions for "${journal.journal}" in SUB system`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botão carregar mais */}
      {hasMoreData && (
        <div className="px-6 py-4 bg-gray-50 border-t text-center">
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('categories.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleResultsTable;