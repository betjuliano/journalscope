/**
 * Tipos e interfaces para o JournalScope V3.0
 * Define a estrutura de dados expandida com 6 fontes
 */

/**
 * Interface principal do Journal expandida
 * @typedef {Object} Journal
 * @property {string} journal - Nome do journal (chave primária)
 * @property {string} [abdc] - Classificação ABDC (A*, A, B, C)
 * @property {string} [abs] - Classificação ABS (4*, 4, 3, 2, 1)
 * @property {string} [wileySubject] - Área temática Wiley
 * @property {string} [wileyAPC] - Custo APC USD Wiley
 * @property {SJRData} [sjr] - Dados SJR
 * @property {JCRData} [jcr] - Dados JCR
 * @property {CiteScoreData} [citeScore] - Dados CiteScore
 * @property {PredatoryData} [predatory] - Dados de journals predatórios
 * @property {DataSource[]} sources - Lista de fontes que contêm este journal
 * @property {string} lastUpdated - Data da última atualização
 * @property {string} dataQuality - Qualidade dos dados (high, medium, low)
 */

/**
 * Dados SJR (Scimago Journal Rank)
 * @typedef {Object} SJRData
 * @property {string} quartile - Quartil (Q1, Q2, Q3, Q4)
 * @property {number} score - SJR Score
 * @property {number} hIndex - H-Index
 * @property {number} citableDocs - Documentos citáveis
 * @property {number} year - Ano da classificação
 */

/**
 * Dados JCR (Journal Citation Reports)
 * @typedef {Object} JCRData
 * @property {number} impactFactor - Fator de impacto
 * @property {string} quartile - Quartil JCR (Q1, Q2, Q3, Q4)
 * @property {string} category - Categoria JCR
 * @property {number} citations - Número de citações
 * @property {number} year - Ano da classificação
 */

/**
 * Dados CiteScore
 * @typedef {Object} CiteScoreData
 * @property {number} score - CiteScore value
 * @property {number} percentile - Percentil
 * @property {number} citations - Número de citações
 * @property {number} year - Ano da classificação
 */

/**
 * Dados de Journals Predatórios
 * @typedef {Object} PredatoryData
 * @property {boolean} isPredatory - true se predatório
 * @property {string} source - Fonte da classificação
 * @property {string} [reason] - Razão da classificação
 * @property {string} lastChecked - Data da última verificação
 */

/**
 * Fontes de dados disponíveis
 * @typedef {'ABDC'|'ABS'|'Wiley'|'SJR'|'JCR'|'CiteScore'|'Predatory'} DataSource
 */

/**
 * Estado dos filtros expandido
 * @typedef {Object} FilterState
 * @property {string} search - Termo de busca
 * @property {string[]} abdc - Filtros ABDC selecionados
 * @property {string[]} abs - Filtros ABS selecionados
 * @property {string[]} sjr - Filtros SJR selecionados
 * @property {boolean} wileyOnly - Apenas journals Wiley
 * @property {'exclude'|'include'|'only'} predatoryFilter - Filtro de predatórios
 * @property {string} [activeQuickFilter] - Filtro rápido ativo
 * @property {number} [jcrImpactMin] - Impacto JCR mínimo
 * @property {number} [citeScoreMin] - CiteScore mínimo
 * @property {number} [hIndexMin] - H-Index mínimo
 */

/**
 * Estatísticas expandidas
 * @typedef {Object} EnhancedStats
 * @property {number} total - Total de journals
 * @property {number} filtered - Journals filtrados
 * @property {SourceStats} bySource - Estatísticas por fonte
 * @property {Object} abdcDistribution - Distribuição ABDC
 * @property {Object} absDistribution - Distribuição ABS
 * @property {Object} sjrDistribution - Distribuição SJR
 */

/**
 * Estatísticas por fonte
 * @typedef {Object} SourceStats
 * @property {number} abdc - Journals com dados ABDC
 * @property {number} abs - Journals com dados ABS
 * @property {number} sjr - Journals com dados SJR
 * @property {number} jcr - Journals com dados JCR
 * @property {number} citeScore - Journals com dados CiteScore
 * @property {number} wiley - Journals com dados Wiley
 * @property {number} predatory - Journals predatórios identificados
 */

/**
 * Configuração de processamento de dados
 * @typedef {Object} ProcessingConfig
 * @property {string} source - Nome da fonte
 * @property {string} filePath - Caminho do arquivo
 * @property {string} sheetName - Nome da planilha
 * @property {Object} columnMapping - Mapeamento de colunas
 * @property {Function} processor - Função de processamento
 */

