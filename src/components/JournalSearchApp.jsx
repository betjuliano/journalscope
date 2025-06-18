import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  BarChart3, 
  Database, 
  RefreshCw,
  ExternalLink,
  CheckSquare,
  Square,
  X,
  Clock
} from 'lucide-react';
import { useEmbeddedData } from '../../hooks';
import { exportAsCSV, exportAsExcel } from '../../utils';
import PerformanceMonitor from './PerformanceMonitor';

const JournalSearchApp = () => {
  // Estados originais do hook
  const {
    filteredData,
    journalsData,
    isLoading,
    error,
    processingStatus,
    dataSource,
    searchTerm,
    setSearchTerm,
    filterABDC,
    setFilterABDC,
    filterABS,
    setFilterABS,
    filterWiley,
    setFilterWiley,
    showStats,
    setShowStats,
    stats,
    reloadData,
    exportToCSV,
    clearAllFilters,
    applyPresetFilter
  } = useEmbeddedData();

  // Estados adicionais para melhorias
  const [selectedJournals, setSelectedJournals] = useState(new Set());
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showResults, setShowResults] = useState(true);

  // Carregar histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('journalSearchHistory');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Salvar busca no histórico
  const saveSearchHistory = (term) => {
    if (term.trim() && !searchHistory.includes(term)) {
      const newHistory = [term, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
      localStorage.setItem('journalSearchHistory', JSON.stringify(newHistory));
    }
  };

  // Handlers para seleção
  const handleSelectJournal = (index) => {
    const newSelected = new Set(selectedJournals);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedJournals(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJournals.size === Math.min(filteredData.length, 100)) {
      setSelectedJournals(new Set());
    } else {
      const indices = Array.from({ length: Math.min(filteredData.length, 100) }, (_, i) => i);
      setSelectedJournals(new Set(indices));
    }
  };

  // Exportação com seleção
  const handleExportExcel = async () => {
    try {
      const dataToExport = selectedJournals.size > 0 
        ? filteredData.filter((_, index) => selectedJournals.has(index))
        : filteredData;
      await exportAsExcel(dataToExport, null, { includeStats: true });
    } catch (error) {
      alert(`Erro na exportação: ${error.message}`);
    }
  };

  const handleExportCSV = () => {
    if (selectedJournals.size > 0) {
      const selectedData = filteredData.filter((_, index) => selectedJournals.has(index));
      exportToCSV(selectedData);
    } else {
      exportToCSV();
    }
  };

  const handlePresetFilter = (preset) => {
    applyPresetFilter(preset);
    setSelectedJournals(new Set());
  };

  const handleSearchTermChange = (term) => {
    setSearchTerm(term);
    if (term.trim()) {
      saveSearchHistory(term);
    }
    setShowSearchHistory(false);
  };

  const getGoogleScholarLink = (journalName) => {
    const query = encodeURIComponent(`"${journalName}" journal`);
    return `https://scholar.google.com/scholar?q=${query}`;
  };

  const highlightSearchTerm = (text, term) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.toString().split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">
              JournalScope
            </h1>
          </div>
          <p className="text-gray-600 mb-2">
            Sistema de Consulta de Journals Acadêmicos
          </p>
          <p className="text-sm text-gray-500">
            Base de dados com {stats.total} journals únicos
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-2">
            <span>ABDC: {dataSource.abdc.count}</span>
            <span>•</span>
            <span>ABS: {dataSource.abs.count}</span>
            <span>•</span>
            <span>Wiley: {dataSource.wiley.count}</span>
            <button
              onClick={reloadData}
              className="ml-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className="h-3 w-3" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Filtros Rápidos */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handlePresetFilter('top-tier')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
            >
              🏆 Top Tier (A* + 4*)
            </button>
            <button
              onClick={() => handlePresetFilter('high-quality')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              ⭐ Alta Qualidade (A + 4)
            </button>
            <button
              onClick={() => handlePresetFilter('wiley-only')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
            >
              📚 Apenas Wiley
            </button>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              🔄 Limpar Filtros
            </button>
          </div>
        </div>

        {/* Controles de Busca e Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Campo de Busca com Histórico */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Journal
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite o nome do journal..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => handleSearchTermChange(e.target.value)}
                  onFocus={() => setShowSearchHistory(true)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
                
                {/* Histórico de Busca */}
                {showSearchHistory && searchHistory.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-100 text-xs text-gray-500 font-medium">
                      HISTÓRICO DE BUSCAS
                    </div>
                    {searchHistory.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchTermChange(term)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                      >
                        <Clock size={14} className="text-gray-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filtro ABDC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classificação ABDC
              </label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filterABDC}
                onChange={(e) => setFilterABDC(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="A*">A*</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            {/* Filtro ABS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classificação ABS
              </label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filterABS}
                onChange={(e) => setFilterABS(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="4*">4*</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </div>

            {/* Controles */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filterWiley}
                  onChange={(e) => setFilterWiley(e.target.checked)}
                />
                <span className="text-sm">Apenas Wiley</span>
              </label>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                >
                  <BarChart3 className="h-3 w-3" />
                  Stats
                </button>
                
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                >
                  <Download className="h-3 w-3" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {showStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas do Banco de Dados
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.withABDC}</div>
                <div className="text-sm text-gray-600">Com ABDC</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.withABS}</div>
                <div className="text-sm text-gray-600">Com ABS</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.withWiley}</div>
                <div className="text-sm text-gray-600">Com Wiley</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Distribuição ABDC:</h4>
                <div className="space-y-2">
                  {Object.entries(stats.abdcDistribution || {}).map(([rating, count]) => (
                    <div key={rating} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rating === 'A*' ? 'bg-green-100 text-green-800' :
                          rating === 'A' ? 'bg-blue-100 text-blue-800' :
                          rating === 'B' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rating}
                        </span>
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Distribuição ABS:</h4>
                <div className="space-y-2">
                  {Object.entries(stats.absDistribution || {}).map(([rating, count]) => (
                    <div key={rating} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rating === '4*' ? 'bg-green-100 text-green-800' :
                          rating === '4' ? 'bg-blue-100 text-blue-800' :
                          rating === '3' ? 'bg-yellow-100 text-yellow-800' :
                          rating === '2' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rating}
                        </span>
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Resultados ({filteredData.length} journals)
              </h2>
              
              {/* Seleção */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  {selectedJournals.size === Math.min(filteredData.length, 100) && filteredData.length > 0 ? (
                    <CheckSquare size={16} className="text-blue-600" />
                  ) : (
                    <Square size={16} />
                  )}
                  <span>Selecionar Todos</span>
                </button>
                
                {selectedJournals.size > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedJournals.size} selecionados
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                disabled={filteredData.length === 0}
              >
                <Download className="h-4 w-4" />
                CSV {selectedJournals.size > 0 && `(${selectedJournals.size})`}
              </button>
              
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                disabled={filteredData.length === 0}
              >
                <Download className="h-4 w-4" />
                Excel {selectedJournals.size > 0 && `(${selectedJournals.size})`}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-3"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ABDC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ABS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área Wiley</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APC (USD)</th>
                  <th className="w-16 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.slice(0, 100).map((journal, index) => {
                  const isSelected = selectedJournals.has(index);
                  
                  return (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSelectJournal(index)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {highlightSearchTerm(journal.journal, searchTerm)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {journal.abdc && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            journal.abdc === 'A*' ? 'bg-green-100 text-green-800' :
                            journal.abdc === 'A' ? 'bg-blue-100 text-blue-800' :
                            journal.abdc === 'B' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {journal.abdc}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {journal.abs && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            journal.abs === '4*' ? 'bg-green-100 text-green-800' :
                            journal.abs === '4' ? 'bg-blue-100 text-blue-800' :
                            journal.abs === '3' ? 'bg-yellow-100 text-yellow-800' :
                            journal.abs === '2' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {journal.abs}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {journal.wileySubject || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {journal.wileyAPC ? `$${journal.wileyAPC}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={getGoogleScholarLink(journal.journal)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="Buscar no Google Scholar"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredData.length > 100 && (
            <div className="px-6 py-4 bg-gray-50 border-t text-center text-sm text-gray-600">
              Mostrando os primeiros 100 resultados de {filteredData.length} encontrados
              {selectedJournals.size > 0 && (
                <span className="ml-2 text-blue-600">
                  • {selectedJournals.size} selecionados para exportação
                </span>
              )}
            </div>
          )}
          
          {filteredData.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <div className="mb-4">
                <Search className="h-12 w-12 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum journal encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Tente ajustar os filtros ou termo de busca
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close search history */}
      {showSearchHistory && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSearchHistory(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            Criado por{' '}
            <a 
              href="mailto:juliano.alves@ufsm.br" 
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Juliano Alves
            </a>
            {' '} - {' '}
            <a 
              href="mailto:juliano.alves@ufsm.br" 
              className="text-indigo-600 hover:text-indigo-800"
            >
              juliano.alves@ufsm.br
            </a>
            {' '} - {' '}
            <a 
              href="https://www.iaprojetos.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800"
            >
              www.iaprojetos.com.br
            </a>
          </p>
        </div>
      </footer>

      {/* Performance Monitor (apenas em desenvolvimento) */}
      <PerformanceMonitor isVisible={process.env.NODE_ENV === 'development'} />
    </div>
  );
};

export default JournalSearchApp;
