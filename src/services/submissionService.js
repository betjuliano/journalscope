/**
 * Serviço de API para gerenciar submissões
 * Usa Supabase quando disponível, fallback para localStorage
 */

import { supabase, isSupabaseAvailable, handleSupabaseError } from '../lib/supabaseClient';
import * as localStorageService from './submissionStorage';

// =====================================================
// AUTENTICAÇÃO
// =====================================================

/**
 * Registra um novo usuário
 */
export const registerUser = async (userData) => {
    if (!isSupabaseAvailable()) {
        return localStorageService.registerUser(userData);
    }

    try {
        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    name: userData.name,
                    institution: userData.institution
                }
            }
        });

        if (authError) return handleSupabaseError(authError);

        // Inserir dados adicionais na tabela users
        const { error: dbError } = await supabase
            .from('users')
            .insert([{
                id: authData.user.id,
                email: userData.email,
                name: userData.name,
                institution: userData.institution
            }]);

        if (dbError) return handleSupabaseError(dbError);

        return {
            success: true,
            user: {
                id: authData.user.id,
                email: userData.email,
                name: userData.name,
                institution: userData.institution
            }
        };
    } catch (error) {
        return handleSupabaseError(error);
    }
};

/**
 * Autentica um usuário
 */
export const authenticateUser = async (email, password) => {
    if (!isSupabaseAvailable()) {
        return localStorageService.authenticateUser(email, password);
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) return null;

        // Buscar dados adicionais do usuário
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (userError) return null;

        return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            institution: userData.institution
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = async () => {
    if (!isSupabaseAvailable()) {
        return localStorageService.getCurrentUser();
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        return userData ? {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            institution: userData.institution
        } : null;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
};

/**
 * Faz logout do usuário
 */
export const logoutUser = async () => {
    if (!isSupabaseAvailable()) {
        return localStorageService.logoutUser();
    }

    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// =====================================================
// SUBMISSÕES
// =====================================================

/**
 * Obtém todas as submissões de um usuário
 */
export const getSubmissions = async (userId) => {
    if (!isSupabaseAvailable()) {
        return localStorageService.getSubmissions(userId);
    }

    try {
        const { data, error } = await supabase
            .from('submissions')
            .select(`
        *,
        authors (
          id,
          name,
          email,
          institution,
          order_position
        ),
        reviews (
          id,
          reviewer_name,
          comment,
          recommendation,
          created_at
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get submissions error:', error);
            return [];
        }

        // Formatar dados para o formato esperado pelo frontend
        return data.map(sub => ({
            id: sub.id,
            userId: sub.user_id,
            title: sub.title,
            journal: sub.journal,
            abstract: sub.abstract,
            keywords: sub.keywords || [],
            authors: sub.authors
                .sort((a, b) => a.order_position - b.order_position)
                .map(a => a.name),
            status: sub.status,
            submittedAt: sub.submitted_at,
            createdAt: sub.created_at,
            updatedAt: sub.updated_at,
            reviews: sub.reviews.map(r => ({
                id: r.id,
                reviewer: r.reviewer_name || 'Revisor Anônimo',
                comment: r.comment,
                recommendation: r.recommendation,
                date: r.created_at
            }))
        }));
    } catch (error) {
        console.error('Get submissions error:', error);
        return [];
    }
};

/**
 * Obtém uma submissão específica por ID
 */
export const getSubmissionById = async (id) => {
    if (!isSupabaseAvailable()) {
        return localStorageService.getSubmissionById(id);
    }

    try {
        const { data, error } = await supabase
            .from('submissions')
            .select(`
        *,
        authors (
          id,
          name,
          email,
          institution,
          order_position
        ),
        reviews (
          id,
          reviewer_name,
          comment,
          recommendation,
          created_at
        )
      `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            journal: data.journal,
            abstract: data.abstract,
            keywords: data.keywords || [],
            authors: data.authors
                .sort((a, b) => a.order_position - b.order_position)
                .map(a => a.name),
            status: data.status,
            submittedAt: data.submitted_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            reviews: data.reviews.map(r => ({
                id: r.id,
                reviewer: r.reviewer_name || 'Revisor Anônimo',
                comment: r.comment,
                recommendation: r.recommendation,
                date: r.created_at
            }))
        };
    } catch (error) {
        console.error('Get submission error:', error);
        return null;
    }
};

/**
 * Salva uma submissão (criar ou atualizar)
 */
export const saveSubmission = async (submission) => {
    if (!isSupabaseAvailable()) {
        return localStorageService.saveSubmission(submission);
    }

    try {
        const submissionData = {
            user_id: submission.userId,
            title: submission.title,
            journal: submission.journal,
            abstract: submission.abstract,
            keywords: submission.keywords,
            status: submission.status
        };

        if (submission.id) {
            // Atualizar existente
            const { error } = await supabase
                .from('submissions')
                .update(submissionData)
                .eq('id', submission.id);

            if (error) {
                console.error('Update submission error:', error);
                return false;
            }

            // Atualizar autores
            await updateAuthors(submission.id, submission.authors);
        } else {
            // Criar novo
            const { data, error } = await supabase
                .from('submissions')
                .insert([submissionData])
                .select()
                .single();

            if (error) {
                console.error('Create submission error:', error);
                return false;
            }

            // Criar autores
            await updateAuthors(data.id, submission.authors);
        }

        return true;
    } catch (error) {
        console.error('Save submission error:', error);
        return false;
    }
};

/**
 * Atualiza autores de uma submissão
 */
const updateAuthors = async (submissionId, authors) => {
    try {
        // Deletar autores existentes
        await supabase
            .from('authors')
            .delete()
            .eq('submission_id', submissionId);

        // Inserir novos autores
        const authorsData = authors.map((name, index) => ({
            submission_id: submissionId,
            name,
            order_position: index + 1
        }));

        const { error } = await supabase
            .from('authors')
            .insert(authorsData);

        if (error) {
            console.error('Update authors error:', error);
        }
    } catch (error) {
        console.error('Update authors error:', error);
    }
};

/**
 * Deleta uma submissão
 */
export const deleteSubmission = async (id) => {
    if (!isSupabaseAvailable()) {
        return localStorageService.deleteSubmission(id);
    }

    try {
        const { error } = await supabase
            .from('submissions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete submission error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Delete submission error:', error);
        return false;
    }
};

/**
 * Adiciona uma revisão a uma submissão
 */
export const addReview = async (submissionId, review) => {
    if (!isSupabaseAvailable()) {
        return localStorageService.addReview(submissionId, review);
    }

    try {
        const { error } = await supabase
            .from('reviews')
            .insert([{
                submission_id: submissionId,
                reviewer_name: review.reviewer,
                comment: review.comment,
                recommendation: review.recommendation
            }]);

        if (error) {
            console.error('Add review error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Add review error:', error);
        return false;
    }
};

/**
 * Gera estatísticas das submissões
 */
export const getSubmissionStats = async (userId) => {
    if (!isSupabaseAvailable()) {
        return localStorageService.getSubmissionStats(userId);
    }

    try {
        const { data, error } = await supabase
            .from('user_statistics')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return {
                total: 0,
                pending: 0,
                underReview: 0,
                revisionRequested: 0,
                accepted: 0,
                rejected: 0,
                acceptanceRate: 0,
                avgReviewTime: 0
            };
        }

        return {
            total: data.total_submissions,
            pending: data.pending_count,
            underReview: data.under_review_count,
            revisionRequested: data.revision_requested_count,
            accepted: data.accepted_count,
            rejected: data.rejected_count,
            acceptanceRate: data.acceptance_rate,
            avgReviewTime: 0 // Calcular se necessário
        };
    } catch (error) {
        console.error('Get stats error:', error);
        return {
            total: 0,
            pending: 0,
            underReview: 0,
            revisionRequested: 0,
            accepted: 0,
            rejected: 0,
            acceptanceRate: 0,
            avgReviewTime: 0
        };
    }
};

/**
 * Gera link de compartilhamento para uma submissão
 */
export const generateShareLink = (submissionId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/submission/view/${submissionId}`;
};

/**
 * Inicializa dados de exemplo (apenas para desenvolvimento)
 */
export const initializeSampleData = () => {
    if (!isSupabaseAvailable()) {
        localStorageService.initializeSampleData();
    }
    // Para Supabase, os dados de exemplo devem ser inseridos via SQL
};

// Exportar ID generator para compatibilidade
export const generateId = localStorageService.generateId;
