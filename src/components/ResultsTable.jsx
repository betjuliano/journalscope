import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Download, ExternalLink } from 'lucide-react';

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

  // Função para ordenar dados
  const sortedData = useMemo(() => {
    if (!data.length) return [];

    return [...data].sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';

      // Ordenação especial para classificações
      if (sortField === 'abdc') {
        const abdcOrder = { 'A*': 4, 'A': 3, 'B': 2, 'C': 1 };
        aValue = abdcOrder[aValue] || 0;
        bValue = abdcOrder[bValue] || 0;
      } else if (sortField === 'abs') {
        const absOrder = { '4*': 5, '4': 4, '3': 3, '2': 2, '1': 1 };
        aValue = absOrder[aValue] || 0;
        bValue = absOrder[bValue] || 0;
      } else if (sortField === 'wileyAPC') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
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

  // Dados a serem exibidos (limitados)
  const displayedData = sortedData.slice(0, maxDisplayed);

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
          {/* Exportar selecionados */}
          {selectedJournals.size > 0 && (
            <>
              <button
                onClick={() => exportSelected('csv')}
                className="btn btn-outline text-sm"
                title="Exportar selecionados como CSV"
              >
                <Download className="h-4 w-4" />
                CSV Selecionados
              </button>
              
              <button
                onClick={() => exportSelected('excel')}
                className="btn btn-outline text-sm"
                title="Exportar selecionados como Excel"
              >
                <Download className="h-4 w-4" />
                Excel Selecionados
              </button>
            </>
          )}
          
          {/* Exportar todos */}
          <button
            onClick={() => onExportCSV && onExportCSV(data)}
            className="btn btn-outline text-sm"
            disabled={data.length === 0}
            title="Exportar todos como CSV"
          >
            <Download className="h-4 w-4" />
            CSV Todos
          </button>
          
          <button
            onClick={() => onExportExcel && onExportExcel(data)}
            className="btn btn-primary text-sm"
            disabled={data.length === 0}
            title="Exportar todos como Excel"
          >
            <Download className="h-4 w-4" />
            Excel Todos
          </button>
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
              <SortableHeader field="journal">Journal</SortableHeader>
              <SortableHeader field="abdc">ABDC</SortableHeader>
              <SortableHeader field="abs">ABS</SortableHeader>
              <SortableHeader field="wileySubject">Área Wiley</SortableHeader>
              <SortableHeader field="wileyAPC">APC (USD)</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((journal, index) => (
              <tr 
                key={index} 
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                  selectedJournals.has(index) ? 'bg-blue-50' : ''
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
                
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  <div className="max-w-xs">
                    {highlightSearchTerm(journal.journal, searchTerm)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <ClassificationBadge type="abdc" value={journal.abdc} />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <ClassificationBadge type="abs" value={journal.abs} />
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="max-w-xs truncate" title={journal.wileySubject}>
                    {journal.wileySubject || '-'}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {journal.wileyAPC ? (
                    <span className="font-medium text-green-600">
                      ${journal.wileyAPC}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    {/* Botão para buscar o journal online */}
                    <button
                      onClick={() => {
                        const searchUrl = `https://scholar.google.com/scholar?q="${encodeURIComponent(journal.journal)}"`;
                        window.open(searchUrl, '_blank');
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Buscar no Google Scholar"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer com informações */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            {data.length > maxDisplayed ? (
              <span>
                Mostrando {displayedData.length} de {data.length} journals
                <span className="text-amber-600 ml-2">
                  (Limitado a {maxDisplayed} para performance)
                </span>
              </span>
            ) : (
              <span>
                {displayedData.length} journals encontrados
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
      </div>
    </div>
  );
};

export default ResultsTable;
