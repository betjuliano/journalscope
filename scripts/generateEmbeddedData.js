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
    path: 'data-sources/ABDC2022.csv',
    sheet: 'Sheet1',
    columns: {
      journal: 0,       // Title
      publisher: 1,     // Publisher
      field: 2,         // Field of Research
      rating: 3,        // Rating (A*, A, B, C)
      issn: 4,          // ISSN (print)
      issnOnline: 5,    // ISSN Online
      website: 6        // Website
    }
  },
  ABS: {
    path: 'data-sources/ABS2024.csv',
    sheet: 'Sheet1',
    columns: {
      issn: 0,          // ISSN
      journal: 2,       // TITLE
      rating: 4,        // AJG2024
      citationRank: 7,  // Citation rank 
      sjrRank: 9,       // SJR rank 
      jifRank: 10       // JIF Rank
    }
  },
  WILEY: {
    path: 'data-sources/Wiley.csv',
    sheet: 'Sheet1',
    columns: {
      journal: 0,        // Journal Title
      issn: 1,           // Online ISSN
      subject: 2,        // Subject Area
      apc: 4             // APC USD
    }
  },
  SJR: {
    path: 'data-sources/SJR2024.xlsx',
    sheet: 'SJR2024',
    columns: {
      journal: 0,        // Title Journal
      issn: -1,          // SJR não tem ISSN
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
    path: 'data-sources/CiteScore.csv',
    sheet: 'Sheet1',
    columns: {
      journal: 0,       // Source title
      issn: -1,         // CiteScore não tem ISSN
      score: 1,         // CiteScore
      snip: 6           // SNIP
    }
  },
  PREDATORY: {
    path: 'data-sources/Predatorio.csv',
    sheet: 'Sheet1',
    columns: {
      journal: 1,        // Journal name (índice 1)
      issn: -1,          // Predatory não tem ISSN
      isPredatory: 0     // Always predatory (índice 0 é o número)
    }
  }
};

/**
 * Processa arquivo ABDC
 */
