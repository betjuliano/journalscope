import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Hook otimizado para dados embarcados
 * Carregamento instantâneo sem processamento de Excel
 */
const useEmbeddedData = () => {
  const [journalsData, setJournalsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    withABDC: 0,
    withABS: 0,
    withWiley: 0,
    abdcDistribution: {},
    absDistribution: {}
  });

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterABDC, setFilterABDC] = useState('');
  const [filterABS, setFilterABS] = useState('');
  const [filterWiley, setFilterWiley] = useState(false);
  const [filterSJR, setFilterSJR] = useState('');
  const [showStats, setShowStats] = useState(false);

  /**
   * Carrega dados embarcados de forma síncrona e instantânea
   */
  useEffect(() => {
    const loadEmbeddedData = () => {
      try {
        setIsLoading(true);
        setError(null);

        // Importação síncrona dos dados embarcados para máxima performance
        import('../src/data/embeddedJournals.js')
          .then(({ EMBEDDED_JOURNALS_DATA }) => {
            if (EMBEDDED_JOURNALS_DATA && EMBEDDED_JOURNALS_DATA.data) {
              console.log('⚡ Dados embarcados carregados instantaneamente');
              console.log(`📊 Total de journals: ${EMBEDDED_JOURNALS_DATA.data.length}`);
              console.log(`📅 Gerado em: ${EMBEDDED_JOURNALS_DATA.generatedAt}`);
              
              setJournalsData(EMBEDDED_JOURNALS_DATA.data);
              setStats(EMBEDDED_JOURNALS_DATA.stats || {
                total: EMBEDDED_JOURNALS_DATA.data.length,
                withABDC: EMBEDDED_JOURNALS_DATA.data.filter(j => j.abdc).length,
                withABS: EMBEDDED_JOURNALS_DATA.data.filter(j => j.abs).length,
                withWiley: EMBEDDED_JOURNALS_DATA.data.filter(j => j.wileySubject).length,
                withSJR: EMBEDDED_JOURNALS_DATA.data.filter(j => j.sjr).length,
                withJCR: EMBEDDED_JOURNALS_DATA.data.filter(j => j.jcr).length,
                withCiteScore: EMBEDDED_JOURNALS_DATA.data.filter(j => j.citeScore).length,
                withPredatory: EMBEDDED_JOURNALS_DATA.data.filter(j => j.predatory).length,
                abdcDistribution: {},
                absDistribution: {}
              });
              
              setIsLoading(false);
            } else {
              throw new Error('Dados embarcados não encontrados ou formato inválido');
            }
          })
          .catch((importError) => {
            console.error('Erro ao carregar dados embarcados:', importError);
            setError('Dados embarcados não encontrados. Os dados estáticos não foram gerados corretamente.');
            setIsLoading(false);
          });

      } catch (err) {
        console.error('Erro crítico ao carregar dados:', err);
        setError('Erro crítico no carregamento dos dados embarcados.');
        setIsLoading(false);
      }
    };

    // Carregamento imediato sem delay
    loadEmbeddedData();
  }, []);

  /**
   * Dados filtrados baseado nos critérios de busca
   */
  const filteredData = useMemo(() => {
    if (!journalsData.length) return [];

    return journalsData.filter(journal => {
      // Filtro de busca por nome
      const matchesSearch = !searchTerm || 
        journal.journal.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro ABDC
      const matchesABDC = !filterABDC || journal.abdc === filterABDC;
      
      // Filtro ABS
      const matchesABS = !filterABS || journal.abs === filterABS;
      
      // Filtro SJR
      const matchesSJR = !filterSJR || journal.sjr?.quartile === filterSJR;
      
      // Filtro Wiley (apenas journals com dados Wiley)
      const matchesWiley = !filterWiley || journal.wileySubject !== '';
      
      return matchesSearch && matchesABDC && matchesABS && matchesSJR && matchesWiley;
    });
  }, [journalsData, searchTerm, filterABDC, filterABS, filterSJR, filterWiley]);

  /**
   * Estatísticas dos dados filtrados
   */
  const filteredStats = useMemo(() => {
    if (!filteredData.length) {
      return {
        total: 0,
        withABDC: 0,
        withABS: 0,
        withWiley: 0,
        abdcDistribution: {},
        absDistribution: {}
      };
    }

    const total = filteredData.length;
    const withABDC = filteredData.filter(j => j.abdc).length;
    const withABS = filteredData.filter(j => j.abs).length;
    const withWiley = filteredData.filter(j => j.wileySubject).length;
    
    const abdcDistribution = {};
    const absDistribution = {};
    
    filteredData.forEach(j => {
      if (j.abdc) {
        abdcDistribution[j.abdc] = (abdcDistribution[j.abdc] || 0) + 1;
      }
      if (j.abs) {
        absDistribution[j.abs] = (absDistribution[j.abs] || 0) + 1;
      }
    });
    
    return {
      total,
      withABDC,
      withABS,
      withWiley,
      abdcDistribution,
      absDistribution
    };
  }, [filteredData]);

  /**
   * Busca journal específico por nome exato
   */
  const findJournalByName = useCallback((journalName) => {
    if (!journalName || !journalsData.length) return null;
    
    const normalizedName = journalName.toLowerCase().trim();
    return journalsData.find(journal => 
      journal.journal.toLowerCase() === normalizedName
    );
  }, [journalsData]);

  /**
   * Busca journals similares
   */
  const findSimilarJournals = useCallback((journalName, limit = 5) => {
    if (!journalName || !journalsData.length) return [];
    
    const normalizedName = journalName.toLowerCase().trim();
    const words = normalizedName.split(' ');
    
    return journalsData
      .filter(journal => {
        const journalWords = journal.journal.toLowerCase().split(' ');
        return words.some(word => 
          journalWords.some(jWord => jWord.includes(word) || word.includes(jWord))
        );
      })
      .slice(0, limit);
  }, [journalsData]);

  /**
   * Exporta dados filtrados para CSV
   */
  const exportToCSV = useCallback((customData = null, filename = 'journal_classifications') => {
    const dataToExport = customData || filteredData;
    
    if (!dataToExport.length) {
      throw new Error('Nenhum dado para exportar');
    }

    const headers = [
      'Journal',
      'Classificação ABDC',
      'Classificação ABS',
      'Área Wiley',
      'APC Wiley (USD)'
    ];
    
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => [
        `"${row.journal.replace(/"/g, '""')}"`,
        `"${row.abdc || 'N/A'}"`,
        `"${row.abs || 'N/A'}"`,
        `"${row.wileySubject.replace(/"/g, '""') || 'N/A'}"`,
        `"${row.wileyAPC || 'N/A'}"`
      ].join(','))
    ].join('\n');
    
    // Adicionar BOM para caracteres especiais
    const csvBlob = new Blob(['\ufeff' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const url = window.URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return true;
  }, [filteredData]);

  /**
   * Limpa todos os filtros
   */
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterABDC('');
    setFilterABS('');
    setFilterWiley(false);
    setFilterSJR('');
  }, []);

  /**
   * Aplica filtros predefinidos
   */
  const applyPresetFilter = useCallback((preset) => {
    clearAllFilters();
    
    switch (preset) {
      case 'top-tier':
        setFilterABDC('A*');
        setFilterABS('4*');
        break;
      case 'high-quality':
        setFilterABDC('A');
        setFilterABS('4');
        break;
      case 'qualis-mb':
        // Filtrar por critérios que geram Qualis MB
        // Pode ser A*/A na ABDC, ou 2+ no ABS, ou Q1 no SJR
        setFilterABDC('A*');
        break;
      case 'qualis-b':
        // Filtrar por critérios que geram Qualis B
        // Pode ser B na ABDC, ou 1 no ABS, ou Q2 no SJR
        setFilterABDC('B');
        break;
      case 'wiley-only':
        setFilterWiley(true);
        break;
      case 'abdc-only':
        setFilterABDC('A*');
        break;
      case 'abs-only':
        setFilterABS('4*');
        break;
      default:
        break;
    }
  }, [clearAllFilters]);

  /**
   * Recarrega dados (regenera dados embarcados)
   */
  const reloadData = useCallback(async () => {
    try {
      setError('Para atualizar os dados, execute: npm run generate-data');
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    // Estados dos dados
    journalsData,
    filteredData,
    isLoading,
    error,
    processingStatus: isLoading ? 'Carregando dados embarcados...' : 'Dados carregados ⚡',
    dataSource: {
      abdc: { count: stats.withABDC, loaded: !isLoading },
      abs: { count: stats.withABS, loaded: !isLoading },
      wiley: { count: stats.withWiley, loaded: !isLoading }
    },
    
    // Estados dos filtros
    searchTerm,
    filterABDC,
    filterABS,
    filterWiley,
    filterSJR,
    
    // Estados da UI
    showStats,
    
    // Estatísticas
    stats,
    filteredStats,
    
    // Setters dos filtros
    setSearchTerm,
    setFilterABDC,
    setFilterABS,
    setFilterWiley,
    setFilterSJR,
    setShowStats,
    
    // Funções de busca
    findJournalByName,
    findSimilarJournals,
    
    // Funções de exportação
    exportToCSV,
    
    // Funções de filtros
    clearAllFilters,
    applyPresetFilter,
    
    // Funções de dados
    reloadData,
    
    // Utilitários
    hasFiltersApplied: !!(searchTerm || filterABDC || filterABS || filterWiley),
    isEmpty: journalsData.length === 0,
    hasResults: filteredData.length > 0,
    isEmbedded: true // Indica que está usando dados embarcados
  };
};

export default useEmbeddedData;
