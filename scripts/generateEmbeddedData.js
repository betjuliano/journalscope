/**
 * Script para gerar dados embarcados (embedded) dos arquivos Excel
 * Converte os arquivos Excel em JSON otimizado para carregamento instantâneo
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuração dos arquivos
const FILES_CONFIG = {
  ABDC: {
    path: 'public/data/ABDC2022.xlsx',
    sheet: '2022 JQL',
    columns: {
      journal: 0,
      rating: 6
    }
  },
  ABS: {
    path: 'public/data/ABS2024.xlsx',
    sheet: 'Sheet1',
    columns: {
      journal: 1,
      rating: 2
    }
  },
  WILEY: {
    path: 'public/data/Wiley.xlsx',
    sheet: 'Hybrid OA Journals Updated',
    columns: {
      journal: 0,
      subject: 2,
      apc: 4
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
    const rating = row[FILES_CONFIG.ABS.columns.rating]?.toString().trim();
    
    if (journal && rating) {
      journals[journal.toLowerCase()] = rating;
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
 * Capitaliza nome do journal
 */
function capitalizeJournalName(journalKey) {
  return journalKey
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Unifica todos os dados
 */
function unifyAllData(abdcJournals, absJournals, wileyJournals) {
  console.log('🔄 Unificando dados...');
  
  const allJournalNames = new Set([
    ...Object.keys(abdcJournals),
    ...Object.keys(absJournals),
    ...Object.keys(wileyJournals)
  ]);
  
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
  
  console.log(`✅ Dados unificados: ${unifiedData.length} journals únicos`);
  return unifiedData;
}

/**
 * Gera estatísticas dos dados
 */
function generateStats(data) {
  const stats = {
    total: data.length,
    withABDC: data.filter(j => j.abdc).length,
    withABS: data.filter(j => j.abs).length,
    withWiley: data.filter(j => j.wileySubject).length,
    abdcDistribution: {},
    absDistribution: {}
  };
  
  data.forEach(journal => {
    if (journal.abdc) {
      stats.abdcDistribution[journal.abdc] = (stats.abdcDistribution[journal.abdc] || 0) + 1;
    }
    if (journal.abs) {
      stats.absDistribution[journal.abs] = (stats.absDistribution[journal.abs] || 0) + 1;
    }
  });
  
  return stats;
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando geração de dados embarcados...\n');
    
    // Verificar se arquivos existem
    for (const [name, config] of Object.entries(FILES_CONFIG)) {
      if (!fs.existsSync(config.path)) {
        throw new Error(`Arquivo ${name} não encontrado: ${config.path}`);
      }
    }
    
    // Processar arquivos
    const abdcJournals = processABDCFile();
    const absJournals = processABSFile();
    const wileyJournals = processWileyFile();
    
    // Unificar dados
    const unifiedData = unifyAllData(abdcJournals, absJournals, wileyJournals);
    
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
  unifyAllData,
  generateStats
};
