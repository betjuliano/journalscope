import React from 'react';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    Calendar,
    BarChart3
} from 'lucide-react';

/**
 * Componente de estatísticas do dashboard de submissões
 */
const SubmissionStats = ({ stats }) => {
    const statCards = [
        {
            title: 'Total de Submissões',
            value: stats.total,
            icon: FileText,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            title: 'Em Revisão',
            value: stats.underReview,
            icon: Clock,
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600'
        },
        {
            title: 'Aceitas',
            value: stats.accepted,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            title: 'Rejeitadas',
            value: stats.rejected,
            icon: XCircle,
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-50',
            textColor: 'text-red-600'
        },
        {
            title: 'Taxa de Aceitação',
            value: `${stats.acceptanceRate}%`,
            icon: TrendingUp,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
        },
        {
            title: 'Tempo Médio de Revisão',
            value: `${stats.avgReviewTime} dias`,
            icon: Calendar,
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                                </div>
                                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                            </div>
                            <h3 className="text-gray-600 text-sm font-medium mb-1">
                                {stat.title}
                            </h3>
                            <p className={`text-3xl font-bold ${stat.textColor}`}>
                                {stat.value}
                            </p>
                        </div>
                        <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
                    </div>
                );
            })}
        </div>
    );
};

export default SubmissionStats;
