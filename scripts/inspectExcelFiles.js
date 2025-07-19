/**
 * Script para inspecionar estrutura dos arquivos Excel
 * Ajuda a identificar colunas e estrutura dos dados
 */

const XLSX = require('xlsx');
const fs = require('fs');

const files = [
  { name: 'ABDC', path: 'data-sources/ABDC2022.xlsx' },
  { name: 'ABS', path: 'data-sources/ABS2024.xlsx' },
  { name: 'WILEY', path: 'data-sources/Wiley.xlsx' },
  { name: 'SJR', path: 'data-sources/SJR2024.xlsx' },
  { name: 'JCR', path: 'data-sources/JCR2024.xlsx' },
  { name: 'CiteScore', path: 'data-sources/CiteScore.xlsx' },
  { name: 'Predatory', path: 'data-sources/Predatorio.xlsx' }
];

function inspectFile(fileName, filePath) {
  console.log(`\n📊 Inspecionando ${fileName}: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }
  
  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`📋 Planilhas disponíveis: ${workbook.SheetNames.join(', ')}`);
    
    // Inspecionar primeira planilha
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`📄 Planilha principal: "${firstSheetName}"`);
    console.log(`📏 Total de linhas: ${data.length}`);
    
    if (data.length > 0) {
      console.log(`🏷️  Cabeçalhos (primeira linha):`);
      data[0].forEach((header, index) => {
        if (header) {
          console.log(`   [${index}] ${header}`);
        }
      });
      
      console.log(`\n📝 Exemplo de dados (segunda linha):`);
      if (data.length > 1 && data[1]) {
        data[1].forEach((value, index) => {
          if (value !== undefined && value !== null && value !== '') {
            console.log(`   [${index}] ${value}`);
          }
        });
      }
      
      console.log(`\n📊 Primeiras 3 linhas completas:`);
      data.slice(0, 3).forEach((row, rowIndex) => {
        console.log(`   Linha ${rowIndex}: [${row.slice(0, 10).join(' | ')}]`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Erro ao processar ${fileName}: ${error.message}`);
  }
}

// Inspecionar todos os arquivos
files.forEach(file => {
  inspectFile(file.name, file.path);
});

console.log('\n✅ Inspeção concluída!');