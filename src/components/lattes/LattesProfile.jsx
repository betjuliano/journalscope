import React from 'react';
import {
    User, Building, MapPin, ExternalLink,
    FileText, FolderGit2, GraduationCap, Award,
    Calendar, Mail, Globe
} from 'lucide-react';

/**
 * Componente para exibição do perfil do pesquisador
 */
const LattesProfile = ({ profile, stats }) => {
    if (!profile) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Perfil não disponível</p>
            </div>
        );
    }

    // Gerar link para Lattes
    const lattesUrl = profile.lattesId
        ? `http://lattes.cnpq.br/${profile.lattesId}`
        : null;

    // Gerar link para ORCID
    const orcidUrl = profile.orcid
        ? `https://orcid.org/${profile.orcid}`
        : null;

    return (
        <div className="space-y-6">
            {/* Card Principal */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* Header com gradiente */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-32 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                            <User className="w-12 h-12 text-indigo-600" />
                        </div>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="pt-16 pb-6 px-8">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {profile.name}
                            </h2>
                            {profile.citationName && (
                                <p className="text-gray-500 mt-1">
                                    Citação: {profile.citationName}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                                {profile.institution && (
                                    <span className="flex items-center gap-1">
                                        <Building className="w-4 h-4" />
                                        {profile.institution}
                                    </span>
                                )}
                                {profile.department && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.department}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Links externos */}
                        <div className="flex items-center gap-2">
                            {lattesUrl && (
                                <a
                                    href={lattesUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Ver Lattes
                                </a>
                            )}
                            {orcidUrl && (
                                <a
                                    href={orcidUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    <Globe className="w-4 h-4" />
                                    ORCID
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Info adicional */}
                    <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {profile.lattesId && (
                            <div>
                                <p className="text-gray-500">ID Lattes</p>
                                <p className="font-medium text-gray-900 font-mono">
                                    {profile.lattesId}
                                </p>
                            </div>
                        )}
                        {profile.orcid && (
                            <div>
                                <p className="text-gray-500">ORCID</p>
                                <p className="font-medium text-gray-900 font-mono">
                                    {profile.orcid}
                                </p>
                            </div>
                        )}
                        {profile.lastUpdate && (
                            <div>
                                <p className="text-gray-500">Última Atualização</p>
                                <p className="font-medium text-gray-900">
                                    {formatDate(profile.lastUpdate)}
                                </p>
                            </div>
                        )}
                        {profile.nationality && (
                            <div>
                                <p className="text-gray-500">Nacionalidade</p>
                                <p className="font-medium text-gray-900">
                                    {profile.nationality}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Artigos */}
                    <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">
                                {stats.articles.total}
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">Artigos</h3>
                        <div className="mt-2 text-sm text-gray-500 space-y-1">
                            <p>{stats.articles.published} publicados</p>
                            <p>{stats.articles.accepted} aceitos para publicação</p>
                        </div>
                    </div>

                    {/* Projetos */}
                    <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <FolderGit2 className="w-6 h-6 text-purple-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">
                                {stats.projects.total}
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">Projetos</h3>
                        <div className="mt-2 text-sm text-gray-500 space-y-1">
                            <p>{stats.projects.research} de pesquisa</p>
                            <p>{stats.projects.extension} de extensão</p>
                            <p>{stats.projects.active} em andamento</p>
                        </div>
                    </div>

                    {/* Orientações */}
                    <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <GraduationCap className="w-6 h-6 text-amber-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">
                                {stats.orientations.total}
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">Orientações</h3>
                        <div className="mt-2 text-sm text-gray-500 space-y-1">
                            <p>{stats.orientations.phd} doutorado</p>
                            <p>{stats.orientations.master} mestrado</p>
                            <p>{stats.orientations.completed} concluídas</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Formatar data do Lattes (formato: DDMMYYYY)
function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const day = dateStr.slice(0, 2);
    const month = dateStr.slice(2, 4);
    const year = dateStr.slice(4, 8);
    return `${day}/${month}/${year}`;
}

export default LattesProfile;
