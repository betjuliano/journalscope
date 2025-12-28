import React, { useState, useMemo } from 'react';
import {
    Award, BarChart3, TrendingUp, Calendar,
    ChevronDown, Filter, Info, CheckCircle2
} from 'lucide-react';
import {
    QUALIS_2021_2024,
    QUALIS_2025_2028,
    filterByQuadriennium,
    getClassificationColor
} from '../../services/qualisScoreService';

/**
 * Componente para exibição de pontuação por quadriênio
 * Atualizado para suportar filtro exclusivo do quadriênio 2025-2028
 */
const LattesScore = ({ articles = [], profile }) => {
    const [activeQuadriennium, setActiveQuadriennium] = useState('2025-2028');
    const [showDetails, setShowDetails] = useState(false);
    const [filterOnly2025_2028, setFilterOnly2025_2028] = useState(false);

    // Calcular pontuações
    const scores = useMemo(() => {
        // Separar artigos por período
        const articles2021_2024 = filterByQuadriennium(articles, '2021-2024');
        const articles2025_2028 = filterByQuadriennium(articles, '2025-2028');

        // Todos os artigos (para classificação geral)
        const allArticles = articles;

        return {
            '2021-2024': calculateQualis2021_2024(articles2021_2024),
            '2025-2028': calculateQualis2025_2028(articles2025_2028),
            'all_2021_2024': calculateQualis2021_2024(allArticles), // Todos classificados pelo Qualis antigo
            'all_2025_2028': calculateQualis2025_2028(allArticles)  // Todos classificados pela nova metodologia
        };
    }, [articles]);

    const currentScore = filterOnly2025_2028
        ? scores['2025-2028']
        : scores[activeQuadriennium];

    // Contagem de artigos no período selecionado
    const periodArticleCount = filterOnly2025_2028
        ? filterByQuadriennium(articles, '2025-2028').length
        : filterByQuadriennium(articles, activeQuadriennium).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Pontuação por Quadriênio
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Classificação da produção bibliográfica conforme metodologia CAPES
                    </p>
                </div>

                {/* Filtro Exclusivo 2025-2028 */}
                <label className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-4 py-3 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-all">
                    <input
                        type="checkbox"
                        checked={filterOnly2025_2028}
                        onChange={(e) => {
                            setFilterOnly2025_2028(e.target.checked);
                            if (e.target.checked) {
                                setActiveQuadriennium('2025-2028');
                            }
                        }}
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                        <span className="font-medium text-emerald-800">Apenas 2025-2028</span>
                        <p className="text-xs text-emerald-600">Nova metodologia CAPES</p>
                    </div>
                </label>
            </div>

            {/* Toggle de Quadriênio */}
            {!filterOnly2025_2028 && (
                <div className="bg-white rounded-xl border p-2 inline-flex gap-1">
                    {['2021-2024', '2025-2028'].map(quad => (
                        <button
                            key={quad}
                            onClick={() => setActiveQuadriennium(quad)}
                            className={`
                                px-6 py-3 rounded-lg font-medium transition-all
                                ${activeQuadriennium === quad
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }
                            `}
                        >
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {quad}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Badge indicando filtro ativo */}
            {filterOnly2025_2028 && (
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg w-fit">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Exibindo apenas artigos de 2025-2028</span>
                    <span className="text-emerald-600">({periodArticleCount} artigos)</span>
                </div>
            )}

            {/* Card Principal de Pontuação */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pontuação Total */}
                <div className={`lg:col-span-1 rounded-2xl p-8 text-white ${filterOnly2025_2028
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-700'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Award className="w-8 h-8" />
                        </div>
                        <span className={`text-sm ${filterOnly2025_2028 ? 'text-emerald-200' : 'text-indigo-200'}`}>
                            {filterOnly2025_2028 || activeQuadriennium === '2025-2028'
                                ? 'Nova Metodologia'
                                : 'Qualis Tradicional'}
                        </span>
                    </div>

                    <p className="text-indigo-200 mb-2">Pontuação Total</p>
                    <p className="text-5xl font-bold mb-4">
                        {currentScore.totalScore}
                        <span className="text-2xl text-indigo-200 ml-2">pts</span>
                    </p>

                    <div className="pt-4 border-t border-white/20">
                        <p className="text-sm text-indigo-200">
                            {currentScore.classifiedCount} de {currentScore.totalArticles} artigos classificados
                        </p>
                        {currentScore.totalArticles > 0 && (
                            <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-white h-2 rounded-full transition-all"
                                    style={{
                                        width: `${(currentScore.classifiedCount / currentScore.totalArticles) * 100}%`
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Distribuição por Classificação */}
                <div className="lg:col-span-2 bg-white rounded-2xl border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                        Distribuição por Classificação
                    </h3>

                    {activeQuadriennium === '2025-2028' ? (
                        <div className="grid grid-cols-4 gap-4">
                            {['MB', 'B', 'R', 'F'].map(classification => {
                                const data = currentScore.byClassification[classification] || { count: 0, score: 0 };
                                const colors = getClassificationColor(classification);
                                return (
                                    <div
                                        key={classification}
                                        className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bg}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-2xl font-bold ${colors.text}`}>
                                                {classification}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                ×{QUALIS_2025_2028[classification]} pts
                                            </span>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {data.count}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            = {data.score} pts
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-3">
                            {['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C'].map(estrato => {
                                const data = currentScore.byClassification[estrato] || { count: 0, score: 0 };
                                const colors = getClassificationColor(estrato);
                                return (
                                    <div
                                        key={estrato}
                                        className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`font-bold ${colors.text}`}>
                                                {estrato}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {QUALIS_2021_2024[estrato]}pts
                                            </span>
                                        </div>
                                        <p className="text-xl font-bold text-gray-900">
                                            {data.count}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabela de Referência */}
            <div className="bg-white rounded-xl border p-6">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
                >
                    <Info className="w-5 h-5" />
                    <span className="font-medium">
                        {showDetails ? 'Ocultar' : 'Ver'} Tabela de Classificação
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </button>

                {showDetails && (
                    <div className="overflow-x-auto">
                        {activeQuadriennium === '2025-2028' ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left font-semibold">Classificação</th>
                                        <th className="px-4 py-3 text-center font-semibold">ABDC</th>
                                        <th className="px-4 py-3 text-center font-semibold">ABS</th>
                                        <th className="px-4 py-3 text-center font-semibold">JCR</th>
                                        <th className="px-4 py-3 text-center font-semibold">SJR</th>
                                        <th className="px-4 py-3 text-center font-semibold">SPELL</th>
                                        <th className="px-4 py-3 text-center font-semibold">Pontos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t">
                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-bold">MB</span></td>
                                        <td className="px-4 py-3 text-center">A, A*</td>
                                        <td className="px-4 py-3 text-center">≥ 2</td>
                                        <td className="px-4 py-3 text-center">Q1</td>
                                        <td className="px-4 py-3 text-center">Q1</td>
                                        <td className="px-4 py-3 text-center">-</td>
                                        <td className="px-4 py-3 text-center font-bold">8</td>
                                    </tr>
                                    <tr className="border-t bg-gray-50">
                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold">B</span></td>
                                        <td className="px-4 py-3 text-center">B</td>
                                        <td className="px-4 py-3 text-center">1</td>
                                        <td className="px-4 py-3 text-center">Q2</td>
                                        <td className="px-4 py-3 text-center">Q2</td>
                                        <td className="px-4 py-3 text-center">10% sup. + Scielo</td>
                                        <td className="px-4 py-3 text-center font-bold">4</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-bold">R</span></td>
                                        <td className="px-4 py-3 text-center">C</td>
                                        <td className="px-4 py-3 text-center">-</td>
                                        <td className="px-4 py-3 text-center">Q3</td>
                                        <td className="px-4 py-3 text-center">Q3</td>
                                        <td className="px-4 py-3 text-center">30% seguintes</td>
                                        <td className="px-4 py-3 text-center font-bold">2</td>
                                    </tr>
                                    <tr className="border-t bg-gray-50">
                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded font-bold">F</span></td>
                                        <td className="px-4 py-3 text-center">-</td>
                                        <td className="px-4 py-3 text-center">-</td>
                                        <td className="px-4 py-3 text-center">Q4</td>
                                        <td className="px-4 py-3 text-center">Q4</td>
                                        <td className="px-4 py-3 text-center">30% seguintes</td>
                                        <td className="px-4 py-3 text-center font-bold">1</td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left font-semibold">Estrato</th>
                                        <th className="px-4 py-3 text-center font-semibold">Pontos</th>
                                        <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(QUALIS_2021_2024).map(([estrato, pontos]) => (
                                        <tr key={estrato} className="border-t">
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded font-bold ${getClassificationColor(estrato).bg} ${getClassificationColor(estrato).text}`}>
                                                    {estrato}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold">{pontos}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                Conforme Qualis CAPES Sucupira
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <p className="mt-4 text-sm text-gray-500">
                            <strong>Nota:</strong> {activeQuadriennium === '2025-2028'
                                ? 'Nova metodologia baseada em ABDC, ABS, JCR, SJR e SPELL. A melhor posição do periódico nas listas determina a classificação.'
                                : 'Classificação obtida da Plataforma Sucupira/Qualis CAPES.'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Funções de cálculo (simplificadas - a classificação real virá das bases)
function calculateQualis2025_2028(articles) {
    const byClassification = { MB: { count: 0, score: 0 }, B: { count: 0, score: 0 }, R: { count: 0, score: 0 }, F: { count: 0, score: 0 } };
    let totalScore = 0;
    let classifiedCount = 0;

    articles.forEach(article => {
        if (article.qualis2025_2028?.classification) {
            const cls = article.qualis2025_2028.classification;
            const pts = QUALIS_2025_2028[cls] || 0;
            byClassification[cls].count++;
            byClassification[cls].score += pts;
            totalScore += pts;
            classifiedCount++;
        }
    });

    return { totalScore, totalArticles: articles.length, classifiedCount, byClassification };
}

function calculateQualis2021_2024(articles) {
    const byClassification = {};
    Object.keys(QUALIS_2021_2024).forEach(key => {
        byClassification[key] = { count: 0, score: 0 };
    });

    let totalScore = 0;
    let classifiedCount = 0;

    articles.forEach(article => {
        if (article.qualis2021_2024?.estrato) {
            const estrato = article.qualis2021_2024.estrato;
            const pts = QUALIS_2021_2024[estrato] || 0;
            if (byClassification[estrato]) {
                byClassification[estrato].count++;
                byClassification[estrato].score += pts;
            }
            totalScore += pts;
            classifiedCount++;
        }
    });

    return { totalScore, totalArticles: articles.length, classifiedCount, byClassification };
}

export default LattesScore;
