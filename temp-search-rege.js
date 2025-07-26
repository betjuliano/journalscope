const XLSX = require('xlsx');

console.log('🔍 Procurando pela REGE nos arquivos Excel...\n');

// Procurar no ABS
try {
  const workbook = XLSX.readFile('data-sources/ABS2024.xlsx');
  const sheet = workbook.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('📊 Procurando no ABS2024.xlsx...');
  data.forEach((row, index) => {
    if (row[1] && row[1].toString().toLowerCase().includes('rege')) {
      console.log(`   Linha ${index}: ${row[1]} | ABS: ${row[2]}`);
    }
    if (row[1] && row[1].toString().toLowerCase().includes('gestao')) {
      console.log(`   Linha ${index}: ${row[1]} | ABS: ${row[2]}`);
    }
    if (row[1] && row[1].toString().toLowerCase().includes('gestão')) {
      console.log(`   Linha ${index}: ${row[1]} | ABS: ${row[2]}`);
    }
  });
} catch (e) {
  console.log('❌ Erro ao ler ABS:', e.message);
}

// Procurar no SJR
try {
  const workbook = XLSX.readFile('data-sources/SJR2024.xlsx');
  const sheet = workbook.Sheets['SJR2024'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('\n📊 Procurando no SJR2024.xlsx...');
  data.forEach((row, index) => {
    if (row[0] && row[0].toString().toLowerCase().includes('rege')) {
      console.log(`   Linha ${index}: ${row[0]} | SJR: ${row[1]} | Quartile: ${row[2]}`);
    }
    if (row[0] && row[0].toString().toLowerCase().includes('gestao')) {
      console.log(`   Linha ${index}: ${row[0]} | SJR: ${row[1]} | Quartile: ${row[2]}`);
    }
    if (row[0] && row[0].toString().toLowerCase().includes('gestão')) {
      console.log(`   Linha ${index}: ${row[0]} | SJR: ${row[1]} | Quartile: ${row[2]}`);
    }
  });
} catch (e) {
  console.log('❌ Erro ao ler SJR:', e.message);
}

// Procurar no JCR
try {
  const workbook = XLSX.readFile('data-sources/JCR2024.xlsx');
  const sheet = workbook.Sheets['undefined_JCR_JournalResults_0'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('\n📊 Procurando no JCR2024.xlsx...');
  data.forEach((row, index) => {
    if (row[0] && row[0].toString().toLowerCase().includes('rege')) {
      console.log(`   Linha ${index}: ${row[0]} | JIF: ${row[3]} | Quartile: ${row[4]}`);
    }
    if (row[0] && row[0].toString().toLowerCase().includes('gestao')) {
      console.log(`   Linha ${index}: ${row[0]} | JIF: ${row[3]} | Quartile: ${row[4]}`);
    }
    if (row[0] && row[0].toString().toLowerCase().includes('gestão')) {
      console.log(`   Linha ${index}: ${row[0]} | JIF: ${row[3]} | Quartile: ${row[4]}`);
    }
  });
} catch (e) {
  console.log('❌ Erro ao ler JCR:', e.message);
}

console.log('\n✅ Busca concluída!');