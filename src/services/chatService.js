import { supabase } from '../lib/supabase';
import { sendAuthorInviteEmail } from './emailService';

/**
 * Serviço para gerenciar o sistema de chat entre autores
 */

/**
 * Obter chat de uma submissão
 * @param {string} submissionId - ID da submissão
 * @returns {Promise<Object|null>} Chat encontrado ou null
 */
export const getSubmissionChat = async (submissionId) => {
    try {
        const { data, error } = await supabase
            .from('submission_chats')
            .select(`
                *,
                submission:submissions(id, title, journal, status),
                participants:chat_participants(
                    id,
                    user:users(id, name, email),
                    joined_at,
                    last_read_at
                )
            `)
            .eq('submission_id', submissionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('[ChatService] Error fetching submission chat:', error);
        return null;
    }
};

/**
 * Obter mensagens de um chat
 * @param {string} chatId - ID do chat
 * @param {number} limit - Limite de mensagens
 * @returns {Promise<Array>} Lista de mensagens
 */
export const getChatMessages = async (chatId, limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                user:users(id, name, email)
            `)
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('[ChatService] Error fetching chat messages:', error);
        return [];
    }
};

/**
 * Enviar mensagem em um chat
 * @param {string} chatId - ID do chat
 * @param {string} userId - ID do usuário
 * @param {string} message - Mensagem
 * @returns {Promise<Object>} Mensagem criada
 */
export const sendMessage = async (chatId, userId, message) => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                chat_id: chatId,
                user_id: userId,
                message: message.trim()
            })
            .select(`
                *,
                user:users(id, name, email)
            `)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('[ChatService] Error sending message:', error);
        throw error;
    }
};

/**
 * Marcar mensagens como lidas
 * @param {string} chatId - ID do chat
 * @param {string} userId - ID do usuário
 * @returns {Promise<boolean>} Sucesso
 */
export const markMessagesAsRead = async (chatId, userId) => {
    try {
        // Atualizar last_read_at do participante
        const { error: participantError } = await supabase
            .from('chat_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('chat_id', chatId)
            .eq('user_id', userId);

        if (participantError) throw participantError;

        // Marcar mensagens como lidas
        const { error: messagesError } = await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('chat_id', chatId)
            .neq('user_id', userId)
            .eq('is_read', false);

        if (messagesError) throw messagesError;

        return true;
    } catch (error) {
        console.error('[ChatService] Error marking messages as read:', error);
        return false;
    }
};

/**
 * Obter contagem de mensagens não lidas por usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de chats com contagem de não lidas
 */
export const getUnreadMessageCount = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('unread_messages_by_user')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('[ChatService] Error fetching unread message count:', error);
        return [];
    }
};

/**
 * Obter chats do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de chats
 */
export const getUserChats = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('chat_participants')
            .select(`
                chat:submission_chats(
                    id,
                    submission_id,
                    is_active,
                    created_at,
                    submission:submissions(id, title, journal, status)
                )
            `)
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        return data?.map(item => item.chat).filter(Boolean) || [];
    } catch (error) {
        console.error('[ChatService] Error fetching user chats:', error);
        return [];
    }
};

/**
 * Enviar convite para autor
 * @param {Object} authorData - Dados do autor
 * @param {string} authorData.submissionId - ID da submissão
 * @param {string} authorData.name - Nome do autor
 * @param {string} authorData.email - Email do autor
 * @param {number} authorData.orderPosition - Posição na ordem de autores
 * @param {string} authorData.submissionTitle - Título da submissão
 * @param {string} authorData.submissionJournal - Periódico da submissão
 * @param {string} authorData.inviterName - Nome de quem está convidando
 * @returns {Promise<Object>} Autor criado com token de convite
 */
export const sendAuthorInvite = async (authorData) => {
    try {
        // Gerar token único
        const inviteToken = `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const { data, error } = await supabase
            .from('authors')
            .insert({
                submission_id: authorData.submissionId,
                name: authorData.name,
                email: authorData.email,
                order_position: authorData.orderPosition,
                invite_status: 'sent',
                invite_token: inviteToken,
                invite_sent_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Enviar email de convite via Resend
        try {
            const emailResult = await sendAuthorInviteEmail({
                authorName: authorData.name,
                authorEmail: authorData.email,
                inviteToken: inviteToken,
                submissionTitle: authorData.submissionTitle || 'Submissão Acadêmica',
                submissionJournal: authorData.submissionJournal || 'Não especificado',
                inviterName: authorData.inviterName || 'Um colega pesquisador'
            });

            if (emailResult.success) {
                console.log(`[ChatService] Email enviado com sucesso para ${authorData.email}`);
            } else {
                console.warn(`[ChatService] Falha ao enviar email: ${emailResult.error}`);
            }
        } catch (emailError) {
            // Não falhar se o email não for enviado
            console.error('[ChatService] Erro ao enviar email de convite:', emailError);
        }

        return data;
    } catch (error) {
        console.error('[ChatService] Error sending author invite:', error);
        throw error;
    }
};

/**
 * Aceitar convite de autor
 * @param {string} inviteToken - Token do convite
 * @param {string} userId - ID do usuário que está aceitando
 * @returns {Promise<Object>} Autor atualizado
 */
export const acceptAuthorInvite = async (inviteToken, userId) => {
    try {
        const { data, error } = await supabase
            .from('authors')
            .update({
                user_id: userId,
                invite_status: 'accepted',
                invite_accepted_at: new Date().toISOString()
            })
            .eq('invite_token', inviteToken)
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('[ChatService] Error accepting author invite:', error);
        throw error;
    }
};

/**
 * Verificar se todos os autores aceitaram o convite
 * @param {string} submissionId - ID da submissão
 * @returns {Promise<Object>} Status dos convites
 */
export const checkAllAuthorsAccepted = async (submissionId) => {
    try {
        const { data, error } = await supabase
            .from('authors')
            .select('id, name, email, invite_status')
            .eq('submission_id', submissionId);

        if (error) throw error;

        const total = data.length;
        const accepted = data.filter(a => a.invite_status === 'accepted').length;
        const pending = data.filter(a => a.invite_status === 'pending' || a.invite_status === 'sent').length;

        return {
            total,
            accepted,
            pending,
            allAccepted: pending === 0,
            authors: data
        };
    } catch (error) {
        console.error('[ChatService] Error checking author invites:', error);
        return {
            total: 0,
            accepted: 0,
            pending: 0,
            allAccepted: false,
            authors: []
        };
    }
};

/**
 * Subscrever a mudanças em tempo real no chat
 * @param {string} chatId - ID do chat
 * @param {Function} callback - Função a ser chamada quando houver nova mensagem
 * @returns {Object} Subscription object
 */
export const subscribeToChat = (chatId, callback) => {
    const subscription = supabase
        .channel(`chat:${chatId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'journalscope',
                table: 'chat_messages',
                filter: `chat_id=eq.${chatId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return subscription;
};

/**
 * Cancelar subscrição do chat
 * @param {Object} subscription - Objeto de subscrição
 */
export const unsubscribeFromChat = (subscription) => {
    if (subscription) {
        supabase.removeChannel(subscription);
    }
};

export default {
    getSubmissionChat,
    getChatMessages,
    sendMessage,
    markMessagesAsRead,
    getUnreadMessageCount,
    getUserChats,
    sendAuthorInvite,
    acceptAuthorInvite,
    checkAllAuthorsAccepted,
    subscribeToChat,
    unsubscribeFromChat
};
