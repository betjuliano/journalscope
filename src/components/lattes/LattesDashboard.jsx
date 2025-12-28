import React, { useState, useEffect } from 'react';
import {
    User, FileText, Award, FolderGit2, GraduationCap,
    Upload, ChevronRight, RefreshCw, Download,
    BarChart3, Users, Package, Home, Star, Save, Loader2, CloudOff, Cloud
} from 'lucide-react';
import LattesImport from './LattesImport';
import LattesProfile from './LattesProfile';
import LattesArticles from './LattesArticles';
import LattesScore from './LattesScore';
import LattesTechnicalProduction from './LattesTechnicalProduction';
import ResearcherHome from './ResearcherHome';
import { getStats } from '../../services/lattesParserService';
import { classifyAllArticles } from '../../services/articleClassificationService';
import {
    getSavedCurriculo,
    saveCurriculo,
    updateTechProductMark,
    convertSavedToAppFormat
} from '../../services/lattesStorageService';

/**
 * Dashboard principal do Extrator Lattes
 * Atualizado para incluir produção técnica e persistência no banco
 */
const LattesDashboard = ({ user }) => {
    const [lattesData, setLattesData] = useState(null);
    const [activeTab, setActiveTab] = useState('import');
    const [stats, setStats] = useState(null);

    // Estados de persistência
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [savedCurriculo, setSavedCurriculo] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);

    // Tabs disponíveis - reorganizadas para melhor UX
    const tabs = [
        { id: 'import', label: 'Importar', icon: Upload, showAlways: true },
        { id: 'home', label: 'Página Inicial', icon: Home, requiresData: true },
        { id: 'profile', label: 'Perfil', icon: User, requiresData: true },
        { id: 'articles', label: 'Artigos', icon: FileText, requiresData: true },
        { id: 'score', label: 'Pontuação', icon: Award, requiresData: true },
        { id: 'technical', label: 'Produção Técnica', icon: Package, requiresData: true },
        { id: 'projects', label: 'Projetos', icon: FolderGit2, requiresData: true },
        { id: 'orientations', label: 'Orientações', icon: GraduationCap, requiresData: true }
    ];

    // Carregar currículo salvo ao iniciar
    useEffect(() => {
        const loadSavedCurriculo = async () => {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const saved = await getSavedCurriculo(user.id);
                if (saved) {
                    setSavedCurriculo(saved);
                    const appData = convertSavedToAppFormat(saved);
                    // Classificar artigos ao carregar
                    appData.articles = classifyAllArticles(appData.articles || []);
                    setLattesData(appData);
                    setLastSaved(saved.updated_at);
                    setActiveTab('home');
                }
            } catch (error) {
                console.error('[LattesDashboard] Erro ao carregar currículo:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSavedCurriculo();
    }, [user?.id]);

    // Atualiza stats quando dados mudam
    useEffect(() => {
        if (lattesData) {
            setStats(getStats(lattesData));
        }
    }, [lattesData]);

    // Salvar currículo após importação
    const handleImportSuccess = async (parsedData, options = {}) => {
        // Classificar artigos usando as bases de dados
        console.log('[LattesDashboard] Classificando artigos...');
        const classifiedArticles = classifyAllArticles(parsedData.articles || []);
        const dataWithClassification = {
            ...parsedData,
            articles: classifiedArticles
        };

        // Contar artigos classificados como MB
        const mbCount = classifiedArticles.filter(a => a.qualis2025_2028?.classification === 'MB').length;
        console.log(`[LattesDashboard] ${mbCount} artigos classificados como MB (8 pontos)`);

        setLattesData(dataWithClassification);
        setActiveTab('home');

        // Salvar no banco se usuário estiver logado
        if (user?.id) {
            setIsSaving(true);
            setSaveError(null);
            try {
                const result = await saveCurriculo(user.id, dataWithClassification, {
                    updateExisting: options.updateExisting !== false
                });
                setLastSaved(new Date().toISOString());

                // Recarregar dados salvos para ter os IDs corretos
                const saved = await getSavedCurriculo(user.id);
                if (saved) {
                    setSavedCurriculo(saved);
                    // Reclassificar após carregar do banco
                    const appData = convertSavedToAppFormat(saved);
                    appData.articles = classifyAllArticles(appData.articles || []);
                    setLattesData(appData);
                }
            } catch (error) {
                console.error('[LattesDashboard] Erro ao salvar:', error);
                setSaveError('Erro ao salvar no banco de dados');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleNewImport = () => {
        // Não limpa dados salvos, apenas permite novo import
        setActiveTab('import');
    };

    const handleUpdateTechProduct = async (updatedProduction) => {
        if (lattesData) {
            setLattesData({
                ...lattesData,
                technicalProduction: updatedProduction
            });

            // Salvar marcação no banco
            if (user?.id && savedCurriculo) {
                try {
                    // Encontrar item modificado e atualizar
                    for (const item of updatedProduction) {
                        if (item.id) {
                            await updateTechProductMark(item.id, item.isMarkedAsTechProduct);
                        }
                    }
                } catch (error) {
                    console.error('[LattesDashboard] Erro ao atualizar marcação:', error);
                }
            }
        }
    };

    const getAvailableTabs = () => {
        return tabs.filter(tab => tab.showAlways || (tab.requiresData && lattesData));
    };

    // Loading inicial
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando currículo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                                <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Extrator Lattes
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    Análise de currículo e pontuação por quadriênio
                                </p>
                            </div>
                        </div>

                        {/* Ações */}
                        {lattesData && (
                            <div className="flex items-center gap-3">
                                {/* Indicador de sincronização */}
                                {isSaving ? (
                                    <span className="flex items-center gap-2 text-sm text-blue-600">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Salvando...
                                    </span>
                                ) : lastSaved ? (
                                    <span className="flex items-center gap-2 text-sm text-emerald-600">
                                        <Cloud className="w-4 h-4" />
                                        Salvo
                                    </span>
                                ) : user?.id ? (
                                    <span className="flex items-center gap-2 text-sm text-gray-400">
                                        <CloudOff className="w-4 h-4" />
                                        Não salvo
                                    </span>
                                ) : null}

                                {saveError && (
                                    <span className="text-sm text-red-500">{saveError}</span>
                                )}

                                <button
                                    onClick={handleNewImport}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Novo Import
                                </button>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                                >
                                    <Download className="w-4 h-4" />
                                    Exportar Relatório
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Resumo rápido */}
                    {lattesData && stats && (
                        <div className="mt-4 pt-4 border-t flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <span className="font-medium">{lattesData.profile?.name}</span>
                            </div>
                            <div className="w-px h-4 bg-gray-300" />
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span><strong className="text-blue-600">{stats.articles.total}</strong> artigos</span>
                                <span><strong className="text-purple-600">{stats.projects.total}</strong> projetos</span>
                                <span><strong className="text-amber-600">{stats.orientations.total}</strong> orientações</span>
                                {stats.technicalProduction?.total > 0 && (
                                    <span><strong className="text-emerald-600">{stats.technicalProduction.total}</strong> prod. técnica</span>
                                )}
                            </div>
                            {stats.orientations.ongoing > 0 && (
                                <>
                                    <div className="w-px h-4 bg-gray-300" />
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                                        {stats.orientations.ongoing} orient. em andamento
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Navegação por tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6">
                    <nav className="flex gap-1 overflow-x-auto">
                        {getAvailableTabs().map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 text-sm font-medium
                                    border-b-2 transition-colors whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {/* Badges de contagem */}
                                {tab.id === 'articles' && stats && (
                                    <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        {stats.articles.total}
                                    </span>
                                )}
                                {tab.id === 'orientations' && stats && stats.orientations.ongoing > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                        {stats.orientations.ongoing} em andamento
                                    </span>
                                )}
                                {tab.id === 'technical' && stats && stats.technicalProduction?.techProducts > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3" />
                                        {stats.technicalProduction.techProducts}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Conteúdo */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'import' && (
                    <LattesImport
                        onImportSuccess={handleImportSuccess}
                        existingCurriculo={savedCurriculo}
                        lastSaved={lastSaved}
                    />
                )}

                {activeTab === 'home' && lattesData && (
                    <ResearcherHome
                        profile={lattesData.profile}
                        stats={stats}
                        technicalProduction={lattesData.technicalProduction || []}
                        articles={lattesData.articles || []}
                        orientations={lattesData.orientations || []}
                        projects={lattesData.projects || []}
                    />
                )}

                {activeTab === 'profile' && lattesData && (
                    <LattesProfile
                        profile={lattesData.profile}
                        stats={stats}
                    />
                )}

                {activeTab === 'articles' && lattesData && (
                    <LattesArticles
                        articles={lattesData.articles}
                    />
                )}

                {activeTab === 'score' && lattesData && (
                    <LattesScore
                        articles={lattesData.articles}
                        profile={lattesData.profile}
                    />
                )}

                {activeTab === 'technical' && lattesData && (
                    <LattesTechnicalProduction
                        technicalProduction={lattesData.technicalProduction || []}
                        onUpdateTechProduct={handleUpdateTechProduct}
                    />
                )}

                {activeTab === 'projects' && lattesData && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Projetos</h2>
                        {lattesData.projects.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border">
                                <FolderGit2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Nenhum projeto encontrado no currículo</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {lattesData.projects.map((project, index) => (
                                    <div key={index} className="bg-white rounded-xl border p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`
                                                        px-2 py-1 text-xs font-medium rounded-full
                                                        ${project.type === 'research' ? 'bg-blue-100 text-blue-700' : ''}
                                                        ${project.type === 'extension' ? 'bg-purple-100 text-purple-700' : ''}
                                                        ${project.type === 'development' ? 'bg-emerald-100 text-emerald-700' : ''}
                                                    `}>
                                                        {project.type === 'research' && 'Pesquisa'}
                                                        {project.type === 'extension' && 'Extensão'}
                                                        {project.type === 'development' && 'Desenvolvimento'}
                                                    </span>
                                                    <span className={`
                                                        px-2 py-1 text-xs rounded-full
                                                        ${project.yearEnd ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}
                                                    `}>
                                                        {project.yearEnd ? 'Concluído' : 'Em andamento'}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                                {project.description && (
                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                        {project.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right text-sm text-gray-500">
                                                {project.yearStart}
                                                {project.yearEnd ? ` - ${project.yearEnd}` : ' - atual'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orientations' && lattesData && (
                    <OrientationsSection orientations={lattesData.orientations || []} />
                )}
            </div>
        </div>
    );
};

/**
 * Seção de Orientações com abas para filtrar
 */
const OrientationsSection = ({ orientations }) => {
    const [filter, setFilter] = useState('all'); // all, ongoing, completed

    const ongoingCount = orientations.filter(o => o.status === 'ongoing').length;
    const completedCount = orientations.filter(o => o.status === 'completed').length;

    const filteredOrientations = orientations.filter(o => {
        if (filter === 'ongoing') return o.status === 'ongoing';
        if (filter === 'completed') return o.status === 'completed';
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Orientações</h2>

                {/* Filtros */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-white shadow text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Todas ({orientations.length})
                    </button>
                    <button
                        onClick={() => setFilter('ongoing')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'ongoing'
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Em Andamento ({ongoingCount})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Concluídas ({completedCount})
                    </button>
                </div>
            </div>

            {/* Destaque para orientações em andamento */}
            {filter === 'all' && ongoingCount > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="w-6 h-6 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800">
                                {ongoingCount} orientação{ongoingCount > 1 ? 'ões' : ''} em andamento
                            </p>
                            <p className="text-sm text-amber-600">
                                {orientations.filter(o => o.status === 'ongoing' && o.type === 'phd').length} doutorado(s), {' '}
                                {orientations.filter(o => o.status === 'ongoing' && o.type === 'master').length} mestrado(s)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {filteredOrientations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                        {filter === 'ongoing'
                            ? 'Nenhuma orientação em andamento'
                            : filter === 'completed'
                                ? 'Nenhuma orientação concluída'
                                : 'Nenhuma orientação encontrada no currículo'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredOrientations.map((orientation, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-xl border p-6 ${orientation.status === 'ongoing' ? 'border-l-4 border-l-amber-400' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`
                                            px-2 py-1 text-xs font-medium rounded-full
                                            ${orientation.type === 'phd' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                                        `}>
                                            {orientation.type === 'phd' ? 'Doutorado' : 'Mestrado'}
                                        </span>
                                        <span className={`
                                            px-2 py-1 text-xs rounded-full
                                            ${orientation.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                                        `}>
                                            {orientation.status === 'completed' ? 'Concluída' : 'Em andamento'}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900">{orientation.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Orientando: {orientation.student}
                                    </p>
                                    {orientation.institution && (
                                        <p className="text-sm text-gray-500">
                                            {orientation.institution}
                                        </p>
                                    )}
                                    {orientation.program && (
                                        <p className="text-sm text-gray-400">
                                            Programa: {orientation.program}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    {orientation.status === 'ongoing' ? `Início: ${orientation.year}` : orientation.year}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LattesDashboard;
