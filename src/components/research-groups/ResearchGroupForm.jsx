import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Plus,
    Trash2,
    Users,
    Building,
    User,
    BookOpen,
    Globe,
    AlertCircle
} from 'lucide-react';
import { createResearchGroup, updateResearchGroup, findGroupByCnpqId } from '../../services/researchGroupService';

/**
 * Formulário para criar/editar grupos de pesquisa CNPq
 */
const ResearchGroupForm = ({ user, group, onClose, onSuccess }) => {
    const isEditing = !!group;

    const [formData, setFormData] = useState({
        cnpq_id: '',
        name: '',
        institution: '',
        leader_name: '',
        knowledge_area: '',
        research_lines: [],
        description: '',
        website: '',
        created_by: user.id
    });

    const [newResearchLine, setNewResearchLine] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingCnpq, setCheckingCnpq] = useState(false);

    useEffect(() => {
        if (group) {
            setFormData(group);
        }
    }, [group]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleAddResearchLine = () => {
        if (newResearchLine.trim()) {
            setFormData(prev => ({
                ...prev,
                research_lines: [...prev.research_lines, newResearchLine.trim()]
            }));
            setNewResearchLine('');
        }
    };

    const handleRemoveResearchLine = (index) => {
        setFormData(prev => ({
            ...prev,
            research_lines: prev.research_lines.filter((_, i) => i !== index)
        }));
    };

    const checkCnpqId = async (cnpqId) => {
        if (!cnpqId.trim() || isEditing) return;

        setCheckingCnpq(true);
        const { data } = await findGroupByCnpqId(cnpqId);
        setCheckingCnpq(false);

        if (data) {
            setError('Este ID CNPq já está cadastrado no sistema.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.cnpq_id.trim() || !formData.name.trim() || !formData.institution.trim()) {
            setError('Por favor, preencha os campos obrigatórios.');
            return;
        }

        // Verificar ID CNPq duplicado
        if (!isEditing) {
            const isValid = await checkCnpqId(formData.cnpq_id);
            if (!isValid) return;
        }

        setLoading(true);

        try {
            let result;
            if (isEditing) {
                result = await updateResearchGroup(group.id, formData);
            } else {
                result = await createResearchGroup(formData);
            }

            if (result.error) {
                setError(result.error.message || 'Erro ao salvar grupo de pesquisa');
                setLoading(false);
                return;
            }

            if (onSuccess) {
                onSuccess(result.data);
            }
            onClose();
        } catch (err) {
            setError('Erro ao salvar grupo de pesquisa');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {isEditing ? 'Editar Grupo de Pesquisa' : 'Novo Grupo de Pesquisa'}
                            </h1>
                            <p className="text-gray-600">
                                Cadastre grupos de pesquisa vinculados ao CNPq
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

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Informações Básicas
                        </h2>

                        <div className="space-y-4">
                            {/* CNPq ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ID do Grupo no CNPq *
                                </label>
                                <input
                                    type="text"
                                    name="cnpq_id"
                                    value={formData.cnpq_id}
                                    onChange={handleChange}
                                    onBlur={(e) => checkCnpqId(e.target.value)}
                                    disabled={isEditing}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                                    placeholder="Ex: dgp.cnpq.br/dgp/espelhogrupo/123456"
                                />
                                {checkingCnpq && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Verificando ID do CNPq...
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Encontre o ID do seu grupo em: <a href="http://dgp.cnpq.br/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dgp.cnpq.br</a>
                                </p>
                            </div>

                            {/* Nome do Grupo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome do Grupo *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Nome oficial do grupo de pesquisa"
                                />
                            </div>

                            {/* Instituição */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Instituição *
                                </label>
                                <input
                                    type="text"
                                    name="institution"
                                    value={formData.institution}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Universidade ou instituição vinculada"
                                />
                            </div>

                            {/* Líder */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Líder do Grupo
                                    <span className="text-gray-500 text-xs ml-2">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="leader_name"
                                    value={formData.leader_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Nome do(s) líder(es) do grupo"
                                />
                            </div>

                            {/* Área do Conhecimento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Área do Conhecimento
                                    <span className="text-gray-500 text-xs ml-2">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="knowledge_area"
                                    value={formData.knowledge_area}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Ex: Ciências Exatas e da Terra - Ciência da Computação"
                                />
                            </div>

                            {/* Website */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Website
                                    <span className="text-gray-500 text-xs ml-2">(opcional)</span>
                                </label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="https://grupo-pesquisa.universidade.br"
                                />
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descrição
                                    <span className="text-gray-500 text-xs ml-2">(opcional)</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Breve descrição do grupo e suas áreas de atuação"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linhas de Pesquisa */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Linhas de Pesquisa
                        </h2>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {formData.research_lines.map((line, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2"
                                >
                                    {line}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveResearchLine(index)}
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
                                value={newResearchLine}
                                onChange={(e) => setNewResearchLine(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResearchLine())}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Digite uma linha de pesquisa"
                            />
                            <button
                                type="button"
                                onClick={handleAddResearchLine}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {isEditing ? 'Salvar Alterações' : 'Criar Grupo'}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResearchGroupForm;
