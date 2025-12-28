import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Users, X, AlertCircle, CheckCircle } from 'lucide-react';
import {
    getSubmissionChat,
    getChatMessages,
    sendMessage,
    markMessagesAsRead,
    subscribeToChat,
    unsubscribeFromChat,
    checkAllAuthorsAccepted
} from '../../services/chatService';

/**
 * Componente de chat para comunicação entre autores de uma submissão
 */
const SubmissionChat = ({ submissionId, currentUser, onClose }) => {
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [authorsStatus, setAuthorsStatus] = useState(null);
    const messagesEndRef = useRef(null);
    const subscriptionRef = useRef(null);

    // Carregar chat e mensagens
    useEffect(() => {
        loadChat();
        checkAuthors();

        return () => {
            if (subscriptionRef.current) {
                unsubscribeFromChat(subscriptionRef.current);
            }
        };
    }, [submissionId]);

    // Scroll automático para última mensagem
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChat = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const chatData = await getSubmissionChat(submissionId);

            if (!chatData) {
                setError('Chat não encontrado para esta submissão');
                return;
            }

            setChat(chatData);

            const messagesData = await getChatMessages(chatData.id);
            setMessages(messagesData);

            // Marcar mensagens como lidas
            await markMessagesAsRead(chatData.id, currentUser.id);

            // Subscrever a novas mensagens em tempo real
            subscriptionRef.current = subscribeToChat(chatData.id, handleNewMessage);

        } catch (err) {
            console.error('Error loading chat:', err);
            setError('Erro ao carregar chat');
        } finally {
            setIsLoading(false);
        }
    };

    const checkAuthors = async () => {
        try {
            const status = await checkAllAuthorsAccepted(submissionId);
            setAuthorsStatus(status);
        } catch (err) {
            console.error('Error checking authors:', err);
        }
    };

    const handleNewMessage = async (newMsg) => {
        // Adicionar mensagem à lista
        setMessages(prev => [...prev, newMsg]);

        // Marcar como lida se não for do usuário atual
        if (newMsg.user_id !== currentUser.id && chat) {
            await markMessagesAsRead(chat.id, currentUser.id);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !chat) return;

        try {
            setIsSending(true);
            setError(null);

            const sentMessage = await sendMessage(chat.id, currentUser.id, newMessage);

            // A mensagem será adicionada via subscription em tempo real
            // Mas adicionamos localmente para feedback imediato
            if (!subscriptionRef.current) {
                setMessages(prev => [...prev, sentMessage]);
            }

            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Erro ao enviar mensagem');
        } finally {
            setIsSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
                date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando chat...</p>
                </div>
            </div>
        );
    }

    if (error && !chat) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-6 h-6" />
                        <div>
                            <h2 className="text-lg font-semibold">
                                Chat da Submissão
                            </h2>
                            <p className="text-sm text-blue-100 truncate max-w-md">
                                {chat?.submission?.title}
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Status dos autores */}
                {authorsStatus && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4" />
                        <span>
                            {authorsStatus.accepted} de {authorsStatus.total} autores cadastrados
                        </span>
                        {authorsStatus.allAccepted ? (
                            <CheckCircle className="w-4 h-4 text-green-300" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-300" />
                        )}
                    </div>
                )}
            </div>

            {/* Aviso se nem todos os autores aceitaram */}
            {authorsStatus && !authorsStatus.allAccepted && (
                <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium">Aguardando cadastro de coautores</p>
                            <p className="text-xs mt-1">
                                {authorsStatus.pending} autor(es) ainda não aceitou(aram) o convite.
                                O chat estará totalmente ativo quando todos se cadastrarem.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Participantes */}
            {chat?.participants && chat.participants.length > 0 && (
                <div className="bg-gray-50 border-b border-gray-200 p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Participantes:</span>
                        <div className="flex flex-wrap gap-2">
                            {chat.participants.map((participant, idx) => (
                                <span
                                    key={participant.id}
                                    className="px-2 py-1 bg-white rounded-full text-xs border border-gray-200"
                                >
                                    {participant.user?.name}
                                    {participant.user?.id === currentUser.id && ' (você)'}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm mt-1">Seja o primeiro a enviar uma mensagem!</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwnMessage = message.user_id === currentUser.id;
                        const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;

                        return (
                            <div
                                key={message.id}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                    {showAvatar && !isOwnMessage && (
                                        <div className="text-xs text-gray-600 font-medium mb-1 px-3">
                                            {message.user?.name}
                                        </div>
                                    )}
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${isOwnMessage
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                                : 'bg-white text-gray-900 border border-gray-200'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {message.message}
                                        </p>
                                        <p
                                            className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                                }`}
                                        >
                                            {formatMessageTime(message.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Erro */}
            {error && (
                <div className="bg-red-50 border-t border-red-200 p-3">
                    <div className="flex items-center gap-2 text-sm text-red-800">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Input de mensagem */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSending ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Enviar</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubmissionChat;
