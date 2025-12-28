import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Check } from 'lucide-react';
import { autocompleteJournals } from '../../services/journalService';

/**
 * Componente de autocomplete para seleção de periódicos
 */
const JournalAutocomplete = ({ value, onChange, required = false }) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Buscar sugestões quando o termo de busca mudar
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchTerm.length < 2) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            try {
                const results = await autocompleteJournals(searchTerm, 10);
                setSuggestions(results);
                setIsOpen(results.length > 0);
            } catch (error) {
                console.error('Error fetching journal suggestions:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    // Atualizar searchTerm quando value mudar externamente
    useEffect(() => {
        if (value !== searchTerm) {
            setSearchTerm(value || '');
        }
    }, [value]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
        setSelectedIndex(-1);
    };

    const handleSelectSuggestion = (journal) => {
        setSearchTerm(journal.name);
        onChange(journal.name);
        setIsOpen(false);
        setSuggestions([]);
        setSelectedIndex(-1);
    };

    const handleClear = () => {
        setSearchTerm('');
        onChange('');
        setSuggestions([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    const getClassificationBadge = (journal) => {
        const badges = [];

        if (journal.qualis && journal.qualis !== '-') {
            badges.push({
                label: journal.qualis,
                color: journal.qualis === 'MB' ? 'purple' :
                    journal.qualis === 'B' ? 'blue' :
                        journal.qualis === 'R' ? 'yellow' : 'red'
            });
        }

        if (journal.abdc) {
            badges.push({
                label: `ABDC: ${journal.abdc}`,
                color: journal.abdc === 'A*' || journal.abdc === 'A' ? 'green' :
                    journal.abdc === 'B' ? 'blue' : 'gray'
            });
        }

        if (journal.abs) {
            badges.push({
                label: `ABS: ${journal.abs}`,
                color: 'indigo'
            });
        }

        return badges;
    };

    return (
        <div ref={wrapperRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Periódico {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0) {
                                setIsOpen(true);
                            }
                        }}
                        required={required}
                        className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Digite para buscar periódicos..."
                        autoComplete="off"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Limpar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                )}
            </div>

            {/* Dropdown de sugestões */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-2">
                        <div className="text-xs text-gray-500 px-3 py-2 font-medium">
                            {suggestions.length} periódico{suggestions.length !== 1 ? 's' : ''} encontrado{suggestions.length !== 1 ? 's' : ''}
                        </div>
                        {suggestions.map((journal, index) => {
                            const badges = getClassificationBadge(journal);
                            const isSelected = index === selectedIndex;

                            return (
                                <button
                                    key={journal.id}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(journal)}
                                    className={`w-full text-left px-3 py-3 rounded-md transition-colors ${isSelected
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 text-sm truncate">
                                                {journal.name}
                                            </div>
                                            {badges.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {badges.map((badge, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                                                    badge.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                                                        badge.color === 'green' ? 'bg-green-100 text-green-800' :
                                                                            badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                                                                badge.color === 'red' ? 'bg-red-100 text-red-800' :
                                                                                    badge.color === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
                                                                                        'bg-gray-100 text-gray-800'
                                                                }`}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Mensagem quando não há resultados */}
            {isOpen && !isLoading && searchTerm.length >= 2 && suggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    <div className="text-center text-gray-500 text-sm">
                        <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p>Nenhum periódico encontrado</p>
                        <p className="text-xs mt-1">
                            Você pode digitar o nome manualmente
                        </p>
                    </div>
                </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
                Digite pelo menos 2 caracteres para buscar ou digite o nome completo manualmente
            </p>
        </div>
    );
};

export default JournalAutocomplete;
