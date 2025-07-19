import { useState, useMemo } from 'react';

const useAdvancedFilters = (data = []) => {
  const [filters, setFilters] = useState({
    abdc: [],
    abs: [],
    qualis: [],
    sjrQuartile: [],
    jcrQuartile: [],
    predatory: null,
    hasWileyAPC: null,
    minCiteScore: null,
    maxCiteScore: null,
    minHIndex: null,
    maxHIndex: null,
    wileySubjects: []
  });

  // Aplicar filtros aos dados
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    return data.filter(journal => {
      // Filtro ABDC
      if (filters.abdc.length > 0 && !filters.abdc.includes(journal.abdc)) {
        return false;
      }

      // Filtro ABS
      if (filters.abs.length > 0 && !filters.abs.includes(journal.abs)) {
        return false;
      }

      // Filtro Qualis (calculado)
      if (filters.qualis.length > 0) {
        const qualis = calculateQualis(journal);
        if (!filters.qualis.includes(qualis)) {
          return false;
        }
      }

      // Filtro SJR Quartile
      if (filters.sjrQuartile.length > 0) {
        const sjrQuartile = journal.sjr?.quartile;
        if (!sjrQuartile || !filters.sjrQuartile.includes(sjrQuartile)) {
          return false;
        }
      }

      // Filtro JCR Quartile
      if (filters.jcrQuartile.length > 0) {
        const jcrQuartile = journal.jcr?.quartile;
        if (!jcrQuartile || !filters.jcrQuartile.includes(jcrQuartile)) {
          return false;
        }
      }

      // Filtro Predatório
      if (filters.predatory !== null) {
        const isPredatory = journal.predatory?.isPredatory || false;
        if (isPredatory !== filters.predatory) {
          return false;
        }
      }

      // Filtro Wiley APC
      if (filters.hasWileyAPC !== null) {
        const hasAPC = Boolean(journal.wileyAPC);
        if (hasAPC !== filters.hasWileyAPC) {
          return false;
        }
      }

      // Filtro CiteScore
      if (filters.minCiteScore !== null || filters.maxCiteScore !== null) {
        const citeScore = journal.citeScore?.score;
        if (!citeScore) return false;
        
        if (filters.minCiteScore !== null && citeScore < filters.minCiteScore) {
          return false;
        }
        if (filters.maxCiteScore !== null && citeScore > filters.maxCiteScore) {
          return false;
        }
      }

      // Filtro H-Index
      if (filters.minHIndex !== null || filters.maxHIndex !== null) {
        const hIndex = journal.sjr?.hIndex;
        if (!hIndex) return false;
        
        if (filters.minHIndex !== null && hIndex < filters.minHIndex) {
          return false;
        }
        if (filters.maxHIndex !== null && hIndex > filters.maxHIndex) {
          return false;
        }
      }

      // Filtro Wiley Subjects
      if (filters.wileySubjects.length > 0) {
        if (!journal.wileySubject || !filters.wileySubjects.includes(journal.wileySubject)) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  // Função para calcular Qualis (mesma lógica da tabela)
  const calculateQualis = (journal) => {
    const abdc = journal.abdc;
    const abs = journal.abs;
    const jcrQuartile = journal.jcr?.quartile;
    const sjrQuartile = journal.sjr?.quartile;

    // MB: ABDC = A/A* OU ABS ≥ 2 OU JCR = Q1 OU SJR = Q1
    if (
      abdc === 'A' || abdc === 'A*' ||
      (abs && (abs === '2' || abs === '3' || abs === '4' || abs === '4*')) ||
      jcrQuartile === 'Q1' ||
      sjrQuartile === 'Q1'
    ) {
      return 'MB';
    }

    // B: ABDC = B OU ABS = 1 OU JCR = Q2 OU SJR = Q2
    if (
      abdc === 'B' ||
      abs === '1' ||
      jcrQuartile === 'Q2' ||
      sjrQuartile === 'Q2'
    ) {
      return 'B';
    }

    // R: ABDC = C OU JCR = Q3 OU SJR = Q3
    if (
      abdc === 'C' ||
      jcrQuartile === 'Q3' ||
      sjrQuartile === 'Q3'
    ) {
      return 'R';
    }

    // F: JCR = Q4 OU SJR = Q4
    if (jcrQuartile === 'Q4' || sjrQuartile === 'Q4') {
      return 'F';
    }

    return '-';
  };

  // Função para atualizar filtros
  const updateFilter = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      abdc: [],
      abs: [],
      qualis: [],
      sjrQuartile: [],
      jcrQuartile: [],
      predatory: null,
      hasWileyAPC: null,
      minCiteScore: null,
      maxCiteScore: null,
      minHIndex: null,
      maxHIndex: null,
      wileySubjects: []
    });
  };

  // Estatísticas dos filtros aplicados
  const filterStats = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null;
    });

    return {
      activeCount: activeFilters.length,
      totalResults: filteredData.length,
      originalTotal: data.length
    };
  }, [filters, filteredData.length, data.length]);

  return {
    filters,
    filteredData,
    updateFilter,
    clearFilters,
    filterStats
  };
};

export default useAdvancedFilters;