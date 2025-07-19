/**
 * Sistema de merge inteligente de dados para JournalScope V3.0
 * Responsável por unificar dados de 6 fontes diferentes sem duplicação
 */

import { DATA_SOURCES } from './types.js';

/**
 * Sistema de prioridade para resolução de conflitos
 * Ordem decrescente de confiabilidade
 */
export const DATA_PRIORITY = {
  ABDC: 6,    // Mais rigoroso
  ABS: 5,     // Bem estabelecido
  SJR: 4,     // Ampla cobertura
  JCR: 3,     // Tradicional
  CiteScore: 2, // Mais recente
  Wiley: 1,   // Específico da editora
  Predatory: 1 // Informação crítica mas específica
};

/**
 * Capitaliza nome do journal de forma consistente
 * @param {string} journalKey - Nome do journal em lowercase
 * @returns {string} Nome capitalizado
 */
export const capitalizeJournalName = (journalKey) => {
  if (!journalKey || typeof journalKey !== 'string') return '';
  
  return journalKey
    .split(' ')
    .map(word => {
      if (word.length <= 2) return word.toUpperCase(); // Siglas
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Normaliza nome do journal para comparação
 * @param {string} journalName - Nome original do journal
 * @returns {string} Nome normalizado
 */
export const normalizeJournalName = (journalName) => {
  if (!journalName || typeof journalName !== 'string') return '';
  
  return journalName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ')     // Normaliza espaços
    .trim();
};

/**
 * Detecta possíveis duplicatas baseado em similaridade de nomes
 * @param {string} name1 - Primeiro nome
 * @param {string} name2 - Segundo nome
 * @returns {boolean} True se são similares
 */
export const areSimilarNames = (name1, name2) => {
  if (!name1 || !name2) return false;
  
  const normalized1 = normalizeJournalName(name1);
  const normalized2 = normalizeJournalName(name2);
  
  // Nomes idênticos após normalização
  if (normalized1 === normalized2) return true;
  
  // Calcula similaridade usando Levenshtein distance simplificada
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  
  // Se têm palavras em comum significativas
  const commonWords = words1.filter(word => 
    word.length > 3 && words2.includes(word)
  );
  
  // Considera similar se mais de 60% das palavras são comuns
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  return similarity > 0.6;
};

/**
 * Resolve conflitos entre dados de diferentes fontes
 * @param {Object} existingData - Dados existentes
 * @param {Object} newData - Novos dados
 * @param {string} source - Fonte dos novos dados
 * @returns {Object} Dados resolvidos
 */
export const resolveDataConflicts = (existingData, newData, source) => {
  const resolved = { ...existingData };
  const conflicts = [];
  
  // Para cada campo nos novos dados
  Object.keys(newData).forEach(field => {
    const existingValue = existingData[field];
    const newValue = newData[field];
    
    // Se não há valor existente, aceita o novo
    if (!existingValue && newValue) {
      resolved[field] = newValue;
      return;
    }
    
    // Se há conflito, usa prioridade
    if (existingValue && newValue && existingValue !== newValue) {
      const existingSource = existingData.sources?.[0] || 'Unknown';
      const existingPriority = DATA_PRIORITY[existingSource] || 0;
      const newPriority = DATA_PRIORITY[source] || 0;
      
      if (newPriority > existingPriority) {
        conflicts.push({
          field,
          oldValue: existingValue,
          newValue,
          oldSource: existingSource,
          newSource: source,
          resolution: 'new_value_used'
        });
        resolved[field] = newValue;
      } else {
        conflicts.push({
          field,
          oldValue: existingValue,
          newValue,
          oldSource: existingSource,
          newSource: source,
          resolution: 'existing_value_kept'
        });
      }
    }
  });
  
  // Adiciona informações de conflitos se houver
  if (conflicts.length > 0) {
    resolved.conflicts = [...(existingData.conflicts || []), ...conflicts];
  }
  
  return resolved;
};

/**
 * Unifica dados de todas as fontes em uma estrutura única
 * @param {Object} sourceData - Dados de todas as fontes
 * @returns {Array} Array de journals unificados
 */
export const unifyAllDataSources = (sourceData) => {
  console.log('🔄 Iniciando unificação de dados de 6 fontes...');
  
  const {
    abdc = {},
    abs = {},
    wiley = {},
    sjr = {},
    jcr = {},
    citeScore = {},
    predatory = {}
  } = sourceData;
  
  // Coletar todos os nomes únicos de journals
  const allJournalNames = new Set();
  
  // Adicionar nomes de cada fonte
  Object.keys(abdc).forEach(name => allJournalNames.add(name));
  Object.keys(abs).forEach(name => allJournalNames.add(name));
  Object.keys(wiley).forEach(name => allJournalNames.add(name));
  Object.keys(sjr).forEach(name => allJournalNames.add(name));
  Object.keys(jcr).forEach(name => allJournalNames.add(name));
  Object.keys(citeScore).forEach(name => allJournalNames.add(name));
  Object.keys(predatory).forEach(name => allJournalNames.add(name));
  
  console.log(`📊 Total de journals únicos encontrados: ${allJournalNames.size}`);
  
  // Processar cada journal
  const unifiedJournals = [];
  const processingStats = {
    totalProcessed: 0,
    successfulMerges: 0,
    conflicts: 0,
    duplicatesRemoved: 0
  };
  
  for (const journalKey of allJournalNames) {
    try {
      // Coletar dados de todas as fontes para este journal
      const journalData = {
        journal: capitalizeJournalName(journalKey),
        sources: [],
        lastUpdated: new Date().toISOString()
      };
      
      // ABDC
      if (abdc[journalKey]) {
        journalData.abdc = abdc[journalKey];
        journalData.sources.push('ABDC');
      }
      
      // ABS
      if (abs[journalKey]) {
        journalData.abs = abs[journalKey];
        journalData.sources.push('ABS');
      }
      
      // Wiley
      if (wiley[journalKey]) {
        journalData.wileySubject = wiley[journalKey].subjectArea || "";
        journalData.wileyAPC = wiley[journalKey].apcUsd || "";
        if (journalData.wileySubject) {
          journalData.sources.push('Wiley');
        }
      }
      
      // SJR
      if (sjr[journalKey]) {
        journalData.sjr = {
          quartile: sjr[journalKey].quartile,
          score: sjr[journalKey].score || 0,
          hIndex: sjr[journalKey].hIndex || 0,
          citableDocs: sjr[journalKey].citableDocs || 0,
          year: sjr[journalKey].year || new Date().getFullYear()
        };
        journalData.sources.push('SJR');
      }
      
      // JCR
      if (jcr[journalKey]) {
        journalData.jcr = {
          impactFactor: jcr[journalKey].impactFactor,
          quartile: jcr[journalKey].quartile || '',
          category: jcr[journalKey].category || '',
          citations: jcr[journalKey].citations || 0,
          year: jcr[journalKey].year || new Date().getFullYear()
        };
        journalData.sources.push('JCR');
      }
      
      // CiteScore
      if (citeScore[journalKey]) {
        journalData.citeScore = {
          score: citeScore[journalKey].score,
          percentile: citeScore[journalKey].percentile || 0,
          citations: citeScore[journalKey].citations || 0,
          year: citeScore[journalKey].year || new Date().getFullYear()
        };
        journalData.sources.push('CiteScore');
      }
      
      // Predatory
      if (predatory[journalKey]) {
        journalData.predatory = {
          isPredatory: predatory[journalKey].isPredatory,
          source: predatory[journalKey].source || 'Unknown',
          reason: predatory[journalKey].reason || '',
          lastChecked: predatory[journalKey].lastChecked || new Date().toISOString().split('T')[0]
        };
        journalData.sources.push('Predatory');
      }
      
      // Determinar qualidade dos dados
      journalData.dataQuality = journalData.sources.length >= 3 ? 'high' : 
                               journalData.sources.length >= 2 ? 'medium' : 'low';
      
      unifiedJournals.push(journalData);
      processingStats.totalProcessed++;
      processingStats.successfulMerges++;
      
    } catch (error) {
      console.warn(`Erro ao processar journal ${journalKey}:`, error);
    }
  }
  
  // Ordenar por nome
  unifiedJournals.sort((a, b) => a.journal.localeCompare(b.journal));
  
  console.log('✅ Unificação concluída:');
  console.log(`   - Journals processados: ${processingStats.totalProcessed}`);
  console.log(`   - Merges bem-sucedidos: ${processingStats.successfulMerges}`);
  console.log(`   - Conflitos resolvidos: ${processingStats.conflicts}`);
  
  return unifiedJournals;
};

/**
 * Gera estatísticas dos dados unificados
 * @param {Array} unifiedData - Dados unificados
 * @returns {Object} Estatísticas detalhadas
 */
export const generateUnifiedStats = (unifiedData) => {
  if (!Array.isArray(unifiedData) || unifiedData.length === 0) {
    return {
      total: 0,
      bySource: {
        abdc: 0,
        abs: 0,
        sjr: 0,
        jcr: 0,
        citeScore: 0,
        wiley: 0,
        predatory: 0
      },
      abdcDistribution: {},
      absDistribution: {},
      sjrDistribution: {},
      dataQualityDistribution: {}
    };
  }
  
  const stats = {
    total: unifiedData.length,
    bySource: {
      abdc: 0,
      abs: 0,
      sjr: 0,
      jcr: 0,
      citeScore: 0,
      wiley: 0,
      predatory: 0
    },
    abdcDistribution: {},
    absDistribution: {},
    sjrDistribution: {},
    dataQualityDistribution: {}
  };
  
  unifiedData.forEach(journal => {
    // Contar por fonte
    if (journal.abdc) stats.bySource.abdc++;
    if (journal.abs) stats.bySource.abs++;
    if (journal.sjr) stats.bySource.sjr++;
    if (journal.jcr) stats.bySource.jcr++;
    if (journal.citeScore) stats.bySource.citeScore++;
    if (journal.wileySubject) stats.bySource.wiley++;
    if (journal.predatory) stats.bySource.predatory++;
    
    // Distribuições
    if (journal.abdc) {
      stats.abdcDistribution[journal.abdc] = (stats.abdcDistribution[journal.abdc] || 0) + 1;
    }
    if (journal.abs) {
      stats.absDistribution[journal.abs] = (stats.absDistribution[journal.abs] || 0) + 1;
    }
    if (journal.sjr?.quartile) {
      stats.sjrDistribution[journal.sjr.quartile] = (stats.sjrDistribution[journal.sjr.quartile] || 0) + 1;
    }
    if (journal.dataQuality) {
      stats.dataQualityDistribution[journal.dataQuality] = (stats.dataQualityDistribution[journal.dataQuality] || 0) + 1;
    }
  });
  
  return stats;
};

/**
 * Valida integridade dos dados unificados
 * @param {Array} unifiedData - Dados para validar
 * @returns {Object} Resultado da validação
 */
export const validateUnifiedData = (unifiedData) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: {
      totalJournals: unifiedData.length,
      validJournals: 0,
      journalsWithErrors: 0,
      journalsWithWarnings: 0
    }
  };
  
  unifiedData.forEach((journal, index) => {
    const journalErrors = [];
    const journalWarnings = [];
    
    // Validações obrigatórias
    if (!journal.journal || typeof journal.journal !== 'string') {
      journalErrors.push('Nome do journal é obrigatório');
    }
    
    if (!Array.isArray(journal.sources) || journal.sources.length === 0) {
      journalErrors.push('Journal deve ter pelo menos uma fonte de dados');
    }
    
    // Validações de dados SJR
    if (journal.sjr) {
      if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(journal.sjr.quartile)) {
        journalErrors.push('Quartil SJR inválido');
      }
      if (typeof journal.sjr.score !== 'number' || journal.sjr.score < 0) {
        journalErrors.push('Score SJR inválido');
      }
    }
    
    // Validações de dados JCR
    if (journal.jcr) {
      if (typeof journal.jcr.impactFactor !== 'number' || journal.jcr.impactFactor < 0) {
        journalErrors.push('Impact Factor JCR inválido');
      }
    }
    
    // Validações de dados CiteScore
    if (journal.citeScore) {
      if (typeof journal.citeScore.percentile !== 'number' || 
          journal.citeScore.percentile < 0 || 
          journal.citeScore.percentile > 100) {
        journalErrors.push('Percentil CiteScore inválido');
      }
    }
    
    // Avisos para qualidade de dados
    if (journal.sources.length === 1) {
      journalWarnings.push('Journal tem apenas uma fonte de dados');
    }
    
    if (journal.dataQuality === 'low') {
      journalWarnings.push('Qualidade de dados baixa');
    }
    
    // Registrar erros e avisos
    if (journalErrors.length > 0) {
      validation.errors.push({
        index,
        journal: journal.journal,
        errors: journalErrors
      });
      validation.summary.journalsWithErrors++;
      validation.isValid = false;
    } else {
      validation.summary.validJournals++;
    }
    
    if (journalWarnings.length > 0) {
      validation.warnings.push({
        index,
        journal: journal.journal,
        warnings: journalWarnings
      });
      validation.summary.journalsWithWarnings++;
    }
  });
  
  return validation;
};

export default {
  capitalizeJournalName,
  normalizeJournalName,
  areSimilarNames,
  resolveDataConflicts,
  unifyAllDataSources,
  generateUnifiedStats,
  validateUnifiedData,
  DATA_PRIORITY
};