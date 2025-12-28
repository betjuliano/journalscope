import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    User,
    Mail,
    Calendar,
    BookOpen,
    Building,
    BarChart3
} from 'lucide-react';
import {
    getGroupMembers,
    getGroupSubmissions,
    getGroupStats
} from '../../services/researchGroupService';

/**
 * Dashboard do grupo de pesquisa com estatísticas e submissões
 */
const ResearchGroupDashboard = ({ group, user, onClose }) => {
    const [members, setMembers] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, members, submissions

    useEffect(() => {
        loadDashboardData();
    }, [group.id]);

    const loadDashboardData = async () => {
        setLoading(true);

        const [membersResult, submissionsResult, statsResult] = await Promise.all([
            getGroupMembers(group.id),
            getGroupSubmissions(group.id),
            getGroupStats(group.id)
        ]);

        if (membersResult.data) setMembers(membersResult.data);
        if (submissionsResult.data) setSubmissions(submissionsResult.data);
        if (statsResult.data) setStats(statsResult.data);

        setLoading(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pendente',
            under_review: 'Em Revisão',
            revision_requested: 'Revisão Solicitada',
            accepted: 'Aceita',
            rejected: 'Rejeitada'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            under_review: 'bg-blue-100 text-blue-800',
            revision_requested: 'bg-orange-100 text-orange-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getRoleLabel = (role) => {
        const labels = {
            leader: 'Líder',
            member: 'Membro',
            student: 'Estudante'
        };
        return labels[role] || role;
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            leader: 'bg-purple-100 text-purple-800',
            member: 'bg-blue-100 text-blue-800',
            student: 'bg-green-100 text-green-800'
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <button
                        onClick={onClose}
                        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar para grupos
                    </button>

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {group.name}
                            </h1>
                            <div className="space-y-1 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    <span>{group.institution}</span>
                                </div>
                                {group.leader_name && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span>Líder: {group.leader_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mt-6 flex gap-2 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'overview'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4 inline mr-2" />
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'members'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />
                            Membros ({members.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('submissions')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'submissions'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <FileText className="w-4 h-4 inline mr-2" />
                            Submissões ({submissions.length})
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Carregando dados...</p>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && stats && (
                            <div className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <Users className="w-8 h-8 text-blue-600" />
                                            <span className="text-3xl font-bold text-gray-900">
                                                {stats.total_members || 0}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 font-medium">Membros Ativos</p>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <FileText className="w-8 h-8 text-purple-600" />
                                            <span className="text-3xl font-bold text-gray-900">
                                                {stats.total_submissions || 0}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 font-medium">Total de Submissões</p>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <CheckCircle className="w-8 h-8 text-green-600" />
                                            <span className="text-3xl font-bold text-gray-900">
                                                {stats.accepted_submissions || 0}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 font-medium">Aceitas</p>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <TrendingUp className="w-8 h-8 text-indigo-600" />
                                            <span className="text-3xl font-bold text-gray-900">
                                                {stats.acceptance_rate || 0}%
                                            </span>
                                        </div>
                                        <p className="text-gray-600 font-medium">Taxa de Aceitação</p>
                                    </div>
                                </div>

                                {/* Status Distribution */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                        Distribuição por Status
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-6 h-6 text-blue-600" />
                                                <span className="font-medium text-gray-900">Em Revisão</span>
                                            </div>
                                            <span className="text-2xl font-bold text-blue-600">
                                                {stats.under_review_submissions || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                                <span className="font-medium text-gray-900">Aceitas</span>
                                            </div>
                                            <span className="text-2xl font-bold text-green-600">
                                                {stats.accepted_submissions || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <XCircle className="w-6 h-6 text-red-600" />
                                                <span className="font-medium text-gray-900">Rejeitadas</span>
                                            </div>
                                            <span className="text-2xl font-bold text-red-600">
                                                {stats.rejected_submissions || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Members Tab */}
                        {activeTab === 'members' && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Membros do Grupo
                                </h3>
                                {members.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">
                                        Nenhum membro cadastrado ainda
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {member.user_name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {member.user_name || 'Nome não disponível'}
                                                        </p>
                                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {member.user_email || 'Email não disponível'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(member.role)}`}>
                                                        {getRoleLabel(member.role)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        Desde {formatDate(member.joined_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submissions Tab */}
                        {activeTab === 'submissions' && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Submissões do Grupo
                                </h3>
                                {submissions.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">
                                        Nenhuma submissão vinculada ao grupo ainda
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {submissions.map((submission) => (
                                            <div
                                                key={submission.id || submission.submission_id}
                                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 mb-1">
                                                            {submission.title}
                                                        </h4>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <BookOpen className="w-4 h-4" />
                                                                <span>{submission.journal}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-4 h-4" />
                                                                <span>{submission.author_name || 'Autor desconhecido'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>{formatDate(submission.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                                                        {getStatusLabel(submission.status)}
                                                    </span>
                                                </div>
                                                {submission.submission_link && (
                                                    <a
                                                        href={submission.submission_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        Ver submissão no journal →
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ResearchGroupDashboard;
