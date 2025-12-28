import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão configuradas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found. Using localStorage fallback.');
}

// Criar cliente Supabase com schema journalscope
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        db: {
            schema: 'journalscope'
        }
    })
    : null;

// Verificar se Supabase está disponível
export const isSupabaseAvailable = () => {
    return supabase !== null;
};

// Helper para lidar com erros do Supabase
export const handleSupabaseError = (error) => {
    console.error('Supabase Error:', error);
    return {
        success: false,
        error: error.message || 'Erro desconhecido'
    };
};

export default supabase;
