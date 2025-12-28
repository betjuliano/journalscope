/**
 * Serviço para parsing de currículos Lattes em formato XML
 * Extrai: perfil, artigos, projetos, orientações
 */

// =====================================================
// PARSING DO XML
// =====================================================

/**
 * Parse do XML completo do Lattes
 * @param {string} xmlString - Conteúdo do arquivo XML
 * @returns {Object} Objeto estruturado com dados do currículo
 */
export function parseXML(xmlString) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');

        // Verificar erros de parsing
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Erro ao analisar XML: formato inválido');
        }

        // Extrair dados
        return {
            profile: extractProfile(doc),
            articles: extractArticles(doc),
            projects: extractProjects(doc),
            orientations: extractOrientations(doc),
            technicalProduction: extractTechnicalProduction(doc),
            indicators: extractIndicators(doc),
            metadata: {
                parsedAt: new Date().toISOString(),
                xmlVersion: doc.querySelector('CURRICULO-VITAE')?.getAttribute('NUMERO-IDENTIFICADOR') || null
            }
        };
    } catch (error) {
        console.error('[LattesParser] Erro ao processar XML:', error);
        throw error;
    }
}

// =====================================================
// EXTRAÇÃO DE PERFIL
// =====================================================

/**
 * Extrai dados do perfil/dados gerais
 */
export function extractProfile(doc) {
    const cv = doc.querySelector('CURRICULO-VITAE');
    const dadosGerais = doc.querySelector('DADOS-GERAIS');
    const endereco = doc.querySelector('ENDERECO-PROFISSIONAL');

    if (!cv || !dadosGerais) {
        return null;
    }

    return {
        lattesId: cv.getAttribute('NUMERO-IDENTIFICADOR') || '',
        lastUpdate: cv.getAttribute('DATA-ATUALIZACAO') || '',
        name: dadosGerais.getAttribute('NOME-COMPLETO') || '',
        citationName: dadosGerais.getAttribute('NOME-EM-CITACOES-BIBLIOGRAFICAS') || '',
        nationality: dadosGerais.getAttribute('PAIS-DE-NACIONALIDADE') || '',
        orcid: dadosGerais.getAttribute('ORCID-ID') || '',
        institution: endereco?.getAttribute('NOME-INSTITUICAO-EMPRESA') || '',
        unit: endereco?.getAttribute('NOME-ORGAO') || '',
        department: endereco?.getAttribute('NOME-UNIDADE') || ''
    };
}

// =====================================================
// EXTRAÇÃO DE ARTIGOS PUBLICADOS
// =====================================================

/**
 * Extrai artigos publicados em periódicos
 */
export function extractArticles(doc) {
    const articles = [];

    // Artigos publicados
    const publishedArticles = doc.querySelectorAll('ARTIGO-PUBLICADO');
    publishedArticles.forEach(article => {
        const basicData = article.querySelector('DADOS-BASICOS-DO-ARTIGO');
        const detailData = article.querySelector('DETALHAMENTO-DO-ARTIGO');
        const authors = article.querySelectorAll('AUTORES');

        if (basicData && detailData) {
            articles.push({
                type: 'published',
                title: basicData.getAttribute('TITULO-DO-ARTIGO') || '',
                titleEnglish: basicData.getAttribute('TITULO-DO-ARTIGO-INGLES') || '',
                year: parseInt(basicData.getAttribute('ANO-DO-ARTIGO') || '0', 10),
                language: basicData.getAttribute('IDIOMA') || '',
                doi: basicData.getAttribute('DOI') || '',
                journal: detailData.getAttribute('TITULO-DO-PERIODICO-OU-REVISTA') || '',
                issn: detailData.getAttribute('ISSN') || '',
                volume: detailData.getAttribute('VOLUME') || '',
                issue: detailData.getAttribute('FASCICULO') || '',
                pages: `${detailData.getAttribute('PAGINA-INICIAL') || ''}-${detailData.getAttribute('PAGINA-FINAL') || ''}`,
                authors: extractAuthors(authors)
            });
        }
    });

    // Artigos aceitos para publicação
    const acceptedArticles = doc.querySelectorAll('ARTIGO-ACEITO-PARA-PUBLICACAO');
    acceptedArticles.forEach(article => {
        const basicData = article.querySelector('DADOS-BASICOS-DO-ARTIGO');
        const detailData = article.querySelector('DETALHAMENTO-DO-ARTIGO');
        const authors = article.querySelectorAll('AUTORES');

        if (basicData && detailData) {
            articles.push({
                type: 'accepted',
                title: basicData.getAttribute('TITULO-DO-ARTIGO') || '',
                titleEnglish: basicData.getAttribute('TITULO-DO-ARTIGO-INGLES') || '',
                year: parseInt(basicData.getAttribute('ANO-DO-ARTIGO') || '0', 10),
                language: basicData.getAttribute('IDIOMA') || '',
                doi: basicData.getAttribute('DOI') || '',
                journal: detailData.getAttribute('TITULO-DO-PERIODICO-OU-REVISTA') || '',
                issn: detailData.getAttribute('ISSN') || '',
                volume: detailData.getAttribute('VOLUME') || '',
                issue: detailData.getAttribute('FASCICULO') || '',
                pages: `${detailData.getAttribute('PAGINA-INICIAL') || ''}-${detailData.getAttribute('PAGINA-FINAL') || ''}`,
                authors: extractAuthors(authors)
            });
        }
    });

    // Ordenar por ano (mais recente primeiro)
    return articles.sort((a, b) => b.year - a.year);
}

