import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Plus,
    Trash2,
    FileText,
    User,
    BookOpen,
    Calendar,
    Tag,
    MessageSquare,
    Mail,
    Link,
    ExternalLink,
    Users
} from 'lucide-react';
import { saveSubmission, addReview } from '../../utils/submissionStorage';
import JournalAutocomplete from './JournalAutocomplete';
import { sendAuthorInvite } from '../../services/chatService';
import { getUserGroups } from '../../services/researchGroupService';

/**
 * Formulário para criar/editar submissões de artigos
 */
const SubmissionForm = ({ user, submission, onClose }) => {
    const isEditing = !!submission;

    const [formData, setFormData] = useState({
        title: '',
        journal: '',
        submissionLink: '',
        abstract: '',
        keywords: [],
        authors: [{ name: user.name, email: user.email, isOwner: true }],
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviews: [],
        researchGroupId: '',
        isPrivate: false
    });

    const [newKeyword, setNewKeyword] = useState('');
    const [newAuthor, setNewAuthor] = useState({ name: '', email: '' });
    const [newReview, setNewReview] = useState({
        reviewer: '',
        comment: '',
        recommendation: 'revision'
    });
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [sendingInvites, setSendingInvites] = useState(false);
    const [userGroups, setUserGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);

    useEffect(() => {
        if (submission) {
            setFormData(submission);
        }
    }, [submission]);

    useEffect(() => {
        loadUserGroups();
    }, [user.id]);

    const loadUserGroups = async () => {
        setLoadingGroups(true);
        const { data } = await getUserGroups(user.id);
        if (data) {
            setUserGroups(data);
        }
        setLoadingGroups(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddKeyword = () => {
        if (newKeyword.trim()) {
            setFormData(prev => ({
                ...prev,
                keywords: [...prev.keywords, newKeyword.trim()]
            }));
            setNewKeyword('');
        }
    };

    const handleRemoveKeyword = (index) => {
        setFormData(prev => ({
            ...prev,
            keywords: prev.keywords.filter((_, i) => i !== index)
        }));
    };

    const handleAddAuthor = () => {
        if (newAuthor.name.trim() && newAuthor.email.trim()) {
            setFormData(prev => ({
                ...prev,
                authors: [...prev.authors, {
                    name: newAuthor.name.trim(),
                    email: newAuthor.email.trim(),
                    isOwner: false
                }]
            }));
            setNewAuthor({ name: '', email: '' });
        }
    };

    const handleRemoveAuthor = (index) => {
        // Não permitir remover o primeiro autor (owner)
        if (index === 0) return;

        setFormData(prev => ({
            ...prev,
            authors: prev.authors.filter((_, i) => i !== index)
        }));
    };

    const handleAddReview = () => {
        if (newReview.comment.trim()) {
            const review = {
                ...newReview,
                date: new Date().toISOString(),
                reviewer: newReview.reviewer.trim() || 'Revisor Anônimo'
            };

            setFormData(prev => ({
                ...prev,
                reviews: [...(prev.reviews || []), review]
            }));

            setNewReview({
                reviewer: '',
                comment: '',
                recommendation: 'revision'
            });
            setShowReviewForm(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.journal.trim()) {
            alert('Por favor, preencha o título e o periódico');
            return;
        }

        const submissionData = {
            ...formData,
            userId: user.id,
            updatedAt: new Date().toISOString()
        };

        saveSubmission(submissionData);
        onClose();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {isEditing ? 'Editar Submissão' : 'Nova Submissão'}
                            </h1>
                            <p className="text-gray-600">
                                Preencha os detalhes da submissão do artigo
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Informações Básicas
                        </h2>

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Título do Artigo *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Digite o título do artigo"
                                />
                            </div>

                            {/* Journal */}
                            <div>
                                <JournalAutocomplete
                                    value={formData.journal}
                                    onChange={(value) => setFormData(prev => ({ ...prev, journal: value }))}
                                    required
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="pending">Pendente</option>
                                    <option value="under_review">Em Revisão</option>
                                    <option value="revision_requested">Revisão Solicitada</option>
                                    <option value="accepted">Aceita</option>
                                    <option value="rejected">Rejeitada</option>
                                </select>
                            </div>

                            {/* Submission Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Link da Submissão
                                    <span className="text-gray-500 text-xs ml-2">(opcional)</span>
                                </label>
                                <input
                                    type="url"
                                    name="submissionLink"
                                    value={formData.submissionLink}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="https://journal-system.com/submission/12345"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Cole aqui o link da sua submissão no sistema do journal para acesso rápido
                                </p>
                            </div>

                            {/* Abstract */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Resumo
                                </label>
                                <textarea
                                    name="abstract"
                                    value={formData.abstract}
                                    onChange={handleChange}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Digite o resumo do artigo"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Research Group */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Grupo de Pesquisa
                            <span className="text-sm font-normal text-gray-500">(opcional)</span>
                        </h2>

                        <div className="space-y-4">
                            {/* Group Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vincular a um Grupo de Pesquisa
                                </label>
                                {loadingGroups ? (
                                    <div className="text-sm text-gray-600">Carregando grupos...</div>
                                ) : userGroups.length === 0 ? (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            Você ainda não pertence a nenhum grupo de pesquisa.
                                            Cadastre um grupo para vincular suas submissões.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            name="researchGroupId"
                                            value={formData.researchGroupId}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        >
                                            <option value="">Nenhum grupo selecionado</option>
                                            {userGroups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name} - {group.institution}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            💡 Ao vincular a um grupo, todos os membros poderão visualizar esta submissão
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Privacy Toggle */}
                            {formData.researchGroupId && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPrivate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                Manter submissão privada
                                            </span>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Se marcado, esta submissão não será visível para outros membros do grupo
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Authors */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Autores
                        </h2>

                        <div className="space-y-3 mb-4">
                            {formData.authors.map((author, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">
                                                {author.name || author}
                                            </span>
                                            {author.isOwner && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                    Autor Principal
                                                </span>
                                            )}
                                        </div>
                                        {author.email && (
                                            <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                                                <Mail className="w-3 h-3" />
                                                <span>{author.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    {!author.isOwner && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAuthor(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover autor"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={newAuthor.name}
                                    onChange={(e) => setNewAuthor(prev => ({ ...prev, name: e.target.value }))}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nome do autor"
                                />
                                <input
                                    type="email"
                                    value={newAuthor.email}
                                    onChange={(e) => setNewAuthor(prev => ({ ...prev, email: e.target.value }))}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Email do autor"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddAuthor}
                                disabled={!newAuthor.name.trim() || !newAuthor.email.trim()}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar Coautor
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Os coautores receberão um email de convite para se cadastrar no sistema e participar do chat da submissão.
                            </p>
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Palavras-chave
                        </h2>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {formData.keywords.map((keyword, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2"
                                >
                                    {keyword}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveKeyword(index)}
                                        className="hover:text-blue-900"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Digite uma palavra-chave"
                            />
                            <button
                                type="button"
                                onClick={handleAddKeyword}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Reviews (only for editing) */}
                    {isEditing && (
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    Revisões ({formData.reviews?.length || 0})
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Revisão
                                </button>
                            </div>

                            {showReviewForm && (
                                <div className="mb-4 p-4 bg-purple-50 rounded-lg space-y-3">
                                    <input
                                        type="text"
                                        value={newReview.reviewer}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, reviewer: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Nome do revisor (opcional)"
                                    />
                                    <textarea
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="Comentários da revisão"
                                    />
                                    <select
                                        value={newReview.recommendation}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, recommendation: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="accept">Aceitar</option>
                                        <option value="revision">Revisão Necessária</option>
                                        <option value="reject">Rejeitar</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddReview}
                                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            Salvar Revisão
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowReviewForm(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {formData.reviews && formData.reviews.length > 0 && (
                                <div className="space-y-3">
                                    {formData.reviews.map((review, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900">
                                                    {review.reviewer}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(review.date).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${review.recommendation === 'accept' ? 'bg-green-100 text-green-800' :
                                                review.recommendation === 'reject' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {review.recommendation === 'accept' ? 'Aceitar' :
                                                    review.recommendation === 'reject' ? 'Rejeitar' :
                                                        'Revisão Necessária'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {isEditing ? 'Salvar Alterações' : 'Criar Submissão'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmissionForm;
