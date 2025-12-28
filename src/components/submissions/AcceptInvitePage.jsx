import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Mail, User, FileText } from 'lucide-react';
import { acceptAuthorInvite } from '../../services/chatService';
import { supabase } from '../../lib/supabase';

/**
 * Página para aceitar convite de coautor
 * URL: /accept-invite/:token
 */
const AcceptInvitePage = ({ inviteToken, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inviteData, setInviteData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadInviteData();
        checkCurrentUser();
    }, [inviteToken]);

    const loadInviteData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Buscar dados do convite
            const { data, error: inviteError } = await supabase
                .from('authors')
                .select(`
                    *,
                    submission:submissions(
                        id,
                        title,
                        journal,
                        abstract,
                        user:users(name, email)
                    )
                `)
                .eq('invite_token', inviteToken)
                .single();

            if (inviteError) {
                if (inviteError.code === 'PGRST116') {
                    setError('Convite não encontrado ou inválido');
                } else {
                    throw inviteError;
                }
                return;
            }

            if (data.invite_status === 'accepted') {
                setError('Este convite já foi aceito');
                return;
            }

            if (data.invite_status === 'declined') {
                setError('Este convite foi recusado');
                return;
            }

            setInviteData(data);

        } catch (err) {
            console.error('Error loading invite:', err);
            setError('Erro ao carregar convite');
        } finally {
            setLoading(false);
        }
    };

    const checkCurrentUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        } catch (err) {
            console.error('Error checking user:', err);
        }
    };

    const handleAcceptInvite = async () => {
        if (!currentUser) {
            setError('Você precisa estar logado para aceitar o convite');
            return;
        }

        try {
            setIsAccepting(true);
            setError(null);

            await acceptAuthorInvite(inviteToken, currentUser.id);

            setSuccess(true);

            // Redirecionar após 3 segundos
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(inviteData.submission);
                }
            }, 3000);

        } catch (err) {
            console.error('Error accepting invite:', err);
            setError('Erro ao aceitar convite');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDeclineInvite = async () => {
        if (!currentUser) {
            setError('Você precisa estar logado para recusar o convite');
            return;
        }

        try {
            setIsAccepting(true);
            setError(null);

            const { error: updateError } = await supabase
                .from('authors')
                .update({ invite_status: 'declined' })
                .eq('invite_token', inviteToken);

            if (updateError) throw updateError;

            setError('Convite recusado');

        } catch (err) {
            console.error('Error declining invite:', err);
            setError('Erro ao recusar convite');
        } finally {
            setIsAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando convite...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Convite Aceito!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Você agora é coautor da submissão "{inviteData?.submission?.title}".
                    </p>
                    <p className="text-sm text-gray-500">
                        Redirecionando para a submissão...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Erro
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Voltar para o Início
                    </button>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <Mail className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Convite para Coautoria
                        </h1>
                        <p className="text-gray-600">
                            Você foi convidado para ser coautor de uma submissão
                        </p>
                    </div>

                    {inviteData && (
                        <div className="space-y-4 mb-8">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {inviteData.submission.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Periódico: {inviteData.submission.journal}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">Convidado por:</span>{' '}
                                            {inviteData.submission.user.name}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {inviteData.submission.user.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-yellow-800 font-medium mb-1">
                                    Você precisa estar logado
                                </p>
                                <p className="text-sm text-yellow-700">
                                    Faça login ou crie uma conta para aceitar este convite.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {/* Redirecionar para login */ }}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                            Fazer Login
                        </button>
                        <button
                            onClick={() => {/* Redirecionar para registro */ }}
                            className="flex-1 px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                        >
                            Criar Conta
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <Mail className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Convite para Coautoria
                    </h1>
                    <p className="text-gray-600">
                        Você foi convidado para ser coautor de uma submissão
                    </p>
                </div>

                {inviteData && (
                    <div className="space-y-4 mb-8">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        {inviteData.submission.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Periódico: {inviteData.submission.journal}
                                    </p>
                                    {inviteData.submission.abstract && (
                                        <p className="text-sm text-gray-700 line-clamp-3">
                                            {inviteData.submission.abstract}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">Convidado por:</span>{' '}
                                        {inviteData.submission.user.name}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {inviteData.submission.user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-green-800 font-medium mb-1">
                                        Benefícios de aceitar
                                    </p>
                                    <ul className="text-sm text-green-700 space-y-1">
                                        <li>• Acesso ao chat em tempo real com outros autores</li>
                                        <li>• Acompanhar o status da submissão</li>
                                        <li>• Participar das revisões e discussões</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={handleAcceptInvite}
                        disabled={isAccepting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAccepting ? 'Aceitando...' : 'Aceitar Convite'}
                    </button>
                    <button
                        onClick={handleDeclineInvite}
                        disabled={isAccepting}
                        className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Recusar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitePage;
