import React, { useState, useMemo } from 'react';
import {
    FileText, Search, Filter, ChevronDown, ChevronUp,
    ExternalLink, Calendar, Users, Book
} from 'lucide-react';
import { getClassificationColor } from '../../services/qualisScoreService';

/**
 * Componente para listagem de artigos com classificação
 */
const LattesArticles = ({ articles = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [sortBy, setSortBy] = useState('year');
    const [sortOrder, setSortOrder] = useState('desc');
    const [expandedArticle, setExpandedArticle] = useState(null);

    // Anos disponíveis para filtro
    const availableYears = useMemo(() => {
        const years = [...new Set(articles.map(a => a.year))].filter(Boolean);
        return years.sort((a, b) => b - a);
    }, [articles]);

    // Artigos filtrados e ordenados
    const filteredArticles = useMemo(() => {
        let result = [...articles];

        // Filtro por busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(a =>
                a.title?.toLowerCase().includes(term) ||
                a.journal?.toLowerCase().includes(term) ||
                a.authors?.some(author => author.name?.toLowerCase().includes(term))
            );
        }

        // Filtro por tipo
        if (filterType !== 'all') {
            result = result.filter(a => a.type === filterType);
        }

        // Filtro por ano
        if (filterYear !== 'all') {
            result = result.filter(a => a.year === parseInt(filterYear));
        }

        // Ordenação
        result.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'year') {
                comparison = (a.year || 0) - (b.year || 0);
            } else if (sortBy === 'title') {
                comparison = (a.title || '').localeCompare(b.title || '');
            } else if (sortBy === 'journal') {
                comparison = (a.journal || '').localeCompare(b.journal || '');
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return result;
    }, [articles, searchTerm, filterType, filterYear, sortBy, sortOrder]);

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return null;
        return sortOrder === 'desc'
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronUp className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Artigos em Periódicos</h2>
                    <p className="text-gray-500 mt-1">
                        {articles.length} artigos encontrados • {filteredArticles.length} exibidos
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Busca */}
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por título, periódico ou autor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Tipo */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="published">Publicados</option>
                        <option value="accepted">Aceitos</option>
                    </select>

                    {/* Ano */}
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os anos</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de Artigos */}
            {filteredArticles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum artigo encontrado</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    {/* Cabeçalho da tabela */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b text-sm font-medium text-gray-600">
                        <button
                            className="col-span-5 flex items-center gap-1 hover:text-gray-900"
                            onClick={() => toggleSort('title')}
                        >
                            Título
                            <SortIcon field="title" />
                        </button>
                        <button
                            className="col-span-3 flex items-center gap-1 hover:text-gray-900"
                            onClick={() => toggleSort('journal')}
                        >
                            Periódico
                            <SortIcon field="journal" />
                        </button>
                        <button
                            className="col-span-1 flex items-center gap-1 hover:text-gray-900"
                            onClick={() => toggleSort('year')}
                        >
                            Ano
                            <SortIcon field="year" />
                        </button>
                        <div className="col-span-1 text-center">2021-24</div>
                        <div className="col-span-1 text-center">2025-28</div>
                        <div className="col-span-1 text-center">Status</div>
                    </div>

                    {/* Linhas */}
                    {filteredArticles.map((article, index) => (
                        <div key={index}>
                            <div
                                className={`
                                    grid grid-cols-12 gap-4 px-6 py-4 items-center
                                    border-b hover:bg-gray-50 cursor-pointer transition-colors
                                    ${expandedArticle === index ? 'bg-blue-50' : ''}
                                `}
                                onClick={() => setExpandedArticle(expandedArticle === index ? null : index)}
                            >
                                {/* Título */}
                                <div className="col-span-5">
                                    <p className="font-medium text-gray-900 line-clamp-2">
                                        {article.title}
                                    </p>
                                </div>

                                {/* Periódico */}
                                <div className="col-span-3">
                                    <p className="text-gray-600 line-clamp-1">
                                        {article.journal}
                                    </p>
                                    {article.issn && (
                                        <p className="text-xs text-gray-400">ISSN: {article.issn}</p>
                                    )}
                                </div>

                                {/* Ano */}
                                <div className="col-span-1 text-center font-medium text-gray-700">
                                    {article.year}
                                </div>

                                {/* Classificação 2021-2024 */}
                                <div className="col-span-1 text-center">
                                    {article.qualis2021_2024 ? (
                                        <span className={`
                                            px-2 py-1 text-xs font-bold rounded
                                            ${getClassificationColor(article.qualis2021_2024.estrato).bg}
                                            ${getClassificationColor(article.qualis2021_2024.estrato).text}
                                        `}>
                                            {article.qualis2021_2024.estrato}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </div>

                                {/* Classificação 2025-2028 */}
                                <div className="col-span-1 text-center">
                                    {article.qualis2025_2028 ? (
                                        <span className={`
                                            px-2 py-1 text-xs font-bold rounded
                                            ${getClassificationColor(article.qualis2025_2028.classification).bg}
                                            ${getClassificationColor(article.qualis2025_2028.classification).text}
                                        `}>
                                            {article.qualis2025_2028.classification}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="col-span-1 text-center">
                                    <span className={`
                                        px-2 py-1 text-xs rounded-full
                                        ${article.type === 'published'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'
                                        }
                                    `}>
                                        {article.type === 'published' ? 'Publicado' : 'Aceito'}
                                    </span>
                                </div>
                            </div>

                            {/* Detalhes expandidos */}
                            {expandedArticle === index && (
                                <div className="px-6 py-4 bg-blue-50 border-b">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Detalhes</h4>
                                            <div className="space-y-2 text-sm">
                                                {article.doi && (
                                                    <p className="flex items-center gap-2">
                                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                                        <a
                                                            href={`https://doi.org/${article.doi}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            DOI: {article.doi}
                                                        </a>
                                                    </p>
                                                )}
                                                {article.volume && (
                                                    <p className="flex items-center gap-2">
                                                        <Book className="w-4 h-4 text-gray-400" />
                                                        Vol. {article.volume}
                                                        {article.issue && `, Nº ${article.issue}`}
                                                        {article.pages && `, pp. ${article.pages}`}
                                                    </p>
                                                )}
                                                {article.language && (
                                                    <p className="text-gray-600">
                                                        Idioma: {article.language}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Autores</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {article.authors?.map((author, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-white rounded text-sm text-gray-700 border"
                                                    >
                                                        {author.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LattesArticles;