/**
 * Extrai lista de autores de um artigo
 */
function extractAuthors(authorNodes) {
    const authors = [];
    authorNodes.forEach(author => {
        authors.push({
            name: author.getAttribute('NOME-COMPLETO-DO-AUTOR') || '',
            citationName: author.getAttribute('NOME-PARA-CITACAO') || '',
            orcid: author.getAttribute('NRO-ID-CNPQ') || '',
            order: parseInt(author.getAttribute('ORDEM-DE-AUTORIA') || '0', 10)
        });
    });
    return authors.sort((a, b) => a.order - b.order);
}

// =====================================================
// EXTRAÇÃO DE PROJETOS
// =====================================================

/**
 * Extrai projetos de pesquisa, extensão e desenvolvimento
 */
export function extractProjects(doc) {
    const projects = [];

    // Projetos de pesquisa
    const researchProjects = doc.querySelectorAll('PROJETO-DE-PESQUISA');
    researchProjects.forEach(project => {
        const financers = project.querySelectorAll('FINANCIADOR-DO-PROJETO');

        projects.push({
            type: 'research',
            name: project.getAttribute('NOME-DO-PROJETO') || '',
            description: project.getAttribute('DESCRICAO-DO-PROJETO') || '',
            yearStart: parseInt(project.getAttribute('ANO-INICIO') || '0', 10),
            yearEnd: project.getAttribute('ANO-FIM') ? parseInt(project.getAttribute('ANO-FIM'), 10) : null,
            status: project.getAttribute('SITUACAO') || '',
            role: project.getAttribute('NATUREZA') || '',
            financers: Array.from(financers).map(f => ({
                name: f.getAttribute('NOME-INSTITUICAO') || '',
                code: f.getAttribute('CODIGO-ORGAO-FINANCIADOR') || ''
            }))
        });
    });

    // Projetos de extensão
    const extensionProjects = doc.querySelectorAll('PROJETO-DE-EXTENSAO');
    extensionProjects.forEach(project => {
        projects.push({
            type: 'extension',
            name: project.getAttribute('NOME-DO-PROJETO') || '',
            description: project.getAttribute('DESCRICAO-DO-PROJETO') || '',
            yearStart: parseInt(project.getAttribute('ANO-INICIO') || '0', 10),
            yearEnd: project.getAttribute('ANO-FIM') ? parseInt(project.getAttribute('ANO-FIM'), 10) : null,
            status: project.getAttribute('SITUACAO') || '',
            financers: []
        });
    });

    // Projetos de desenvolvimento
    const devProjects = doc.querySelectorAll('PROJETO-DE-DESENVOLVIMENTO-TECNOLOGICO');
    devProjects.forEach(project => {
        projects.push({
            type: 'development',
            name: project.getAttribute('NOME-DO-PROJETO') || '',
            description: project.getAttribute('DESCRICAO-DO-PROJETO') || '',
            yearStart: parseInt(project.getAttribute('ANO-INICIO') || '0', 10),
            yearEnd: project.getAttribute('ANO-FIM') ? parseInt(project.getAttribute('ANO-FIM'), 10) : null,
            status: project.getAttribute('SITUACAO') || '',
            financers: []
        });
    });

    // Ordenar por ano de início (mais recente primeiro)
    return projects.sort((a, b) => (b.yearStart || 0) - (a.yearStart || 0));
}

// =====================================================
// EXTRAÇÃO DE ORIENTAÇÕES
// =====================================================

/**
 * Extrai orientações concluídas e em andamento
 */
