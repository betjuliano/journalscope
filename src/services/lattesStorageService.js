/**
 * Serviço para persistência de dados do Lattes no Supabase
 * Gerencia currículos, produção técnica, artigos, orientações e projetos
 */

import { supabase } from '../lib/supabase';

// =====================================================
// CURRÍCULO PRINCIPAL
// =====================================================

/**
 * Busca currículo salvo do usuário logado
 */
export async function getSavedCurriculo(userId) {
    try {
        const { data, error } = await supabase
            .schema('journalscope')
            .from('lattes_curriculos')
            .select(`
                *,
                producao_tecnica:lattes_producao_tecnica(*),
                artigos:lattes_artigos(*),
                orientacoes:lattes_orientacoes(*),
                projetos:lattes_projetos(*),
                indicadores:lattes_indicadores(*)
            `)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }

        return data;
    } catch (error) {
        console.error('[LattesStorage] Erro ao buscar currículo:', error);
        throw error;
    }
}

/**
 * Verifica se usuário já tem currículo salvo
 */
export async function hasSavedCurriculo(userId) {
    try {
        const { count, error } = await supabase
            .schema('journalscope')
            .from('lattes_curriculos')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) throw error;
        return count > 0;
    } catch (error) {
        console.error('[LattesStorage] Erro ao verificar currículo:', error);
        return false;
    }
}

/**
 * Salva ou atualiza currículo completo
 */
