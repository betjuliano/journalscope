/**
 * Script para importar periódicos do embeddedJournals.json para o Supabase
 * 
 * Uso:
 * node src/utils/importJournalsFromFile.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Calcular Qualis baseado nas classificações
 */
function calculateQualis(journal) {
    const abdc = journal.abdc;
    const abs = journal.abs;
    const jcrQuartile = journal.jcr?.quartile;
    const sjrQuartile = journal.sjr?.quartile;

    // MB: ABDC = A/A* OU ABS ≥ 2 OU JCR = Q1 OU SJR = Q1
    if (
        abdc === 'A' || abdc === 'A*' ||
        (abs && (abs === '2' || abs === '3' || abs === '4' || abs === '4*')) ||
        jcrQuartile === 'Q1' ||
        sjrQuartile === 'Q1'
    ) {
        return 'MB';
    }

    // B: ABDC = B OU ABS = 1 OU JCR = Q2 OU SJR = Q2
    if (
        abdc === 'B' ||
        abs === '1' ||
        jcrQuartile === 'Q2' ||
        sjrQuartile === 'Q2'
    ) {
        return 'B';
    }

    // R: ABDC = C OU JCR = Q3 OU SJR = Q3
    if (
        abdc === 'C' ||
        jcrQuartile === 'Q3' ||
        sjrQuartile === 'Q3'
    ) {
        return 'R';
    }

    // F: JCR = Q4 OU SJR = Q4
    if (jcrQuartile === 'Q4' || sjrQuartile === 'Q4') {
        return 'F';
    }

    return '-';
}

/**
 * Transformar journal do formato do arquivo para o formato do banco
 */
function transformJournal(journal) {
    return {
        name: journal.journal,
        abdc: journal.abdc || null,
        abs: journal.abs || null,
        sjr_quartile: journal.sjr?.quartile || null,
        sjr_score: journal.sjr?.score || null,
        sjr_h_index: journal.sjr?.hIndex || null,
        jcr_quartile: journal.jcr?.quartile || null,
        jcr_impact_factor: journal.jcr?.impactFactor || null,
        jcr_issn: journal.jcr?.issn || null,
        qualis: calculateQualis(journal),
        is_predatory: journal.predatory?.isPredatory || false,
        wiley_subject: journal.wileySubject || null
    };
}

/**
 * Importar periódicos em lotes
 */
async function importJournals() {
    try {
        console.log('📚 Iniciando importação de periódicos...\n');

        // Ler arquivo JSON
        const filePath = path.join(__dirname, '../data/embeddedJournals.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const journalsData = JSON.parse(fileContent);

        const journals = journalsData.data;
        console.log(`📊 Total de periódicos no arquivo: ${journals.length}`);
        console.log(`📈 Estatísticas:`);
        console.log(`   - Com ABDC: ${journalsData.stats.withABDC}`);
        console.log(`   - Com ABS: ${journalsData.stats.withABS}`);
        console.log(`   - Com SJR: ${journalsData.stats.withSJR}`);
        console.log(`   - Com JCR: ${journalsData.stats.withJCR}`);
        console.log(`   - Predatórios: ${journalsData.stats.withPredatory}`);
        console.log('');

        // Processar em lotes de 100
        const batchSize = 100;
        let totalImported = 0;
        let totalErrors = 0;
        let totalSkipped = 0;

        for (let i = 0; i < journals.length; i += batchSize) {
            const batch = journals.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(journals.length / batchSize);

            console.log(`🔄 Processando lote ${batchNumber}/${totalBatches} (${batch.length} periódicos)...`);

            // Transformar dados
            const transformedBatch = batch.map(transformJournal);

            // Inserir no Supabase
            const { data, error } = await supabase
                .from('journals')
                .upsert(transformedBatch, {
                    onConflict: 'name',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`   ❌ Erro no lote ${batchNumber}:`, error.message);
                totalErrors += batch.length;
            } else {
                totalImported += batch.length;
                console.log(`   ✅ Lote ${batchNumber} processado`);
            }

            // Pequeno delay entre lotes para não sobrecarregar
            if (i + batchSize < journals.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Resumo final
        console.log('\n' + '='.repeat(60));
        console.log('📈 RESUMO DA IMPORTAÇÃO');
        console.log('='.repeat(60));
        console.log(`✅ Total processado: ${totalImported}`);
        console.log(`❌ Total com erro: ${totalErrors}`);
        console.log(`📊 Total no arquivo: ${journals.length}`);
        console.log('='.repeat(60));

        // Verificar no banco
        const { count, error: countError } = await supabase
            .from('journals')
            .select('*', { count: 'exact', head: true });

        if (!countError) {
            console.log(`\n📚 Total de periódicos no banco: ${count}`);
        }

        console.log('\n✅ Importação concluída!');

    } catch (error) {
        console.error('❌ Erro fatal na importação:', error);
        process.exit(1);
    }
}

// Executar
importJournals()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Falha:', error);
        process.exit(1);
    });
