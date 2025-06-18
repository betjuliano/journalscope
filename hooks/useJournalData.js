import { useState, useEffect, useMemo, useCallback } from 'react';
import useDataProcessor from './useDataProcessor';

/**
 * Hook principal para gerenciar dados de journals, filtros e funcionalidades
 * Centraliza toda a lógica de estado da aplicação
 */
const useJournalData = () => {
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterABDC, setFilterABDC] = useState('');
  const [filterABS, setFilterABS] = useState('');
  const [filterWiley, setFilterWiley] = useState(false);
  
  // Estados dos dados
  const [journalsData, setJournalsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados da UI
  const [showStats, setShowStats] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  
  // Hook do processador de dados
  const {
    isProcessing,
    processingStatus,
    processingError,
    dataSource,
    processAllData,
    clearCacheAndReprocess,
    checkFilesAvailability
  } = useDataProcessor();

  /**
   * Carrega dados iniciais
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await processAllData();
        setJournalsData(data);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [processAllData]);

  /**
   * Atualiza estado de loading baseado no processamento
   */
  useEffect(() => {
    setIsLoading(isProcessing);
    if (processingError) {
      setError(processingError);
    }
  }, [isProcessing, processingError]);

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
   * Estatísticas dos dados
   */
  const stats = useMemo(() => {
    if (!journalsData.length) {
      return {
        total: 0,
        withABDC: 0,
        withABS: 0,
        withWiley: 0,
        abdcDistribution: {},
        absDistribution: {},
        filteredCount: 0
      };
    }

    const total = journalsData.length;
    const withABDC = journalsData.filter(j => j.abdc).length;
    const withABS = journalsData.filter(j => j.abs).length;
    const withWiley = journalsData.filter(j => j.wileySubject).length;
    
    // Distribuição por classificação
    const abdcDistribution = {};
    const absDistribution = {};
    
    journalsData.forEach(j => {
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
      absDistribution,
      filteredCount: filteredData.length
    };
  }, [journalsData, filteredData.length]);

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
  const exportToCSV = useCallback((filename = 'journal_classifications') => {
    if (!filteredData.length) {
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
      ...filteredData.map(row => [
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
   * Exporta estatísticas para JSON
   */
  const exportStatsToJSON = useCallback(() => {
    const statsData = {
      exportDate: new Date().toISOString(),
      totalJournals: stats.total,
      filteredJournals: stats.filteredCount,
      dataSource: dataSource,
      filters: {
        searchTerm,
        filterABDC,
        filterABS,
        filterWiley
      },
      statistics: {
        overall: stats,
        filtered: filteredStats
      }
    };
    
    const jsonBlob = new Blob([JSON.stringify(statsData, null, 2)], {
      type: 'application/json'
    });
    
    const url = window.URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journalscope_stats_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return true;
  }, [stats, filteredStats, dataSource, searchTerm, filterABDC, filterABS, filterWiley]);

  /**
   * Limpa todos os filtros
   */
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterABDC('');
    setFilterABS('');
    setFilterWiley(false);
    setSelectedJournal(null);
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
   * Recarrega dados dos arquivos
   */
  const reloadData = useCallback(async () => {
    try {
      setError(null);
      const data = await clearCacheAndReprocess();
      setJournalsData(data);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [clearCacheAndReprocess]);

  /**
   * Verifica status dos arquivos
   */
  const checkDataFiles = useCallback(async () => {
    try {
      const fileStatus = await checkFilesAvailability();
      return fileStatus;
    } catch (err) {
      console.error('Erro ao verificar arquivos:', err);
      return null;
    }
  }, [checkFilesAvailability]);

  return {
    // Estados dos dados
    journalsData,
    filteredData,
    isLoading,
    error,
    processingStatus,
    dataSource,
    
    // Estados dos filtros
    searchTerm,
    filterABDC,
    filterABS,
    filterWiley,
    selectedJournal,
    
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
    setSelectedJournal,
    setShowStats,
    
    // Funções de busca
    findJournalByName,
    findSimilarJournals,
    
    // Funções de exportação
    exportToCSV,
    exportStatsToJSON,
    
    // Funções de filtros
    clearAllFilters,
    applyPresetFilter,
    
    // Funções de dados
    reloadData,
    checkDataFiles,
    
    // Utilitários
    hasFiltersApplied: !!(searchTerm || filterABDC || filterABS || filterWiley),
    isEmpty: journalsData.length === 0,
    hasResults: filteredData.length > 0
  };
};

export default useJournalData;
