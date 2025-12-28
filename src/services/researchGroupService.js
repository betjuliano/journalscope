/**
 * Serviço de API para gerenciar grupos de pesquisa
 * Usa Supabase quando disponível, fallback para localStorage
 */

import { supabase, isSupabaseAvailable, handleSupabaseError } from '../lib/supabaseClient';

// =====================================================
// GRUPOS DE PESQUISA
// =====================================================

/**
 * Cria um novo grupo de pesquisa
 */
export async function createResearchGroup(groupData) {
    if (!isSupabaseAvailable()) {
        // Fallback para localStorage
        const groups = JSON.parse(localStorage.getItem('research_groups') || '[]');
        const newGroup = {
            id: crypto.randomUUID(),
            ...groupData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        groups.push(newGroup);
        localStorage.setItem('research_groups', JSON.stringify(groups));
        return { data: newGroup, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('research_groups')
            .insert([groupData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'createResearchGroup');
    }
}

/**
 * Obtém todos os grupos que o usuário pertence
 */
export async function getUserGroups(userId) {
    if (!isSupabaseAvailable()) {
        // Fallback para localStorage
        const groups = JSON.parse(localStorage.getItem('research_groups') || '[]');
        const members = JSON.parse(localStorage.getItem('group_members') || '[]');

        const userGroupIds = members
            .filter(m => m.user_id === userId && m.status === 'active')
            .map(m => m.group_id);

        const userGroups = groups.filter(g => userGroupIds.includes(g.id));
        return { data: userGroups, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('group_members')
            .select(`
                *,
                research_groups (*)
            `)
            .eq('user_id', userId)
            .eq('status', 'active');

        if (error) throw error;

        const groups = data.map(item => item.research_groups);
        return { data: groups, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'getUserGroups');
    }
}

/**
 * Obtém um grupo específico por ID
 */
export async function getGroupById(groupId) {
    if (!isSupabaseAvailable()) {
        const groups = JSON.parse(localStorage.getItem('research_groups') || '[]');
        const group = groups.find(g => g.id === groupId);
        return { data: group || null, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('research_groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'getGroupById');
    }
}

/**
 * Atualiza um grupo de pesquisa
 */
export async function updateResearchGroup(groupId, updates) {
    if (!isSupabaseAvailable()) {
        const groups = JSON.parse(localStorage.getItem('research_groups') || '[]');
        const index = groups.findIndex(g => g.id === groupId);

        if (index !== -1) {
            groups[index] = {
                ...groups[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            localStorage.setItem('research_groups', JSON.stringify(groups));
            return { data: groups[index], error: null };
        }

        return { data: null, error: { message: 'Grupo não encontrado' } };
    }

    try {
        const { data, error } = await supabase
            .from('research_groups')
            .update(updates)
            .eq('id', groupId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'updateResearchGroup');
    }
}

/**
 * Deleta um grupo de pesquisa
 */
export async function deleteResearchGroup(groupId) {
    if (!isSupabaseAvailable()) {
        const groups = JSON.parse(localStorage.getItem('research_groups') || '[]');
        const filtered = groups.filter(g => g.id !== groupId);
        localStorage.setItem('research_groups', JSON.stringify(filtered));

        // Também remover membros
        const members = JSON.parse(localStorage.getItem('group_members') || '[]');
        const filteredMembers = members.filter(m => m.group_id !== groupId);
        localStorage.setItem('group_members', JSON.stringify(filteredMembers));

        return { error: null };
    }

    try {
        const { error } = await supabase
            .from('research_groups')
            .delete()
            .eq('id', groupId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return handleSupabaseError(error, 'deleteResearchGroup');
    }
}

// =====================================================
// MEMBROS DO GRUPO
// =====================================================

/**
 * Adiciona um membro ao grupo
 */
export async function addGroupMember(groupId, userId, role = 'member') {
    if (!isSupabaseAvailable()) {
        const members = JSON.parse(localStorage.getItem('group_members') || '[]');
        const newMember = {
            id: crypto.randomUUID(),
            group_id: groupId,
            user_id: userId,
            role,
            status: 'active',
            joined_at: new Date().toISOString()
        };
        members.push(newMember);
        localStorage.setItem('group_members', JSON.stringify(members));
        return { data: newMember, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('group_members')
            .insert([{
                group_id: groupId,
                user_id: userId,
                role,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'addGroupMember');
    }
}

/**
 * Remove um membro do grupo
 */
export async function removeGroupMember(groupId, userId) {
    if (!isSupabaseAvailable()) {
        const members = JSON.parse(localStorage.getItem('group_members') || '[]');
        const filtered = members.filter(m => !(m.group_id === groupId && m.user_id === userId));
        localStorage.setItem('group_members', JSON.stringify(filtered));
        return { error: null };
    }

    try {
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return handleSupabaseError(error, 'removeGroupMember');
    }
}

/**
 * Obtém todos os membros de um grupo
 */
export async function getGroupMembers(groupId) {
    if (!isSupabaseAvailable()) {
        const members = JSON.parse(localStorage.getItem('group_members') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        const groupMembers = members
            .filter(m => m.group_id === groupId && m.status === 'active')
            .map(m => {
                const user = users.find(u => u.id === m.user_id);
                return {
                    ...m,
                    user
                };
            });

        return { data: groupMembers, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('active_group_members')
            .select('*')
            .eq('group_id', groupId);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'getGroupMembers');
    }
}

/**
 * Atualiza o papel de um membro no grupo
 */
export async function updateMemberRole(groupId, userId, newRole) {
    if (!isSupabaseAvailable()) {
        const members = JSON.parse(localStorage.getItem('group_members') || '[]');
        const member = members.find(m => m.group_id === groupId && m.user_id === userId);

        if (member) {
            member.role = newRole;
            localStorage.setItem('group_members', JSON.stringify(members));
            return { data: member, error: null };
        }

        return { data: null, error: { message: 'Membro não encontrado' } };
    }

    try {
        const { data, error } = await supabase
            .from('group_members')
            .update({ role: newRole })
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'updateMemberRole');
    }
}

// =====================================================
// SUBMISSÕES DO GRUPO
// =====================================================

/**
 * Obtém todas as submissões de um grupo
 */
export async function getGroupSubmissions(groupId) {
    if (!isSupabaseAvailable()) {
        const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        const groupSubmissions = submissions.filter(s =>
            s.research_group_id === groupId && !s.is_private
        );
        return { data: groupSubmissions, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('group_submissions')
            .select('*')
            .eq('research_group_id', groupId);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'getGroupSubmissions');
    }
}

/**
 * Obtém estatísticas de um grupo
 */
export async function getGroupStats(groupId) {
    if (!isSupabaseAvailable()) {
        const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        const members = JSON.parse(localStorage.getItem('group_members') || '[]');

        const groupSubmissions = submissions.filter(s =>
            s.research_group_id === groupId && !s.is_private
        );

        const activeMembers = members.filter(m =>
            m.group_id === groupId && m.status === 'active'
        );

        const stats = {
            total_members: activeMembers.length,
            total_submissions: groupSubmissions.length,
            accepted_submissions: groupSubmissions.filter(s => s.status === 'accepted').length,
            rejected_submissions: groupSubmissions.filter(s => s.status === 'rejected').length,
            under_review_submissions: groupSubmissions.filter(s => s.status === 'under_review').length,
            acceptance_rate: groupSubmissions.length > 0
                ? ((groupSubmissions.filter(s => s.status === 'accepted').length / groupSubmissions.length) * 100).toFixed(2)
                : 0
        };

        return { data: stats, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('group_stats')
            .select('*')
            .eq('group_id', groupId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'getGroupStats');
    }
}

/**
 * Busca grupo pelo ID do CNPq
 */
export async function findGroupByCnpqId(cnpqId) {
    if (!isSupabaseAvailable()) {
        const groups = JSON.parse(localStorage.getItem('research_groups') || '[]');
        const group = groups.find(g => g.cnpq_id === cnpqId);
        return { data: group || null, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('research_groups')
            .select('*')
            .eq('cnpq_id', cnpqId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return { data: data || null, error: null };
    } catch (error) {
        return handleSupabaseError(error, 'findGroupByCnpqId');
    }
}
