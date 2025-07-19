/**
 * Script para gerar dados embarcados (embedded) dos arquivos Excel
 * Converte os arquivos Excel em JSON otimizado para carregamento instantâneo
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuração dos arquivos expandida para 7 fontes
const FILES_CONFIG = {
  ABDC: {
    path: 'data-sources/ABDC2022.xlsx',
    sheet: '2022 JQL',
    columns: {
      journal: 0,
      rating: 6
    }
  },
  ABS: {
    path: 'data-sources/ABS2024.xlsx',
    sheet: 'Sheet1',
    columns: {
      journal: 1,       // Journal Title
      rating: 2,        // AJG 2024
      citationRank: 7,  // Citation rank 
      sjrRank: 9,       // SJR rank 
      jifRank: 10       // JIF Rank
    }
  },
  WILEY: {
    path: 'data-sources/Wiley.xlsx',
    sheet: 'Hybrid OA Journals Updated',
    columns: {
      journal: 0,
      subject: 2,
      apc: 4
    }
  },
  SJR: {
    path: 'data-sources/SJR2024.xlsx',
    sheet: 'SJR2024',
    columns: {
      journal: 0,        // Title Journal
      score: 1,          // SJR
      quartile: 2,       // SJR_Best_Q
      hIndex: 3,         // H_index
      citableDocs: 4,    // Citable_Docs_(3years)
      citesPerDoc: 5     // Cites_Doc_(2years)
    }
  },
  JCR: {
    path: 'data-sources/JCR2024.xlsx',
    sheet: 'undefined_JCR_JournalResults_0',
    columns: {
      journal: 0,       // Title_Journal
      issn: 1,          // ISSN
      citations: 2,     // Total Citations
      impactFactor: 3,  // 2024 JIF
      quartile: 4,      // JIF Quartile
      jci: 5,           // 2024 JCI
      category: 6       // Category
    }
  },
  CITESCORE: {
    path: 'data-sources/CiteScore.xlsx',
    sheet: 'Sheet0',
    columns: {
      journal: 0,       // Journal_Title
      score: 1,         // CiteScore
      snip: 2           // SNIP
    }
  },
  PREDATORY: {
    path: 'data-sources/Predatorio.xlsx',
    sheet: 'Sheet1',
    columns: {
      journal: 0,        // Title_Journal
      isPredatory: 1     // P (SIM/NÃO)
    }
  }
};

/**
 * Processa arquivo ABDC
 */
