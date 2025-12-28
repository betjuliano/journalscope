import React, { useState, useEffect } from 'react';
import { LogOut, BookOpen, FileText, Users, GraduationCap } from 'lucide-react';
import AuthForm from './auth/AuthForm';
import SubmissionDashboard from './submissions/SubmissionDashboard';
import JournalSearchApp from './JournalSearchApp';
import ResearchGroupList from './research-groups/ResearchGroupList';
import LattesDashboard from './lattes/LattesDashboard';
import { getCurrentUser, logoutUser, initializeSampleData } from '../utils/submissionStorage';

/**
 * Aplicação principal com navegação entre módulos
 */
const MainApp = () => {
    const [user, setUser] = useState(null);
    const [currentModule, setCurrentModule] = useState('journals'); // 'journals', 'submissions', 'research-groups', 'lattes'
    const [loading, setLoading] = useState(true);
    const [selectedJournal, setSelectedJournal] = useState(null); // Periódico selecionado para submissão

    useEffect(() => {
        // Inicializar dados de exemplo na primeira execução
        initializeSampleData();

        // Verificar se há usuário logado
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    // Escutar evento de criação de submissão a partir de periódico
    useEffect(() => {
        const handleCreateSubmission = (event) => {
            const { journalName } = event.detail;

            // Se não estiver logado, fazer login primeiro
            if (!user) {
                setSelectedJournal(journalName);
                setCurrentModule('submissions');
                return;
            }

            // Se já estiver logado, ir para submissões com o periódico selecionado
            setSelectedJournal(journalName);
            setCurrentModule('submissions');
        };

        window.addEventListener('createSubmissionFromJournal', handleCreateSubmission);

        return () => {
            window.removeEventListener('createSubmissionFromJournal', handleCreateSubmission);
        };
    }, [user]);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        if (window.confirm('Deseja realmente sair?')) {
            logoutUser();
            setUser(null);
            setCurrentModule('journals');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    // Se não estiver logado e tentar acessar submissões ou grupos, mostrar login
    if (!user && (currentModule === 'submissions' || currentModule === 'research-groups')) {
        return <AuthForm onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">JournalScope</h1>
                                <p className="text-xs text-gray-500">Sistema Acadêmico Integrado</p>
                            </div>
                        </div>

                        {/* Module Tabs */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentModule('journals')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${currentModule === 'journals'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                Consulta de Journals
                            </button>
                            <button
                                onClick={() => setCurrentModule('submissions')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${currentModule === 'submissions'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Gestão de Submissões
                            </button>
                            <button
                                onClick={() => setCurrentModule('research-groups')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${currentModule === 'research-groups'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                Grupos de Pesquisa
                            </button>
                            <button
                                onClick={() => setCurrentModule('lattes')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${currentModule === 'lattes'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <GraduationCap className="w-4 h-4" />
                                Extrator Lattes
                            </button>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            {user ? (
                                <>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.institution}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Sair"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setCurrentModule('submissions')}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div>
                {currentModule === 'journals' ? (
                    <JournalSearchApp />
                ) : currentModule === 'lattes' ? (
                    <LattesDashboard user={user} />
                ) : currentModule === 'research-groups' ? (
                    user ? (
                        <ResearchGroupList user={user} />
                    ) : (
                        <AuthForm onLogin={handleLogin} />
                    )
                ) : user ? (
                    <SubmissionDashboard
                        user={user}
                        selectedJournal={selectedJournal}
                        onClearSelectedJournal={() => setSelectedJournal(null)}
                    />
                ) : (
                    <AuthForm onLogin={handleLogin} />
                )}
            </div>
        </div>
    );
};

export default MainApp;
