/**
 * Utilitário para gerenciar submissões no localStorage
 * Simula um backend para desenvolvimento
 */

const STORAGE_KEY = 'journalscope_submissions';
const USERS_KEY = 'journalscope_users';

/**
 * Gera um ID único
 */
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Obtém todas as submissões de um usuário
 */
export const getSubmissions = (userId) => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const submissions = data ? JSON.parse(data) : [];
        return submissions.filter(sub => sub.userId === userId);
    } catch (error) {
        console.error('Erro ao carregar submissões:', error);
        return [];
    }
};

/**
 * Obtém uma submissão específica por ID
 */
export const getSubmissionById = (id) => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const submissions = data ? JSON.parse(data) : [];
        return submissions.find(sub => sub.id === id);
    } catch (error) {
        console.error('Erro ao carregar submissão:', error);
        return null;
    }
};

/**
 * Salva uma submissão (criar ou atualizar)
 */
export const saveSubmission = (submission) => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        let submissions = data ? JSON.parse(data) : [];

        if (submission.id) {
            // Atualizar existente
            submissions = submissions.map(sub =>
                sub.id === submission.id ? { ...submission, updatedAt: new Date().toISOString() } : sub
            );
        } else {
            // Criar novo
            const newSubmission = {
                ...submission,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            submissions.push(newSubmission);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
        return true;
    } catch (error) {
        console.error('Erro ao salvar submissão:', error);
        return false;
    }
};

/**
 * Deleta uma submissão
 */
export const deleteSubmission = (id) => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        let submissions = data ? JSON.parse(data) : [];
        submissions = submissions.filter(sub => sub.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
        return true;
    } catch (error) {
        console.error('Erro ao deletar submissão:', error);
        return false;
    }
};

/**
 * Adiciona uma revisão a uma submissão
 */
export const addReview = (submissionId, review) => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        let submissions = data ? JSON.parse(data) : [];

        submissions = submissions.map(sub => {
            if (sub.id === submissionId) {
                return {
                    ...sub,
                    reviews: [...(sub.reviews || []), {
                        ...review,
                        id: generateId(),
                        date: new Date().toISOString()
                    }],
                    updatedAt: new Date().toISOString()
                };
            }
            return sub;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
        return true;
    } catch (error) {
        console.error('Erro ao adicionar revisão:', error);
        return false;
    }
};

/**
 * Gera estatísticas das submissões
 */
export const getSubmissionStats = (userId) => {
    const submissions = getSubmissions(userId);

    const total = submissions.length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const underReview = submissions.filter(s => s.status === 'under_review').length;
    const revisionRequested = submissions.filter(s => s.status === 'revision_requested').length;
    const accepted = submissions.filter(s => s.status === 'accepted').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;

    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    // Calcular tempo médio de revisão (em dias)
    const completedSubmissions = submissions.filter(s =>
        s.status === 'accepted' || s.status === 'rejected'
    );

    let avgReviewTime = 0;
    if (completedSubmissions.length > 0) {
        const totalDays = completedSubmissions.reduce((sum, sub) => {
            const submitted = new Date(sub.submittedAt);
            const updated = new Date(sub.updatedAt);
            const days = Math.floor((updated - submitted) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0);
        avgReviewTime = Math.round(totalDays / completedSubmissions.length);
    }

    return {
        total,
        pending,
        underReview,
        revisionRequested,
        accepted,
        rejected,
        acceptanceRate,
        avgReviewTime
    };
};

/**
 * Gera link de compartilhamento para uma submissão
 */
export const generateShareLink = (submissionId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/submission/view/${submissionId}`;
};

/**
 * Autentica um usuário
 */
export const authenticateUser = (email, password) => {
    try {
        const data = localStorage.getItem(USERS_KEY);
        const users = data ? JSON.parse(data) : [];

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Não retornar a senha
            const { password, ...userWithoutPassword } = user;
            localStorage.setItem('journalscope_current_user', JSON.stringify(userWithoutPassword));
            return userWithoutPassword;
        }

        return null;
    } catch (error) {
        console.error('Erro ao autenticar:', error);
        return null;
    }
};

/**
 * Registra um novo usuário
 */
export const registerUser = (userData) => {
    try {
        const data = localStorage.getItem(USERS_KEY);
        let users = data ? JSON.parse(data) : [];

        // Verificar se email já existe
        if (users.some(u => u.email === userData.email)) {
            return { success: false, message: 'Email já cadastrado' };
        }

        const newUser = {
            id: generateId(),
            ...userData,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Fazer login automático
        const { password, ...userWithoutPassword } = newUser;
        localStorage.setItem('journalscope_current_user', JSON.stringify(userWithoutPassword));

        return { success: true, user: userWithoutPassword };
    } catch (error) {
        console.error('Erro ao registrar:', error);
        return { success: false, message: 'Erro ao criar conta' };
    }
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = () => {
    try {
        const data = localStorage.getItem('journalscope_current_user');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
        return null;
    }
};

/**
 * Faz logout do usuário
 */
export const logoutUser = () => {
    localStorage.removeItem('journalscope_current_user');
};

/**
 * Inicializa dados de exemplo (apenas para desenvolvimento)
 */
export const initializeSampleData = () => {
    // Criar usuário de exemplo se não existir
    const users = localStorage.getItem(USERS_KEY);
    if (!users) {
        const sampleUser = {
            id: 'user-1',
            name: 'Dr. João Silva',
            email: 'joao@example.com',
            password: '123456',
            institution: 'Universidade Federal',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(USERS_KEY, JSON.stringify([sampleUser]));
    }

    // Criar submissões de exemplo se não existirem
    const submissions = localStorage.getItem(STORAGE_KEY);
    if (!submissions) {
        const sampleSubmissions = [
            {
                id: 'sub-1',
                userId: 'user-1',
                title: 'Machine Learning Applications in Business Analytics',
                journal: 'Journal of Business Research',
                abstract: 'This paper explores the application of machine learning techniques in business analytics, focusing on predictive modeling and decision support systems.',
                keywords: ['Machine Learning', 'Business Analytics', 'Predictive Modeling'],
                authors: ['Dr. João Silva', 'Dr. Maria Santos'],
                status: 'under_review',
                submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                reviews: [
                    {
                        id: 'rev-1',
                        reviewer: 'Dr. Carlos Oliveira',
                        comment: 'Artigo bem estruturado com metodologia sólida. Sugiro expandir a seção de resultados.',
                        recommendation: 'revision',
                        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                id: 'sub-2',
                userId: 'user-1',
                title: 'Sustainable Supply Chain Management: A Systematic Review',
                journal: 'International Journal of Production Economics',
                abstract: 'A comprehensive systematic review of sustainable practices in supply chain management.',
                keywords: ['Sustainability', 'Supply Chain', 'Green Logistics'],
                authors: ['Dr. João Silva'],
                status: 'accepted',
                submittedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                reviews: [
                    {
                        id: 'rev-2',
                        reviewer: 'Dr. Ana Paula',
                        comment: 'Excelente revisão da literatura. Recomendo publicação.',
                        recommendation: 'accept',
                        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                id: 'sub-3',
                userId: 'user-1',
                title: 'Digital Transformation in Small and Medium Enterprises',
                journal: 'Journal of Small Business Management',
                abstract: 'This study investigates the challenges and opportunities of digital transformation in SMEs.',
                keywords: ['Digital Transformation', 'SMEs', 'Innovation'],
                authors: ['Dr. João Silva', 'Dr. Pedro Costa', 'Dr. Ana Lima'],
                status: 'pending',
                submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                reviews: []
            }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSubmissions));
    }
};
