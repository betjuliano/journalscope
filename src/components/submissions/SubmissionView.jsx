import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    FileText,
    Calendar,
    User,
    BookOpen,
    Tag,
    MessageSquare,
    ExternalLink,
    ArrowLeft
} from 'lucide-react';
import { getSubmissionById } from '../../utils/submissionStorage';

/**
 * Página de visualização pública de submissão (para compartilhamento)
 */
const SubmissionView = () => {
    const { id } = useParams();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSubmission = () => {
            const data = getSubmissionById(id);
            setSubmission(data);
            setLoading(false);
        };

        loadSubmission();
    }, [id]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando submissão...</p>
                </div>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Submissão não encontrada
                    </h2>
                    <p className="text-gray-600 mb-6">
                        O link pode estar incorreto ou a submissão foi removida.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o início
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-8 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${getStatusColor(submission.status)}`}>
                                {getStatusLabel(submission.status)}
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {submission.title}
                            </h1>
                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    <span className="font-medium">{submission.journal}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    <span>Submetido em {formatDate(submission.submittedAt)}</span>
                                </div>
                            </div>

                            {/* Submission Link */}
                            {submission.submissionLink && (
                                <div className="mt-4">
                                    <a
                                        href={submission.submissionLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Acessar Submissão no Journal
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Authors */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Autores
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {submission.authors.map((author, idx) => (
                            <span
                                key={idx}
                                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-800 rounded-lg font-medium border border-blue-100"
                            >
                                {author}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Abstract */}
                {submission.abstract && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Resumo</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {submission.abstract}
                        </p>
                    </div>
                )}

                {/* Keywords */}
                {submission.keywords && submission.keywords.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Palavras-chave
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {submission.keywords.map((keyword, idx) => (
                                <span
                                    key={idx}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews */}
                {submission.reviews && submission.reviews.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Revisões ({submission.reviews.length})
                        </h2>
                        <div className="space-y-4">
                            {submission.reviews.map((review, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-semibold text-gray-900">
                                            {review.reviewer}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {formatDate(review.date)}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mb-3 leading-relaxed">
                                        {review.comment}
                                    </p>
                                    {review.recommendation && (
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${review.recommendation === 'accept' ? 'bg-green-100 text-green-800' :
                                            review.recommendation === 'reject' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {review.recommendation === 'accept' ? 'Aceitar' :
                                                review.recommendation === 'reject' ? 'Rejeitar' :
                                                    'Revisão Necessária'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-md p-6 text-white text-center">
                    <ExternalLink className="w-8 h-8 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">
                        Visualização Compartilhada
                    </h3>
                    <p className="text-blue-100 text-sm">
                        Esta é uma visualização somente leitura desta submissão.
                        <br />
                        Para editar ou gerenciar, faça login no sistema.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubmissionView;
