import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Hook simplificado para dados embarcados
 * Versão estável focada em funcionalidade básica
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
    withSJR: 0,
    withJCR: 0,
    withCiteScore: 0,
    withPredatory: 0,
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
   * Carrega dados embarcados de forma lazy para otimizar bundle inicial
   */
  useEffect(() => {
    const loadEmbeddedData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import para carregar dados apenas quando necessário
        const { EMBEDDED_JOURNALS_DATA } = await import('../src/data/embeddedJournals.js');
        
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
          throw new Error('Dados embarcados não encontrados');
        }
      } catch (err) {
        console.error('Erro ao carregar dados embarcados:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadEmbeddedData();
  }, []);

  /**
   * Termo de busca processado
   */
  const processedSearchTerm = useMemo(() => {
    return searchTerm ? searchTerm.toLowerCase().trim() : '';
  }, [searchTerm]);

  /**
   * Dados filtrados com otimização simples
   */
  const filteredData = useMemo(() => {
    if (!journalsData || journalsData.length === 0) return [];

    const startTime = performance.now();
    
    const filtered = journalsData.filter(journal => {
      // Filtro de busca
      if (processedSearchTerm && !journal.journal.toLowerCase().includes(processedSearchTerm)) {
        return false;
      }
      
      // Filtros específicos
      if (filterABDC && journal.abdc !== filterABDC) return false;
      if (filterABS && journal.abs !== filterABS) return false;
      if (filterSJR && journal.sjr?.quartile !== filterSJR) return false;
      if (filterWiley && !journal.wileySubject) return false;
      
      return true;
    });

    const filterTime = performance.now() - startTime;
    
    if (import.meta.env.DEV) {
      console.log(`🔍 Filtro aplicado em ${filterTime.toFixed(2)}ms para ${journalsData.length} journals`);
      console.log(`📊 Resultados: ${filtered.length}/${journalsData.length} (${((filtered.length / journalsData.length) * 100).toFixed(1)}%)`);
    }

    return filtered;
  }, [journalsData, processedSearchTerm, filterABDC, filterABS, filterSJR, filterWiley]);

  /**
   * Estatísticas dos dados filtrados
   */
  const filteredStats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        total: 0,
        withABDC: 0,
        withABS: 0,
        withWiley: 0,
        withSJR: 0,
        withJCR: 0,
        withCiteScore: 0,
        withPredatory: 0,
        abdcDistribution: {},
        absDistribution: {}
      };
    }

    const stats = {
      total: filteredData.length,
      withABDC: 0,
      withABS: 0,
      withWiley: 0,
      withSJR: 0,
      withJCR: 0,
      withCiteScore: 0,
      withPredatory: 0,
      abdcDistribution: {},
      absDistribution: {}
    };
    
    filteredData.forEach(journal => {
      if (journal.abdc) stats.withABDC++;
      if (journal.abs) stats.withABS++;
      if (journal.wileySubject) stats.withWiley++;
      if (journal.sjr) stats.withSJR++;
      if (journal.jcr) stats.withJCR++;
      if (journal.citeScore) stats.withCiteScore++;
      if (journal.predatory) stats.withPredatory++;
      
      // Distribuições
      if (journal.abdc) {
        stats.abdcDistribution[journal.abdc] = (stats.abdcDistribution[journal.abdc] || 0) + 1;
      }
      if (journal.abs) {
        stats.absDistribution[journal.abs] = (stats.absDistribution[journal.abs] || 0) + 1;
      }
    });
    
    return stats;
  }, [filteredData]);

  /**
   * Busca journal específico por nome exato
   */
  const findJournalByName = useCallback((journalName) => {
    if (!journalName || !journalsData || journalsData.length === 0) return null;
    
    const normalizedName = journalName.toLowerCase().trim();
    return journalsData.find(journal => 
      journal.journal.toLowerCase() === normalizedName
    );
  }, [journalsData]);

  /**
   * Busca journals similares
   */
  const findSimilarJournals = useCallback((journalName, limit = 5) => {
    if (!journalName || !journalsData || journalsData.length === 0) return [];
    
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
    
    if (!dataToExport || dataToExport.length === 0) {
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
        `"${row.wileySubject?.replace(/"/g, '""') || 'N/A'}"`,
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
    // Limpar filtros primeiro
    setSearchTerm('');
    setFilterABDC('');
    setFilterABS('');
    setFilterWiley(false);
    setFilterSJR('');
    
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
        setFilterABDC('A*');
        break;
      case 'qualis-b':
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
  }, []);

  /**
   * Recarrega dados
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
    journalsData: journalsData || [],
    filteredData: filteredData || [],
    isLoading,
    error,
    stats,
    filteredStats,
    
    // Estados dos filtros
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
    
    // Funções de busca
    findJournalByName,
    findSimilarJournals,
    exportToCSV,
    
    // Funções de filtros
    clearAllFilters,
    applyPresetFilter,
    
    // Funções de dados
    reloadData,
    
    // Utilitários
    hasFiltersApplied: !!(searchTerm || filterABDC || filterABS || filterWiley),
    isEmpty: !journalsData || journalsData.length === 0,
    hasResults: filteredData && filteredData.length > 0,
    isEmbedded: true
  };
};

export default useEmbeddedData;