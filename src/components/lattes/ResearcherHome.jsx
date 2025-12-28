import React from 'react';
import {
    User, Award, FileText, FolderGit2, GraduationCap,
    Star, Package, FileCode, Cpu, MapPin, Building,
    Calendar, ExternalLink, Mail, Globe, BookOpen,
    TrendingUp, ChevronRight, Trophy
} from 'lucide-react';
import { getClassificationColor, QUALIS_2025_2028 } from '../../services/qualisScoreService';

/**
 * Página inicial do pesquisador com destaque para produtos tecnológicos
 * Serve como vitrine da produção acadêmica e técnica
 */
const ResearcherHome = ({
    profile,
    stats,
    technicalProduction = [],
    articles = [],
    orientations = [],
    projects = []
}) => {
    // Filtrar apenas produtos tecnológicos marcados
    const techProducts = technicalProduction.filter(p => p.isMarkedAsTechProduct);

    // Orientações em andamento
    const ongoingOrientations = orientations.filter(o => o.status === 'ongoing');

    // Projetos ativos
    const activeProjects = projects.filter(p => !p.yearEnd || p.status === 'EM_ANDAMENTO');

    // Artigos recentes (últimos 3 anos)
    const currentYear = new Date().getFullYear();
    const recentArticles = articles.filter(a => a.year >= currentYear - 3).slice(0, 5);

    // ⭐ Artigos com pontuação máxima (MB - 8 pontos) no quadriênio 2025-2028
    const topArticles = articles.filter(a =>
        a.qualis2025_2028?.classification === 'MB' &&
        a.year >= 2025 && a.year <= 2028
    );

    // Artigos MB de todos os tempos (para mostrar mais candidatos)
    const allMBArticles = articles.filter(a =>
        a.qualis2025_2028?.classification === 'MB'
    );

    const productionTypes = {
        software: { label: 'Software', icon: FileCode, color: 'blue' },
        patent: { label: 'Patente', icon: Award, color: 'amber' },
        tech_product: { label: 'Produto Tecnológico', icon: Package, color: 'emerald' },
        process: { label: 'Processo/Técnica', icon: Cpu, color: 'purple' },
        technical_work: { label: 'Trabalho Técnico', icon: Cpu, color: 'indigo' },
        didactic_material: { label: 'Material Didático', icon: BookOpen, color: 'rose' }
    };

    if (!profile) {
        return (
            <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum perfil carregado</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero do Pesquisador */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden">
                {/* Pattern decorativo */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <User className="w-12 h-12" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                            {profile.citationName && (
                                <p className="text-indigo-200 text-sm mb-3">
                                    Citação: {profile.citationName}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-indigo-100">
                                {profile.institution && (
                                    <span className="flex items-center gap-1">
                                        <Building className="w-4 h-4" />
                                        {profile.institution}
                                    </span>
                                )}
                                {profile.department && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.department}
                                    </span>
                                )}
                                {profile.orcid && (
                                    <a
                                        href={`https://orcid.org/${profile.orcid}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-white transition-colors"
                                    >
                                        <Globe className="w-4 h-4" />
                                        ORCID: {profile.orcid}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas Rápidas */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold">{stats?.articles?.total || 0}</p>
                            <p className="text-sm text-indigo-200">Artigos</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold">{stats?.projects?.total || 0}</p>
                            <p className="text-sm text-indigo-200">Projetos</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold">{stats?.orientations?.total || 0}</p>
                            <p className="text-sm text-indigo-200">Orientações</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold">{techProducts.length}</p>
                            <p className="text-sm text-indigo-200">Produtos Tec.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold">{ongoingOrientations.length}</p>
                            <p className="text-sm text-indigo-200">Orient. Andamento</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Produtos Tecnológicos em Destaque */}
            {techProducts.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Star className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Produtos Tecnológicos</h2>
                                <p className="text-sm text-gray-500">Produções técnicas em destaque</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            {techProducts.length} {techProducts.length === 1 ? 'produto' : 'produtos'}
                        </span>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {techProducts.map((product, index) => {
                            const typeInfo = productionTypes[product.type] || { label: product.type, icon: Package, color: 'gray' };
                            const TypeIcon = typeInfo.icon;

                            return (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                                >
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 border-b border-emerald-100">
                                        <div className="flex items-center gap-2">
                                            <TypeIcon className="w-4 h-4 text-emerald-600" />
                                            <span className="text-sm font-medium text-emerald-700">
                                                {typeInfo.label}
                                            </span>
                                            <span className="ml-auto text-xs text-emerald-600">
                                                {product.year}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                                            {product.title}
                                        </h3>
                                        {product.institution && (
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Building className="w-4 h-4" />
                                                {product.institution}
                                            </p>
                                        )}
                                        {product.registrationNumber && (
                                            <p className="text-xs text-gray-400 mt-2">
                                                Registro: {product.registrationNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ⭐ Artigos com Pontuação Máxima (MB - 8 pontos) */}
            {allMBArticles.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg">
                                <Trophy className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Artigos em Periódicos de Alto Impacto
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Classificação MB (Muito Bom) - 8 pontos no Qualis 2025-2028
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                                {allMBArticles.length} {allMBArticles.length === 1 ? 'artigo' : 'artigos'}
                            </span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                                {allMBArticles.length * 8} pontos
                            </span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-2xl border border-amber-200 p-6">
                        <div className="grid gap-4">
                            {allMBArticles.slice(0, 10).map((article, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center flex-wrap gap-2 mb-2">
                                                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md">
                                                    MB - 8pts
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                    {article.year}
                                                </span>
                                                {article.qualis2025_2028?.sources?.map((source, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                                                    >
                                                        {source}
                                                    </span>
                                                ))}
                                                {article.year >= 2025 && article.year <= 2028 && (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                                                        ✓ Quadriênio 2025-2028
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {article.title}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {article.journal}
                                            </p>
                                            {article.doi && (
                                                <a
                                                    href={`https://doi.org/${article.doi}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                                                >
                                                    DOI: {article.doi}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {allMBArticles.length > 10 && (
                            <p className="text-center text-amber-700 mt-4 text-sm">
                                E mais {allMBArticles.length - 10} artigos de alto impacto...
                            </p>
                        )}
                    </div>
                </section>
            )}

            {/* Duas colunas: Orientações em Andamento + Artigos Recentes */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Orientações em Andamento */}
                <section className="bg-white rounded-xl border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Orientações em Andamento</h2>
                            <p className="text-sm text-gray-500">{ongoingOrientations.length} orientações ativas</p>
                        </div>
                    </div>

                    {ongoingOrientations.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">
                            Nenhuma orientação em andamento
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {ongoingOrientations.slice(0, 5).map((orientation, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${orientation.type === 'phd'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {orientation.type === 'phd' ? 'Doutorado' : 'Mestrado'}
                                        </span>
                                        <span className="text-xs text-gray-500">Início: {orientation.year}</span>
                                    </div>
                                    <p className="font-medium text-gray-900 text-sm line-clamp-1">
                                        {orientation.title}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {orientation.student}
                                    </p>
                                </div>
                            ))}
                            {ongoingOrientations.length > 5 && (
                                <p className="text-sm text-center text-blue-600 cursor-pointer hover:underline">
                                    Ver mais {ongoingOrientations.length - 5} orientações
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* Artigos Recentes */}
                <section className="bg-white rounded-xl border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Artigos Recentes</h2>
                            <p className="text-sm text-gray-500">Últimos 3 anos</p>
                        </div>
                    </div>

                    {recentArticles.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">
                            Nenhum artigo recente encontrado
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentArticles.map((article, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                                            {article.year}
                                        </span>
                                        {article.qualis2025_2028?.classification && (
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${getClassificationColor(article.qualis2025_2028.classification).bg
                                                } ${getClassificationColor(article.qualis2025_2028.classification).text}`}>
                                                {article.qualis2025_2028.classification}
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-medium text-gray-900 text-sm line-clamp-2">
                                        {article.title}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {article.journal}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Projetos Ativos */}
            {activeProjects.length > 0 && (
                <section className="bg-white rounded-xl border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FolderGit2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Projetos em Andamento</h2>
                            <p className="text-sm text-gray-500">{activeProjects.length} projetos ativos</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {activeProjects.slice(0, 4).map((project, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${project.type === 'research' ? 'bg-blue-100 text-blue-700' :
                                        project.type === 'extension' ? 'bg-purple-100 text-purple-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {project.type === 'research' && 'Pesquisa'}
                                        {project.type === 'extension' && 'Extensão'}
                                        {project.type === 'development' && 'Desenvolvimento'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Desde {project.yearStart}
                                    </span>
                                </div>
                                <p className="font-medium text-gray-900 line-clamp-2">
                                    {project.name}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Indicadores */}
            {stats?.indicators && (
                <section className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Indicadores Bibliográficos</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 text-center border">
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.indicators.articlesInternational || 0}
                            </p>
                            <p className="text-sm text-gray-500">Artigos Internacionais</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center border">
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.indicators.articlesNational || 0}
                            </p>
                            <p className="text-sm text-gray-500">Artigos Nacionais</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center border">
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.indicators.booksComplete || 0}
                            </p>
                            <p className="text-sm text-gray-500">Livros</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center border">
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.indicators.booksChapters || 0}
                            </p>
                            <p className="text-sm text-gray-500">Capítulos</p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default ResearcherHome;
