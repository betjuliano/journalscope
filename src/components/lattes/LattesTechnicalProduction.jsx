import React, { useState, useMemo } from 'react';
import {
    Cpu, Package, FileCode, Award, Beaker, BookOpen,
    ChevronDown, ChevronUp, Star, StarOff, Search, Filter,
    ExternalLink, Building, Calendar, CheckCircle2
} from 'lucide-react';

/**
 * Componente para exibição e gestão de produção técnica
 * Permite marcar itens como produtos tecnológicos para destaque
 */
const LattesTechnicalProduction = ({
    technicalProduction = [],
    onUpdateTechProduct,
    showOnlyTechProducts = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [expandedItem, setExpandedItem] = useState(null);
    const [localProduction, setLocalProduction] = useState(technicalProduction);

    // Tipos de produção
    const productionTypes = {
        software: { label: 'Software', icon: FileCode, color: 'blue' },
        patent: { label: 'Patente', icon: Award, color: 'amber' },
        tech_product: { label: 'Produto Tecnológico', icon: Package, color: 'emerald' },
        process: { label: 'Processo/Técnica', icon: Beaker, color: 'purple' },
        technical_work: { label: 'Trabalho Técnico', icon: Cpu, color: 'indigo' },
        didactic_material: { label: 'Material Didático', icon: BookOpen, color: 'rose' }
    };

    // Atualizar local production quando props mudam
    React.useEffect(() => {
        setLocalProduction(technicalProduction);
    }, [technicalProduction]);

    // Filtrar produção
    const filteredProduction = useMemo(() => {
        let result = [...localProduction];

        // Filtro por produtos tecnológicos
        if (showOnlyTechProducts) {
            result = result.filter(item => item.isMarkedAsTechProduct);
        }

        // Filtro por busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.title?.toLowerCase().includes(term) ||
                item.institution?.toLowerCase().includes(term)
            );
        }

        // Filtro por tipo
        if (filterType !== 'all') {
            result = result.filter(item => item.type === filterType);
        }

        // Filtro por categoria
        if (filterCategory !== 'all') {
            const isTechProduct = filterCategory === 'tech_product';
            result = result.filter(item => item.isMarkedAsTechProduct === isTechProduct);
        }

        return result;
    }, [localProduction, searchTerm, filterType, filterCategory, showOnlyTechProducts]);

    // Marcar/desmarcar como produto tecnológico
    const toggleTechProduct = (index) => {
        const updated = [...localProduction];
        const itemIndex = localProduction.findIndex((_, i) => i === index);
        if (itemIndex !== -1) {
            updated[itemIndex] = {
                ...updated[itemIndex],
                isMarkedAsTechProduct: !updated[itemIndex].isMarkedAsTechProduct
            };
            setLocalProduction(updated);
            if (onUpdateTechProduct) {
                onUpdateTechProduct(updated);
            }
        }
    };

    // Estatísticas
    const stats = useMemo(() => ({
        total: localProduction.length,
        techProducts: localProduction.filter(p => p.isMarkedAsTechProduct).length,
        software: localProduction.filter(p => p.type === 'software').length,
        patents: localProduction.filter(p => p.type === 'patent').length
    }), [localProduction]);

    const getTypeInfo = (type) => productionTypes[type] || { label: type, icon: Package, color: 'gray' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Produção Técnica
                </h2>
                <p className="text-gray-500 mt-1">
                    Gerencie sua produção técnica e marque itens como produtos tecnológicos
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Package className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Star className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-700">{stats.techProducts}</p>
                            <p className="text-sm text-emerald-600">Produtos Tecnológicos</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileCode className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.software}</p>
                            <p className="text-sm text-gray-500">Softwares</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.patents}</p>
                            <p className="text-sm text-gray-500">Patentes</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info sobre Produtos Tecnológicos */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-emerald-800">
                            Marque itens como Produto Tecnológico
                        </p>
                        <p className="text-sm text-emerald-700 mt-1">
                            Itens marcados como produto tecnológico ficam em destaque na sua página inicial
                            do pesquisador, facilitando a comprovação e divulgação da sua produção técnica.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Busca */}
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por título ou instituição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Tipo */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os tipos</option>
                        {Object.entries(productionTypes).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {/* Categoria */}
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todas as categorias</option>
                        <option value="tech_product">Produtos Tecnológicos</option>
                        <option value="other">Outros</option>
                    </select>
                </div>
            </div>

            {/* Lista de Produção */}
            {filteredProduction.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                        {showOnlyTechProducts
                            ? 'Nenhum produto tecnológico marcado'
                            : 'Nenhuma produção técnica encontrada'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredProduction.map((item, index) => {
                        const typeInfo = getTypeInfo(item.type);
                        const TypeIcon = typeInfo.icon;
                        const isExpanded = expandedItem === index;

                        return (
                            <div
                                key={index}
                                className={`bg-white rounded-xl border overflow-hidden transition-all ${item.isMarkedAsTechProduct
                                        ? 'border-emerald-300 ring-1 ring-emerald-200'
                                        : ''
                                    }`}
                            >
                                {/* Header do item */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50"
                                    onClick={() => setExpandedItem(isExpanded ? null : index)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className={`p-2 rounded-lg bg-${typeInfo.color}-100`}>
                                                <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-600`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                                                        {typeInfo.label}
                                                    </span>
                                                    {item.isMarkedAsTechProduct && (
                                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                                            <Star className="w-3 h-3" />
                                                            Produto Tecnológico
                                                        </span>
                                                    )}
                                                    <span className="text-sm text-gray-500">{item.year}</span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mt-1">
                                                    {item.title}
                                                </h3>
                                                {item.institution && (
                                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                        <Building className="w-4 h-4" />
                                                        {item.institution}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botão de marcar como produto tecnológico */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleTechProduct(localProduction.indexOf(item));
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${item.isMarkedAsTechProduct
                                                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                                }`}
                                            title={item.isMarkedAsTechProduct
                                                ? 'Remover marcação de Produto Tecnológico'
                                                : 'Marcar como Produto Tecnológico'
                                            }
                                        >
                                            {item.isMarkedAsTechProduct ? (
                                                <Star className="w-5 h-5 fill-current" />
                                            ) : (
                                                <StarOff className="w-5 h-5" />
                                            )}
                                        </button>

                                        {/* Botão expandir */}
                                        <button className="text-gray-400">
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Detalhes expandidos */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 bg-gray-50 border-t">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {item.nature && (
                                                <div>
                                                    <span className="text-gray-500">Natureza:</span>
                                                    <p className="font-medium">{item.nature}</p>
                                                </div>
                                            )}
                                            {item.availability && (
                                                <div>
                                                    <span className="text-gray-500">Disponibilidade:</span>
                                                    <p className="font-medium">{item.availability}</p>
                                                </div>
                                            )}
                                            {item.registrationNumber && (
                                                <div>
                                                    <span className="text-gray-500">Registro:</span>
                                                    <p className="font-medium">{item.registrationNumber}</p>
                                                </div>
                                            )}
                                            {item.depositDate && (
                                                <div>
                                                    <span className="text-gray-500">Data Depósito:</span>
                                                    <p className="font-medium">{item.depositDate}</p>
                                                </div>
                                            )}
                                            {item.country && (
                                                <div>
                                                    <span className="text-gray-500">País:</span>
                                                    <p className="font-medium">{item.country}</p>
                                                </div>
                                            )}
                                            {item.status && (
                                                <div>
                                                    <span className="text-gray-500">Situação:</span>
                                                    <p className="font-medium">{item.status}</p>
                                                </div>
                                            )}
                                            {item.description && (
                                                <div className="col-span-2">
                                                    <span className="text-gray-500">Descrição:</span>
                                                    <p className="font-medium mt-1">{item.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LattesTechnicalProduction;
