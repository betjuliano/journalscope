import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    Users,
    Calendar
} from 'lucide-react';
import SubmissionList from './SubmissionList';
import SubmissionForm from './SubmissionForm';
import SubmissionStats from './SubmissionStats';
import { getSubmissions, getSubmissionStats } from '../../utils/submissionStorage';

/**
 * Dashboard principal de submissões de artigos
 * Exibe estatísticas, lista de submissões e permite criar novas
 */
const SubmissionDashboard = ({ user, selectedJournal, onClearSelectedJournal }) => {
    const { t } = useI18n();
    const [submissions, setSubmissions] = useState([]);
    const [stats, setStats] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, under_review, accepted, rejected

    useEffect(() => {
        loadData();
    }, [user]);

    // Abrir formulário automaticamente quando um periódico é selecionado
    useEffect(() => {
        if (selectedJournal) {
            setSelectedSubmission({ journal: selectedJournal });
            setShowForm(true);
            // Limpar o periódico selecionado após abrir o formulário
            if (onClearSelectedJournal) {
                onClearSelectedJournal();
            }
        }
    }, [selectedJournal, onClearSelectedJournal]);

    const loadData = () => {
        const userSubmissions = getSubmissions(user.id);
        setSubmissions(userSubmissions);
        setStats(getSubmissionStats(user.id));
    };

    const handleCreateSubmission = () => {
        setSelectedSubmission(null);
        setShowForm(true);
    };

    const handleEditSubmission = (submission) => {
        setSelectedSubmission(submission);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedSubmission(null);
        loadData();
    };

    const filteredSubmissions = submissions.filter(sub => {
        if (filter === 'all') return true;
        return sub.status === filter;
    });

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

    const getStatusIcon = (status) => {
        const icons = {
            pending: Clock,
            under_review: AlertCircle,
            revision_requested: FileText,
            accepted: CheckCircle,
            rejected: XCircle
        };
        const Icon = icons[status] || FileText;
        return <Icon className="w-5 h-5" />;
    };

    if (showForm) {
        return (
            <SubmissionForm
                user={user}
                submission={selectedSubmission}
                onClose={handleCloseForm}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                Gestão de Submissões
                            </h1>
                            <p className="text-gray-600">
                                Gerencie suas submissões de artigos para periódicos acadêmicos
                            </p>
                        </div>
                        <button
                            onClick={handleCreateSubmission}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            + Nova Submissão
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && <SubmissionStats stats={stats} />}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-gray-700 font-semibold">Filtrar por status:</span>
                        {[
                            { value: 'all', label: 'Todas', count: submissions.length },
                            { value: 'pending', label: 'Pendentes', count: submissions.filter(s => s.status === 'pending').length },
                            { value: 'under_review', label: 'Em Revisão', count: submissions.filter(s => s.status === 'under_review').length },
                            { value: 'revision_requested', label: 'Revisão Solicitada', count: submissions.filter(s => s.status === 'revision_requested').length },
                            { value: 'accepted', label: 'Aceitas', count: submissions.filter(s => s.status === 'accepted').length },
                            { value: 'rejected', label: 'Rejeitadas', count: submissions.filter(s => s.status === 'rejected').length }
                        ].map(({ value, label, count }) => (
                            <button
                                key={value}
                                onClick={() => setFilter(value)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${filter === value
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {label} ({count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submissions List */}
                <SubmissionList
                    submissions={filteredSubmissions}
                    onEdit={handleEditSubmission}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                />

                {/* Empty State */}
                {filteredSubmissions.length === 0 && (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Nenhuma submissão encontrada
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all'
                                ? 'Comece criando sua primeira submissão de artigo'
                                : `Não há submissões com o status "${filter}"`
                            }
                        </p>
                        {filter === 'all' && (
                            <button
                                onClick={handleCreateSubmission}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                            >
                                Criar Primeira Submissão
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmissionDashboard;
