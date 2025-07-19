import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  BarChart3, 
  Database, 
  RefreshCw,
  X,
  Clock
} from 'lucide-react';
import { useEmbeddedData } from '../../hooks';
import { exportAsCSV, exportAsExcel } from '../../utils';
import PerformanceMonitor from './PerformanceMonitor';
import ResultsTable from './ResultsTable';

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
    filterSJR,
    setFilterSJR,
    showStats,
    setShowStats,
    stats,
    reloadData,
    exportToCSV,
    clearAllFilters,
    applyPresetFilter
  } = useEmbeddedData();

  // Estados adicionais para melhorias
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [excludePredatory, setExcludePredatory] = useState(false);

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

  // Exportação com Excel
  const handleExportExcel = async (data) => {
    try {
      await exportAsExcel(data || filteredData, null, { includeStats: true });
    } catch (error) {
      alert(`Erro na exportação: ${error.message}`);
    }
  };

  const handleExportCSV = (data) => {
    exportToCSV(data || filteredData);
  };

  const handlePresetFilter = (preset) => {
    applyPresetFilter(preset);
  };

  const handleSearchTermChange = (term) => {
    setSearchTerm(term);
    if (term.trim()) {
      saveSearchHistory(term);
    }
    setShowSearchHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Database className="h-10 w-10 text-indigo-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              JournalScope
            </h1>
          </div>
          <div className="max-w-3xl mx-auto mb-6">
            <p className="text-xl text-gray-700 mb-3 font-medium">
              Sistema Integrado de Consulta de Journals Acadêmicos
            </p>
            <p className="text-gray-600 leading-relaxed">
              Plataforma unificada para consulta e análise de journals acadêmicos com dados consolidados 
              de múltiplas bases de classificação internacional, incluindo ABDC, ABS, JCR, SJR, CiteScore e Wiley.
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 max-w-5xl mx-auto mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
              <div className="text-xs text-gray-600 font-medium">Total Journals</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-blue-600">{stats.withABDC}</div>
              <div className="text-xs text-gray-600 font-medium">ABDC</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-green-600">{stats.withABS}</div>
              <div className="text-xs text-gray-600 font-medium">ABS</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-purple-600">{stats.withJCR}</div>
              <div className="text-xs text-gray-600 font-medium">JCR</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-orange-600">{stats.withSJR}</div>
              <div className="text-xs text-gray-600 font-medium">SJR</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-red-600">{stats.withCiteScore}</div>
              <div className="text-xs text-gray-600 font-medium">CiteScore</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-red-800">{stats.withPredatory}</div>
              <div className="text-xs text-gray-600 font-medium">Predatórios</div>
            </div>
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
              onClick={() => handlePresetFilter('qualis-mb')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
            >
              🥇 Qualis MB
            </button>
            <button
              onClick={() => handlePresetFilter('qualis-b')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              🥈 Qualis B
            </button>
            <button
              onClick={() => handlePresetFilter('wiley-only')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm"
            >
              📚 Apenas Wiley
            </button>
            <button
              onClick={() => setExcludePredatory(!excludePredatory)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-colors text-sm ${
                excludePredatory 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚫 Excluir Predatórios
            </button>
            <button
              onClick={() => {
                clearAllFilters();
                setExcludePredatory(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              🔄 Limpar Filtros
            </button>
          </div>
        </div>

        {/* Controles de Busca e Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

            {/* Filtro SJR Quartil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SJR Quartil
              </label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filterSJR}
                onChange={(e) => setFilterSJR(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
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
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {showStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas Detalhadas do Banco de Dados
            </h3>
            
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                <div className="text-xs text-indigo-700 font-medium">Total Journals</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{stats.withABDC}</div>
                <div className="text-xs text-blue-700 font-medium">Com ABDC</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{stats.withABS}</div>
                <div className="text-xs text-green-700 font-medium">Com ABS</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{stats.withJCR}</div>
                <div className="text-xs text-purple-700 font-medium">Com JCR</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{stats.withSJR}</div>
                <div className="text-xs text-orange-700 font-medium">Com SJR</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{stats.withCiteScore}</div>
                <div className="text-xs text-red-700 font-medium">Com CiteScore</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{stats.withWiley}</div>
                <div className="text-xs text-yellow-700 font-medium">Com Wiley</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-lg border border-red-300">
                <div className="text-2xl font-bold text-red-800">{stats.withPredatory}</div>
                <div className="text-xs text-red-800 font-medium">Predatórios</div>
              </div>
            </div>
            
            {/* Distribuições por Classificação */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Distribuição ABDC */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  📊 Distribuição ABDC
                </h4>
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
                      <span className="font-medium text-gray-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Distribuição ABS */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  📈 Distribuição ABS
                </h4>
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
                      <span className="font-medium text-gray-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribuição SJR */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  🎯 Distribuição SJR
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.sjrDistribution || {}).map(([rating, count]) => (
                    <div key={rating} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rating === 'Q1' ? 'bg-green-100 text-green-800' :
                          rating === 'Q2' ? 'bg-blue-100 text-blue-800' :
                          rating === 'Q3' ? 'bg-yellow-100 text-yellow-800' :
                          rating === 'Q4' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rating}
                        </span>
                      </span>
                      <span className="font-medium text-gray-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualidade dos Journals */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  ⭐ Qualidade dos Journals
                </h4>
                <div className="space-y-2 mb-4">
                  {Object.entries(stats.dataQualityDistribution || {}).map(([quality, count]) => (
                    <div key={quality} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quality === 'high' ? 'bg-green-100 text-green-800' :
                          quality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {quality === 'high' ? 'Alta' : quality === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </span>
                      <span className="font-medium text-gray-700">{count}</span>
                    </div>
                  ))}
                </div>
                
                {/* Explicação da Qualidade */}
                <div className="border-t border-gray-200 pt-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Como é calculada:</h5>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span><strong>Alta:</strong> 3+ fontes de dados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span><strong>Média:</strong> 2 fontes de dados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span><strong>Baixa:</strong> 1 fonte de dados</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Fontes: ABDC, ABS, JCR, SJR, CiteScore, Wiley, Predatory
                  </p>
                </div>
              </div>

              {/* Cobertura por Base */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  📋 Cobertura por Base
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ABDC:</span>
                    <span className="font-medium">{((stats.withABDC / stats.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ABS:</span>
                    <span className="font-medium">{((stats.withABS / stats.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>JCR:</span>
                    <span className="font-medium">{((stats.withJCR / stats.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SJR:</span>
                    <span className="font-medium">{((stats.withSJR / stats.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CiteScore:</span>
                    <span className="font-medium">{((stats.withCiteScore / stats.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wiley:</span>
                    <span className="font-medium">{((stats.withWiley / stats.total) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Resumo Qualis */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  🏆 Resumo Qualis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        MB
                      </span>
                    </span>
                    <span className="font-medium text-gray-700">
                      {filteredData.filter(j => j.qualis === 'MB' || (j.abdc === 'A*' || j.abdc === 'A' || (j.abs && ['2', '3', '4', '4*'].includes(j.abs)) || j.jcr?.quartile === 'Q1' || j.sjr?.quartile === 'Q1')).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        B
                      </span>
                    </span>
                    <span className="font-medium text-gray-700">
                      {filteredData.filter(j => j.abdc === 'B' || j.abs === '1' || j.jcr?.quartile === 'Q2' || j.sjr?.quartile === 'Q2').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultados com novo componente */}
        <ResultsTable 
          data={excludePredatory ? filteredData.filter(journal => !journal.predatory?.isPredatory) : filteredData}
          searchTerm={searchTerm}
          maxDisplayed={100}
        />
      </div>

      {/* Click outside to close search history */}
      {showSearchHistory && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSearchHistory(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Footer Content with Images */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-6">
              
              {/* Left Side - Partner Logos */}
              <div className="flex justify-center lg:justify-start items-center gap-4">
                <a 
                  href="https://www.ufsm.br/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="/images/footer-logo-1.png" 
                    alt="UFSM" 
                    className="h-16 w-auto object-contain"
                  />
                </a>
                <a 
                  href="https://www.ufsm.br/cursos/pos-graduacao/santa-maria/ppgop/visibilidade-do-programa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="/images/footer-logo-2.png" 
                    alt="PPGOP UFSM" 
                    className="h-16 w-auto object-contain"
                  />
                </a>
              </div>

              {/* Center - Developer Info */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Desenvolvido por{' '}
                  <a 
                    href="https://www.linkedin.com/in/juliano-alves-66657b17/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Juliano Alves
                  </a>
                </p>
                <p className="text-sm text-gray-600">
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

              {/* Right Side - Sponsor Logo */}
              <div className="flex justify-center lg:justify-end items-center">
                <a 
                  href="http://dgp.cnpq.br/dgp/espelhogrupo/818170" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="/images/footer-sponsor.png" 
                    alt="CNPq" 
                    className="h-20 w-auto object-contain"
                  />
                </a>
              </div>
            </div>

            {/* Data Sources Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 text-center">
                Fontes de Dados e Atualizações
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                <div className="space-y-2">
                  <div>
                    <strong className="text-gray-800">JCR - Categorias Selecionadas:</strong>
                    <div className="mt-1 leading-relaxed">
                      Management, Business, Finance, Economics, Public Administration, 
                      Industrial Relations & Labor, Humanities, Multidisciplinary, 
                      Transportation Science & Technology, Information Science & Library Science, 
                      Green & Sustainable Science & Technology, Engineering - Industrial, 
                      Engineering - Manufacturing, Computer Science - Artificial Intelligence
                    </div>
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">SJR - 2024:</strong> Atualizado em 07/2025
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">ABDC:</strong> Atualização 2022 - 2025 previsto Outubro 2025
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <strong className="text-gray-800">CiteScore - Scopus:</strong> 2024
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">Wiley:</strong> Termo convênio Capes 2025
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">ABS - 2024:</strong> Atualizado em 07/2025
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">Predatório:</strong> The Predatory Journals List 
                    (<a 
                      href="https://www.predatoryjournals.org/the-list/journals" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      predatoryjournals.org
                    </a>)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Performance Monitor removido */}
    </div>
  );
};

export default JournalSearchApp;