/**
 * Resultado do processamento de dados
 * @typedef {Object} ProcessingResult
 * @property {Object} results - Dados processados por fonte
 * @property {Error[]} errors - Erros encontrados durante processamento
 * @property {ProcessingStats} stats - Estatísticas do processamento
 */

/**
 * Estatísticas do processamento
 * @typedef {Object} ProcessingStats
 * @property {number} totalProcessed - Total de registros processados
 * @property {number} successfulMerges - Merges bem-sucedidos
 * @property {number} conflicts - Conflitos resolvidos
 * @property {number} duplicatesRemoved - Duplicatas removidas
 * @property {string} processingTime - Tempo de processamento
 */

/**
 * Opções de paginação
 * @typedef {Object} PaginationOptions
 * @property {number} pageSize - Tamanho da página (padrão: 100)
 * @property {number} currentPage - Página atual
 * @property {boolean} hasMore - Há mais resultados
 * @property {number} totalResults - Total de resultados
 */

/**
 * Configuração de filtro rápido
 * @typedef {Object} QuickFilterConfig
 * @property {string} name - Nome do filtro
 * @property {string} description - Descrição
 * @property {string} icon - Ícone emoji
 * @property {FilterState} filters - Configuração dos filtros
 */

/**
 * Resultado de busca
 * @typedef {Object} SearchResult
 * @property {Journal[]} data - Journals encontrados
 * @property {number} total - Total de resultados
 * @property {number} page - Página atual
 * @property {boolean} hasMore - Há mais páginas
 * @property {EnhancedStats} stats - Estatísticas dos resultados
 */

/**
 * Configuração de exportação
 * @typedef {Object} ExportConfig
 * @property {'csv'|'excel'|'json'} format - Formato de exportação
 * @property {string} filename - Nome do arquivo
 * @property {string[]} fields - Campos a exportar
 * @property {boolean} includeStats - Incluir estatísticas
 * @property {Object} metadata - Metadados adicionais
 */

// Validadores de tipos
export const isValidJournal = (journal) => {
  return journal && 
         typeof journal.journal === 'string' && 
         journal.journal.length > 0;
};

export const isValidSJRData = (sjr) => {
  return sjr && 
         ['Q1', 'Q2', 'Q3', 'Q4'].includes(sjr.quartile) &&
         typeof sjr.score === 'number' &&
         typeof sjr.hIndex === 'number';
};

export const isValidJCRData = (jcr) => {
  return jcr && 
         typeof jcr.impactFactor === 'number' &&
         jcr.impactFactor >= 0;
};

export const isValidCiteScoreData = (citeScore) => {
  return citeScore && 
         typeof citeScore.score === 'number' &&
         typeof citeScore.percentile === 'number' &&
         citeScore.percentile >= 0 && 
         citeScore.percentile <= 100;
};

// Constantes de tipos
export const DATA_SOURCES = ['ABDC', 'ABS', 'Wiley', 'SJR', 'JCR', 'CiteScore', 'Predatory'];
export const ABDC_RATINGS = ['A*', 'A', 'B', 'C'];
export const ABS_RATINGS = ['4*', '4', '3', '2', '1'];
export const SJR_QUARTILES = ['Q1', 'Q2', 'Q3', 'Q4'];
export const DATA_QUALITY_LEVELS = ['high', 'medium', 'low'];
export const PREDATORY_FILTERS = ['exclude', 'include', 'only'];

// Funções utilitárias de tipo
export const createEmptyJournal = (name) => ({
  journal: name,
  sources: [],
  lastUpdated: new Date().toISOString(),
  dataQuality: 'medium'
});

export const createEmptyFilterState = () => ({
  search: '',
  abdc: [],
  abs: [],
  sjr: [],
  wileyOnly: false,
  predatoryFilter: 'exclude'
});

export const createEmptyStats = () => ({
  total: 0,
  filtered: 0,
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
  sjrDistribution: {}
});

export default {
  isValidJournal,
  isValidSJRData,
  isValidJCRData,
  isValidCiteScoreData,
  DATA_SOURCES,
  ABDC_RATINGS,
  ABS_RATINGS,
  SJR_QUARTILES,
  DATA_QUALITY_LEVELS,
  PREDATORY_FILTERS,
  createEmptyJournal,
  createEmptyFilterState,
  createEmptyStats
};