/**
 * Utilitários para manipulação de texto
 * Inclui funções para truncamento, validação e formatação de texto
 * Com tratamento robusto de erros e validações
 */

// Constantes para validação
const TRUNCATION_LIMITS = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 200,
  DEFAULT_LENGTH: 30
};

const JOURNAL_NAME_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 500
};

/**
 * Valida o comprimento máximo de truncamento
 * 
 * @param {number} maxLength - Comprimento a ser validado
 * @returns {number} Comprimento validado dentro dos limites permitidos
 */
export const validateTruncationLength = (maxLength) => {
  try {
    // Verificar se é um número válido
    if (typeof maxLength !== 'number' || isNaN(maxLength)) {
      console.warn(`[textUtils] Comprimento de truncamento inválido: ${maxLength}. Usando valor padrão: ${TRUNCATION_LIMITS.DEFAULT_LENGTH}`);
      return TRUNCATION_LIMITS.DEFAULT_LENGTH;
    }
    
    // Verificar limites mínimos e máximos
    if (maxLength < TRUNCATION_LIMITS.MIN_LENGTH) {
      console.warn(`[textUtils] Comprimento de truncamento muito pequeno: ${maxLength}. Mínimo permitido: ${TRUNCATION_LIMITS.MIN_LENGTH}`);
      return TRUNCATION_LIMITS.MIN_LENGTH;
    }
    
    if (maxLength > TRUNCATION_LIMITS.MAX_LENGTH) {
      console.warn(`[textUtils] Comprimento de truncamento muito grande: ${maxLength}. Máximo permitido: ${TRUNCATION_LIMITS.MAX_LENGTH}`);
      return TRUNCATION_LIMITS.MAX_LENGTH;
    }
    
    return maxLength;
  } catch (error) {
    console.error(`[textUtils] Erro ao validar comprimento de truncamento:`, error);
    return TRUNCATION_LIMITS.DEFAULT_LENGTH;
  }
};

/**
 * Sanitiza um nome de journal removendo caracteres especiais perigosos
 * 
 * @param {string} name - Nome a ser sanitizado
 * @returns {string} Nome sanitizado
 */
export const sanitizeJournalName = (name) => {
  try {
    // Verificar entrada nula ou indefinida
    if (name === null || name === undefined) {
      console.warn(`[textUtils] Nome de journal nulo ou indefinido recebido para sanitização`);
      return '';
    }
    
    // Converter para string se necessário
    if (typeof name !== 'string') {
      console.warn(`[textUtils] Nome de journal não é string: ${typeof name}. Convertendo para string.`);
      name = String(name);
    }
    
    // Verificar comprimento excessivo
    if (name.length > JOURNAL_NAME_LIMITS.MAX_LENGTH) {
      console.warn(`[textUtils] Nome de journal muito longo: ${name.length} caracteres. Máximo permitido: ${JOURNAL_NAME_LIMITS.MAX_LENGTH}`);
      name = name.substring(0, JOURNAL_NAME_LIMITS.MAX_LENGTH);
    }
    
    // Remover caracteres potencialmente perigosos
    const sanitized = name
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '') // Remover brackets HTML básicos
      .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de controle
      .trim();
    
    // Verificar se a sanitização removeu conteúdo significativo
    if (sanitized.length < name.trim().length * 0.5) {
      console.warn(`[textUtils] Sanitização removeu mais de 50% do conteúdo original. Nome original: "${name.trim()}", Sanitizado: "${sanitized}"`);
    }
    
    return sanitized;
  } catch (error) {
    console.error(`[textUtils] Erro durante sanitização do nome do journal:`, error);
    return '';
  }
};

/**
 * Trunca o nome de um journal para um comprimento máximo especificado
 * Com tratamento robusto de erros e validações
 * 
 * @param {string} name - Nome do journal a ser truncado
 * @param {number} maxLength - Comprimento máximo permitido (padrão: 30)
 * @returns {string} Nome truncado com reticências se necessário, ou nome original se não precisar truncar
 * 
 * @example
 * truncateJournalName("Journal of Very Long Academic Research", 20)
 * // Returns: "Journal of Very Long..."
 * 
 * truncateJournalName("Short Journal", 30)
 * // Returns: "Short Journal"
 * 
 * truncateJournalName(null, 30)
 * // Returns: ""
 */
