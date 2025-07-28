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
import SimpleResultsTable from './SimpleResultsTable';
import LanguageToggle from './LanguageToggle';
import { useI18n } from '../contexts/I18nContext';

const JournalSearchApp = () => {
  // I18n context
  const { t, language } = useI18n();
  
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
    if (term.trim() && searchHistory && !searchHistory.includes(term)) {
      const newHistory = [term, ...(searchHistory || []).slice(0, 9)];
      setSearchHistory(newHistory);
      localStorage.setItem('journalSearchHistory', JSON.stringify(newHistory));
    }
  };

  // Exportação com Excel
  const handleExportExcel = async (data) => {
    try {
      await exportAsExcel(data || filteredData || [], null, { includeStats: true });
    } catch (error) {
      alert(`Erro na exportação: ${error.message}`);
    }
  };

  const handleExportCSV = (data) => {
    exportToCSV(data || filteredData || []);
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
    <div className="journalscope-container min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="hero-section text-center mb-8 relative">
          {/* Language Toggle - positioned in top-right */}
          <div className="absolute top-0 right-0">
            <LanguageToggle position="hero" />
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <Database className="h-10 w-10 text-indigo-600" />
            <h1 className="hero-title">
              JournalScope
            </h1>
          </div>
          <div className="max-w-3xl mx-auto mb-6">
            <p className="hero-subtitle">
              {t('hero.subtitle')}
            </p>
            <p className="hero-description">
              {t('hero.description')}
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 max-w-5xl mx-auto mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
              <div className="text-xs text-gray-600 font-medium">{t('stats.totalJournals')}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-blue-600">{stats.withABDC}</div>
              <div className="text-xs text-gray-600 font-medium">{t('stats.withABDC')}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-green-600">{stats.withABS}</div>
              <div className="text-xs text-gray-600 font-medium">{t('stats.withABS')}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-purple-600">{stats.withJCR}</div>
              <div className="text-xs text-gray-600 font-medium">{t('stats.withJCR')}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-orange-600">{stats.withSJR}</div>
              <div className="text-xs text-gray-600 font-medium">{t('stats.withSJR')}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-red-600">{stats.withCiteScore}</div>
              <div className="text-xs text-gray-600 font-medium">{t('stats.withCiteScore')}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20">
              <div className="text-2xl font-bold text-red-800">{stats.withPredatory}</div>
              <div className="text-xs text-gray-600 font-medium">{t('stats.withPredatory')}</div>
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
              {t('filters.quickFilters.topTier')}
            </button>
            <button
              onClick={() => handlePresetFilter('high-quality')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              {t('filters.quickFilters.highQuality')}
            </button>
            <button
              onClick={() => handlePresetFilter('qualis-mb')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
            >
              {t('filters.quickFilters.qualisMB')}
            </button>
            <button
              onClick={() => handlePresetFilter('qualis-b')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              {t('filters.quickFilters.qualisB')}
            </button>
            <button
              onClick={() => handlePresetFilter('wiley-only')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm"
            >
              {t('filters.quickFilters.wileyOnly')}
            </button>
            <button
              onClick={() => setExcludePredatory(!excludePredatory)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-colors text-sm ${
                excludePredatory 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('filters.quickFilters.excludePredatory')}
            </button>
            <button
              onClick={() => {
                clearAllFilters();
                setExcludePredatory(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              {t('filters.quickFilters.clearFilters')}
            </button>
          </div>
        </div>

        {/* Controles de Busca e Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Campo de Busca com Histórico */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('filters.search.label')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('filters.search.placeholder')}
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
                {showSearchHistory && searchHistory && searchHistory.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-100 text-xs text-gray-500 font-medium">
                      {t('filters.search.history')}
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
                {t('labels.abdcClassification')}
              </label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filterABDC}
                onChange={(e) => setFilterABDC(e.target.value)}
              >
                <option value="">{t('labels.all')}</option>
                <option value="A*">A*</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            {/* Filtro ABS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('labels.absClassification')}
              </label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filterABS}
                onChange={(e) => setFilterABS(e.target.value)}
              >
                <option value="">{t('labels.all')}</option>
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
                {t('labels.sjrQuartile')}
              </label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filterSJR}
                onChange={(e) => setFilterSJR(e.target.value)}
              >
                <option value="">{t('labels.allQuartiles')}</option>
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
                <span className="text-sm">{t('labels.wileyOnly')}</span>
              </label>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                >
                  <BarChart3 className="h-3 w-3" />
                  {t('filters.stats.label')}
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
              {t('statsPanel.title')}
            </h3>
            
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                <div className="text-xs text-indigo-700 font-medium">{t('statsPanel.general.total')}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{stats.withABDC}</div>
                <div className="text-xs text-blue-700 font-medium">{t('statsPanel.general.withABDC')}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{stats.withABS}</div>
                <div className="text-xs text-green-700 font-medium">{t('statsPanel.general.withABS')}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{stats.withJCR}</div>
                <div className="text-xs text-purple-700 font-medium">{t('statsPanel.general.withJCR')}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{stats.withSJR}</div>
                <div className="text-xs text-orange-700 font-medium">{t('statsPanel.general.withSJR')}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{stats.withCiteScore}</div>
                <div className="text-xs text-red-700 font-medium">{t('statsPanel.general.withCiteScore')}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{stats.withWiley}</div>
                <div className="text-xs text-yellow-700 font-medium">{t('stats.withWiley')}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-lg border border-red-300">
                <div className="text-2xl font-bold text-red-800">{stats.withPredatory}</div>
                <div className="text-xs text-red-800 font-medium">{t('statsPanel.general.withPredatory')}</div>
              </div>
            </div>
            
            {/* Distributions by Classification */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Distribuição ABDC */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  {t('statsPanel.distributions.abdc')}
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
                  {t('statsPanel.distributions.abs')}
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
                  {t('statsPanel.distributions.sjr')}
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
                  {t('statsPanel.distributions.quality')}
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
                          {quality === 'high' ? t('statsPanel.quality.high') : quality === 'medium' ? t('statsPanel.quality.medium') : t('statsPanel.quality.low')}
                        </span>
                      </span>
                      <span className="font-medium text-gray-700">{count}</span>
                    </div>
                  ))}
                </div>
                
                {/* Explicação da Qualidade */}
                <div className="border-t border-gray-200 pt-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">{t('statsPanel.quality.explanation')}</h5>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span><strong>{t('statsPanel.quality.high')}:</strong> {t('statsPanel.quality.highDesc')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span><strong>{t('statsPanel.quality.medium')}:</strong> {t('statsPanel.quality.mediumDesc')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span><strong>{t('statsPanel.quality.low')}:</strong> {t('statsPanel.quality.lowDesc')}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {t('statsPanel.quality.sources')}
                  </p>
                </div>
              </div>

              {/* Cobertura por Base */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  {t('statsPanel.distributions.coverage')}
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
                  {t('statsPanel.distributions.qualis')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        MB
                      </span>
                    </span>
                    <span className="font-medium text-gray-700">
                      {filteredData ? filteredData.filter(j => j.qualis === 'MB' || (j.abdc === 'A*' || j.abdc === 'A' || (j.abs && ['2', '3', '4', '4*'].includes(j.abs)) || j.jcr?.quartile === 'Q1' || j.sjr?.quartile === 'Q1')).length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        B
                      </span>
                    </span>
                    <span className="font-medium text-gray-700">
                      {filteredData ? filteredData.filter(j => j.abdc === 'B' || j.abs === '1' || j.jcr?.quartile === 'Q2' || j.sjr?.quartile === 'Q2').length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultados com tabela simples e funcional */}
        <SimpleResultsTable 
          data={excludePredatory ? (filteredData || []).filter(journal => !journal.predatory?.isPredatory) : (filteredData || [])}
          searchTerm={searchTerm}
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
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
                  {t('footer.developedBy')}{' '}
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
                {t('dataSources.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                <div className="space-y-2">
                  <div>
                    <strong className="text-gray-800">{t('dataSources.jcr')} - {t('categories.selectedCategories')}</strong>
                    <div className="mt-1 leading-relaxed">
                      Management, Business, Finance, Economics, Public Administration, 
                      Industrial Relations & Labor, Humanities, Multidisciplinary, 
                      Transportation Science & Technology, Information Science & Library Science, 
                      Green & Sustainable Science & Technology, Engineering - Industrial, 
                      Engineering - Manufacturing, Computer Science - Artificial Intelligence
                    </div>
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">{t('dataSources.sjr')}:</strong> {t('dataSources.updatedOn')} 07/2025
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">ABDC:</strong> {t('dataSources.abdc')}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <strong className="text-gray-800">{t('dataSources.citeScore')}:</strong> 2024
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">Wiley:</strong> {t('dataSources.wiley')}
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">{t('dataSources.abs')}:</strong> {t('dataSources.updatedOn')} 07/2025
                  </div>
                  
                  <div>
                    <strong className="text-gray-800">{t('footer.predatory')}:</strong> The Predatory Journals List 
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