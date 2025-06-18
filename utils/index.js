/**
 * Arquivo de índice para os utilitários do JournalScope
 * Centraliza todas as exportações da pasta utils
 */

// Importar todas as constantes
export * from './constants';

// Importar todas as funções de processamento de dados
export * from './dataProcessor';

// Importar todas as funções de exportação
export * from './exportUtils';

// Importações padrão para uso como objetos
import * as constants from './constants';
import * as dataProcessor from './dataProcessor';
import * as exportUtils from './exportUtils';

// Exportação agrupada para facilitar uso
export const Constants = constants;
export const DataProcessor = dataProcessor;
export const ExportUtils = exportUtils;

// Exportação padrão com todos os utilitários
export default {
  Constants: constants,
  DataProcessor: dataProcessor,
  ExportUtils: exportUtils
};

/**
 * Exemplos de uso das importações:
 * 
 * // Importação específica de constantes
 * import { APP_INFO, CLASSIFICATIONS } from '../utils';
 * 
 * // Importação específica de funções
 * import { normalizeJournalName, filterJournalsData } from '../utils';
 * import { exportAsCSV, exportAsJSON } from '../utils';
 * 
 * // Importação agrupada
 * import { Constants, DataProcessor, ExportUtils } from '../utils';
 * 
 * // Importação como objeto completo
 * import Utils from '../utils';
 * const { APP_INFO } = Utils.Constants;
 * 
 * // Importação mista
 * import { APP_INFO, exportAsCSV, normalizeJournalName } from '../utils';
 */