export const truncateJournalName = (name, maxLength = TRUNCATION_LIMITS.DEFAULT_LENGTH) => {
  try {
    // Validar e sanitizar o nome primeiro
    const sanitizedName = sanitizeJournalName(name);
    
    // Se a sanitização resultou em string vazia, retornar vazio
    if (!sanitizedName) {
      if (name) {
        console.warn(`[textUtils] Nome de journal resultou em string vazia após sanitização: "${name}"`);
      }
      return '';
    }
    
    // Validar comprimento máximo
    const validatedMaxLength = validateTruncationLength(maxLength);
    
    // Se o nome sanitizado está dentro do limite, retornar como está
    if (sanitizedName.length <= validatedMaxLength) {
      return sanitizedName;
    }
    
    // Truncar e adicionar reticências
    const truncated = sanitizedName.substring(0, validatedMaxLength) + '...';
    
    return truncated;
  } catch (error) {
    console.error(`[textUtils] Erro durante truncamento do nome do journal:`, error, { name, maxLength });
    
    // Fallback: tentar retornar pelo menos uma versão básica
    try {
      if (name && typeof name === 'string') {
        return name.substring(0, Math.min(name.length, TRUNCATION_LIMITS.DEFAULT_LENGTH));
      }
    } catch (fallbackError) {
      console.error(`[textUtils] Erro no fallback de truncamento:`, fallbackError);
    }
    
    return '';
  }
};

/**
 * Valida se um nome de journal é válido
 * Com tratamento robusto de erros e logs de warning
 * 
 * @param {any} name - Nome a ser validado
 * @returns {boolean} true se o nome é válido, false caso contrário
 */
