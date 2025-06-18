import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  RotateCcw, 
  Crown, 
  Star, 
  BookOpen, 
  Award, 
  Trophy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  filterABDC,
  setFilterABDC,
  filterABS,
  setFilterABS,
  filterWiley,
  setFilterWiley,
  onClearFilters,
  onApplyPreset,
  stats = {},
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // Carregar histórico de buscas do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('journalscope_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.warn('Erro ao carregar histórico de buscas:', error);
      }
    }
  }, []);

  // Salvar busca no histórico
  const saveToHistory = (term) => {
    if (!term || term.length < 2) return;
    
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('journalscope_search_history', JSON.stringify(newHistory));
  };

  // Handle da busca
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value && value.length >= 2) {
      setShowSearchHistory(true);
    } else {
      setShowSearchHistory(false);
    }
  };

  // Handle do Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm) {
      saveToHistory(searchTerm);
      setShowSearchHistory(false);
    }
  };

  // Selecionar do histórico
  const selectFromHistory = (term) => {
    setSearchTerm(term);
    setShowSearchHistory(false);
    saveToHistory(term);
  };

  // Limpar histórico
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('journalscope_search_history');
    setShowSearchHistory(false);
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm || filterABDC || filterABS || filterWiley;

  // Presets de filtros
  const filterPresets = [
    {
      id: 'top-tier',
      name: 'Top Tier',
      description: 'A* + 4*',
      icon: Crown,
      color: 'green',
      filters: { abdc: 'A*', abs: '4*' }
    },
    {
      id: 'high-quality',
      name: 'Alta Qualidade',
      description: 'A + 4',
      icon: Star,
      color: 'blue',
      filters: { abdc: 'A', abs: '4' }
    },
    {
      id: 'wiley-only',
      name: 'Apenas Wiley',
      description: 'Todos da Wiley',
      icon: BookOpen,
      color: 'purple',
      filters: { wiley: true }
    },
    {
      id: 'abdc-a-star',
      name: 'ABDC A*',
      description: 'Elite ABDC',
      icon: Award,
      color: 'emerald',
      filters: { abdc: 'A*' }
    },
    {
      id: 'abs-four-star',
      name: 'ABS 4*',
      description: 'Elite ABS',
      icon: Trophy,
      color: 'yellow',
      filters: { abs: '4*' }
    }
  ];

  // Componente de preset button
  const PresetButton = ({ preset }) => (
    <button
      onClick={() => onApplyPreset && onApplyPreset(preset.id)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-${preset.color}-200 bg-${preset.color}-50 hover:bg-${preset.color}-100 text-${preset.color}-700 transition-colors text-sm`}
      title={`Filtrar por ${preset.description}`}
    >
      <preset.icon className="h-4 w-4" />
      <div className="text-left">
        <div className="font-medium">{preset.name}</div>
        <div className="text-xs opacity-75">{preset.description}</div>
      </div>
    </button>
  );

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header dos filtros */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filtros de Busca</h3>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Ativos
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="h-4 w-4" />
                Limpar
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title={isExpanded ? 'Recolher filtros' : 'Expandir filtros'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros Rápidos (sempre visíveis) */}
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtros Rápidos
          </label>
          <div className="flex flex-wrap gap-2">
            {filterPresets.map((preset) => (
              <PresetButton key={preset.id} preset={preset} />
            ))}
          </div>
        </div>

        {/* Campo de Busca Principal */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Journal
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Digite o nome do journal..."
              className="input pl-10 pr-10"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchHistory.length > 0 && setShowSearchHistory(true)}
              onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowSearchHistory(false);
                }}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Histórico de buscas */}
          {showSearchHistory && searchHistory.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Buscas Recentes</span>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Limpar
                </button>
              </div>
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => selectFromHistory(term)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Search className="h-3 w-3 text-gray-400" />
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtros Avançados (expansível) */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-slide-up">
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro ABDC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classificação ABDC
                  {stats.withABDC && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({stats.withABDC} journals)
                    </span>
                  )}
                </label>
                <select
                  className="select"
                  value={filterABDC}
                  onChange={(e) => setFilterABDC(e.target.value)}
                >
                  <option value="">Todas as classificações</option>
                  <option value="A*">
                    A* - Elite ({stats.abdcDistribution?.['A*'] || 0})
                  </option>
                  <option value="A">
                    A - Excelente ({stats.abdcDistribution?.['A'] || 0})
                  </option>
                  <option value="B">
                    B - Boa ({stats.abdcDistribution?.['B'] || 0})
                  </option>
                  <option value="C">
                    C - Aceitável ({stats.abdcDistribution?.['C'] || 0})
                  </option>
                </select>
              </div>

              {/* Filtro ABS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classificação ABS
                  {stats.withABS && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({stats.withABS} journals)
                    </span>
                  )}
                </label>
                <select
                  className="select"
                  value={filterABS}
                  onChange={(e) => setFilterABS(e.target.value)}
                >
                  <option value="">Todas as classificações</option>
                  <option value="4*">
                    4* - Classe mundial ({stats.absDistribution?.['4*'] || 0})
                  </option>
                  <option value="4">
                    4 - Alta qualidade ({stats.absDistribution?.['4'] || 0})
                  </option>
                  <option value="3">
                    3 - Boa qualidade ({stats.absDistribution?.['3'] || 0})
                  </option>
                  <option value="2">
                    2 - Reconhecida ({stats.absDistribution?.['2'] || 0})
                  </option>
                  <option value="1">
                    1 - Modesta ({stats.absDistribution?.['1'] || 0})
                  </option>
                </select>
              </div>

              {/* Filtros Adicionais */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtros Adicionais
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                      checked={filterWiley}
                      onChange={(e) => setFilterWiley(e.target.checked)}
                    />
                    <span className="text-sm">
                      Apenas Wiley
                      {stats.withWiley && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({stats.withWiley} journals)
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Resumo dos filtros ativos */}
            {hasActiveFilters && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filtros ativos:</span>
                    <div className="flex flex-wrap gap-1">
                      {searchTerm && (
                        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                          Busca: "{searchTerm}"
                        </span>
                      )}
                      {filterABDC && (
                        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                          ABDC: {filterABDC}
                        </span>
                      )}
                      {filterABS && (
                        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                          ABS: {filterABS}
                        </span>
                      )}
                      {filterWiley && (
                        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                          Apenas Wiley
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={onClearFilters}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    Limpar todos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
