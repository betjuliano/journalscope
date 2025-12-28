import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Edit,
    Trash2,
    ExternalLink,
    Building,
    User,
    BookOpen,
    BarChart3,
    AlertCircle
} from 'lucide-react';
import { getUserGroups, deleteResearchGroup } from '../../services/researchGroupService';
import ResearchGroupForm from './ResearchGroupForm';
import ResearchGroupDashboard from './ResearchGroupDashboard';

/**
 * Lista de grupos de pesquisa do usuário
 */
const ResearchGroupList = ({ user }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [viewingDashboard, setViewingDashboard] = useState(null);

    useEffect(() => {
        loadGroups();
    }, [user.id]);

    const loadGroups = async () => {
        setLoading(true);
        const { data, error } = await getUserGroups(user.id);

        if (!error && data) {
            setGroups(data);
        }
        setLoading(false);
    };

    const handleEdit = (group) => {
        setSelectedGroup(group);
        setShowForm(true);
    };

    const handleDelete = async (groupId) => {
        if (window.confirm('Tem certeza que deseja excluir este grupo de pesquisa? Esta ação não pode ser desfeita.')) {
            const { error } = await deleteResearchGroup(groupId);

            if (!error) {
                loadGroups();
            } else {
                alert('Erro ao excluir grupo de pesquisa');
            }
        }
    };

    const handleViewDashboard = (group) => {
        setViewingDashboard(group);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedGroup(null);
    };

    const handleFormSuccess = () => {
        loadGroups();
    };

    if (viewingDashboard) {
        return (
            <ResearchGroupDashboard
                group={viewingDashboard}
                user={user}
                onClose={() => setViewingDashboard(null)}
            />
        );
    }

    if (showForm) {
        return (
            <ResearchGroupForm
                user={user}
                group={selectedGroup}
                onClose={handleCloseForm}
                onSuccess={handleFormSuccess}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-600" />
                                Grupos de Pesquisa
                            </h1>
                            <p className="text-gray-600">
                                Gerencie seus grupos de pesquisa vinculados ao CNPq
                            </p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Grupo
                        </button>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Carregando grupos...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && groups.length === 0 && (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Nenhum grupo cadastrado
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Cadastre seu primeiro grupo de pesquisa para começar a colaborar
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Cadastrar Grupo
                        </button>
                    </div>
                )}

                {/* Groups Grid */}
                {!loading && groups.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                {group.name}
                                            </h3>
                                            <div className="space-y-1 text-sm text-gray-600">
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

                                    {/* CNPq ID */}
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">ID CNPq</p>
                                        <p className="text-sm font-mono text-blue-800 break-all">
                                            {group.cnpq_id}
                                        </p>
                                    </div>

                                    {/* Knowledge Area */}
                                    {group.knowledge_area && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-600 mb-1">Área do Conhecimento</p>
                                            <p className="text-sm text-gray-800">{group.knowledge_area}</p>
                                        </div>
                                    )}

                                    {/* Research Lines */}
                                    {group.research_lines && group.research_lines.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                                <BookOpen className="w-3 h-3" />
                                                Linhas de Pesquisa
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {group.research_lines.slice(0, 3).map((line, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                                                    >
                                                        {line}
                                                    </span>
                                                ))}
                                                {group.research_lines.length > 3 && (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                        +{group.research_lines.length - 3} mais
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {group.description && (
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                            {group.description}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => handleViewDashboard(group)}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                            Dashboard
                                        </button>
                                        {group.website && (
                                            <a
                                                href={group.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Visitar website"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleEdit(group)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(group.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Sobre os Grupos de Pesquisa CNPq</p>
                        <p>
                            Os grupos de pesquisa cadastrados aqui permitem que você vincule submissões e
                            acompanhe o desempenho coletivo do grupo. Todos os membros do grupo poderão
                            visualizar as submissões vinculadas (exceto as marcadas como privadas).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResearchGroupList;
