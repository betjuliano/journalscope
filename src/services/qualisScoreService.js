/**
 * Serviço de classificação e pontuação Qualis/CAPES
 * Suporta dois quadriênios:
 * - 2021-2024: Qualis tradicional (A1-B4)
 * - 2025-2028: Nova metodologia (MB/B/R/F)
 */

// =====================================================
// TABELAS DE PONTUAÇÃO
// =====================================================

// Quadriênio 2021-2024 - Qualis Tradicional
export const QUALIS_2021_2024 = {
    A1: 100,
    A2: 85,
    A3: 70,
    A4: 55,
    B1: 40,
    B2: 30,
    B3: 20,
    B4: 10,
    C: 0
};

// Quadriênio 2025-2028 - Nova Metodologia CAPES
export const QUALIS_2025_2028 = {
    MB: 8,  // Muito Bom
    B: 4,   // Bom
    R: 2,   // Regular
    F: 1    // Fraco
};

// Labels amigáveis
export const CLASSIFICATION_LABELS = {
    MB: 'Muito Bom (MB)',
    B: 'Bom (B)',
    R: 'Regular (R)',
    F: 'Fraco (F)'
};

// =====================================================
// CLASSIFICAÇÃO 2025-2028 (NOVA METODOLOGIA)
// =====================================================

/**
 * Classifica artigo pela nova metodologia 2025-2028
 * @param {Object} article - Artigo do Lattes
 * @param {Object} journalData - Dados do periódico nas bases
 * @returns {Object} { classification, score, sources, details }
 */
