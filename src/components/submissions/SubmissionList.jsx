import React, { useState } from 'react';
import {
    FileText,
    Edit,
    Trash2,
    Share2,
    Eye,
    Calendar,
    User,
    BookOpen,
    MessageSquare,
    ExternalLink,
    Copy,
    Check,
    Link
} from 'lucide-react';
import { deleteSubmission, generateShareLink } from '../../utils/submissionStorage';

/**
 * Lista de submissões com ações e detalhes
 */
const SubmissionList = ({ submissions, onEdit, getStatusColor, getStatusIcon }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [copiedLink, setCopiedLink] = useState(null);

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta submissão?')) {
            deleteSubmission(id);
            window.location.reload();
        }
    };

    const handleShare = (submission) => {
        const link = generateShareLink(submission.id);
        navigator.clipboard.writeText(link);
        setCopiedLink(submission.id);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
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

    return (
        <div className="space-y-4">
            {submissions.map((submission) => {
                const StatusIcon = getStatusIcon(submission.status);
                const isExpanded = expandedId === submission.id;

                return (
                    <div
                        key={submission.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {submission.title}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(submission.status)}`}>
                                            {StatusIcon}
                                            {getStatusLabel(submission.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            <span>{submission.journal}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Submetido em {formatDate(submission.submittedAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            <span>{submission.authors.length} autor(es)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {submission.submissionLink && (
                                        <a
                                            href={submission.submissionLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Acessar submissão no journal"
                                        >
                                            <Link className="w-5 h-5" />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => toggleExpand(submission.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Ver detalhes"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onEdit(submission)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleShare(submission)}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors relative"
                                        title="Compartilhar link"
                                    >
                                        {copiedLink === submission.id ? (
                                            <Check className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Share2 className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(submission.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Info */}
                            {submission.abstract && (
                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                    {submission.abstract}
                                </p>
                            )}

                            {/* Reviews Count */}
                            {submission.reviews && submission.reviews.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{submission.reviews.length} revisão(ões)</span>
                                </div>
                            )}
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
                                {/* Authors */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Autores
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {submission.authors.map((author, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200"
                                            >
                                                {author}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Abstract */}
                                {submission.abstract && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Resumo</h4>
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {submission.abstract}
                                        </p>
                                    </div>
                                )}

                                {/* Keywords */}
                                {submission.keywords && submission.keywords.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Palavras-chave</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {submission.keywords.map((keyword, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Reviews */}
                                {submission.reviews && submission.reviews.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            Revisões ({submission.reviews.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {submission.reviews.map((review, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-white rounded-lg p-4 border border-gray-200"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-gray-900">
                                                            {review.reviewer || 'Revisor Anônimo'}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {formatDate(review.date)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm">
                                                        {review.comment}
                                                    </p>
                                                    {review.recommendation && (
                                                        <div className="mt-2">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${review.recommendation === 'accept' ? 'bg-green-100 text-green-800' :
                                                                review.recommendation === 'reject' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {review.recommendation === 'accept' ? 'Aceitar' :
                                                                    review.recommendation === 'reject' ? 'Rejeitar' :
                                                                        'Revisão Necessária'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Share Link */}
                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4" />
                                        Link de Compartilhamento
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={generateShareLink(submission.id)}
                                            readOnly
                                            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600"
                                        />
                                        <button
                                            onClick={() => handleShare(submission)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            {copiedLink === submission.id ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Copiado!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copiar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Compartilhe este link com coautores para que possam visualizar a submissão
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default SubmissionList;
