/**
 * Script para importar periódicos em lote para o Supabase
 * 
 * Como usar:
 * 1. Certifique-se de que a migration foi executada
 * 2. Tenha seus dados de periódicos em um array
 * 3. Execute este script
 */

import { bulkImportJournals } from '../services/journalService';

/**
 * Importar periódicos de um arquivo JSON
 * @param {string} filePath - Caminho para o arquivo JSON
 */
export async function importJournalsFromFile(filePath) {
    try {
        console.log('📚 Iniciando importação de periódicos...');
        console.log(`📁 Arquivo: ${filePath}`);

        // Importar dados do arquivo
        const journalsData = await import(filePath);
        const journals = Array.isArray(journalsData.default)
            ? journalsData.default
            : journalsData;

        console.log(`📊 Total de periódicos a importar: ${journals.length}`);

        // Importar em lotes de 100 para evitar timeout
        const batchSize = 100;
        let totalImported = 0;
        let totalErrors = 0;

        for (let i = 0; i < journals.length; i += batchSize) {
            const batch = journals.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(journals.length / batchSize);

            console.log(`\n🔄 Processando lote ${batchNumber}/${totalBatches} (${batch.length} periódicos)...`);

            const result = await bulkImportJournals(batch);

            if (result.success) {
                totalImported += result.imported;
                console.log(`✅ Lote ${batchNumber} importado com sucesso: ${result.imported} periódicos`);
            } else {
                totalErrors += batch.length;
                console.error(`❌ Erro no lote ${batchNumber}: ${result.error}`);
            }

            // Pequeno delay entre lotes
            if (i + batchSize < journals.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📈 RESUMO DA IMPORTAÇÃO');
        console.log('='.repeat(50));
        console.log(`✅ Total importado: ${totalImported}`);
        console.log(`❌ Total com erro: ${totalErrors}`);
        console.log(`📊 Total processado: ${journals.length}`);
        console.log('='.repeat(50));

        return {
            success: totalErrors === 0,
            totalImported,
            totalErrors,
            total: journals.length
        };

    } catch (error) {
        console.error('❌ Erro fatal na importação:', error);
        throw error;
    }
}

/**
 * Importar periódicos de um array
 * @param {Array} journals - Array de periódicos
 */
export async function importJournalsFromArray(journals) {
    try {
        console.log('📚 Iniciando importação de periódicos...');
        console.log(`📊 Total de periódicos a importar: ${journals.length}`);

        const result = await bulkImportJournals(journals);

        if (result.success) {
            console.log(`✅ Sucesso! ${result.imported} periódicos importados.`);
        } else {
            console.error(`❌ Erro: ${result.error}`);
        }

        return result;

    } catch (error) {
        console.error('❌ Erro na importação:', error);
        throw error;
    }
}

/**
 * Exemplo de uso com dados de exemplo
 */
export async function importExampleJournals() {
    const exampleJournals = [
        {
            name: 'Journal of Business Research',
            abdc: 'A',
            abs: '3',
            sjr: {
                quartile: 'Q1',
                score: 1.234,
                hIndex: 150
            },
            jcr: {
                quartile: 'Q1',
                impactFactor: 4.567,
                issn: '0148-2963'
            },
            qualis: 'MB',
            predatory: {
                isPredatory: false
            },
            wileySubject: 'Business & Management'
        },
        {
            name: 'International Journal of Production Economics',
            abdc: 'A*',
            abs: '4',
            sjr: {
                quartile: 'Q1',
                score: 2.345,
                hIndex: 180
            },
            jcr: {
                quartile: 'Q1',
                impactFactor: 5.678,
                issn: '0925-5273'
            },
            qualis: 'MB',
            predatory: {
                isPredatory: false
            },
            wileySubject: 'Operations & Supply Chain Management'
        }
    ];

    return await importJournalsFromArray(exampleJournals);
}

// Se executado diretamente (não como módulo)
if (import.meta.url === `file://${process.argv[1]}`) {
    importExampleJournals()
        .then(result => {
            console.log('\n✅ Importação concluída!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Falha na importação:', error);
            process.exit(1);
        });
}

export default {
    importJournalsFromFile,
    importJournalsFromArray,
    importExampleJournals
};
