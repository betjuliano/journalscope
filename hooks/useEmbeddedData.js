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
  const [issnSearch, setIssnSearch] = useState('');
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
   * Valida formato ISSN XXXX-XXXX
   */
  const isValidISSNFormat = useCallback((issn) => {
    return /^\d{4}-\d{3}[0-9X]$/.test(issn);
  }, []);

  /**
   * Normaliza ISSN para busca
   */
  const normalizeISSNForSearch = useCallback((issn) => {
    if (!issn) return '';
    return issn.toString().replace(/[^0-9X]/g, '').toUpperCase();
  }, []);

  /**
   * Termo de busca processado
   */
  const processedSearchTerm = useMemo(() => {
    return searchTerm ? searchTerm.toLowerCase().trim() : '';
  }, [searchTerm]);

  /**
   * ISSN de busca processado
   */
  const processedIssnSearch = useMemo(() => {
    return issnSearch ? normalizeISSNForSearch(issnSearch) : '';
  }, [issnSearch, normalizeISSNForSearch]);

  /**
   * Dados filtrados com otimização simples
   */
  const filteredData = useMemo(() => {
    if (!journalsData || journalsData.length === 0) return [];

    const startTime = performance.now();
    
    const filtered = journalsData.filter(journal => {
      // Filtro de busca por nome
      if (processedSearchTerm && !journal.journal.toLowerCase().includes(processedSearchTerm)) {
        return false;
      }
      
      // Filtro de busca por ISSN
      if (processedIssnSearch) {
        const journalIssn = normalizeISSNForSearch(journal.issn || '');
        if (!journalIssn.includes(processedIssnSearch)) {
          return false;
        }
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
  }, [journalsData, processedSearchTerm, processedIssnSearch, filterABDC, filterABS, filterSJR, filterWiley, normalizeISSNForSearch]);

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

    // Normalização e validação de ISSN
    const normalizeISSN = (issn) => (issn || '').toUpperCase().trim();
    const isValidISSN = (issn) => {
      const s = normalizeISSN(issn);
      const m = s.match(/^\d{4}-\d{3}[0-9X]$/);
      if (!m) return false;
      const digits = s.replace('-', '').split('');
      const weights = [8,7,6,5,4,3,2];
      let sum = 0;
      for (let i = 0; i < 7; i++) sum += parseInt(digits[i], 10) * weights[i];
      const remainder = sum % 11;
      const check = (11 - remainder);
      const checkChar = check === 10 ? 'X' : (check === 11 ? '0' : String(check));
      return digits[7] === checkChar;
    };

    // Deduplicar por ISSN válido
    const uniqueByIssn = new Map();
    const aggregated = [];
    for (const j of filteredData) {
      const issn = normalizeISSN(j.issn);
      const key = isValidISSN(issn) ? issn : null;
      if (key && !uniqueByIssn.has(key)) {
        uniqueByIssn.set(key, j);
        aggregated.push(j);
      }
      if (!key) {
        // sem ISSN válido, contar individualmente
        aggregated.push(j);
      }
    }

    const stats = {
      total: aggregated.length,
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

    aggregated.forEach(journal => {
      if (journal.abdc) stats.withABDC++;
      if (journal.abs) stats.withABS++;
      if (journal.wileySubject) stats.withWiley++;
      if (journal.sjr) stats.withSJR++;
      if (journal.jcr) stats.withJCR++;
      if (journal.citeScore) stats.withCiteScore++;
      if (journal.predatory) stats.withPredatory++;

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
    setIssnSearch('');
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
    setIssnSearch('');
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
    issnSearch,
    setIssnSearch,
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
    
    // Funções de ISSN
    isValidISSNFormat,
    normalizeISSNForSearch,
    
    // Funções de filtros
    clearAllFilters,
    applyPresetFilter,
    
    // Funções de dados
    reloadData,
    
    // Utilitários
    hasFiltersApplied: !!(searchTerm || issnSearch || filterABDC || filterABS || filterWiley),
    isEmpty: !journalsData || journalsData.length === 0,
    hasResults: filteredData && filteredData.length > 0,
    isEmbedded: true
  };
};

export default useEmbeddedData;