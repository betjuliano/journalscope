import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, Building } from 'lucide-react';
import { authenticateUser, registerUser } from '../../utils/submissionStorage';

/**
 * Componente de Login e Registro
 */
const AuthForm = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        institution: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // Login
                const user = authenticateUser(formData.email, formData.password);
                if (user) {
                    onLogin(user);
                } else {
                    setError('Email ou senha incorretos');
                }
            } else {
                // Registro
                if (!formData.name || !formData.institution) {
                    setError('Por favor, preencha todos os campos');
                    setLoading(false);
                    return;
                }

                const result = registerUser(formData);
                if (result.success) {
                    onLogin(result.user);
                } else {
                    setError(result.message);
                }
            }
        } catch (err) {
            setError('Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            email: '',
            password: '',
            name: '',
            institution: ''
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">JournalScope</h1>
                    <p className="text-blue-100">Sistema de Gestão de Submissões</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
                        </h2>
                        <p className="text-gray-600">
                            {isLogin
                                ? 'Entre com suas credenciais para continuar'
                                : 'Preencha os dados para criar sua conta'
                            }
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name (only for register) */}
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome Completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required={!isLogin}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Dr. João Silva"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Institution (only for register) */}
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Instituição
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="institution"
                                        value={formData.institution}
                                        onChange={handleChange}
                                        required={!isLogin}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Universidade Federal"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                    {isLogin ? 'Entrar' : 'Criar Conta'}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                            {' '}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                            >
                                {isLogin ? 'Criar conta' : 'Fazer login'}
                            </button>
                        </p>
                    </div>

                    {/* Demo Credentials */}
                    {isLogin && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800 font-medium mb-2">
                                Credenciais de demonstração:
                            </p>
                            <p className="text-xs text-blue-700">
                                Email: joao@example.com<br />
                                Senha: 123456
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-white text-sm">
                    <p>© 2025 JournalScope. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