export function extractOrientations(doc) {
    const orientations = [];

    // Orientações concluídas - Doutorado
    const phdCompleted = doc.querySelectorAll('ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO');
    phdCompleted.forEach(orientation => {
        const basicData = orientation.querySelector('DADOS-BASICOS-DE-ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO');
        const detailData = orientation.querySelector('DETALHAMENTO-DE-ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO');

        if (basicData) {
            orientations.push({
                type: 'phd',
                status: 'completed',
                title: basicData.getAttribute('TITULO') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                student: detailData?.getAttribute('NOME-DO-ORIENTADO') || '',
                institution: detailData?.getAttribute('NOME-DA-INSTITUICAO') || '',
                program: detailData?.getAttribute('NOME-DO-CURSO') || ''
            });
        }
    });

    // Orientações concluídas - Mestrado
    const masterCompleted = doc.querySelectorAll('ORIENTACOES-CONCLUIDAS-PARA-MESTRADO');
    masterCompleted.forEach(orientation => {
        const basicData = orientation.querySelector('DADOS-BASICOS-DE-ORIENTACOES-CONCLUIDAS-PARA-MESTRADO');
        const detailData = orientation.querySelector('DETALHAMENTO-DE-ORIENTACOES-CONCLUIDAS-PARA-MESTRADO');

        if (basicData) {
            orientations.push({
                type: 'master',
                status: 'completed',
                title: basicData.getAttribute('TITULO') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                student: detailData?.getAttribute('NOME-DO-ORIENTADO') || '',
                institution: detailData?.getAttribute('NOME-DA-INSTITUICAO') || '',
                program: detailData?.getAttribute('NOME-DO-CURSO') || ''
            });
        }
    });

    // Orientações em andamento - Doutorado
    const phdOngoing = doc.querySelectorAll('ORIENTACAO-EM-ANDAMENTO-DE-DOUTORADO');
    phdOngoing.forEach(orientation => {
        const basicData = orientation.querySelector('DADOS-BASICOS-DA-ORIENTACAO-EM-ANDAMENTO-DE-DOUTORADO');
        const detailData = orientation.querySelector('DETALHAMENTO-DA-ORIENTACAO-EM-ANDAMENTO-DE-DOUTORADO');

        if (basicData) {
            orientations.push({
                type: 'phd',
                status: 'ongoing',
                title: basicData.getAttribute('TITULO-DO-TRABALHO') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                student: detailData?.getAttribute('NOME-DO-ORIENTANDO') || '',
                institution: detailData?.getAttribute('NOME-INSTITUICAO') || '',
                program: detailData?.getAttribute('NOME-CURSO') || ''
            });
        }
    });

    // Orientações em andamento - Mestrado
    const masterOngoing = doc.querySelectorAll('ORIENTACAO-EM-ANDAMENTO-DE-MESTRADO');
    masterOngoing.forEach(orientation => {
        const basicData = orientation.querySelector('DADOS-BASICOS-DA-ORIENTACAO-EM-ANDAMENTO-DE-MESTRADO');
        const detailData = orientation.querySelector('DETALHAMENTO-DA-ORIENTACAO-EM-ANDAMENTO-DE-MESTRADO');

        if (basicData) {
            orientations.push({
                type: 'master',
                status: 'ongoing',
                title: basicData.getAttribute('TITULO-DO-TRABALHO') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                student: detailData?.getAttribute('NOME-DO-ORIENTANDO') || '',
                institution: detailData?.getAttribute('NOME-INSTITUICAO') || '',
                program: detailData?.getAttribute('NOME-CURSO') || ''
            });
        }
    });

    // Ordenar por ano (mais recente primeiro)
    return orientations.sort((a, b) => b.year - a.year);
}

// =====================================================
// EXTRAÇÃO DE PRODUÇÃO TÉCNICA
// =====================================================

/**
 * Extrai produção técnica: software, patentes, produtos tecnológicos, etc.
 */
