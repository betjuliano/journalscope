/**
 * Utilitários de processamento de dados para JournalScope
 * Funções auxiliares para manipulação e validação de dados
 */

import { FILE_CONFIG, CLASSIFICATIONS, VALIDATION } from './constants';

/**
 * Normaliza o nome de um journal para comparação
 * @param {string} journalName - Nome do journal
 * @returns {string} Nome normalizado
 */
export const normalizeJournalName = (journalName) => {
  if (!journalName || typeof journalName !== 'string') return '';
  
  return journalName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' ')    // Normaliza espaços
    .trim();
};

/**
 * Capitaliza o nome de um journal para exibição
 * @param {string} journalName - Nome do journal
 * @returns {string} Nome capitalizado
 */
export const capitalizeJournalName = (journalName) => {
  if (!journalName || typeof journalName !== 'string') return '';
  
  // Palavras que devem permanecer em minúsculas (artigos, preposições, etc.)
  const lowercaseWords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'de', 'da', 'do',
    'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com'
  ];
  
  return journalName
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Primeira palavra sempre maiúscula
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Palavras especiais permanecem minúsculas (exceto se for a primeira)
      if (lowercaseWords.includes(word)) {
        return word;
      }
      
      // Outras palavras são capitalizadas
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Valida se uma string é uma classificação ABDC válida
 * @param {string} rating - Classificação a validar
 * @returns {boolean} True se válida
 */
export const isValidABDCRating = (rating) => {
  return Object.keys(CLASSIFICATIONS.ABDC).includes(rating);
};

/**
 * Valida se uma string é uma classificação ABS válida
 * @param {string} rating - Classificação a validar
 * @returns {boolean} True se válida
 */
export const isValidABSRating = (rating) => {
  return Object.keys(CLASSIFICATIONS.ABS).includes(rating);
};

/**
 * Obtém a prioridade numérica de uma classificação ABDC
 * @param {string} rating - Classificação ABDC
 * @returns {number} Prioridade (maior = melhor)
 */
export const getABDCPriority = (rating) => {
  return CLASSIFICATIONS.ABDC[rating]?.priority || 0;
};

/**
 * Obtém a prioridade numérica de uma classificação ABS
 * @param {string} rating - Classificação ABS
 * @returns {number} Prioridade (maior = melhor)
 */
export const getABSPriority = (rating) => {
  return CLASSIFICATIONS.ABS[rating]?.priority || 0;
};

/**
 * Compara dois journals por qualidade (ABDC + ABS)
 * @param {Object} journalA - Primeiro journal
 * @param {Object} journalB - Segundo journal
 * @returns {number} Resultado da comparação (-1, 0, 1)
 */
export const compareJournalsByQuality = (journalA, journalB) => {
  const priorityA = getABDCPriority(journalA.abdc) + getABSPriority(journalA.abs);
  const priorityB = getABDCPriority(journalB.abdc) + getABSPriority(journalB.abs);
  
  if (priorityA > priorityB) return -1;
  if (priorityA < priorityB) return 1;
  return journalA.journal.localeCompare(journalB.journal);
};

/**
 * Filtra dados baseado em critérios
 * @param {Array} data - Array de journals
 * @param {Object} filters - Objeto com filtros
 * @returns {Array} Dados filtrados
 */