export const isValidJournalName = (name) => {
  try {
    // Verificar valores nulos ou indefinidos
    if (name === null || name === undefined) {
      console.warn(`[textUtils] Nome de journal nulo ou indefinido recebido para validação`);
      return false;
    }
    
    // Verificar se é string
    if (typeof name !== 'string') {
      console.warn(`[textUtils] Nome de journal não é string: ${typeof name}, valor: ${name}`);
      return false;
    }
    
    // Verificar se não está vazio após trim
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      console.warn(`[textUtils] Nome de journal está vazio após trim: "${name}"`);
      return false;
    }
    
    // Verificar comprimento mínimo
    if (trimmedName.length < JOURNAL_NAME_LIMITS.MIN_LENGTH) {
      console.warn(`[textUtils] Nome de journal muito curto: ${trimmedName.length} caracteres. Mínimo: ${JOURNAL_NAME_LIMITS.MIN_LENGTH}`);
      return false;
    }
    
    // Verificar comprimento máximo
    if (trimmedName.length > JOURNAL_NAME_LIMITS.MAX_LENGTH) {
      console.warn(`[textUtils] Nome de journal muito longo: ${trimmedName.length} caracteres. Máximo: ${JOURNAL_NAME_LIMITS.MAX_LENGTH}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`[textUtils] Erro durante validação do nome do journal:`, error, { name });
    return false;
  }
};

/**
 * Calcula se um nome precisa ser truncado
 * Com tratamento robusto de erros e validações
 * 
 * @param {string} name - Nome a ser verificado
 * @param {number} maxLength - Comprimento máximo
 * @returns {boolean} true se precisa truncar, false caso contrário
 */
export const needsTruncation = (name, maxLength = TRUNCATION_LIMITS.DEFAULT_LENGTH) => {
  try {
    // Verificar entrada inválida
    if (!name || typeof name !== 'string') {
      if (name !== null && name !== undefined && name !== '') {
        console.warn(`[textUtils] Entrada inválida para needsTruncation: ${typeof name}, valor: ${name}`);
      }
      return false;
    }
    
    // Validar comprimento máximo
    const validatedMaxLength = validateTruncationLength(maxLength);
    
    return name.length > validatedMaxLength;
  } catch (error) {
    console.error(`[textUtils] Erro ao verificar necessidade de truncamento:`, error, { name, maxLength });
    return false;
  }
};

/**
 * Obtém o nome completo de um journal, mesmo que esteja truncado
 * Com tratamento robusto de erros e validações
 * 
 * @param {string} displayName - Nome exibido (possivelmente truncado)
 * @param {string} originalName - Nome original completo
 * @returns {string} Nome completo
 */
export const getFullJournalName = (displayName, originalName) => {
  try {
    // Priorizar nome original se disponível e válido
    if (originalName && typeof originalName === 'string' && originalName.trim()) {
      return sanitizeJournalName(originalName);
    }
    
    // Fallback para nome exibido
    if (displayName && typeof displayName === 'string' && displayName.trim()) {
      return sanitizeJournalName(displayName);
    }
    
    // Log de warning se ambos estão inválidos
    console.warn(`[textUtils] Ambos displayName e originalName são inválidos:`, { displayName, originalName });
    return '';
  } catch (error) {
    console.error(`[textUtils] Erro ao obter nome completo do journal:`, error, { displayName, originalName });
    return displayName || originalName || '';
  }
};

/**
 * Função de fallback para renderização segura de nomes de journals
 * Usada quando há erro na renderização principal
 * 
 * @param {Object} journal - Objeto do journal
 * @param {string} fallbackText - Texto de fallback opcional
 * @returns {string} Nome seguro para renderização
 */
export const getSafeJournalNameForRendering = (journal, fallbackText = 'Nome não disponível') => {
  try {
    // Tentar obter nome do journal de diferentes campos
    const possibleNames = [
      journal?.journal,
      journal?.name,
      journal?.title,
      journal?.journalName
    ];
    
    for (const name of possibleNames) {
      if (name && typeof name === 'string' && name.trim()) {
        const sanitized = sanitizeJournalName(name);
        if (sanitized) {
          return sanitized;
        }
      }
    }
    
    // Se nenhum nome válido foi encontrado, usar fallback
    console.warn(`[textUtils] Nenhum nome válido encontrado para journal:`, journal);
    return fallbackText;
  } catch (error) {
    console.error(`[textUtils] Erro ao obter nome seguro para renderização:`, error, { journal });
    return fallbackText;
  }
};

/**
 * Função de fallback para renderização de célula de journal em caso de erro
 * 
 * @param {Object} journal - Objeto do journal
 * @param {number} index - Índice do journal na tabela
 * @returns {Object} Elemento React de fallback
 */
export const createJournalCellFallback = (journal, index) => {
  try {
    const safeName = getSafeJournalNameForRendering(journal);
    
    return {
      type: 'div',
      props: {
        className: 'journal-cell-fallback',
        'data-testid': `journal-cell-fallback-${index}`,
        title: 'Erro na renderização - modo de fallback',
        children: [
          {
            type: 'span',
            props: {
              className: 'text-gray-900',
              children: safeName
            }
          },
          {
            type: 'span',
            props: {
              className: 'text-xs text-red-500 ml-2',
              title: 'Modo de fallback ativo',
              children: '⚠'
            }
          }
        ]
      }
    };
  } catch (error) {
    console.error(`[textUtils] Erro crítico no fallback de renderização:`, error);
    
    // Fallback do fallback - retorno mais básico possível
    return {
      type: 'div',
      props: {
        className: 'journal-cell-error',
        children: 'Erro de renderização'
      }
    };
  }
};

/**
 * Valida dados de journal antes do processamento
 * 
 * @param {Object} journal - Objeto do journal a ser validado
 * @returns {Object} Resultado da validação com status e mensagens
 */
export const validateJournalData = (journal) => {
  const result = {
    isValid: true,
    warnings: [],
    errors: []
  };
  
  try {
    // Verificar se journal é um objeto
    if (!journal || typeof journal !== 'object') {
      result.isValid = false;
      result.errors.push(`Journal deve ser um objeto, recebido: ${typeof journal}`);
      return result;
    }
    
    // Verificar nome do journal
    if (!isValidJournalName(journal.journal)) {
      result.warnings.push('Nome do journal inválido ou ausente');
    }
    
    // Verificar outros campos importantes
    const importantFields = ['abdc', 'abs', 'sjr', 'jcr'];
    importantFields.forEach(field => {
      if (journal[field] === undefined) {
        result.warnings.push(`Campo ${field} não definido`);
      }
    });
    
    // Log warnings se houver
    if (result.warnings.length > 0) {
      console.warn(`[textUtils] Warnings na validação do journal:`, result.warnings, journal);
    }
    
    return result;
  } catch (error) {
    console.error(`[textUtils] Erro durante validação de dados do journal:`, error);
    result.isValid = false;
    result.errors.push('Erro interno durante validação');
    return result;
  }
};