export function classifyArticle2025_2028(article, journalData) {
    if (!journalData) {
        return {
            classification: null,
            score: 0,
            sources: [],
            details: 'Periódico não encontrado nas bases'
        };
    }

    const {
        abdc,
        abs,
        jcrQuartile,
        sjrQuartile,
        spellPercentile,
        isScielo
    } = journalData;

    let classification = null;
    const sources = [];

    // Regra 1: MB (Muito Bom)
    // ABDC A ou A*, ABS >= 2, JCR Q1, SJR Q1
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

    // Regra 2: B (Bom)
    // ABDC B, ABS 1, JCR Q2, SJR Q2, SPELL top 10% + Scielo
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
        } else if (spellPercentile && spellPercentile <= 10 && isScielo) {
            classification = 'B';
            sources.push('SPELL top 10% + SciELO');
        }
    }

    // Regra 3: R (Regular)
    // ABDC C, JCR Q3, SJR Q3, SPELL 30% seguintes
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
        } else if (spellPercentile && spellPercentile > 10 && spellPercentile <= 40) {
            classification = 'R';
            sources.push('SPELL 11-40%');
        }
    }

    // Regra 4: F (Fraco)
    // JCR Q4, SJR Q4, SPELL 30% seguintes
    if (!classification) {
        if (jcrQuartile === 'Q4') {
            classification = 'F';
            sources.push('JCR Q4');
        } else if (sjrQuartile === 'Q4') {
            classification = 'F';
            sources.push('SJR Q4');
        } else if (spellPercentile && spellPercentile > 40 && spellPercentile <= 70) {
            classification = 'F';
            sources.push('SPELL 41-70%');
        }
    }

    // Bônus SciELO: +1 nível (máximo B)
    if (classification && isScielo && !sources.some(s => s.includes('SciELO'))) {
        const levels = ['F', 'R', 'B', 'MB'];
        const currentIndex = levels.indexOf(classification);
        if (currentIndex > 0 && currentIndex < 3) {
            classification = levels[currentIndex + 1];
            if (classification === 'MB') {
                classification = 'B'; // Limite máximo
            }
            sources.push('Bônus SciELO (+1 nível)');
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

// =====================================================
// CLASSIFICAÇÃO 2021-2024 (QUALIS TRADICIONAL)
// =====================================================

/**
 * Classifica artigo pelo Qualis tradicional 2021-2024
 * @param {Object} article - Artigo do Lattes
 * @param {Object} qualisData - Dados do Qualis Sucupira
 * @returns {Object} { estrato, score }
 */
export function classifyArticle2021_2024(article, qualisData) {
    if (!qualisData || !qualisData.estrato) {
        return {
            estrato: null,
            score: 0,
            details: 'Não encontrado no Qualis 2021-2024'
        };
    }

    const estrato = qualisData.estrato.toUpperCase();
    const score = QUALIS_2021_2024[estrato] || 0;

    return {
        estrato,
        score,
        details: `Qualis ${estrato}`
    };
}

// =====================================================
// CÁLCULO DE PONTUAÇÃO TOTAL
// =====================================================

/**
 * Calcula pontuação total por quadriênio
 * @param {Array} articles - Lista de artigos classificados
 * @param {string} quadriennium - '2021-2024' ou '2025-2028'
 * @returns {Object} Estatísticas consolidadas
 */
export function calculateTotalScore(articles, quadriennium) {
    const isNewMethod = quadriennium === '2025-2028';
    const scoreTable = isNewMethod ? QUALIS_2025_2028 : QUALIS_2021_2024;

    let totalScore = 0;
    const byClassification = {};
    const classifiedArticles = [];

    articles.forEach(article => {
        const classField = isNewMethod ? 'classification' : 'estrato';
        const classValue = article[classField];

        if (classValue && scoreTable[classValue] !== undefined) {
            const score = scoreTable[classValue];
            totalScore += score;

            if (!byClassification[classValue]) {
                byClassification[classValue] = {
                    count: 0,
                    totalScore: 0,
                    articles: []
                };
            }

            byClassification[classValue].count++;
            byClassification[classValue].totalScore += score;
            byClassification[classValue].articles.push({
                title: article.title,
                journal: article.journal,
                year: article.year,
                score
            });

            classifiedArticles.push({
                ...article,
                score,
                quadriennium
            });
        }
    });

    return {
        quadriennium,
        totalScore,
        totalArticles: articles.length,
        classifiedArticles: classifiedArticles.length,
        byClassification,
        articles: classifiedArticles
    };
}

// =====================================================
// FILTRO POR PERÍODO
// =====================================================

/**
 * Filtra artigos pelo período do quadriênio
 * @param {Array} articles - Lista de artigos
 * @param {string} quadriennium - '2021-2024' ou '2025-2028'
 * @returns {Array} Artigos filtrados
 */
export function filterByQuadriennium(articles, quadriennium) {
    const [startYear, endYear] = quadriennium.split('-').map(Number);

    return articles.filter(article => {
        const year = article.year;
        return year >= startYear && year <= endYear;
    });
}

// =====================================================
// BUSCA EM BASES (INTEGRAÇÃO COM DADOS EXISTENTES)
// =====================================================

/**
 * Busca periódico nas bases de dados (ABDC, ABS, JCR, SJR)
 * @param {string} journalName - Nome do periódico
 * @param {string} issn - ISSN do periódico
 * @param {Object} databases - Objeto com as bases de dados
 * @returns {Object} Dados consolidados do periódico
 */
export function findJournalInBases(journalName, issn, databases = {}) {
    const normalizedName = normalizeForSearch(journalName);
    const normalizedISSN = issn ? issn.replace(/[^0-9X]/gi, '').toUpperCase() : null;

    let result = {
        found: false,
        journalName,
        issn,
        abdc: null,
        abs: null,
        jcrQuartile: null,
        sjrQuartile: null,
        spellPercentile: null,
        isScielo: false,
        sources: []
    };

    // Buscar em cada base
    if (databases.abdc && Array.isArray(databases.abdc)) {
        const match = databases.abdc.find(j =>
            normalizeForSearch(j.journal) === normalizedName ||
            (normalizedISSN && j.issn && j.issn.replace(/[^0-9X]/gi, '').toUpperCase() === normalizedISSN)
        );
        if (match) {
            result.abdc = match.rating || match.abdc;
            result.sources.push('ABDC');
            result.found = true;
        }
    }

    if (databases.abs && Array.isArray(databases.abs)) {
        const match = databases.abs.find(j =>
            normalizeForSearch(j.journal) === normalizedName
        );
        if (match) {
            result.abs = match.rating || match.abs;
            result.sources.push('ABS');
            result.found = true;
        }
    }

    if (databases.jcr && Array.isArray(databases.jcr)) {
        const match = databases.jcr.find(j =>
            normalizeForSearch(j.journal) === normalizedName ||
            (normalizedISSN && j.issn && j.issn.replace(/[^0-9X]/gi, '').toUpperCase() === normalizedISSN)
        );
        if (match) {
            result.jcrQuartile = match.quartile || match.jcr_quartile;
            result.jcrImpactFactor = match.impactFactor || match.jcr_impact_factor;
            result.sources.push('JCR');
            result.found = true;
        }
    }

    if (databases.sjr && Array.isArray(databases.sjr)) {
        const match = databases.sjr.find(j =>
            normalizeForSearch(j.journal) === normalizedName ||
            (normalizedISSN && j.issn && j.issn.replace(/[^0-9X]/gi, '').toUpperCase() === normalizedISSN)
        );
        if (match) {
            result.sjrQuartile = match.quartile || match.sjr_quartile;
            result.sjrScore = match.score || match.sjr_score;
            result.sources.push('SJR');
            result.found = true;
        }
    }

    return result;
}

/**
 * Normaliza string para busca
 */
function normalizeForSearch(str) {
    if (!str) return '';
    return str
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '')
        .trim();
}

// =====================================================
// CORES E ESTILOS
// =====================================================

/**
 * Retorna cor para classificação
 */
export function getClassificationColor(classification) {
    const colors = {
        // 2025-2028
        MB: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
        B: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
        R: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
        F: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
        // 2021-2024
        A1: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
        A2: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        A3: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
        A4: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
        B1: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
        B2: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        B3: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
        B4: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
        C: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' }
    };

    return colors[classification] || { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
}

export default {
    QUALIS_2021_2024,
    QUALIS_2025_2028,
    CLASSIFICATION_LABELS,
    classifyArticle2025_2028,
    classifyArticle2021_2024,
    calculateTotalScore,
    filterByQuadriennium,
    findJournalInBases,
    getClassificationColor
};
