import { useState, useCallback } from 'react';
import { FILE_CONFIG } from '../utils/constants';

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
    wiley: { count: 0, loaded: false }
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
   * Função utilitária para capitalizar nomes de journals
   */
  const capitalizeJournalName = useCallback((journalKey) => {
    return journalKey
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  /**
   * Processa e unifica todos os dados
   */
  const processAllData = useCallback(async () => {
    try {
      setIsProcessing(true);
      setProcessingError(null);
      
      // Reset data source
      setDataSource({
        abdc: { count: 0, loaded: false },
        abs: { count: 0, loaded: false },
        wiley: { count: 0, loaded: false }
      });
      
      // Verificar se já existem dados processados em cache
      if (window.processedJournalsData && window.processedJournalsData.length > 0) {
        setProcessingStatus('Usando dados em cache...');
        
        // Atualizar contadores baseado nos dados existentes
        const withABDC = window.processedJournalsData.filter(j => j.abdc).length;
        const withABS = window.processedJournalsData.filter(j => j.abs).length;
        const withWiley = window.processedJournalsData.filter(j => j.wileySubject).length;
        
        setDataSource({
          abdc: { count: withABDC, loaded: true },
          abs: { count: withABS, loaded: true },
          wiley: { count: withWiley, loaded: true }
        });
        
        setProcessingStatus(`Cache carregado! ${window.processedJournalsData.length} journals disponíveis.`);
        setIsProcessing(false);
        return window.processedJournalsData;
      }
      
      // Processar todos os arquivos em paralelo
      const [abdcJournals, absJournals, wileyJournals] = await Promise.all([
        processABDCData(),
        processABSData(),
        processWileyData()
      ]);
      
      setProcessingStatus('Unificando dados...');
      
      // Criar conjunto único de journals
      const allJournalNames = new Set([
        ...Object.keys(abdcJournals),
        ...Object.keys(absJournals),
        ...Object.keys(wileyJournals)
      ]);
      
      // Criar tabela unificada
      const unifiedData = [];
      for (const journalKey of allJournalNames) {
        const abdcRating = abdcJournals[journalKey] || "";
        const absRating = absJournals[journalKey] || "";
        const wileyInfo = wileyJournals[journalKey] || {};
        
        unifiedData.push({
          journal: capitalizeJournalName(journalKey),
          abdc: abdcRating,
          abs: absRating,
          wileySubject: wileyInfo.subjectArea || "",
          wileyAPC: wileyInfo.apcUsd || ""
        });
      }
      
      // Ordenar por nome
      unifiedData.sort((a, b) => a.journal.localeCompare(b.journal));
      
      // Salvar dados processados em cache
      window.processedJournalsData = unifiedData;
      
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
    // Limpar cache
    delete window.processedJournalsData;
    
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
      FILE_CONFIG.files.WILEY
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
    capitalizeJournalName
  };
};

export default useDataProcessor;
