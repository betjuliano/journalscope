/**
 * Serviço de classificação de artigos do Lattes
 * Usa os dados embarcados de periódicos para classificar artigos
 */

import { EMBEDDED_JOURNALS_DATA } from '../data/embeddedJournals';
import {
    QUALIS_2025_2028,
    classifyArticle2025_2028
} from './qualisScoreService';
import { normalizeJournalName } from './lattesParserService';

// Cache para busca rápida de periódicos
let journalIndex = null;

/**
 * Inicializa o índice de periódicos para busca rápida
 */
function initJournalIndex() {
    if (journalIndex) return journalIndex;

    journalIndex = new Map();

    if (EMBEDDED_JOURNALS_DATA?.data) {
        EMBEDDED_JOURNALS_DATA.data.forEach(journal => {
            const normalizedName = normalizeJournalName(journal.journal);
            journalIndex.set(normalizedName, journal);
        });
    }

    return journalIndex;
}

/**
 * Busca dados de um periódico pelo nome
 */
export function findJournalByName(journalName) {
    initJournalIndex();
    const normalized = normalizeJournalName(journalName);
    return journalIndex.get(normalized) || null;
}

/**
 * Busca dados de um periódico pelo ISSN
 */
export function findJournalByISSN(issn) {
    if (!issn) return null;

    const cleanIssn = issn.replace(/[^0-9X]/gi, '');

    // Busca no array (menos eficiente, mas ISSNs não estão indexados)
    if (EMBEDDED_JOURNALS_DATA?.data) {
        // Por enquanto, busca por nome pois ISSN não está nos dados embarcados
        return null;
    }

    return null;
}

/**
 * Classifica um artigo pela metodologia 2025-2028
 */
export function classifyArticleWithData(article) {
    // Buscar dados do periódico
    let journalData = findJournalByName(article.journal);

    // Se não encontrar pelo nome, tentar pelo ISSN
    if (!journalData && article.issn) {
        journalData = findJournalByISSN(article.issn);
    }

    if (!journalData) {
        return {
            classification: null,
            score: 0,
            sources: [],
            details: 'Periódico não encontrado nas bases'
        };
    }

    // Extrair dados relevantes para classificação
    const classificationData = {
        abdc: journalData.abdc || null,
        abs: journalData.abs || null,
        jcrQuartile: journalData.jcr?.quartile || null,
        sjrQuartile: journalData.sjr?.quartile || null,
        spellPercentile: null,
        isScielo: false
    };

    return classifyWithRules(classificationData);
}

/**
 * Aplica regras de classificação 2025-2028
 */
function classifyWithRules(data) {
    const { abdc, abs, jcrQuartile, sjrQuartile, spellPercentile, isScielo } = data;

    let classification = null;
    const sources = [];

    // Regra 1: MB (Muito Bom) - 8 pontos
    if (abdc === 'A*' || abdc === 'A') {
        classification = 'MB';
        sources.push(`ABDC ${abdc}`);
    } else if (abs && parseInt(abs) >= 2) {
        classification = 'MB';
        sources.push(`ABS ${abs}`);
    } else if (jcrQuartile === 'Q1') {
        classification = 'MB';
        sources.push('JCR Q1');
    } else if (sjrQuartile === 'Q1') {
        classification = 'MB';
        sources.push('SJR Q1');
    }

    // Regra 2: B (Bom) - 4 pontos
    if (!classification) {
        if (abdc === 'B') {
            classification = 'B';
            sources.push('ABDC B');
        } else if (abs === '1') {
            classification = 'B';
            sources.push('ABS 1');
        } else if (jcrQuartile === 'Q2') {
            classification = 'B';
            sources.push('JCR Q2');
        } else if (sjrQuartile === 'Q2') {
            classification = 'B';
            sources.push('SJR Q2');
        }
    }

    // Regra 3: R (Regular) - 2 pontos
    if (!classification) {
        if (abdc === 'C') {
            classification = 'R';
            sources.push('ABDC C');
        } else if (jcrQuartile === 'Q3') {
            classification = 'R';
            sources.push('JCR Q3');
        } else if (sjrQuartile === 'Q3') {
            classification = 'R';
            sources.push('SJR Q3');
        }
    }

    // Regra 4: F (Fraco) - 1 ponto
    if (!classification) {
        if (jcrQuartile === 'Q4') {
            classification = 'F';
            sources.push('JCR Q4');
        } else if (sjrQuartile === 'Q4') {
            classification = 'F';
            sources.push('SJR Q4');
        }
    }

    const score = classification ? QUALIS_2025_2028[classification] : 0;

    return {
        classification,
        score,
        sources,
        details: sources.join(', ') || 'Sem classificação'
    };
}

/**
 * Classifica todos os artigos de um currículo
 */
export function classifyAllArticles(articles) {
    return articles.map(article => {
        const qualis2025_2028 = classifyArticleWithData(article);

        return {
            ...article,
            qualis2025_2028
        };
    });
}

/**
 * Retorna artigos com classificação MB (8 pontos)
 */
export function getTopArticles(articles) {
    return articles.filter(article =>
        article.qualis2025_2028?.classification === 'MB'
    ).sort((a, b) => b.year - a.year);
}

/**
 * Estatísticas de classificação
 */
export function getClassificationStats(articles) {
    const stats = {
        total: articles.length,
        classified: 0,
        totalScore: 0,
        byClassification: {
            MB: { count: 0, score: 0, articles: [] },
            B: { count: 0, score: 0, articles: [] },
            R: { count: 0, score: 0, articles: [] },
            F: { count: 0, score: 0, articles: [] }
        }
    };

    articles.forEach(article => {
        const cls = article.qualis2025_2028?.classification;
        const score = article.qualis2025_2028?.score || 0;

        if (cls && stats.byClassification[cls]) {
            stats.classified++;
            stats.totalScore += score;
            stats.byClassification[cls].count++;
            stats.byClassification[cls].score += score;
            stats.byClassification[cls].articles.push({
                title: article.title,
                journal: article.journal,
                year: article.year,
                score,
                sources: article.qualis2025_2028.sources
            });
        }
    });

    return stats;
}

export default {
    findJournalByName,
    findJournalByISSN,
    classifyArticleWithData,
    classifyAllArticles,
    getTopArticles,
    getClassificationStats
};
