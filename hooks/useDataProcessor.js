import { useState, useCallback } from 'react';
import { FILE_CONFIG } from '../utils/constants';
import { unifyAllDataSources, generateUnifiedStats, validateUnifiedData } from '../utils/dataMerger';

/**
 * Hook para processar arquivos Excel e unificar dados de journals
 * Responsável por carregar e processar dados ABDC, ABS e Wiley
 */
const useDataProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingError, setProcessingError] = useState(null);
  const [dataSource, setDataSource] = useState({
    abdc: { count: 0, loaded: false },
    abs: { count: 0, loaded: false },
    wiley: { count: 0, loaded: false },
    sjr: { count: 0, loaded: false },
    jcr: { count: 0, loaded: false },
    citeScore: { count: 0, loaded: false },
    predatory: { count: 0, loaded: false }
  });

  /**
   * Tenta ler um arquivo em todos os caminhos definidos em FILE_CONFIG.paths
   * @param {string} fileName Nome do arquivo a ser lido
   * @returns {Promise<ArrayBuffer>} Conteúdo do arquivo
   */
  const readFileFromPaths = useCallback(async (fileName) => {
    for (const basePath of FILE_CONFIG.paths) {
      try {
        const file = await window.fs.readFile(`${basePath}${fileName}`);
        return file;
      } catch {
        // Continua tentando nos próximos caminhos
      }
    }
    throw new Error(`Arquivo ${fileName} não encontrado`);
  }, []);

  /**
   * Processa dados ABDC
   */
  const processABDCData = useCallback(async () => {
    try {
      setProcessingStatus('Carregando dados ABDC...');
      
      const XLSX = await import('xlsx');
      
      // Buscar arquivo nos caminhos configurados
      const abdcFile = await readFileFromPaths(FILE_CONFIG.files.ABDC);
      
      const abdcWorkbook = XLSX.read(abdcFile);
      
      // Verificar se a sheet existe
      if (!abdcWorkbook.Sheets["2022 JQL"]) {
        throw new Error('Sheet "2022 JQL" não encontrada no arquivo ABDC');
      }
      
      const abdcSheet = abdcWorkbook.Sheets["2022 JQL"];
      const abdcRawData = XLSX.utils.sheet_to_json(abdcSheet, { header: 1 });
      
      // Encontrar onde começam os dados (procurar por "Journal Title")
      let abdcStartRow = -1;
      for (let i = 0; i < abdcRawData.length; i++) {
        if (abdcRawData[i] && abdcRawData[i][0] === "Journal Title") {
          abdcStartRow = i + 1;
          break;
        }
      }
      
      if (abdcStartRow === -1) {
        throw new Error('Cabeçalho "Journal Title" não encontrado nos dados ABDC');
      }
      
      const abdcJournals = {};
      const abdcDataRows = abdcRawData
        .slice(abdcStartRow)
        .filter(row => row && row[0] && typeof row[0] === 'string');
      
      abdcDataRows.forEach(row => {
        const journalTitle = row[0]?.toString().trim();
        const rating = row[6]?.toString().trim();
        if (journalTitle && rating) {
          abdcJournals[journalTitle.toLowerCase()] = rating;
        }
      });
      
      setDataSource(prev => ({
        ...prev,
        abdc: { count: Object.keys(abdcJournals).length, loaded: true }
      }));
      
      return abdcJournals;
    } catch (error) {
      console.error('Erro ao processar ABDC:', error);
      throw new Error(`Erro ao carregar dados ABDC: ${error.message}`);
    }
  }, [readFileFromPaths]);

  /**
   * Processa dados ABS
   */
  const processABSData = useCallback(async () => {
    try {
      setProcessingStatus('Carregando dados ABS...');
      
      const XLSX = await import('xlsx');
      
      // Buscar arquivo nos caminhos configurados
      const absFile = await readFileFromPaths(FILE_CONFIG.files.ABS);
      
      const absWorkbook = XLSX.read(absFile);
      
      // Verificar se a sheet existe
      if (!absWorkbook.Sheets["Sheet1"]) {
        throw new Error('Sheet "Sheet1" não encontrada no arquivo ABS');
      }
      
      const absSheet = absWorkbook.Sheets["Sheet1"];
      const absRawData = XLSX.utils.sheet_to_json(absSheet, { header: 1 });
      
      // Verificar se há dados suficientes
      if (absRawData.length < 2) {
        throw new Error('Dados insuficientes no arquivo ABS');
      }
      
      // Os dados ABS começam na linha 1 (linha 0 é cabeçalho)
      const absDataRows = absRawData
        .slice(1)
        .filter(row => row && row[1]);
      
      const absJournals = {};
      absDataRows.forEach(row => {
        const journalTitle = row[1]?.toString().trim();
        const rating = row[2]?.toString().trim(); // AJG 2024
        if (journalTitle && rating) {
          absJournals[journalTitle.toLowerCase()] = rating;
        }
      });
      
      setDataSource(prev => ({
        ...prev,
        abs: { count: Object.keys(absJournals).length, loaded: true }
      }));
      
      return absJournals;
    } catch (error) {
      console.error('Erro ao processar ABS:', error);
      throw new Error(`Erro ao carregar dados ABS: ${error.message}`);
    }
  }, [readFileFromPaths]);

  /**
   * Processa dados Wiley
   */
  const processWileyData = useCallback(async () => {
    try {
      setProcessingStatus('Carregando dados Wiley...');
      
      const XLSX = await import('xlsx');
      
      // Buscar arquivo nos caminhos configurados
      const wileyFile = await readFileFromPaths(FILE_CONFIG.files.WILEY);
      
      const wileyWorkbook = XLSX.read(wileyFile);
      
      // Verificar se a sheet existe
      if (!wileyWorkbook.Sheets["Hybrid OA Journals Updated"]) {
        throw new Error('Sheet "Hybrid OA Journals Updated" não encontrada no arquivo Wiley');
      }
      
      const wileySheet = wileyWorkbook.Sheets["Hybrid OA Journals Updated"];
      const wileyRawData = XLSX.utils.sheet_to_json(wileySheet, { header: 1 });
      
      // Encontrar onde começam os dados (procurar por "Journal Title")
      let wileyStartRow = -1;
      for (let i = 0; i < wileyRawData.length; i++) {
        if (wileyRawData[i] && wileyRawData[i][0] === "Journal Title") {
          wileyStartRow = i + 1;
          break;
        }
      }
      
      if (wileyStartRow === -1) {
        throw new Error('Cabeçalho "Journal Title" não encontrado nos dados Wiley');
      }
      
      const wileyJournals = {};
      const wileyDataRows = wileyRawData
        .slice(wileyStartRow)
        .filter(row => row && row[0] && typeof row[0] === 'string');
      
      wileyDataRows.forEach(row => {
        const journalTitle = row[0]?.toString().trim();
        const subjectArea = row[2]?.toString().trim();
        const apcUsd = row[4]?.toString().trim();
        if (journalTitle) {
          wileyJournals[journalTitle.toLowerCase()] = {
            subjectArea: subjectArea || "",
            apcUsd: apcUsd || ""
          };
        }
      });
      
      setDataSource(prev => ({
        ...prev,
        wiley: { count: Object.keys(wileyJournals).length, loaded: true }
      }));
      
      return wileyJournals;
    } catch (error) {
      console.error('Erro ao processar Wiley:', error);
      throw new Error(`Erro ao carregar dados Wiley: ${error.message}`);
    }
  }, [readFileFromPaths]);

  /**
   * Processa dados SJR (Scimago Journal Rank)
   */
  const processSJRData = useCallback(async () => {
    try {
      setProcessingStatus('Carregando dados SJR...');
      
      const XLSX = await import('xlsx');
      
      // Buscar arquivo nos caminhos configurados
      const sjrFile = await readFileFromPaths(FILE_CONFIG.files.SJR);
      
      const sjrWorkbook = XLSX.read(sjrFile);
      
      // Verificar se a sheet existe
      if (!sjrWorkbook.Sheets[FILE_CONFIG.sheets.SJR]) {
        throw new Error(`Sheet "${FILE_CONFIG.sheets.SJR}" não encontrada no arquivo SJR`);
      }
      
      const sjrSheet = sjrWorkbook.Sheets[FILE_CONFIG.sheets.SJR];
      const sjrRawData = XLSX.utils.sheet_to_json(sjrSheet, { header: 1 });
      
      // Verificar se há dados suficientes
      if (sjrRawData.length < 2) {
        throw new Error('Dados insuficientes no arquivo SJR');
      }
      
      // Os dados SJR começam na linha 1 (linha 0 é cabeçalho)
      const sjrDataRows = sjrRawData
        .slice(1)
        .filter(row => row && row[FILE_CONFIG.columns.SJR.JOURNAL_TITLE]);
      
      const sjrJournals = {};
      sjrDataRows.forEach(row => {
        const journalTitle = row[FILE_CONFIG.columns.SJR.JOURNAL_TITLE]?.toString().trim();
        const sjrScore = parseFloat(row[FILE_CONFIG.columns.SJR.SJR_SCORE]) || 0;
        const quartile = row[FILE_CONFIG.columns.SJR.QUARTILE]?.toString().trim();
        const hIndex = parseInt(row[FILE_CONFIG.columns.SJR.H_INDEX]) || 0;
        const citableDocs = parseInt(row[FILE_CONFIG.columns.SJR.CITABLE_DOCS]) || 0;
        const year = parseInt(row[FILE_CONFIG.columns.SJR.YEAR]) || new Date().getFullYear();
        
        if (journalTitle && quartile && ['Q1', 'Q2', 'Q3', 'Q4'].includes(quartile)) {
          sjrJournals[journalTitle.toLowerCase()] = {
            quartile,
            score: sjrScore,
            hIndex,
            citableDocs,
            year
          };
        }
      });
      
      setDataSource(prev => ({
        ...prev,
        sjr: { count: Object.keys(sjrJournals).length, loaded: true }
      }));
      
      console.log(`✅ SJR processado: ${Object.keys(sjrJournals).length} journals`);
      return sjrJournals;
    } catch (error) {
      console.error('Erro ao processar SJR:', error);
      throw new Error(`Erro ao carregar dados SJR: ${error.message}`);
    }
  }, [readFileFromPaths]);

  /**
   * Processa dados JCR (Journal Citation Reports)
   */
  const processJCRData = useCallback(async () => {
    try {
      setProcessingStatus('Carregando dados JCR...');
      
      const XLSX = await import('xlsx');
      
      // Buscar arquivo nos caminhos configurados
      const jcrFile = await readFileFromPaths(FILE_CONFIG.files.JCR);
      
      const jcrWorkbook = XLSX.read(jcrFile);
      
      // Verificar se a sheet existe
      if (!jcrWorkbook.Sheets[FILE_CONFIG.sheets.JCR]) {
        throw new Error(`Sheet "${FILE_CONFIG.sheets.JCR}" não encontrada no arquivo JCR`);
      }
      
      const jcrSheet = jcrWorkbook.Sheets[FILE_CONFIG.sheets.JCR];
      const jcrRawData = XLSX.utils.sheet_to_json(jcrSheet, { header: 1 });
      
      // Verificar se há dados suficientes
      if (jcrRawData.length < 2) {
        throw new Error('Dados insuficientes no arquivo JCR');
      }
      
      // Os dados JCR começam na linha 1 (linha 0 é cabeçalho)
      const jcrDataRows = jcrRawData
        .slice(1)
        .filter(row => row && row[FILE_CONFIG.columns.JCR.JOURNAL_TITLE]);
      
      const jcrJournals = {};
      jcrDataRows.forEach(row => {
        const journalTitle = row[FILE_CONFIG.columns.JCR.JOURNAL_TITLE]?.toString().trim();
        const impactFactor = parseFloat(row[FILE_CONFIG.columns.JCR.IMPACT_FACTOR]) || 0;
        const quartile = row[FILE_CONFIG.columns.JCR.QUARTILE]?.toString().trim();
        const category = row[FILE_CONFIG.columns.JCR.CATEGORY]?.toString().trim();
        const citations = parseInt(row[FILE_CONFIG.columns.JCR.CITATIONS]) || 0;
        const year = parseInt(row[FILE_CONFIG.columns.JCR.YEAR]) || new Date().getFullYear();
        
        if (journalTitle && impactFactor >= 0) {
          jcrJournals[journalTitle.toLowerCase()] = {
            impactFactor,
            quartile: quartile || '',
            category: category || '',
            citations,
            year
          };
        }
      });
      
      setDataSource(prev => ({
        ...prev,
        jcr: { count: Object.keys(jcrJournals).length, loaded: true }
      }));
      
      console.log(`✅ JCR processado: ${Object.keys(jcrJournals).length} journals`);
      return jcrJournals;
    } catch (error) {
      console.error('Erro ao processar JCR:', error);
      throw new Error(`Erro ao carregar dados JCR: ${error.message}`);
    }
  }, [readFileFromPaths]);

  /**
   * Processa dados CiteScore
   */
  const processCiteScoreData = useCallback(async () => {
    try {
      setProcessingStatus('Carregando dados CiteScore...');
      
      const XLSX = await import('xlsx');
      
      // Buscar arquivo nos caminhos configurados
      const citeScoreFile = await readFileFromPaths(FILE_CONFIG.files.CITESCORE);
      
      const citeScoreWorkbook = XLSX.read(citeScoreFile);
      
      // Verificar se a sheet existe
      if (!citeScoreWorkbook.Sheets[FILE_CONFIG.sheets.CITESCORE]) {
        throw new Error(`Sheet "${FILE_CONFIG.sheets.CITESCORE}" não encontrada no arquivo CiteScore`);
      }
      
      const citeScoreSheet = citeScoreWorkbook.Sheets[FILE_CONFIG.sheets.CITESCORE];
      const citeScoreRawData = XLSX.utils.sheet_to_json(citeScoreSheet, { header: 1 });
      
      // Verificar se há dados suficientes
      if (citeScoreRawData.length < 2) {
        throw new Error('Dados insuficientes no arquivo CiteScore');
      }
      
      // Os dados CiteScore começam na linha 1 (linha 0 é cabeçalho)
      const citeScoreDataRows = citeScoreRawData
        .slice(1)
        .filter(row => row && row[FILE_CONFIG.columns.CITESCORE.JOURNAL_TITLE]);
      
      const citeScoreJournals = {};
      citeScoreDataRows.forEach(row => {
        const journalTitle = row[FILE_CONFIG.columns.CITESCORE.JOURNAL_TITLE]?.toString().trim();
        const score = parseFloat(row[FILE_CONFIG.columns.CITESCORE.CITESCORE]) || 0;
        const percentile = parseFloat(row[FILE_CONFIG.columns.CITESCORE.PERCENTILE]) || 0;
        const citations = parseInt(row[FILE_CONFIG.columns.CITESCORE.CITATIONS]) || 0;
        const year = parseInt(row[FILE_CONFIG.columns.CITESCORE.YEAR]) || new Date().getFullYear();
        
        if (journalTitle && score >= 0 && percentile >= 0 && percentile <= 100) {
          citeScoreJournals[journalTitle.toLowerCase()] = {
            score,
            percentile,
            citations,
            year
          };
        }
      });
      
      setDataSource(prev => ({
        ...prev,
        citeScore: { count: Object.keys(citeScoreJournals).length, loaded: true }
      }));
      
      console.log(`✅ CiteScore processado: ${Object.keys(citeScoreJournals).length} journals`);
      return citeScoreJournals;
    } catch (error) {
      console.error('Erro ao processar CiteScore:', error);
      throw new Error(`Erro ao carregar dados CiteScore: ${error.message}`);
    }
  }, [readFileFromPaths]);

  /**
   * Processa dados de Journals Predatórios
   */
  const processPredatoryData = useCallback(async () => {
    try {
      setProcessingStatus('Carregando dados de Journals Predatórios...');
      
      const XLSX = await import('xlsx');
      
      // Buscar arquivo nos caminhos configurados
      const predatoryFile = await readFileFromPaths(FILE_CONFIG.files.PREDATORY);
      
      const predatoryWorkbook = XLSX.read(predatoryFile);
      
      // Verificar se a sheet existe
      if (!predatoryWorkbook.Sheets[FILE_CONFIG.sheets.PREDATORY]) {
        throw new Error(`Sheet "${FILE_CONFIG.sheets.PREDATORY}" não encontrada no arquivo Predatory`);
      }
      
      const predatorySheet = predatoryWorkbook.Sheets[FILE_CONFIG.sheets.PREDATORY];
      const predatoryRawData = XLSX.utils.sheet_to_json(predatorySheet, { header: 1 });
      
      // Verificar se há dados suficientes
      if (predatoryRawData.length < 2) {
        throw new Error('Dados insuficientes no arquivo Predatory');
      }
      
      // Os dados Predatory começam na linha 1 (linha 0 é cabeçalho)
      const predatoryDataRows = predatoryRawData
        .slice(1)
        .filter(row => row && row[FILE_CONFIG.columns.PREDATORY.JOURNAL_TITLE]);
      
      const predatoryJournals = {};
      predatoryDataRows.forEach(row => {
        const journalTitle = row[FILE_CONFIG.columns.PREDATORY.JOURNAL_TITLE]?.toString().trim();
        const isPredatory = Boolean(row[FILE_CONFIG.columns.PREDATORY.IS_PREDATORY]);
        const source = row[FILE_CONFIG.columns.PREDATORY.SOURCE]?.toString().trim();
        const reason = row[FILE_CONFIG.columns.PREDATORY.REASON]?.toString().trim();
        const lastChecked = row[FILE_CONFIG.columns.PREDATORY.LAST_CHECKED]?.toString().trim();
        
        if (journalTitle) {
          predatoryJournals[journalTitle.toLowerCase()] = {
            isPredatory,
            source: source || 'Unknown',
            reason: reason || '',
            lastChecked: lastChecked || new Date().toISOString().split('T')[0]
          };
        }
      });
      
      setDataSource(prev => ({
        ...prev,
        predatory: { count: Object.keys(predatoryJournals).length, loaded: true }
      }));
      
      console.log(`✅ Predatory processado: ${Object.keys(predatoryJournals).length} journals`);
      return predatoryJournals;
    } catch (error) {
      console.error('Erro ao processar Predatory:', error);
      throw new Error(`Erro ao carregar dados Predatory: ${error.message}`);
    }
  }, [readFileFromPaths]);

  /**
   * Função utilitária para capitalizar nomes de journals
   */
  const capitalizeJournalName = useCallback((journalKey) => {
    return journalKey
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  /**
   * Processa e unifica todos os dados com otimizações de performance
   */
  const processAllData = useCallback(async () => {
    try {
      setIsProcessing(true);
      setProcessingError(null);
      
      // Reset data source
      setDataSource({
        abdc: { count: 0, loaded: false },
        abs: { count: 0, loaded: false },
        wiley: { count: 0, loaded: false },
        sjr: { count: 0, loaded: false },
        jcr: { count: 0, loaded: false },
        citeScore: { count: 0, loaded: false },
        predatory: { count: 0, loaded: false }
      });
      
      // Verificar cache primeiro (mais rápido)
      const cachedData = localStorage.getItem('journalscope_processed_data');
      const cacheTimestamp = localStorage.getItem('journalscope_cache_timestamp');
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
      
      if (cachedData && cacheTimestamp) {
        const isExpired = Date.now() - parseInt(cacheTimestamp) > cacheExpiry;
        
        if (!isExpired) {
          setProcessingStatus('Carregando dados do cache...');
          
          const parsedData = JSON.parse(cachedData);
          
          // Atualizar contadores baseado nos dados existentes
          const withABDC = parsedData.filter(j => j.abdc).length;
          const withABS = parsedData.filter(j => j.abs).length;
          const withWiley = parsedData.filter(j => j.wileySubject).length;
          const withSJR = parsedData.filter(j => j.sjr).length;
          const withJCR = parsedData.filter(j => j.jcr).length;
          const withCiteScore = parsedData.filter(j => j.citeScore).length;
          const withPredatory = parsedData.filter(j => j.predatory).length;
          
          setDataSource({
            abdc: { count: withABDC, loaded: true },
            abs: { count: withABS, loaded: true },
            wiley: { count: withWiley, loaded: true },
            sjr: { count: withSJR, loaded: true },
            jcr: { count: withJCR, loaded: true },
            citeScore: { count: withCiteScore, loaded: true },
            predatory: { count: withPredatory, loaded: true }
          });
          
          setProcessingStatus(`Cache carregado! ${parsedData.length} journals disponíveis.`);
          setIsProcessing(false);
          return parsedData;
        }
      }
      
      // Processar arquivos com carregamento progressivo
      setProcessingStatus('Iniciando carregamento...');
      
      const results = {};
      const processors = [
        { name: 'abdc', fn: processABDCData },
        { name: 'abs', fn: processABSData },
        { name: 'wiley', fn: processWileyData },
        { name: 'sjr', fn: processSJRData },
        { name: 'jcr', fn: processJCRData },
        { name: 'citeScore', fn: processCiteScoreData },
        { name: 'predatory', fn: processPredatoryData }
      ];
      
      // Processar em paralelo com updates progressivos
      await Promise.all(
        processors.map(async ({ name, fn }) => {
          try {
            results[name] = await fn();
          } catch (error) {
            console.warn(`Erro ao carregar ${name}:`, error);
            results[name] = {};
          }
        })
      );
      
      setProcessingStatus('Unificando dados...');
      
      // Usar sistema de merge inteligente
      const unifiedData = await new Promise((resolve) => {
        setTimeout(() => {
          const unified = unifyAllDataSources(results);
          resolve(unified);
        }, 0);
      });
      
      // Salvar no cache localStorage (mais persistente)
      try {
        localStorage.setItem('journalscope_processed_data', JSON.stringify(unifiedData));
        localStorage.setItem('journalscope_cache_timestamp', Date.now().toString());
      } catch (e) {
        console.warn('Não foi possível salvar no cache:', e);
      }
      
      setProcessingStatus(`Processamento concluído! ${unifiedData.length} journals processados.`);
      setIsProcessing(false);
      
      return unifiedData;
      
    } catch (error) {
      console.error('Erro durante o processamento:', error);
      setProcessingError(error.message);
      setIsProcessing(false);
      throw error;
    }
  }, [processABDCData, processABSData, processWileyData, capitalizeJournalName]);

  /**
   * Limpa cache e reprocessa dados
   */
  const clearCacheAndReprocess = useCallback(async () => {
    // Limpar cache da memória
    delete window.processedJournalsData;
    
    // Limpar cache do localStorage
    localStorage.removeItem('journalscope_processed_data');
    localStorage.removeItem('journalscope_cache_timestamp');
    
    // Reprocessar
    return await processAllData();
  }, [processAllData]);

  /**
   * Verifica se arquivos estão disponíveis
   */
  const checkFilesAvailability = useCallback(async () => {
    const files = [
      FILE_CONFIG.files.ABDC,
      FILE_CONFIG.files.ABS,
      FILE_CONFIG.files.WILEY,
      FILE_CONFIG.files.SJR,
      FILE_CONFIG.files.JCR,
      FILE_CONFIG.files.CITESCORE,
      FILE_CONFIG.files.PREDATORY
    ];
    
    const fileStatus = {};
    
    for (const file of files) {
      let found = false;
      for (const basePath of FILE_CONFIG.paths) {
        try {
          await window.fs.readFile(`${basePath}${file}`);
          fileStatus[file] = true;
          found = true;
          break;
        } catch {
          // tenta próximo caminho
        }
      }
      if (!found) {
        fileStatus[file] = false;
      }
    }
    
    return fileStatus;
  }, []);

  return {
    // Estados
    isProcessing,
    processingStatus,
    processingError,
    dataSource,
    
    // Funções
    processAllData,
    clearCacheAndReprocess,
    checkFilesAvailability,
    
    // Funções individuais (para uso avançado)
    processABDCData,
    processABSData,
    processWileyData,
    processSJRData,
    processJCRData,
    processCiteScoreData,
    processPredatoryData,
    capitalizeJournalName
  };
};

export default useDataProcessor;
