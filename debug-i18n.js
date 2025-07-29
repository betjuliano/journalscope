// Script para debugar problema de internacionalização

// Importar traduções
import ptTranslations from './src/translations/pt.js';
import enTranslations from './src/translations/en.js';

console.log('=== DEBUG INTERNACIONALIZAÇÃO ===');

console.log('\n1. Verificando arquivos de tradução:');
console.log('PT - Hero subtitle:', ptTranslations.hero.subtitle);
console.log('EN - Hero subtitle:', enTranslations.hero.subtitle);

console.log('\n2. Verificando tabela:');
console.log('PT - Table results:', ptTranslations.table?.results || 'NÃO ENCONTRADO');
console.log('EN - Table results:', enTranslations.table?.results || 'NÃO ENCONTRADO');

console.log('\n3. Verificando labels:');
console.log('PT - Search label:', ptTranslations.filters.search.label);
console.log('EN - Search label:', enTranslations.filters.search.label);

console.log('\n4. Verificando se há inversão:');
const ptHasEnglish = ptTranslations.hero.subtitle.includes('Integrated');
const enHasPortuguese = enTranslations.hero.subtitle.includes('Sistema');

console.log('PT tem texto em inglês:', ptHasEnglish);
console.log('EN tem texto em português:', enHasPortuguese);

if (ptHasEnglish || enHasPortuguese) {
    console.log('🚨 PROBLEMA DETECTADO: Textos invertidos nos arquivos de tradução!');
} else {
    console.log('✅ Arquivos de tradução parecem corretos');
}