function processABDCFile() {
  console.log('📊 Processando arquivo ABDC...');
  
  // Ler arquivo CSV diretamente
  const csvContent = fs.readFileSync(FILES_CONFIG.ABDC.path, 'utf8');
  const lines = csvContent.split('\n');
  
  const journals = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV com aspas corretamente
    const row = parseCSVLine(line, ',');
    if (row.length < 4) continue;
    
    const journal = row[FILES_CONFIG.ABDC.columns.journal];
    const rating = row[FILES_CONFIG.ABDC.columns.rating];
    const issnPrint = normalizeISSN(row[FILES_CONFIG.ABDC.columns.issn] || '');
    const issnOnline = normalizeISSN(row[FILES_CONFIG.ABDC.columns.issnOnline] || '');
    
    // Priorizar ISSN online, depois print
    const primaryISSN = issnOnline || issnPrint;
    
    // Validar que o rating é A*, A, B ou C
    if (journal && rating && ['A*', 'A', 'B', 'C'].includes(rating)) {
      journals[normalizeJournalName(journal)] = {
        issn: primaryISSN,
        issnPrint: issnPrint,
        issnOnline: issnOnline,
        rating: rating
      };
    }
  }
  
  console.log(`✅ ABDC processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Parse CSV line com aspas (suporta vírgula e ponto-e-vírgula como separadores)
 */
function parseCSVLine(line, separator = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      // Não adicionar a aspa ao conteúdo
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Adicionar último campo
  result.push(current.trim());
  
  return result;
}

/**
 * Processa arquivo ABS
 */
function processABSFile() {
  console.log('📊 Processando arquivo ABS...');
  
  // Ler arquivo CSV diretamente
  const csvContent = fs.readFileSync(FILES_CONFIG.ABS.path, 'utf8');
  const lines = csvContent.split('\n');
  
  const journals = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = parseCSVLine(line, ';');
    if (row.length < 5) continue;
    
    const issn = normalizeISSN(row[FILES_CONFIG.ABS.columns.issn] || '');
    const journal = row[FILES_CONFIG.ABS.columns.journal];
    const rating = row[FILES_CONFIG.ABS.columns.rating];
    
    if (journal && rating) {
      journals[normalizeJournalName(journal)] = {
        issn: issn || '',
        rating,
        citationRank: '',
        sjrRank: '',
        jifRank: ''
      };
    }
  }
  
  console.log(`✅ ABS processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Processa arquivo Wiley
 */
function processWileyFile() {
  console.log('📊 Processando arquivo Wiley...');
  
  // Ler arquivo CSV diretamente
  const csvContent = fs.readFileSync(FILES_CONFIG.WILEY.path, 'utf8');
  const lines = csvContent.split('\n');
  
  const journals = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV com aspas usando a função parseCSVLine
    const row = parseCSVLine(line, ';');
    
    if (row.length < 5) continue;
    
    const journal = row[FILES_CONFIG.WILEY.columns.journal];
    const issn = normalizeISSN(row[FILES_CONFIG.WILEY.columns.issn] || '');
    const subject = row[FILES_CONFIG.WILEY.columns.subject];
    const apc = row[FILES_CONFIG.WILEY.columns.apc];
    
    if (journal) {
      journals[normalizeJournalName(journal)] = {
        issn: issn || '',
        subjectArea: subject || "",
        apcUsd: apc || ""
      };
    }
  }
  
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
      journals[normalizeJournalName(journal)] = {
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
    const issn = normalizeISSN(row[FILES_CONFIG.JCR.columns.issn]?.toString().trim() || '');
    
    // Tratar vírgulas nos números (ex: "10,376" -> 10376)
    const citationsStr = row[FILES_CONFIG.JCR.columns.citations]?.toString().replace(/,/g, '') || '0';
    const citations = parseInt(citationsStr) || 0;
    
    const impactFactor = parseFloat(row[FILES_CONFIG.JCR.columns.impactFactor]) || 0;
    const quartile = row[FILES_CONFIG.JCR.columns.quartile]?.toString().trim();
    const jci = parseFloat(row[FILES_CONFIG.JCR.columns.jci]) || 0;
    const category = row[FILES_CONFIG.JCR.columns.category]?.toString().trim();
    
    if (journal) {
      journals[normalizeJournalName(journal)] = {
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
 * Processa arquivo CiteScore (com campos multi-linha)
 */
function processCiteScoreFile() {
  console.log('📊 Processando arquivo CiteScore...');
  
  // Ler arquivo CSV diretamente
  const csvContent = fs.readFileSync(FILES_CONFIG.CITESCORE.path, 'utf8');
  
  // CiteScore tem campos com quebras de linha dentro de aspas, então precisamos de um parser especial
  const journals = {};
  let currentLine = '';
  let inQuotes = false;
  let recordCount = 0;
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    }
    
    if (char === '\n' && !inQuotes) {
      // Fim de um registro completo
      if (currentLine.trim() && recordCount > 0) { // Pular cabeçalho
        const row = parseCSVLine(currentLine, ';');
        
        if (row.length >= 7) {
          const journal = row[FILES_CONFIG.CITESCORE.columns.journal];
          const scoreStr = row[FILES_CONFIG.CITESCORE.columns.score];
          const snipStr = row[FILES_CONFIG.CITESCORE.columns.snip];
          
          // Tratar valores "N/A" e vírgulas decimais (europeu: 54,9 -> 54.9)
          const score = (scoreStr && scoreStr !== 'N/A' && scoreStr !== '') ? parseFloat(scoreStr.replace(',', '.')) : 0;
          const snip = (snipStr && snipStr !== 'N/A' && snipStr !== '') ? parseFloat(snipStr.replace(',', '.')) : 0;
          
          if (journal && score > 0) {
            journals[normalizeJournalName(journal)] = {
              issn: '', // CiteScore não tem ISSN
              score,
              snip,
              year: 2024 // CiteScore 2024
            };
          }
        }
      }
      
      recordCount++;
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  // Processar última linha se existir
  if (currentLine.trim() && recordCount > 0) {
    const row = parseCSVLine(currentLine, ';');
    
    if (row.length >= 7) {
      const journal = row[FILES_CONFIG.CITESCORE.columns.journal];
      const scoreStr = row[FILES_CONFIG.CITESCORE.columns.score];
      const snipStr = row[FILES_CONFIG.CITESCORE.columns.snip];
      
      const score = (scoreStr && scoreStr !== 'N/A' && scoreStr !== '') ? parseFloat(scoreStr.replace(',', '.')) : 0;
      const snip = (snipStr && snipStr !== 'N/A' && snipStr !== '') ? parseFloat(snipStr.replace(',', '.')) : 0;
      
      if (journal && score > 0) {
        journals[normalizeJournalName(journal)] = {
          issn: '', // CiteScore não tem ISSN
          score,
          snip,
          year: 2024 // CiteScore 2024
        };
      }
    }
  }
  
  console.log(`✅ CiteScore processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Processa arquivo Predatory
 */
function processPredatoryFile() {
  console.log('📊 Processando arquivo Predatory...');
  
  // Ler arquivo CSV diretamente
  const csvContent = fs.readFileSync(FILES_CONFIG.PREDATORY.path, 'utf8');
  const lines = csvContent.split('\n');
  
  const journals = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = parseCSVLine(line, ',');
    if (row.length < 2) continue;
    
    const journal = row[FILES_CONFIG.PREDATORY.columns.journal];
    
    if (journal) {
      journals[normalizeJournalName(journal)] = {
        issn: '', // Predatory não tem ISSN
        isPredatory: true,
        source: 'The Predatory Journals List',
        reason: 'Listed as predatory journal',
        lastChecked: new Date().toISOString().split('T')[0]
      };
    }
  }
  
  console.log(`✅ Predatory processado: ${Object.keys(journals).length} journals`);
  return journals;
}

/**
 * Normaliza ISSN para formato XXXX-XXXX
 */
function normalizeISSN(issn) {
  if (!issn) return '';
  
  // Remove caracteres não numéricos exceto X
  const cleaned = issn.toString().replace(/[^0-9X]/g, '').toUpperCase();
  
  // Se tem 8 caracteres, adiciona hífen no meio
  if (cleaned.length === 8) {
    return cleaned.substring(0, 4) + '-' + cleaned.substring(4);
  }
  
  return cleaned;
}

/**
 * Valida ISSN usando algoritmo de dígito verificador
 */
function isValidISSN(issn) {
  const normalized = normalizeISSN(issn);
  
  // Verifica formato XXXX-XXXX
  if (!/^\d{4}-\d{3}[0-9X]$/.test(normalized)) {
    return false;
  }
  
  // Remove hífen e converte para array
  const digits = normalized.replace('-', '').split('');
  
  // Pesos para cálculo do dígito verificador
  const weights = [8, 7, 6, 5, 4, 3, 2];
  
  // Calcula soma ponderada
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(digits[i], 10) * weights[i];
  }
  
  // Calcula dígito verificador
  const remainder = sum % 11;
  const checkDigit = (11 - remainder) % 11;
  const expectedCheck = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  return digits[7] === expectedCheck;
}

/**
 * Normaliza nome do journal para comparação
 */
function normalizeJournalName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos (ã → a, ç → c, etc)
    .replace(/~/g, '') // Remove til (~)
    .replace(/ç/g, 'c') // Converte ç para c
    .trim();
}

/**
 * Calcula similaridade entre dois nomes de journals (0-1)
 * Usa distância de Levenshtein normalizada
 */
function calculateSimilarity(str1, str2) {
  const normalize = (s) => s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove tudo exceto letras e números
    .replace(/\s+/g, '');
  
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Distância de Levenshtein
  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // remoção
        );
      }
    }
  }
  
  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (distance / maxLength);
}

/**
 * Verifica se dois nomes de journals são similares o suficiente para serem considerados o mesmo
 */
function areSimilarJournals(name1, name2) {
  const similarity = calculateSimilarity(name1, name2);
  const threshold = 0.85; // 85% de similaridade
  
  // Casos especiais de prefixos comuns
  const n1 = name1.toLowerCase().replace(/[^a-z]/g, '');
  const n2 = name2.toLowerCase().replace(/[^a-z]/g, '');
  
  // Se um contém o outro completamente (ex: "RBGN" vs "Revista Brasileira")
  if (n1.includes(n2) || n2.includes(n1)) {
    if (Math.abs(n1.length - n2.length) / Math.max(n1.length, n2.length) < 0.3) {
      return true;
    }
  }
  
  // Casos especiais: verificar se um é a sigla do outro
  // Ex: "RBGN-Revista Brasileira De Gestao" vs "Revista Brasileira De Gestao"
  const words1 = name1.toLowerCase().split(/[\s\-]+/).filter(w => w.length > 2);
  const words2 = name2.toLowerCase().split(/[\s\-]+/).filter(w => w.length > 2);
  
  // Se ambos têm pelo menos 3 palavras significativas, verificar se são muito similares
  if (words1.length >= 3 && words2.length >= 3) {
    const commonWords = words1.filter(w => words2.includes(w));
    const similarityByWords = commonWords.length / Math.min(words1.length, words2.length);
    if (similarityByWords >= 0.75) {
      return true;
    }
  }
  
  // Extrair possível sigla no início (até o primeiro hífen ou espaço grande)
  const extractAcronym = (str) => {
    const match = str.match(/^([A-Z]{2,6})[\s\-]/i);
    return match ? match[1].toLowerCase() : null;
  };
  
  const acronym1 = extractAcronym(name1);
  const acronym2 = extractAcronym(name2);
  
  // Se um tem sigla e o outro não, verificar se a sigla corresponde às iniciais
  if ((acronym1 && !acronym2) || (!acronym1 && acronym2)) {
    const acronym = acronym1 || acronym2;
    const fullName = acronym1 ? name2 : name1;
    const initials = fullName.toLowerCase()
      .split(/[\s\-]+/)
      .filter(w => w.length > 2 && !['de', 'da', 'do', 'dos', 'das', 'e', 'the', 'of', 'and', 'for'].includes(w))
      .map(w => w[0])
      .join('');
    
    if (initials === acronym.toLowerCase()) {
      return true;
    }
  }
  
  return similarity >= threshold;
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
 * Deduplica journals por ISSN válido e similaridade de nomes
 */
function deduplicateByISSN(allJournals) {
  console.log('🔄 Aplicando deduplicação por ISSN e similaridade de nomes...');
  
  const issnGroups = new Map();
  const issnToGroupMap = new Map(); // Mapeia cada ISSN para o grupo
  const journalsWithoutISSN = [];
  
  // Agrupar por ISSN válido (considerando todos os ISSNs de um journal)
  for (const journal of allJournals) {
    const issns = journal.allISSNs ? journal.allISSNs.split(',').map(i => i.trim()).filter(i => i && isValidISSN(i)) : [];
    
    // Se não tem ISSN válido, adicionar à lista de sem ISSN
    if (issns.length === 0) {
      if (journal.issn && isValidISSN(journal.issn)) {
        issns.push(journal.issn);
      } else {
        journalsWithoutISSN.push(journal);
        continue;
      }
    }
    
    // Verificar se algum dos ISSNs já pertence a um grupo
    let existingGroupKey = null;
    for (const issn of issns) {
      if (issnToGroupMap.has(issn)) {
        existingGroupKey = issnToGroupMap.get(issn);
        break;
      }
    }
    
    // Se encontrou um grupo existente, adicionar a ele
    if (existingGroupKey) {
      issnGroups.get(existingGroupKey).push(journal);
      // Mapear todos os ISSNs deste journal para o mesmo grupo
      for (const issn of issns) {
        if (!issnToGroupMap.has(issn)) {
          issnToGroupMap.set(issn, existingGroupKey);
        }
      }
    } else {
      // Criar novo grupo com o primeiro ISSN válido
      const groupKey = issns[0];
      issnGroups.set(groupKey, [journal]);
      // Mapear todos os ISSNs deste journal para este novo grupo
      for (const issn of issns) {
        issnToGroupMap.set(issn, groupKey);
      }
    }
  }
  
  const deduplicatedJournals = [];
  let duplicateCountByISSN = 0;
  let duplicateCountByName = 0;
  
  // Processar grupos com ISSN
  for (const [issn, journals] of issnGroups) {
    if (journals.length === 1) {
      // ISSN único, não é duplicata
      deduplicatedJournals.push(journals[0]);
    } else {
      // ISSN duplicado, consolidar
      duplicateCountByISSN += journals.length - 1;
      
      // Coletar todos os ISSNs únicos
      const allConsolidatedISSNs = [...new Set(journals.flatMap(j => {
        const issns = [];
        if (j.issn) issns.push(j.issn);
        if (j.allISSNs) issns.push(...j.allISSNs.split(',').map(i => i.trim()));
        return issns;
      }).filter(i => i && isValidISSN(i)))];
      
      // Consolidar dados de todas as fontes
      const consolidated = {
        journal: journals[0].journal, // Nome do primeiro journal encontrado
        issn: issn,
        allISSNs: allConsolidatedISSNs.join(', '),
        isDuplicate: true,
        duplicateCount: journals.length,
        duplicateSources: journals.map(j => j.source || 'Unknown'),
        // Consolidar classificações (pegar a primeira não vazia)
        abdc: journals.find(j => j.abdc)?.abdc || '',
        abs: journals.find(j => j.abs)?.abs || '',
        wileySubject: journals.find(j => j.wileySubject)?.wileySubject || '',
        wileyAPC: journals.find(j => j.wileyAPC)?.wileyAPC || '',
        sjr: journals.find(j => j.sjr)?.sjr || null,
        jcr: journals.find(j => j.jcr)?.jcr || null,
        citeScore: journals.find(j => j.citeScore)?.citeScore || null,
        predatory: journals.find(j => j.predatory)?.predatory || null,
        sources: [...new Set(journals.flatMap(j => j.sources || []))],
        lastUpdated: new Date().toISOString(),
        dataQuality: 'high' // Múltiplas fontes = alta qualidade
      };
      
      deduplicatedJournals.push(consolidated);
    }
  }
  
  // Deduplicar journals sem ISSN por similaridade de nomes
  console.log('🔄 Aplicando deduplicação por similaridade de nomes...');
  const processedJournals = [];
  const usedIndices = new Set();
  
  // Criar índice por primeiras palavras significativas para acelerar busca
  const withISSNIndex = new Map();
  for (const journal of deduplicatedJournals) {
    const words = journal.journal.toLowerCase().split(/[\s\-]+/).filter(w => w.length > 2);
    
    // Adicionar no índice pela primeira palavra
    if (words.length > 0) {
      const firstWord = words[0];
      if (!withISSNIndex.has(firstWord)) {
        withISSNIndex.set(firstWord, []);
      }
      withISSNIndex.get(firstWord).push(journal);
    }
    
    // Se a primeira palavra parece ser uma sigla (curta, 2-6 letras), adicionar também pela segunda palavra
    if (words.length > 1) {
      const firstWord = words[0];
      const secondWord = words[1];
      // Verificar se é sigla: palavra curta (2-6 letras)
      if (firstWord.length >= 2 && firstWord.length <= 6) {
        if (!withISSNIndex.has(secondWord)) {
          withISSNIndex.set(secondWord, []);
        }
        if (!withISSNIndex.get(secondWord).includes(journal)) {
          withISSNIndex.get(secondWord).push(journal);
        }
      }
    }
  }
  
  for (let i = 0; i < journalsWithoutISSN.length; i++) {
    if (usedIndices.has(i)) continue;
    
    const current = journalsWithoutISSN[i];
    const words = current.journal.toLowerCase().split(/[\s\-]+/).filter(w => w.length > 2);
    
    // Procurar journals similares pelos índices de primeira e segunda palavra (caso seja sigla)
    const candidates = new Set();
    if (words.length > 0) {
      const firstWordCandidates = withISSNIndex.get(words[0]) || [];
      firstWordCandidates.forEach(j => candidates.add(j));
    }
    if (words.length > 1) {
      const secondWordCandidates = withISSNIndex.get(words[1]) || [];
      secondWordCandidates.forEach(j => candidates.add(j));
    }
    
    let found = false;
    
    for (const journalWithISSN of candidates) {
      if (areSimilarJournals(current.journal, journalWithISSN.journal)) {
        // Consolidar com o journal que tem ISSN (pegar a PRIMEIRA classificação não vazia)
        journalWithISSN.abdc = journalWithISSN.abdc || current.abdc || '';
        journalWithISSN.abs = journalWithISSN.abs || current.abs || '';
        journalWithISSN.wileySubject = journalWithISSN.wileySubject || current.wileySubject || '';
        journalWithISSN.wileyAPC = journalWithISSN.wileyAPC || current.wileyAPC || '';
        journalWithISSN.sjr = journalWithISSN.sjr || current.sjr || null;
        journalWithISSN.jcr = journalWithISSN.jcr || current.jcr || null;
        journalWithISSN.citeScore = journalWithISSN.citeScore || current.citeScore || null;
        journalWithISSN.predatory = journalWithISSN.predatory || current.predatory || null;
        
        // Adicionar ISSNs se o journal sem ISSN tiver algum
        if (current.allISSNs && current.allISSNs.trim()) {
          const existingISSNs = journalWithISSN.allISSNs ? journalWithISSN.allISSNs.split(',').map(i => i.trim()) : [journalWithISSN.issn].filter(i => i);
          const newISSNs = current.allISSNs.split(',').map(i => i.trim()).filter(i => i);
          const combinedISSNs = [...new Set([...existingISSNs, ...newISSNs])].filter(i => i);
          journalWithISSN.allISSNs = combinedISSNs.join(', ');
        }
        
        // Adicionar fontes
        const currentSources = current.sources || [];
        journalWithISSN.sources = [...new Set([...journalWithISSN.sources, ...currentSources])];
        
        // Atualizar qualidade de dados
        if (journalWithISSN.sources.length >= 3) journalWithISSN.dataQuality = 'high';
        else if (journalWithISSN.sources.length >= 2) journalWithISSN.dataQuality = 'medium';
        
        console.log(`   ✓ Consolidado "${current.journal}" com "${journalWithISSN.journal}" (ISSN: ${journalWithISSN.issn})`);
        
        duplicateCountByName++;
        usedIndices.add(i);
        found = true;
        break;
      }
    }
    
    // Se não encontrou, adicionar aos processados
    if (!found) {
      processedJournals.push(current);
    }
  }
  
  // Adicionar journals sem ISSN processados
  deduplicatedJournals.push(...processedJournals);
  
  const totalDuplicates = duplicateCountByISSN + duplicateCountByName;
  console.log(`✅ Deduplicação concluída: ${deduplicatedJournals.length} journals únicos`);
  console.log(`   - Por ISSN: ${duplicateCountByISSN} duplicatas removidas`);
  console.log(`   - Por similaridade: ${duplicateCountByName} duplicatas removidas`);
  console.log(`   - Total: ${totalDuplicates} duplicatas removidas`);
  
  return deduplicatedJournals;
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
    
    // Coletar todos os ISSNs disponíveis
    const allISSNs = [];
    if (jcrInfo.issn) allISSNs.push(jcrInfo.issn);
    if (absInfo.issn && !allISSNs.includes(absInfo.issn)) allISSNs.push(absInfo.issn);
    if (wileyInfo.issn && !allISSNs.includes(wileyInfo.issn)) allISSNs.push(wileyInfo.issn);
    if (typeof abdcRating === 'object') {
      if (abdcRating.issn && !allISSNs.includes(abdcRating.issn)) allISSNs.push(abdcRating.issn);
      if (abdcRating.issnPrint && !allISSNs.includes(abdcRating.issnPrint)) allISSNs.push(abdcRating.issnPrint);
      if (abdcRating.issnOnline && !allISSNs.includes(abdcRating.issnOnline)) allISSNs.push(abdcRating.issnOnline);
    }
    
    // Determinar ISSN prioritário (JCR > ABS > ABDC > Wiley)
    const primaryISSN = allISSNs[0] || '';
    const allISSNsString = allISSNs.filter(issn => issn).join(', ');
    
    unifiedData.push({
      journal: capitalizeJournalName(journalKey),
      issn: primaryISSN,
      allISSNs: allISSNsString,  // Todos os ISSNs encontrados
      abdc: (typeof abdcRating === 'object' && abdcRating?.rating) ? abdcRating.rating : abdcRating || "",
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
        issn: jcrInfo.issn || '',
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
  
  // Aplicar deduplicação por ISSN e similaridade
  const beforeDedup = unifiedData.length;
  const deduplicatedData = deduplicateByISSN(unifiedData);
  const afterDedup = deduplicatedData.length;
  const duplicatesRemoved = beforeDedup - afterDedup;
  
  // Ordenar por nome
  deduplicatedData.sort((a, b) => a.journal.localeCompare(b.journal));
  
  console.log(`✅ Dados unificados e deduplicados: ${deduplicatedData.length} journals únicos`);
  return { data: deduplicatedData, duplicatesRemoved };
}

/**
 * Gera estatísticas dos dados expandidas para 7 fontes
 */
function generateStats(data, duplicatesRemoved = 0) {
  const stats = {
    total: data.length,
    withISSN: data.filter(j => j.issn && j.issn !== '').length,
    duplicates: duplicatesRemoved,
    duplicateCount: data.reduce((sum, j) => sum + (j.duplicateCount || 0), 0),
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
 * Valida estrutura dos arquivos Excel e CSV
 */
function validateExcelStructure() {
  console.log('🔍 Validando estrutura dos arquivos Excel e CSV...');
  const validationResults = {};
  
  for (const [name, config] of Object.entries(FILES_CONFIG)) {
    try {
      // Verificar se é arquivo CSV ou Excel
      const isCSV = config.path.endsWith('.csv');
      
      if (isCSV) {
        // Validar arquivo CSV
        const csvContent = fs.readFileSync(config.path, 'utf8');
        const lines = csvContent.split('\n');
        
        validationResults[name] = {
          type: 'CSV',
          totalRows: lines.length,
          hasData: lines.length > 1,
          status: 'OK'
        };
        
        console.log(`✅ ${name}: Arquivo CSV encontrado (${lines.length} linhas)`);
      } else {
        // Validar arquivo Excel
        const workbook = XLSX.readFile(config.path);
        const hasSheet = workbook.SheetNames.includes(config.sheet);
        
        validationResults[name] = {
          type: 'Excel',
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
    
    // 5. Unificar dados de todas as 7 fontes
    const unifiedResult = unifyAllData(abdcJournals, absJournals, wileyJournals, sjrJournals, jcrJournals, citeScoreJournals, predatoryJournals);
    const unifiedData = unifiedResult.data;
    const duplicatesRemoved = unifiedResult.duplicatesRemoved;
    
    // Gerar estatísticas
    const stats = generateStats(unifiedData, duplicatesRemoved);
    
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
    console.log(`📊 Total de journals únicos: ${unifiedData.length}`);
    console.log(`📊 Com ISSN: ${stats.withISSN}`);
    console.log(`📊 Duplicatas encontradas: ${stats.duplicates} (${stats.duplicateCount} registros consolidados)`);
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