export const filterJournalsData = (data, filters = {}) => {
  if (!Array.isArray(data)) return [];
  
  const {
    searchTerm = '',
    abdc = '',
    abs = '',
    wiley = false,
    minAPC = null,
    maxAPC = null
  } = filters;
  
  return data.filter(journal => {
    // Filtro de busca por nome
    if (searchTerm) {
      const normalizedSearch = normalizeJournalName(searchTerm);
      const normalizedJournal = normalizeJournalName(journal.journal);
      
      if (!normalizedJournal.includes(normalizedSearch)) {
        return false;
      }
    }
    
    // Filtro ABDC
    if (abdc && journal.abdc !== abdc) {
      return false;
    }
    
    // Filtro ABS
    if (abs && journal.abs !== abs) {
      return false;
    }
    
    // Filtro Wiley (apenas journals com dados Wiley)
    if (wiley && !journal.wileySubject) {
      return false;
    }
    
    // Filtro de APC mínimo
    if (minAPC !== null && journal.wileyAPC) {
      const apc = parseFloat(journal.wileyAPC);
      if (isNaN(apc) || apc < minAPC) {
        return false;
      }
    }
    
    // Filtro de APC máximo
    if (maxAPC !== null && journal.wileyAPC) {
      const apc = parseFloat(journal.wileyAPC);
      if (isNaN(apc) || apc > maxAPC) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Busca journals por similaridade de nome
 * @param {Array} data - Array de journals
 * @param {string} searchTerm - Termo de busca
 * @param {number} limit - Limite de resultados
 * @returns {Array} Journals similares
 */
export const findSimilarJournals = (data, searchTerm, limit = 10) => {
  if (!Array.isArray(data) || !searchTerm) return [];
  
  const normalizedSearch = normalizeJournalName(searchTerm);
  const searchWords = normalizedSearch.split(' ').filter(word => word.length > 2);
  
  if (searchWords.length === 0) return [];
  
  const scored = data.map(journal => {
    const normalizedJournal = normalizeJournalName(journal.journal);
    const journalWords = normalizedJournal.split(' ');
    
    let score = 0;
    
    // Pontuação por palavras exatas
    searchWords.forEach(searchWord => {
      journalWords.forEach(journalWord => {
        if (journalWord === searchWord) {
          score += 10;
        } else if (journalWord.includes(searchWord)) {
          score += 5;
        } else if (searchWord.includes(journalWord)) {
          score += 3;
        }
      });
    });
    
    // Bonus por correspondência no início
    if (normalizedJournal.startsWith(normalizedSearch)) {
      score += 20;
    }
    
    // Bonus por correspondência exata
    if (normalizedJournal === normalizedSearch) {
      score += 50;
    }
    
    return { ...journal, similarity: score };
  });
  
  return scored
    .filter(journal => journal.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(({ similarity, ...journal }) => journal);
};

/**
 * Gera estatísticas dos dados
 * @param {Array} data - Array de journals
 * @returns {Object} Objeto com estatísticas
 */
export const generateDataStatistics = (data) => {
  if (!Array.isArray(data)) {
    return {
      total: 0,
      withABDC: 0,
      withABS: 0,
      withWiley: 0,
      abdcDistribution: {},
      absDistribution: {},
      wileySubjects: {},
      apcStats: { min: 0, max: 0, avg: 0, median: 0 }
    };
  }
  
  const stats = {
    total: data.length,
    withABDC: 0,
    withABS: 0,
    withWiley: 0,
    abdcDistribution: {},
    absDistribution: {},
    wileySubjects: {},
    apcStats: { min: Infinity, max: 0, avg: 0, median: 0, values: [] }
  };
  
  data.forEach(journal => {
    // Contar journals com classificações
    if (journal.abdc) {
      stats.withABDC++;
      stats.abdcDistribution[journal.abdc] = (stats.abdcDistribution[journal.abdc] || 0) + 1;
    }
    
    if (journal.abs) {
      stats.withABS++;
      stats.absDistribution[journal.abs] = (stats.absDistribution[journal.abs] || 0) + 1;
    }
    
    if (journal.wileySubject) {
      stats.withWiley++;
      stats.wileySubjects[journal.wileySubject] = (stats.wileySubjects[journal.wileySubject] || 0) + 1;
    }
    
    // Estatísticas de APC
    if (journal.wileyAPC) {
      const apc = parseFloat(journal.wileyAPC);
      if (!isNaN(apc)) {
        stats.apcStats.values.push(apc);
        stats.apcStats.min = Math.min(stats.apcStats.min, apc);
        stats.apcStats.max = Math.max(stats.apcStats.max, apc);
      }
    }
  });
  
  // Calcular média e mediana de APC
  if (stats.apcStats.values.length > 0) {
    const sorted = stats.apcStats.values.sort((a, b) => a - b);
    stats.apcStats.avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
    
    const mid = Math.floor(sorted.length / 2);
    stats.apcStats.median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  } else {
    stats.apcStats.min = 0;
  }
  
  // Remover array de valores (não necessário na saída)
  delete stats.apcStats.values;
  
  return stats;
};

/**
 * Valida a estrutura de um journal
 * @param {Object} journal - Objeto journal
 * @returns {Object} Resultado da validação
 */
export const validateJournalStructure = (journal) => {
  const errors = [];
  const warnings = [];
  
  if (!journal) {
    errors.push('Journal object is null or undefined');
    return { isValid: false, errors, warnings };
  }
  
  // Validar nome do journal
  if (!journal.journal || typeof journal.journal !== 'string') {
    errors.push('Journal name is required and must be a string');
  } else if (journal.journal.length < VALIDATION.journal.minLength) {
    errors.push(`Journal name must be at least ${VALIDATION.journal.minLength} characters`);
  } else if (journal.journal.length > VALIDATION.journal.maxLength) {
    errors.push(`Journal name must be less than ${VALIDATION.journal.maxLength} characters`);
  } else if (!VALIDATION.journal.pattern.test(journal.journal)) {
    warnings.push('Journal name contains potentially invalid characters');
  }
  
  // Validar classificação ABDC
  if (journal.abdc && !isValidABDCRating(journal.abdc)) {
    warnings.push(`Invalid ABDC rating: ${journal.abdc}`);
  }
  
  // Validar classificação ABS
  if (journal.abs && !isValidABSRating(journal.abs)) {
    warnings.push(`Invalid ABS rating: ${journal.abs}`);
  }
  
  // Validar APC
  if (journal.wileyAPC) {
    const apc = parseFloat(journal.wileyAPC);
    if (isNaN(apc) || apc < 0) {
      warnings.push('Invalid APC value');
    } else if (apc > 10000) {
      warnings.push('APC value seems unusually high');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Remove duplicatas de uma lista de journals
 * @param {Array} journals - Array de journals
 * @param {string} keyField - Campo para identificar duplicatas (padrão: 'journal')
 * @returns {Array} Array sem duplicatas
 */
export const removeDuplicateJournals = (journals, keyField = 'journal') => {
  if (!Array.isArray(journals)) return [];
  
  const seen = new Set();
  return journals.filter(journal => {
    const key = normalizeJournalName(journal[keyField]);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Mescla dados de journals de múltiplas fontes
 * @param {Object} sources - Objeto com arrays de cada fonte
 * @returns {Array} Array unificado de journals
 */
export const mergeJournalSources = (sources) => {
  const { abdc = {}, abs = {}, wiley = {} } = sources;
  
  // Obter todos os nomes únicos de journals
  const allJournalNames = new Set([
    ...Object.keys(abdc),
    ...Object.keys(abs),
    ...Object.keys(wiley)
  ]);
  
  const merged = [];
  
  for (const journalKey of allJournalNames) {
    const abdcRating = abdc[journalKey] || '';
    const absRating = abs[journalKey] || '';
    const wileyInfo = wiley[journalKey] || {};
    
    const journal = {
      journal: capitalizeJournalName(journalKey),
      abdc: abdcRating,
      abs: absRating,
      wileySubject: wileyInfo.subjectArea || '',
      wileyAPC: wileyInfo.apcUsd || '',
      wileyAPCGBP: wileyInfo.apcGbp || '',
      wileyAPCEUR: wileyInfo.apcEur || '',
      // Metadados adicionais
      sources: {
        hasABDC: !!abdcRating,
        hasABS: !!absRating,
        hasWiley: !!wileyInfo.subjectArea
      },
      qualityScore: getABDCPriority(abdcRating) + getABSPriority(absRating),
      lastUpdated: new Date().toISOString()
    };
    
    // Validar estrutura antes de adicionar
    const validation = validateJournalStructure(journal);
    if (validation.isValid) {
      merged.push(journal);
    }
  }
  
  // Ordenar por qualidade e depois por nome
  return merged.sort(compareJournalsByQuality);
};

/**
 * Encontra inconsistências entre diferentes classificações
 * @param {Array} journals - Array de journals
 * @returns {Array} Array de inconsistências encontradas
 */
export const findClassificationInconsistencies = (journals) => {
  if (!Array.isArray(journals)) return [];
  
  const inconsistencies = [];
  
  journals.forEach(journal => {
    const abdcPriority = getABDCPriority(journal.abdc);
    const absPriority = getABSPriority(journal.abs);
    
    // Verificar discrepâncias grandes entre classificações
    if (abdcPriority > 0 && absPriority > 0) {
      const difference = Math.abs(abdcPriority - absPriority);
      
      if (difference >= 3) {
        inconsistencies.push({
          journal: journal.journal,
          abdc: journal.abdc,
          abs: journal.abs,
          abdcPriority,
          absPriority,
          difference,
          type: 'major_discrepancy'
        });
      }
    }
    
    // Verificar journals sem classificação
    if (!journal.abdc && !journal.abs) {
      inconsistencies.push({
        journal: journal.journal,
        type: 'no_classification',
        hasWiley: !!journal.wileySubject
      });
    }
  });
  
  return inconsistencies;
};

/**
 * Formata dados para exportação
 * @param {Array} journals - Array de journals
 * @param {string} format - Formato de exportação ('csv', 'json', 'excel')
 * @returns {Object} Dados formatados
 */
export const formatDataForExport = (journals, format = 'csv') => {
  if (!Array.isArray(journals)) return null;
  
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format.toLowerCase()) {
    case 'csv':
      return {
        data: journals,
        filename: `journalscope_export_${timestamp}.csv`,
        headers: [
          'Journal',
          'Classificação ABDC',
          'Classificação ABS',
          'Área Wiley',
          'APC Wiley (USD)',
          'Score de Qualidade'
        ]
      };
      
    case 'json':
      return {
        data: {
          exportInfo: {
            timestamp: new Date().toISOString(),
            totalRecords: journals.length,
            generatedBy: 'JournalScope v1.0.0'
          },
          journals
        },
        filename: `journalscope_export_${timestamp}.json`
      };
      
    case 'excel':
      return {
        data: journals,
        filename: `journalscope_export_${timestamp}.xlsx`,
        sheetName: 'Journals',
        metadata: {
          title: 'JournalScope Export',
          created: new Date(),
          totalRecords: journals.length
        }
      };
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
