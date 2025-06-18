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
  const [showStats, setShowStats] = useState(false);

  /**
   * Carrega dados embarcados
   */
  useEffect(() => {
    const loadEmbeddedData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Carregar dados embarcados de forma síncrona para máxima performance
        let embeddedData;
        
        try {
          // Tentar importação dinâmica primeiro
          const module = await import('../src/data/embeddedJournals.js');
          embeddedData = module.EMBEDDED_JOURNALS_DATA || module.default;
        } catch (importError) {
          console.warn('Importação dinâmica falhou, tentando importação estática...');
          
          // Fallback: importação estática
          try {
            const { EMBEDDED_JOURNALS_DATA } = await import('../src/data/embeddedJournals.js');
            embeddedData = EMBEDDED_JOURNALS_DATA;
          } catch (staticError) {
            throw new Error('Dados embarcados não encontrados. Execute: npm run generate-data');
          }
        }
        
        if (embeddedData && embeddedData.data) {
          console.log('⚡ Carregando dados embarcados (instantâneo)');
          console.log(`📊 Total de journals: ${embeddedData.data.length}`);
          
          setJournalsData(embeddedData.data);
          setStats(embeddedData.stats || {
            total: embeddedData.data.length,
            withABDC: embeddedData.data.filter(j => j.abdc).length,
            withABS: embeddedData.data.filter(j => j.abs).length,
            withWiley: embeddedData.data.filter(j => j.wileySubject).length,
            abdcDistribution: {},
            absDistribution: {}
          });
          
          setIsLoading(false);
          return;
        }
        
        throw new Error('Formato de dados inválido');

      } catch (err) {
        console.error('Erro ao carregar dados embarcados:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

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
      
      // Filtro Wiley (apenas journals com dados Wiley)
      const matchesWiley = !filterWiley || journal.wileySubject !== '';
      
      return matchesSearch && matchesABDC && matchesABS && matchesWiley;
    });
  }, [journalsData, searchTerm, filterABDC, filterABS, filterWiley]);

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
