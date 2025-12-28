import { supabase } from '../lib/supabase';

/**
 * Serviço para gerenciar periódicos no Supabase
 */

/**
 * Buscar todos os periódicos
 * @param {Object} options - Opções de busca
 * @param {string} options.search - Termo de busca
 * @param {number} options.limit - Limite de resultados
 * @returns {Promise<Array>} Lista de periódicos
 */
export const getJournals = async ({ search = '', limit = 100 } = {}) => {
    try {
        let query = supabase
            .from('journals')
            .select('*')
            .order('name', { ascending: true });

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('[JournalService] Error fetching journals:', error);
        return [];
    }
};

/**
 * Buscar periódico por nome exato
 * @param {string} name - Nome do periódico
 * @returns {Promise<Object|null>} Periódico encontrado ou null
 */
export const getJournalByName = async (name) => {
    try {
        const { data, error } = await supabase
            .from('journals')
            .select('*')
            .eq('name', name)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Não encontrado
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('[JournalService] Error fetching journal by name:', error);
        return null;
    }
};

/**
 * Criar ou atualizar periódico
 * @param {Object} journalData - Dados do periódico
 * @returns {Promise<Object>} Periódico criado/atualizado
 */
export const upsertJournal = async (journalData) => {
    try {
        const { data, error } = await supabase
            .from('journals')
            .upsert({
                name: journalData.name || journalData.journal,
                abdc: journalData.abdc,
                abs: journalData.abs,
                sjr_quartile: journalData.sjr?.quartile,
                sjr_score: journalData.sjr?.score,
                sjr_h_index: journalData.sjr?.hIndex,
                jcr_quartile: journalData.jcr?.quartile,
                jcr_impact_factor: journalData.jcr?.impactFactor,
                jcr_issn: journalData.jcr?.issn,
                qualis: journalData.qualis,
                is_predatory: journalData.predatory?.isPredatory || false,
                wiley_subject: journalData.wileySubject
            }, {
                onConflict: 'name',
                returning: 'representation'
            })
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('[JournalService] Error upserting journal:', error);
        throw error;
    }
};

/**
 * Importar lista de periódicos em lote
 * @param {Array} journals - Lista de periódicos
 * @returns {Promise<Object>} Resultado da importação
 */
export const bulkImportJournals = async (journals) => {
    try {
        const journalsToImport = journals.map(journal => ({
            name: journal.name || journal.journal,
            abdc: journal.abdc,
            abs: journal.abs,
            sjr_quartile: journal.sjr?.quartile,
            sjr_score: journal.sjr?.score,
            sjr_h_index: journal.sjr?.hIndex,
            jcr_quartile: journal.jcr?.quartile,
            jcr_impact_factor: journal.jcr?.impactFactor,
            jcr_issn: journal.jcr?.issn,
            qualis: journal.qualis,
            is_predatory: journal.predatory?.isPredatory || false,
            wiley_subject: journal.wileySubject
        }));

        const { data, error } = await supabase
            .from('journals')
            .upsert(journalsToImport, {
                onConflict: 'name',
                returning: 'representation'
            })
            .select();

        if (error) throw error;

        return {
            success: true,
            imported: data?.length || 0,
            total: journals.length
        };
    } catch (error) {
        console.error('[JournalService] Error bulk importing journals:', error);
        return {
            success: false,
            error: error.message,
            imported: 0,
            total: journals.length
        };
    }
};

/**
 * Buscar periódicos com autocomplete
 * @param {string} searchTerm - Termo de busca
 * @param {number} limit - Limite de resultados
 * @returns {Promise<Array>} Lista de sugestões
 */
export const autocompleteJournals = async (searchTerm, limit = 10) => {
    if (!searchTerm || searchTerm.length < 2) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('journals')
            .select('id, name, abdc, abs, qualis, sjr_quartile, jcr_quartile')
            .ilike('name', `%${searchTerm}%`)
            .order('name', { ascending: true })
            .limit(limit);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('[JournalService] Error autocompleting journals:', error);
        return [];
    }
};

export default {
    getJournals,
    getJournalByName,
    upsertJournal,
    bulkImportJournals,
    autocompleteJournals
};