export function extractTechnicalProduction(doc) {
    const production = [];

    // Software
    const softwares = doc.querySelectorAll('SOFTWARE');
    softwares.forEach(software => {
        const basicData = software.querySelector('DADOS-BASICOS-DO-SOFTWARE');
        const detailData = software.querySelector('DETALHAMENTO-DO-SOFTWARE');

        if (basicData) {
            production.push({
                type: 'software',
                category: 'produto_tecnologico',
                isMarkedAsTechProduct: true, // Software automaticamente é produto tecnológico
                title: basicData.getAttribute('TITULO-DO-SOFTWARE') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                nature: basicData.getAttribute('NATUREZA') || '',
                language: detailData?.getAttribute('PLATAFORMA') || '',
                availability: detailData?.getAttribute('DISPONIBILIDADE') || '',
                institution: detailData?.getAttribute('INSTITUICAO-FINANCIADORA') || '',
                registrationNumber: detailData?.getAttribute('NUMERO-REGISTRO-INPI') || ''
            });
        }
    });

    // Patentes
    const patents = doc.querySelectorAll('PATENTE');
    patents.forEach(patent => {
        const basicData = patent.querySelector('DADOS-BASICOS-DA-PATENTE');
        const detailData = patent.querySelector('DETALHAMENTO-DA-PATENTE');

        if (basicData) {
            production.push({
                type: 'patent',
                category: 'produto_tecnologico',
                isMarkedAsTechProduct: true, // Patente automaticamente é produto tecnológico
                title: basicData.getAttribute('TITULO') || '',
                year: parseInt(basicData.getAttribute('ANO-DESENVOLVIMENTO') || '0', 10),
                country: basicData.getAttribute('PAIS') || '',
                registrationNumber: detailData?.getAttribute('NUMERO-DO-REGISTRO') || detailData?.getAttribute('NUMERO-DEPOSITO') || '',
                depositDate: detailData?.getAttribute('DATA-DEPOSITO') || '',
                institution: detailData?.getAttribute('INSTITUICAO-FINANCIADORA') || '',
                status: detailData?.getAttribute('SITUACAO') || ''
            });
        }
    });

    // Produtos Tecnológicos (genérico)
    const techProducts = doc.querySelectorAll('PRODUTO-TECNOLOGICO');
    techProducts.forEach(product => {
        const basicData = product.querySelector('DADOS-BASICOS-DO-PRODUTO-TECNOLOGICO');
        const detailData = product.querySelector('DETALHAMENTO-DO-PRODUTO-TECNOLOGICO');

        if (basicData) {
            production.push({
                type: 'tech_product',
                category: 'produto_tecnologico',
                isMarkedAsTechProduct: true,
                title: basicData.getAttribute('TITULO-DO-PRODUTO') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                nature: basicData.getAttribute('NATUREZA') || '',
                description: basicData.getAttribute('DESCRICAO-DO-PRODUTO') || '',
                availability: basicData.getAttribute('DISPONIBILIDADE') || '',
                institution: detailData?.getAttribute('INSTITUICAO-FINANCIADORA') || '',
                city: detailData?.getAttribute('CIDADE-DO-PRODUTO') || ''
            });
        }
    });

    // Processos ou técnicas
    const processes = doc.querySelectorAll('PROCESSOS-OU-TECNICAS');
    processes.forEach(process => {
        const basicData = process.querySelector('DADOS-BASICOS-DE-PROCESSOS-OU-TECNICAS');
        const detailData = process.querySelector('DETALHAMENTO-DE-PROCESSOS-OU-TECNICAS');

        if (basicData) {
            production.push({
                type: 'process',
                category: 'producao_tecnica',
                isMarkedAsTechProduct: false, // Pode ser marcado manualmente
                title: basicData.getAttribute('TITULO') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                nature: basicData.getAttribute('NATUREZA') || '',
                availability: basicData.getAttribute('DISPONIBILIDADE') || '',
                institution: detailData?.getAttribute('INSTITUICAO-FINANCIADORA') || ''
            });
        }
    });

    // Trabalhos técnicos
    const technicalWorks = doc.querySelectorAll('TRABALHO-TECNICO');
    technicalWorks.forEach(work => {
        const basicData = work.querySelector('DADOS-BASICOS-DO-TRABALHO-TECNICO');
        const detailData = work.querySelector('DETALHAMENTO-DO-TRABALHO-TECNICO');

        if (basicData) {
            production.push({
                type: 'technical_work',
                category: 'producao_tecnica',
                isMarkedAsTechProduct: false, // Pode ser marcado manualmente
                title: basicData.getAttribute('TITULO-DO-TRABALHO-TECNICO') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                nature: basicData.getAttribute('NATUREZA') || '',
                institution: detailData?.getAttribute('INSTITUICAO-FINANCIADORA') || detailData?.getAttribute('NOME-DA-INSTITUICAO') || ''
            });
        }
    });

    // Desenvolvimento de material didático
    const didacticMaterials = doc.querySelectorAll('DESENVOLVIMENTO-DE-MATERIAL-DIDATICO-OU-INSTRUCIONAL');
    didacticMaterials.forEach(material => {
        const basicData = material.querySelector('DADOS-BASICOS-DO-MATERIAL-DIDATICO-OU-INSTRUCIONAL');
        const detailData = material.querySelector('DETALHAMENTO-DO-MATERIAL-DIDATICO-OU-INSTRUCIONAL');

        if (basicData) {
            production.push({
                type: 'didactic_material',
                category: 'producao_tecnica',
                isMarkedAsTechProduct: false,
                title: basicData.getAttribute('TITULO') || '',
                year: parseInt(basicData.getAttribute('ANO') || '0', 10),
                nature: basicData.getAttribute('NATUREZA') || '',
                description: basicData.getAttribute('DESCRICAO') || ''
            });
        }
    });

    // Ordenar por ano (mais recente primeiro)
    return production.sort((a, b) => b.year - a.year);
}