function processABDCFile() {
  console.log('📊 Processando arquivo ABDC...');
  
  const workbook = XLSX.readFile(FILES_CONFIG.ABDC.path);
  const sheet = workbook.Sheets[FILES_CONFIG.ABDC.sheet];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Encontrar linha de início
  let startRow = -1;
  for (let i = 0; i < rawData.length; i++) {
    if (rawData[i] && rawData[i][0] === "Journal Title") {
      startRow = i + 1;
      break;
    }
  }
  
  if (startRow === -1) {
    throw new Error('Cabeçalho não encontrado no arquivo ABDC');
  }
  
  const journals = {};
  const dataRows = rawData.slice(startRow).filter(row => row && row[0]);
  
  dataRows.forEach(row => {
    const journal = row[FILES_CONFIG.ABDC.columns.journal]?.toString().trim();
    const rating = row[FILES_CONFIG.ABDC.columns.rating]?.toString().trim();
    
    if (journal && rating) {
      journals[journal.toLowerCase()] = rating;
    }
  });
  
  console.log(`✅ ABDC processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Processa arquivo ABS
 */
function processABSFile() {
  console.log('📊 Processando arquivo ABS...');
  
  const workbook = XLSX.readFile(FILES_CONFIG.ABS.path);
  const sheet = workbook.Sheets[FILES_CONFIG.ABS.sheet];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const journals = {};
  const dataRows = rawData.slice(1).filter(row => row && row[1]);
  
  dataRows.forEach(row => {
    const journal = row[FILES_CONFIG.ABS.columns.journal]?.toString().trim();
    const rating = row[FILES_CONFIG.ABS.columns.rating]?.toString().trim(); // AJG 2024
    const citationRank = row[FILES_CONFIG.ABS.columns.citationRank]?.toString().trim();
    const sjrRank = row[FILES_CONFIG.ABS.columns.sjrRank]?.toString().trim();
    const jifRank = row[FILES_CONFIG.ABS.columns.jifRank]?.toString().trim();
    
    if (journal && rating) {
      journals[journal.toLowerCase()] = {
        rating,
        citationRank: citationRank || '',
        sjrRank: sjrRank || '',
        jifRank: jifRank || ''
      };
    }
  });
  
  console.log(`✅ ABS processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Processa arquivo Wiley
 */
function processWileyFile() {
  console.log('📊 Processando arquivo Wiley...');
  
  const workbook = XLSX.readFile(FILES_CONFIG.WILEY.path);
  const sheet = workbook.Sheets[FILES_CONFIG.WILEY.sheet];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Encontrar linha de início
  let startRow = -1;
  for (let i = 0; i < rawData.length; i++) {
    if (rawData[i] && rawData[i][0] === "Journal Title") {
      startRow = i + 1;
      break;
    }
  }
  
  if (startRow === -1) {
    throw new Error('Cabeçalho não encontrado no arquivo Wiley');
  }
  
  const journals = {};
  const dataRows = rawData.slice(startRow).filter(row => row && row[0]);
  
  dataRows.forEach(row => {
    const journal = row[FILES_CONFIG.WILEY.columns.journal]?.toString().trim();
    const subject = row[FILES_CONFIG.WILEY.columns.subject]?.toString().trim();
    const apc = row[FILES_CONFIG.WILEY.columns.apc]?.toString().trim();
    
    if (journal) {
      journals[journal.toLowerCase()] = {
        subjectArea: subject || "",
        apcUsd: apc || ""
      };
    }
  });
  
  console.log(`✅ Wiley processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Processa arquivo SJR
 */
function processSJRFile() {
  console.log('📊 Processando arquivo SJR...');
  
  const workbook = XLSX.readFile(FILES_CONFIG.SJR.path);
  const sheet = workbook.Sheets[FILES_CONFIG.SJR.sheet];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const journals = {};
  const dataRows = rawData.slice(1).filter(row => row && row[0]);
  
  dataRows.forEach(row => {
    const journal = row[FILES_CONFIG.SJR.columns.journal]?.toString().trim();
    const score = parseFloat(row[FILES_CONFIG.SJR.columns.score]) || 0;
    const quartile = row[FILES_CONFIG.SJR.columns.quartile]?.toString().trim();
    const hIndex = parseInt(row[FILES_CONFIG.SJR.columns.hIndex]) || 0;
    const citableDocs = parseInt(row[FILES_CONFIG.SJR.columns.citableDocs]) || 0;
    const citesPerDoc = parseFloat(row[FILES_CONFIG.SJR.columns.citesPerDoc]) || 0;
    
    if (journal && quartile) {
      journals[journal.toLowerCase()] = {
        quartile,
        score,
        hIndex,
        citableDocs,
        citesPerDoc,
        year: 2024 // SJR 2024
      };
    }
  });
  
  console.log(`✅ SJR processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Processa arquivo JCR
 */
function processJCRFile() {
  console.log('📊 Processando arquivo JCR...');
  
  const workbook = XLSX.readFile(FILES_CONFIG.JCR.path);
  const sheet = workbook.Sheets[FILES_CONFIG.JCR.sheet];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const journals = {};
  const dataRows = rawData.slice(1).filter(row => row && row[0]);
  
  dataRows.forEach(row => {
    const journal = row[FILES_CONFIG.JCR.columns.journal]?.toString().trim();
    const issn = row[FILES_CONFIG.JCR.columns.issn]?.toString().trim();
    
    // Tratar vírgulas nos números (ex: "10,376" -> 10376)
    const citationsStr = row[FILES_CONFIG.JCR.columns.citations]?.toString().replace(/,/g, '') || '0';
    const citations = parseInt(citationsStr) || 0;
    
    const impactFactor = parseFloat(row[FILES_CONFIG.JCR.columns.impactFactor]) || 0;
    const quartile = row[FILES_CONFIG.JCR.columns.quartile]?.toString().trim();
    const jci = parseFloat(row[FILES_CONFIG.JCR.columns.jci]) || 0;
    const category = row[FILES_CONFIG.JCR.columns.category]?.toString().trim();
    
    if (journal) {
      journals[journal.toLowerCase()] = {
        issn: issn || '',
        impactFactor,
        quartile: quartile || '',
        category: category || '',
        citations,
        jci,
        year: 2024 // JCR 2024
      };
    }
  });
  
  console.log(`✅ JCR processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Processa arquivo CiteScore
 */
function processCiteScoreFile() {
  console.log('📊 Processando arquivo CiteScore...');
  
  const workbook = XLSX.readFile(FILES_CONFIG.CITESCORE.path);
  const sheet = workbook.Sheets[FILES_CONFIG.CITESCORE.sheet];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const journals = {};
  const dataRows = rawData.slice(1).filter(row => row && row[0]);
  
  dataRows.forEach(row => {
    const journal = row[FILES_CONFIG.CITESCORE.columns.journal]?.toString().trim();
    const scoreStr = row[FILES_CONFIG.CITESCORE.columns.score]?.toString().trim();
    const snipStr = row[FILES_CONFIG.CITESCORE.columns.snip]?.toString().trim();
    
    // Tratar valores "N/A"
    const score = (scoreStr && scoreStr !== 'N/A') ? parseFloat(scoreStr) : 0;
    const snip = (snipStr && snipStr !== 'N/A') ? parseFloat(snipStr) : 0;
    
    if (journal) {
      journals[journal.toLowerCase()] = {
        score,
        snip,
        year: 2024 // CiteScore 2024
      };
    }
  });
  
  console.log(`✅ CiteScore processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Processa arquivo Predatory
 */
function processPredatoryFile() {
  console.log('📊 Processando arquivo Predatory...');
  
  const workbook = XLSX.readFile(FILES_CONFIG.PREDATORY.path);
  const sheet = workbook.Sheets[FILES_CONFIG.PREDATORY.sheet];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const journals = {};
  const dataRows = rawData.slice(1).filter(row => row && row[0]);
  
  dataRows.forEach(row => {
    const journal = row[FILES_CONFIG.PREDATORY.columns.journal]?.toString().trim();
    const predatoryFlag = row[FILES_CONFIG.PREDATORY.columns.isPredatory]?.toString().trim();
    
    // Converter "SIM"/"NÃO" para boolean
    const isPredatory = predatoryFlag === 'SIM' || predatoryFlag === 'YES' || predatoryFlag === '1';
    
    if (journal) {
      journals[journal.toLowerCase()] = {
        isPredatory,
        source: 'The Predatory Journals List',
        reason: isPredatory ? 'Listed as predatory journal' : '',
        lastChecked: new Date().toISOString().split('T')[0]
      };
    }
  });
  
  console.log(`✅ Predatory processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Capitaliza nome do journal
 */
function capitalizeJournalName(journalKey) {
  return journalKey
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Unifica todos os dados das 7 fontes
 */
function unifyAllData(abdcJournals, absJournals, wileyJournals, sjrJournals, jcrJournals, citeScoreJournals, predatoryJournals) {
  console.log('🔄 Unificando dados de 7 fontes...');
  
  const allJournalNames = new Set([
    ...Object.keys(abdcJournals),
    ...Object.keys(absJournals),
    ...Object.keys(wileyJournals),
    ...Object.keys(sjrJournals),
    ...Object.keys(jcrJournals),
    ...Object.keys(citeScoreJournals),
    ...Object.keys(predatoryJournals)
  ]);
  
  const unifiedData = [];
  
  for (const journalKey of allJournalNames) {
    const abdcRating = abdcJournals[journalKey] || "";
    const absInfo = absJournals[journalKey] || {};
    const wileyInfo = wileyJournals[journalKey] || {};
    const sjrInfo = sjrJournals[journalKey] || {};
    const jcrInfo = jcrJournals[journalKey] || {};
    const citeScoreInfo = citeScoreJournals[journalKey] || {};
    const predatoryInfo = predatoryJournals[journalKey] || {};
    
    // Determinar fontes de dados disponíveis
    const sources = [];
    if (abdcRating) sources.push('ABDC');
    if (absInfo.rating) sources.push('ABS');
    if (wileyInfo.subjectArea) sources.push('Wiley');
    if (sjrInfo.quartile) sources.push('SJR');
    if (jcrInfo.impactFactor) sources.push('JCR');
    if (citeScoreInfo.score) sources.push('CiteScore');
    if (predatoryInfo.isPredatory !== undefined) sources.push('Predatory');
    
    unifiedData.push({
      journal: capitalizeJournalName(journalKey),
      abdc: abdcRating,
      abs: absInfo.rating || "",
      wileySubject: wileyInfo.subjectArea || "",
      wileyAPC: wileyInfo.apcUsd || "",
      sjr: sjrInfo.quartile ? {
        quartile: sjrInfo.quartile,
        score: sjrInfo.score || 0,
        hIndex: sjrInfo.hIndex || 0,
        citableDocs: sjrInfo.citableDocs || 0,
        year: sjrInfo.year || new Date().getFullYear()
      } : null,
      jcr: jcrInfo.impactFactor ? {
        impactFactor: jcrInfo.impactFactor,
        quartile: jcrInfo.quartile || '',
        category: jcrInfo.category || '',
        citations: jcrInfo.citations || 0,
        year: jcrInfo.year || new Date().getFullYear()
      } : null,
      citeScore: citeScoreInfo.score ? {
        score: citeScoreInfo.score,
        snip: citeScoreInfo.snip || 0,
        year: citeScoreInfo.year || new Date().getFullYear()
      } : null,
      predatory: predatoryInfo.isPredatory !== undefined ? {
        isPredatory: predatoryInfo.isPredatory,
        source: predatoryInfo.source || 'Unknown',
        reason: predatoryInfo.reason || '',
        lastChecked: predatoryInfo.lastChecked || new Date().toISOString().split('T')[0]
      } : null,
      sources,
      lastUpdated: new Date().toISOString(),
      dataQuality: sources.length >= 3 ? 'high' : sources.length >= 2 ? 'medium' : 'low'
    });
  }
  
  // Ordenar por nome
  unifiedData.sort((a, b) => a.journal.localeCompare(b.journal));
  
  console.log(`✅ Dados unificados: ${unifiedData.length} journals únicos`);
  return unifiedData;
}

/**
 * Gera estatísticas dos dados expandidas para 7 fontes
 */
function generateStats(data) {
  const stats = {
    total: data.length,
    withABDC: data.filter(j => j.abdc).length,
    withABS: data.filter(j => j.abs).length,
    withWiley: data.filter(j => j.wileySubject).length,
    withSJR: data.filter(j => j.sjr).length,
    withJCR: data.filter(j => j.jcr).length,
    withCiteScore: data.filter(j => j.citeScore).length,
    withPredatory: data.filter(j => j.predatory && j.predatory.isPredatory).length,
    abdcDistribution: {},
    absDistribution: {},
    sjrDistribution: {},
    dataQualityDistribution: {}
  };
  
  data.forEach(journal => {
    // Distribuições existentes
    if (journal.abdc) {
      stats.abdcDistribution[journal.abdc] = (stats.abdcDistribution[journal.abdc] || 0) + 1;
    }
    if (journal.abs) {
      stats.absDistribution[journal.abs] = (stats.absDistribution[journal.abs] || 0) + 1;
    }
    
    // Novas distribuições
    if (journal.sjr && journal.sjr.quartile) {
      stats.sjrDistribution[journal.sjr.quartile] = (stats.sjrDistribution[journal.sjr.quartile] || 0) + 1;
    }
    if (journal.dataQuality) {
      stats.dataQualityDistribution[journal.dataQuality] = (stats.dataQualityDistribution[journal.dataQuality] || 0) + 1;
    }
  });
  
  return stats;
}

/**
 * Verifica se todos os arquivos existem e são acessíveis
 */
function validateFiles() {
  console.log('🔍 Verificando arquivos...');
  const results = {};
  
  for (const [name, config] of Object.entries(FILES_CONFIG)) {
    const exists = fs.existsSync(config.path);
    results[name] = {
      path: config.path,
      exists,
      size: exists ? (fs.statSync(config.path).size / 1024).toFixed(2) + 'KB' : 'N/A'
    };
    
    if (exists) {
      console.log(`✅ ${name}: ${config.path} (${results[name].size})`);
    } else {
      console.log(`❌ ${name}: ${config.path} - ARQUIVO NÃO ENCONTRADO`);
    }
  }
  
  const missingFiles = Object.entries(results).filter(([_, info]) => !info.exists);
  if (missingFiles.length > 0) {
    throw new Error(`Arquivos não encontrados: ${missingFiles.map(([name]) => name).join(', ')}`);
  }
  
  console.log('✅ Todos os arquivos encontrados!\n');
  return results;
}

/**
 * Valida estrutura dos arquivos Excel
 */
function validateExcelStructure() {
  console.log('🔍 Validando estrutura dos arquivos Excel...');
  const validationResults = {};
  
  for (const [name, config] of Object.entries(FILES_CONFIG)) {
    try {
      const workbook = XLSX.readFile(config.path);
      const hasSheet = workbook.SheetNames.includes(config.sheet);
      
      validationResults[name] = {
        sheetsFound: workbook.SheetNames,
        expectedSheet: config.sheet,
        hasExpectedSheet: hasSheet,
        status: hasSheet ? 'OK' : 'ERRO'
      };
      
      if (hasSheet) {
        const sheet = workbook.Sheets[config.sheet];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        validationResults[name].totalRows = data.length;
        validationResults[name].hasData = data.length > 1;
        
        console.log(`✅ ${name}: Planilha "${config.sheet}" encontrada (${data.length} linhas)`);
      } else {
        console.log(`❌ ${name}: Planilha "${config.sheet}" não encontrada. Disponíveis: ${workbook.SheetNames.join(', ')}`);
      }
      
    } catch (error) {
      validationResults[name] = {
        status: 'ERRO',
        error: error.message
      };
      console.log(`❌ ${name}: Erro ao ler arquivo - ${error.message}`);
    }
  }
  
  const errors = Object.entries(validationResults).filter(([_, info]) => info.status === 'ERRO');
  if (errors.length > 0) {
    throw new Error(`Erros na estrutura dos arquivos: ${errors.map(([name]) => name).join(', ')}`);
  }
  
  console.log('✅ Estrutura dos arquivos validada!\n');
  return validationResults;
}

/**
 * Valida resultados do processamento
 */
function validateProcessingResults(results) {
  console.log('🔍 Validando resultados do processamento...');
  
  const validation = {
    totalSources: Object.keys(results).length,
    successfulSources: 0,
    failedSources: 0,
    emptyResults: 0,
    details: {}
  };
  
  for (const [source, data] of Object.entries(results)) {
    const count = Object.keys(data).length;
    const isEmpty = count === 0;
    
    validation.details[source] = {
      count,
      isEmpty,
      status: isEmpty ? 'VAZIO' : 'OK'
    };
    
    if (isEmpty) {
      validation.emptyResults++;
      console.log(`⚠️  ${source}: 0 journals processados - VERIFICAR CONFIGURAÇÃO`);
    } else {
      validation.successfulSources++;
      console.log(`✅ ${source}: ${count} journals processados`);
    }
  }
  
  validation.failedSources = validation.totalSources - validation.successfulSources;
  
  console.log(`\n📊 Resumo do processamento:`);
  console.log(`   - Fontes processadas: ${validation.successfulSources}/${validation.totalSources}`);
  console.log(`   - Fontes vazias: ${validation.emptyResults}`);
  console.log(`   - Fontes com erro: ${validation.failedSources}`);
  
  if (validation.emptyResults > 0) {
    console.log(`\n⚠️  ATENÇÃO: ${validation.emptyResults} fonte(s) não retornaram dados!`);
    console.log(`   Verifique as configurações de colunas e estrutura dos arquivos.`);
  }
  
  return validation;
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando geração de dados embarcados...\n');
    
    // 1. Verificar se arquivos existem
    const fileValidation = validateFiles();
    
    // 2. Validar estrutura dos arquivos Excel
    const structureValidation = validateExcelStructure();
    
    // 3. Processar arquivos das 7 fontes
    const abdcJournals = processABDCFile();
    const absJournals = processABSFile();
    const wileyJournals = processWileyFile();
    const sjrJournals = processSJRFile();
    const jcrJournals = processJCRFile();
    const citeScoreJournals = processCiteScoreFile();
    const predatoryJournals = processPredatoryFile();
    
    // 4. Validar resultados do processamento
    const processingResults = {
      abdc: abdcJournals,
      abs: absJournals,
      wiley: wileyJournals,
      sjr: sjrJournals,
      jcr: jcrJournals,
      citeScore: citeScoreJournals,
      predatory: predatoryJournals
    };
    
    const processingValidation = validateProcessingResults(processingResults);
    
    // 5. Unificar dados de todas as 6 fontes
    const unifiedData = unifyAllData(abdcJournals, absJournals, wileyJournals, sjrJournals, jcrJournals, citeScoreJournals, predatoryJournals);
    
    // Gerar estatísticas
    const stats = generateStats(unifiedData);
    
    // Criar estrutura final
    const embeddedData = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      stats,
      data: unifiedData
    };
    
    // Criar diretório se não existir
    const outputDir = 'src/data';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Salvar dados embarcados
    const outputPath = path.join(outputDir, 'embeddedJournals.json');
    fs.writeFileSync(outputPath, JSON.stringify(embeddedData, null, 2));
    
    // Gerar arquivo JavaScript para importação direta
    const jsOutputPath = path.join(outputDir, 'embeddedJournals.js');
    const jsContent = `// Dados embarcados gerados automaticamente em ${new Date().toISOString()}
// Total de ${unifiedData.length} journals processados

export const EMBEDDED_JOURNALS_DATA = ${JSON.stringify(embeddedData, null, 2)};

export default EMBEDDED_JOURNALS_DATA;
`;
    
    fs.writeFileSync(jsOutputPath, jsContent);
    
    // Estatísticas finais
    const jsonSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    const jsSize = (fs.statSync(jsOutputPath).size / 1024).toFixed(2);
    
    console.log('\n🎉 Dados embarcados gerados com sucesso!');
    console.log(`📁 Arquivo JSON: ${outputPath} (${jsonSize}KB)`);
    console.log(`📁 Arquivo JS: ${jsOutputPath} (${jsSize}KB)`);
    console.log(`📊 Total de journals: ${unifiedData.length}`);
    console.log(`📊 Com ABDC: ${stats.withABDC}`);
    console.log(`📊 Com ABS: ${stats.withABS}`);
    console.log(`📊 Com Wiley: ${stats.withWiley}`);
    console.log(`📊 Com SJR: ${stats.withSJR}`);
    console.log(`📊 Com JCR: ${stats.withJCR}`);
    console.log(`📊 Com CiteScore: ${stats.withCiteScore}`);
    console.log(`📊 Predatórios: ${stats.withPredatory}`);
    
    console.log('\n💡 Próximos passos:');
    console.log('1. Execute: npm run build');
    console.log('2. Os dados serão carregados instantaneamente!');
    console.log('3. Tempo de carregamento: ~50-100ms ⚡⚡⚡');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  processABDCFile,
  processABSFile,
  processWileyFile,
  processSJRFile,
  processJCRFile,
  processCiteScoreFile,
  processPredatoryFile,
  unifyAllData,
  generateStats
};