export async function saveCurriculo(userId, parsedData, options = { updateExisting: true }) {
    try {
        const { profile, articles, projects, orientations, technicalProduction, indicators, metadata } = parsedData;

        // Verificar se já existe currículo
        const existingCurriculo = await getSavedCurriculo(userId);

        let curriculoId;

        if (existingCurriculo && options.updateExisting) {
            // Atualizar currículo existente
            const { data, error } = await supabase
                .schema('journalscope')
                .from('lattes_curriculos')
                .update({
                    lattes_id: profile.lattesId,
                    nome_completo: profile.name,
                    nome_citacao: profile.citationName,
                    orcid: profile.orcid,
                    instituicao: profile.institution,
                    departamento: profile.department,
                    unidade: profile.unit,
                    nacionalidade: profile.nationality,
                    data_atualizacao_lattes: parseLatteDate(profile.lastUpdate),
                    dados_completos: parsedData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingCurriculo.id)
                .select()
                .single();

            if (error) throw error;
            curriculoId = data.id;

            // Limpar dados antigos para reinserir
            await Promise.all([
                supabase.schema('journalscope').from('lattes_producao_tecnica').delete().eq('curriculo_id', curriculoId),
                supabase.schema('journalscope').from('lattes_artigos').delete().eq('curriculo_id', curriculoId),
                supabase.schema('journalscope').from('lattes_orientacoes').delete().eq('curriculo_id', curriculoId),
                supabase.schema('journalscope').from('lattes_projetos').delete().eq('curriculo_id', curriculoId),
                supabase.schema('journalscope').from('lattes_indicadores').delete().eq('curriculo_id', curriculoId)
            ]);

        } else if (!existingCurriculo) {
            // Inserir novo currículo
            const { data, error } = await supabase
                .schema('journalscope')
                .from('lattes_curriculos')
                .insert({
                    user_id: userId,
                    lattes_id: profile.lattesId,
                    nome_completo: profile.name,
                    nome_citacao: profile.citationName,
                    orcid: profile.orcid,
                    instituicao: profile.institution,
                    departamento: profile.department,
                    unidade: profile.unit,
                    nacionalidade: profile.nationality,
                    data_atualizacao_lattes: parseLatteDate(profile.lastUpdate),
                    dados_completos: parsedData
                })
                .select()
                .single();

            if (error) throw error;
            curriculoId = data.id;
        } else {
            // Não atualizar, apenas retornar o ID existente
            return { curriculoId: existingCurriculo.id, updated: false };
        }

        // Salvar produção técnica
        if (technicalProduction && technicalProduction.length > 0) {
            await saveProducaoTecnica(curriculoId, technicalProduction);
        }

        // Salvar artigos
        if (articles && articles.length > 0) {
            await saveArtigos(curriculoId, articles);
        }

        // Salvar orientações
        if (orientations && orientations.length > 0) {
            await saveOrientacoes(curriculoId, orientations);
        }

        // Salvar projetos
        if (projects && projects.length > 0) {
            await saveProjetos(curriculoId, projects);
        }

        // Salvar indicadores
        await saveIndicadores(curriculoId, parsedData);

        return { curriculoId, updated: true };
    } catch (error) {
        console.error('[LattesStorage] Erro ao salvar currículo:', error);
        throw error;
    }
}

// =====================================================
// PRODUÇÃO TÉCNICA
// =====================================================

async function saveProducaoTecnica(curriculoId, producaoTecnica) {
    const records = producaoTecnica.map(item => ({
        curriculo_id: curriculoId,
        tipo: item.type,
        categoria: item.category,
        titulo: item.title,
        ano: item.year,
        natureza: item.nature,
        descricao: item.description,
        instituicao: item.institution,
        disponibilidade: item.availability,
        numero_registro: item.registrationNumber,
        data_deposito: item.depositDate ? parseLatteDate(item.depositDate) : null,
        pais: item.country,
        situacao: item.status,
        plataforma: item.language, // Para software
        cidade: item.city,
        is_produto_tecnologico: item.isMarkedAsTechProduct || false,
        destaque_pagina_inicial: item.isMarkedAsTechProduct || false,
        dados_extras: item
    }));

    const { error } = await supabase
        .schema('journalscope')
        .from('lattes_producao_tecnica')
        .insert(records);

    if (error) throw error;
}

/**
 * Atualiza marcação de produto tecnológico
 */
export async function updateTechProductMark(producaoId, isMarked) {
    const { error } = await supabase
        .schema('journalscope')
        .from('lattes_producao_tecnica')
        .update({
            is_produto_tecnologico: isMarked,
            destaque_pagina_inicial: isMarked
        })
        .eq('id', producaoId);

    if (error) throw error;
}

// =====================================================
// ARTIGOS
// =====================================================

async function saveArtigos(curriculoId, artigos) {
    const records = artigos.map(article => ({
        curriculo_id: curriculoId,
        tipo: article.type,
        titulo: article.title,
        titulo_ingles: article.titleEnglish,
        ano: article.year,
        doi: article.doi,
        issn: article.issn,
        periodico: article.journal,
        volume: article.volume,
        fasciculo: article.issue,
        paginas: article.pages,
        idioma: article.language,
        qualis_2021_2024_estrato: article.qualis2021_2024?.estrato,
        qualis_2021_2024_pontos: article.qualis2021_2024?.score,
        qualis_2025_2028_classificacao: article.qualis2025_2028?.classification,
        qualis_2025_2028_pontos: article.qualis2025_2028?.score,
        fontes_classificacao: article.qualis2025_2028?.sources || [],
        autores: article.authors
    }));

    const { error } = await supabase
        .schema('journalscope')
        .from('lattes_artigos')
        .insert(records);

    if (error) throw error;
}

// =====================================================
// ORIENTAÇÕES
// =====================================================

async function saveOrientacoes(curriculoId, orientacoes) {
    const records = orientacoes.map(o => ({
        curriculo_id: curriculoId,
        tipo: o.type,
        status: o.status,
        titulo: o.title,
        ano: o.year,
        nome_orientando: o.student,
        instituicao: o.institution,
        programa: o.program
    }));

    const { error } = await supabase
        .schema('journalscope')
        .from('lattes_orientacoes')
        .insert(records);

    if (error) throw error;
}

// =====================================================
// PROJETOS
// =====================================================

async function saveProjetos(curriculoId, projetos) {
    const records = projetos.map(p => ({
        curriculo_id: curriculoId,
        tipo: p.type,
        nome: p.name,
        descricao: p.description,
        ano_inicio: p.yearStart,
        ano_fim: p.yearEnd,
        situacao: p.status,
        natureza: p.role,
        financiadores: p.financers
    }));

    const { error } = await supabase
        .schema('journalscope')
        .from('lattes_projetos')
        .insert(records);

    if (error) throw error;
}

// =====================================================
// INDICADORES
// =====================================================

async function saveIndicadores(curriculoId, parsedData) {
    const { articles, projects, orientations, technicalProduction, indicators } = parsedData;

    const record = {
        curriculo_id: curriculoId,
        artigos_total: articles?.length || 0,
        artigos_internacionais: indicators?.articlesInternational || 0,
        artigos_nacionais: indicators?.articlesNational || 0,
        livros_completos: indicators?.booksComplete || 0,
        capitulos_livro: indicators?.booksChapters || 0,
        producao_tecnica_total: technicalProduction?.length || 0,
        produtos_tecnologicos: technicalProduction?.filter(t => t.isMarkedAsTechProduct).length || 0,
        orientacoes_concluidas: orientations?.filter(o => o.status === 'completed').length || 0,
        orientacoes_andamento: orientations?.filter(o => o.status === 'ongoing').length || 0,
        projetos_ativos: projects?.filter(p => !p.yearEnd).length || 0,
        resumo_cv: indicators?.summary || '',
        calculated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .schema('journalscope')
        .from('lattes_indicadores')
        .upsert(record, { onConflict: 'curriculo_id' });

    if (error) throw error;
}

// =====================================================
// CONVERSÃO DE DADOS SALVOS PARA FORMATO DO APP
// =====================================================

/**
 * Converte dados do banco para o formato usado nos componentes
 */
export function convertSavedToAppFormat(savedData) {
    if (!savedData) return null;

    return {
        profile: {
            lattesId: savedData.lattes_id,
            name: savedData.nome_completo,
            citationName: savedData.nome_citacao,
            orcid: savedData.orcid,
            institution: savedData.instituicao,
            department: savedData.departamento,
            unit: savedData.unidade,
            nationality: savedData.nacionalidade,
            lastUpdate: savedData.data_atualizacao_lattes
        },
        articles: (savedData.artigos || []).map(a => ({
            type: a.tipo,
            title: a.titulo,
            titleEnglish: a.titulo_ingles,
            year: a.ano,
            doi: a.doi,
            issn: a.issn,
            journal: a.periodico,
            volume: a.volume,
            issue: a.fasciculo,
            pages: a.paginas,
            language: a.idioma,
            authors: a.autores,
            qualis2021_2024: a.qualis_2021_2024_estrato ? {
                estrato: a.qualis_2021_2024_estrato,
                score: a.qualis_2021_2024_pontos
            } : null,
            qualis2025_2028: a.qualis_2025_2028_classificacao ? {
                classification: a.qualis_2025_2028_classificacao,
                score: a.qualis_2025_2028_pontos,
                sources: a.fontes_classificacao
            } : null
        })),
        projects: (savedData.projetos || []).map(p => ({
            type: p.tipo,
            name: p.nome,
            description: p.descricao,
            yearStart: p.ano_inicio,
            yearEnd: p.ano_fim,
            status: p.situacao,
            role: p.natureza,
            financers: p.financiadores
        })),
        orientations: (savedData.orientacoes || []).map(o => ({
            type: o.tipo,
            status: o.status,
            title: o.titulo,
            year: o.ano,
            student: o.nome_orientando,
            institution: o.instituicao,
            program: o.programa
        })),
        technicalProduction: (savedData.producao_tecnica || []).map(t => ({
            id: t.id, // Importante para atualização
            type: t.tipo,
            category: t.categoria,
            title: t.titulo,
            year: t.ano,
            nature: t.natureza,
            description: t.descricao,
            institution: t.instituicao,
            availability: t.disponibilidade,
            registrationNumber: t.numero_registro,
            depositDate: t.data_deposito,
            country: t.pais,
            status: t.situacao,
            language: t.plataforma,
            city: t.cidade,
            isMarkedAsTechProduct: t.is_produto_tecnologico
        })),
        indicators: savedData.indicadores?.[0] ? {
            articlesInternational: savedData.indicadores[0].artigos_internacionais,
            articlesNational: savedData.indicadores[0].artigos_nacionais,
            booksComplete: savedData.indicadores[0].livros_completos,
            booksChapters: savedData.indicadores[0].capitulos_livro,
            summary: savedData.indicadores[0].resumo_cv
        } : {},
        metadata: {
            savedAt: savedData.updated_at,
            curriculoId: savedData.id
        }
    };
}

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Converte data do formato Lattes (DDMMAAAA) para Date
 */
function parseLatteDate(dateStr) {
    if (!dateStr) return null;

    // Formato DDMMAAAA
    if (dateStr.length === 8 && !dateStr.includes('-')) {
        const day = dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const year = dateStr.substring(4, 8);
        return `${year}-${month}-${day}`;
    }

    return dateStr;
}

/**
 * Deleta currículo e todos os dados relacionados
 */
export async function deleteCurriculo(curriculoId) {
    const { error } = await supabase
        .schema('journalscope')
        .from('lattes_curriculos')
        .delete()
        .eq('id', curriculoId);

    if (error) throw error;
}

export default {
    getSavedCurriculo,
    hasSavedCurriculo,
    saveCurriculo,
    updateTechProductMark,
    convertSavedToAppFormat,
    deleteCurriculo
};