// =====================================================
// EXTRAÇÃO DE INDICADORES
// =====================================================

/**
 * Extrai indicadores de produção do currículo
 */
export function extractIndicators(doc) {
    const indicators = {
        hIndex: null,
        citations: null,
        articlesInternational: 0,
        articlesNational: 0,
        booksChapters: 0,
        booksComplete: 0,
        technicalProductions: 0,
        orientationsCompleted: 0,
        orientationsOngoing: 0
    };

    // Buscar Índice H se declarado
    const resumo = doc.querySelector('RESUMO-CV');
    if (resumo) {
        // O Lattes não tem campo direto de H-index, mas podemos inferir de outras fontes
        indicators.summary = resumo.getAttribute('TEXTO-RESUMO-CV-RH') || '';
    }

    // Capítulos de livro
    const bookChapters = doc.querySelectorAll('CAPITULO-DE-LIVRO-PUBLICADO');
    indicators.booksChapters = bookChapters.length;

    // Livros completos
    const books = doc.querySelectorAll('LIVRO-PUBLICADO-OU-ORGANIZADO');
    indicators.booksComplete = books.length;

    // Contar artigos por âmbito
    const articles = doc.querySelectorAll('ARTIGO-PUBLICADO');
    articles.forEach(article => {
        const basicData = article.querySelector('DADOS-BASICOS-DO-ARTIGO');
        const ambito = basicData?.getAttribute('NATUREZA') || '';
        if (ambito.includes('INTERNACIONAL')) {
            indicators.articlesInternational++;
        } else {
            indicators.articlesNational++;
        }
    });

    return indicators;
}

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Normaliza nome do periódico para matching
 */
export function normalizeJournalName(name) {
    if (!name) return '';
    return name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^A-Z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();
}

/**
 * Extrai ISSN formatado
 */
export function formatISSN(issn) {
    if (!issn) return '';
    const clean = issn.replace(/[^0-9X]/gi, '');
    if (clean.length === 8) {
        return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return issn;
}

/**
 * Resume estatísticas do currículo
 */
export function getStats(parsedData) {
    if (!parsedData) return null;

    const { articles, projects, orientations, technicalProduction, indicators } = parsedData;

    return {
        articles: {
            total: articles?.length || 0,
            published: articles?.filter(a => a.type === 'published').length || 0,
            accepted: articles?.filter(a => a.type === 'accepted').length || 0
        },
        projects: {
            total: projects?.length || 0,
            research: projects?.filter(p => p.type === 'research').length || 0,
            extension: projects?.filter(p => p.type === 'extension').length || 0,
            development: projects?.filter(p => p.type === 'development').length || 0,
            active: projects?.filter(p => !p.yearEnd || p.status === 'EM_ANDAMENTO').length || 0
        },
        orientations: {
            total: orientations?.length || 0,
            phd: orientations?.filter(o => o.type === 'phd').length || 0,
            master: orientations?.filter(o => o.type === 'master').length || 0,
            completed: orientations?.filter(o => o.status === 'completed').length || 0,
            ongoing: orientations?.filter(o => o.status === 'ongoing').length || 0
        },
        technicalProduction: {
            total: technicalProduction?.length || 0,
            software: technicalProduction?.filter(t => t.type === 'software').length || 0,
            patents: technicalProduction?.filter(t => t.type === 'patent').length || 0,
            techProducts: technicalProduction?.filter(t => t.isMarkedAsTechProduct).length || 0,
            processes: technicalProduction?.filter(t => t.type === 'process').length || 0,
            technicalWorks: technicalProduction?.filter(t => t.type === 'technical_work').length || 0
        },
        indicators: indicators || {}
    };
}

export default {
    parseXML,
    extractProfile,
    extractArticles,
    extractProjects,
    extractOrientations,
    extractTechnicalProduction,
    extractIndicators,
    normalizeJournalName,
    formatISSN,
    getStats
};
