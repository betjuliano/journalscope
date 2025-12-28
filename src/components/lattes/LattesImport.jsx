import React, { useState, useRef } from 'react';
import {
    Upload, FileText, AlertCircle, CheckCircle, X, HelpCircle,
    Archive, FileWarning, RefreshCw, Eye, Save, User, Calendar
} from 'lucide-react';
import { parseXML, getStats } from '../../services/lattesParserService';
import JSZip from 'jszip';

/**
 * Componente para importação de arquivo XML do Lattes
 * Suporta arquivos .xml e .zip contendo XMLs
 * Detecta currículo existente e oferece opções de atualização
 */
const LattesImport = ({
    onImportSuccess,
    onError,
    existingCurriculo = null,  // Currículo já salvo no banco
    lastSaved = null           // Data do último salvamento
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const [importMode, setImportMode] = useState(null); // 'update' | 'view'
    const [pendingData, setPendingData] = useState(null); // Dados aguardando decisão
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    /**
     * Corrige encoding ISO-8859-1 para UTF-8
     * O Lattes exporta arquivos em ISO-8859-1, causando caracteres como "�"
     */
    const fixEncoding = async (content) => {
        // Se já está em UTF-8 válido, retorna direto
        if (!content.includes('�') && !content.includes('Ã')) {
            return content;
        }

        // Tenta decodificar como ISO-8859-1
        try {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder('utf-8');

            // Se o conteúdo parece estar em Latin-1
            const latin1Decoder = new TextDecoder('iso-8859-1');
            const bytes = new Uint8Array([...content].map(c => c.charCodeAt(0)));
            return latin1Decoder.decode(bytes);
        } catch (e) {
            console.warn('[LattesImport] Não foi possível corrigir encoding:', e);
            return content;
        }
    };

    /**
     * Lê arquivo como ArrayBuffer e decodifica com encoding correto
     */
    const readFileWithEncoding = (file, encoding = 'utf-8') => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const decoder = new TextDecoder(encoding);
                    const text = decoder.decode(arrayBuffer);
                    resolve(text);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    };

    /**
     * Tenta detectar e corrigir o encoding do XML
     */
    const decodeXmlContent = async (data) => {
        // Se é ArrayBuffer (de ZIP), converter
        if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
            // Primeiro tenta UTF-8
            try {
                const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(data);
                if (utf8.includes('CURRICULO-VITAE')) return utf8;
            } catch { }

            // Tenta ISO-8859-1 (Latin-1) - comum em XMLs do Lattes
            try {
                const latin1 = new TextDecoder('iso-8859-1').decode(data);
                if (latin1.includes('CURRICULO-VITAE')) return latin1;
            } catch { }

            // Tenta Windows-1252
            try {
                const win1252 = new TextDecoder('windows-1252').decode(data);
                if (win1252.includes('CURRICULO-VITAE')) return win1252;
            } catch { }

            // Fallback
            return new TextDecoder('iso-8859-1').decode(data);
        }

        // Se já é string, verificar se precisa re-decodificar
        if (typeof data === 'string') {
            // Detecta se há caracteres corrompidos (mojibake)
            if (data.includes('Ã§') || data.includes('Ã£') || data.includes('Ã©')) {
                // Double encoding - decodifica de volta
                const bytes = new Uint8Array([...data].map(c => c.charCodeAt(0)));
                return new TextDecoder('utf-8').decode(bytes);
            }
            return data;
        }

        return String(data);
    };

    /**
     * Extrai XMLs de um arquivo ZIP
     */
    const extractXmlFromZip = async (file) => {
        setProcessingStatus('Descompactando arquivo ZIP...');

        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);

            // Encontrar todos os arquivos XML no ZIP
            const xmlFiles = [];
            for (const [fileName, zipEntry] of Object.entries(zipContent.files)) {
                if (fileName.toLowerCase().endsWith('.xml') && !zipEntry.dir) {
                    xmlFiles.push({ name: fileName, entry: zipEntry });
                }
            }

            if (xmlFiles.length === 0) {
                throw new Error('Nenhum arquivo XML encontrado no ZIP.');
            }

            // Processar cada XML encontrado
            const results = [];
            for (const { name, entry } of xmlFiles) {
                setProcessingStatus(`Processando: ${name}...`);

                // Ler como ArrayBuffer para controlar encoding
                const arrayBuffer = await entry.async('arraybuffer');
                const xmlContent = await decodeXmlContent(arrayBuffer);

                if (xmlContent.includes('CURRICULO-VITAE')) {
                    results.push({
                        fileName: name,
                        content: xmlContent
                    });
                }
            }

            if (results.length === 0) {
                throw new Error('Nenhum arquivo XML válido do Lattes encontrado no ZIP.');
            }

            return results;
        } catch (err) {
            if (err.message.includes('Nenhum arquivo')) {
                throw err;
            }
            throw new Error(`Erro ao descompactar ZIP: ${err.message}`);
        }
    };

    const processFile = async (file) => {
        setError(null);
        setPreview(null);
        setProcessingStatus('');

        const isZip = file.name.toLowerCase().endsWith('.zip');
        const isXml = file.name.toLowerCase().endsWith('.xml');

        // Validar extensão
        if (!isXml && !isZip) {
            setError('Por favor, selecione um arquivo XML ou ZIP do Lattes.');
            return;
        }

        // Validar tamanho (máximo 50MB para ZIP, 10MB para XML)
        const maxSize = isZip ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError(`O arquivo é muito grande. Tamanho máximo: ${isZip ? '50MB' : '10MB'}.`);
            return;
        }

        setIsProcessing(true);

        try {
            let xmlContents = [];

            if (isZip) {
                // Extrair XMLs do ZIP
                xmlContents = await extractXmlFromZip(file);
            } else {
                // Ler XML diretamente com encoding correto
                setProcessingStatus('Lendo arquivo XML...');

                // Tenta diferentes encodings
                let xmlContent;

                // Primeiro tenta como UTF-8
                try {
                    xmlContent = await readFileWithEncoding(file, 'utf-8');
                    // Verifica se há caracteres corrompidos
                    if (xmlContent.includes('�')) {
                        throw new Error('Invalid UTF-8');
                    }
                } catch {
                    // Tenta como ISO-8859-1
                    try {
                        xmlContent = await readFileWithEncoding(file, 'iso-8859-1');
                    } catch {
                        // Fallback para leitura padrão
                        xmlContent = await file.text();
                    }
                }

                xmlContent = await decodeXmlContent(xmlContent);

                if (!xmlContent.includes('CURRICULO-VITAE')) {
                    throw new Error('Este não parece ser um arquivo XML do Lattes. O arquivo deve conter a tag CURRICULO-VITAE.');
                }

                xmlContents = [{ fileName: file.name, content: xmlContent }];
            }

            // Processar o primeiro XML (ou único)
            const firstXml = xmlContents[0];
            setProcessingStatus('Analisando currículo...');

            const parsedData = parseXML(firstXml.content);

            if (!parsedData.profile) {
                throw new Error('Não foi possível extrair os dados do perfil. Verifique se o arquivo XML está correto.');
            }

            // Adicionar metadados sobre múltiplos arquivos
            if (xmlContents.length > 1) {
                parsedData.metadata.multipleFiles = true;
                parsedData.metadata.totalFiles = xmlContents.length;
                parsedData.metadata.fileNames = xmlContents.map(x => x.fileName);
            }

            // Calcular estatísticas para preview
            const stats = getStats(parsedData);

            setPreview({
                profile: parsedData.profile,
                stats,
                fileName: isZip ? `${file.name} (${xmlContents.length} arquivo${xmlContents.length > 1 ? 's' : ''})` : file.name,
                fileSize: formatFileSize(file.size),
                isZip,
                totalFiles: xmlContents.length
            });

            // Se existe currículo salvo, pede confirmação antes de sobrescrever
            if (existingCurriculo && parsedData.profile) {
                const isSamePerson = existingCurriculo.nome_completo?.toLowerCase() ===
                    parsedData.profile.name?.toLowerCase();

                if (isSamePerson) {
                    // Mesmo pesquisador - atualiza automaticamente
                    if (onImportSuccess) {
                        onImportSuccess(parsedData, { updateExisting: true });
                    }
                } else {
                    // Pesquisador diferente - guarda para decisão
                    setPendingData(parsedData);
                }
            } else {
                // Primeiro import ou não há currículo existente
                if (onImportSuccess) {
                    onImportSuccess(parsedData, { updateExisting: true });
                }
            }

        } catch (err) {
            console.error('[LattesImport] Erro ao processar arquivo:', err);
            setError(err.message || 'Erro ao processar o arquivo.');
            if (onError) {
                onError(err);
            }
        } finally {
            setIsProcessing(false);
            setProcessingStatus('');
        }
    };

    // Handler para confirmar substituição
    const handleConfirmReplace = () => {
        if (pendingData && onImportSuccess) {
            onImportSuccess(pendingData, { updateExisting: true });
        }
        setPendingData(null);
    };

    // Handler para visualizar sem salvar
    const handleViewOnly = () => {
        if (pendingData && onImportSuccess) {
            onImportSuccess(pendingData, { updateExisting: false });
        }
        setPendingData(null);
    };

    // Handler para cancelar
    const handleCancelImport = () => {
        setPendingData(null);
        setPreview(null);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const clearImport = () => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Importar Currículo Lattes
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Faça upload do arquivo XML ou ZIP do seu currículo para análise
                    </p>
                </div>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <HelpCircle className="w-5 h-5" />
                    Como baixar o XML?
                </button>
            </div>

            {/* Currículo já salvo */}
            {existingCurriculo && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <User className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Currículo salvo</p>
                                <h3 className="text-lg font-semibold text-emerald-800">
                                    {existingCurriculo.nome_completo}
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-emerald-600">
                                    {existingCurriculo.instituicao && (
                                        <span>{existingCurriculo.instituicao}</span>
                                    )}
                                    {lastSaved && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Salvo em: {new Date(lastSaved).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                            ✓ Sincronizado
                        </span>
                    </div>
                    <p className="text-sm text-emerald-700 mt-3">
                        Você pode importar um novo arquivo XML para atualizar este currículo ou visualizar outro perfil temporariamente.
                    </p>
                </div>
            )}

            {/* Modal de confirmação para pesquisador diferente */}
            {pendingData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Currículo de pesquisador diferente
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-800">
                                    <strong>Atenção:</strong> O currículo que você está importando pertence a um pesquisador diferente do que está salvo.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Currículo salvo</p>
                                    <p className="font-medium text-gray-900">{existingCurriculo?.nome_completo}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-xs text-blue-600 mb-1">Novo currículo</p>
                                    <p className="font-medium text-gray-900">{pendingData.profile?.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirmReplace}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Substituir currículo salvo
                            </button>
                            <button
                                onClick={handleViewOnly}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Eye className="w-5 h-5" />
                                Apenas visualizar (não salvar)
                            </button>
                            <button
                                onClick={handleCancelImport}
                                className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Instruções */}
            {showHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">
                        📋 Como obter o arquivo XML do Lattes
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>Acesse <a href="https://lattes.cnpq.br" target="_blank" rel="noopener noreferrer" className="underline font-medium">lattes.cnpq.br</a></li>
                        <li>Faça login com sua conta Gov.br</li>
                        <li>Entre no seu currículo</li>
                        <li>Clique em <strong>"Exportar"</strong> no menu superior</li>
                        <li>Selecione <strong>"XML"</strong> como formato</li>
                        <li>Faça o download e importe aqui (XML ou ZIP)</li>
                    </ol>
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>💡 Dica:</strong> Você pode enviar um arquivo .zip contendo múltiplos XMLs para análise em lote.
                        </p>
                    </div>
                    <p className="mt-3 text-sm text-blue-700">
                        <strong>Nota:</strong> O captcha do Lattes impede scraping automático,
                        por isso é necessário baixar o arquivo manualmente.
                    </p>
                </div>
            )}

            {/* Área de Upload */}
            {!preview && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-12
                        transition-all duration-200 cursor-pointer
                        ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }
                        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                    `}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xml,.zip"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="text-center">
                        {isProcessing ? (
                            <>
                                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-700">
                                    {processingStatus || 'Processando arquivo...'}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-center gap-4 mb-4">
                                    <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <Archive className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                                </div>
                                <p className="text-lg font-medium text-gray-700 mb-2">
                                    Arraste o arquivo XML ou ZIP aqui
                                </p>
                                <p className="text-gray-500">
                                    ou clique para selecionar
                                </p>
                                <div className="mt-4 flex justify-center gap-3 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-4 h-4" />
                                        .xml (até 10MB)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Archive className="w-4 h-4" />
                                        .zip (até 50MB)
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Erro */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-red-800 font-medium">Erro ao importar</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Preview do arquivo importado */}
            {preview && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Header do preview */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-emerald-100 text-sm">Importado com sucesso</p>
                                    <h3 className="text-xl font-bold">
                                        {preview.profile.name}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={clearImport}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Remover e importar outro"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Corpo do preview */}
                    <div className="p-6">
                        {/* Info do arquivo */}
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6 pb-6 border-b">
                            <FileText className="w-4 h-4" />
                            <span>{preview.fileName}</span>
                            <span>•</span>
                            <span>{preview.fileSize}</span>
                            {preview.profile.institution && (
                                <>
                                    <span>•</span>
                                    <span>{preview.profile.institution}</span>
                                </>
                            )}
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-blue-50 rounded-xl">
                                <p className="text-3xl font-bold text-blue-600">
                                    {preview.stats.articles.total}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Artigos
                                </p>
                                <p className="text-xs text-gray-500">
                                    {preview.stats.articles.published} publicados, {preview.stats.articles.accepted} aceitos
                                </p>
                            </div>

                            <div className="text-center p-4 bg-purple-50 rounded-xl">
                                <p className="text-3xl font-bold text-purple-600">
                                    {preview.stats.projects.total}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Projetos
                                </p>
                                <p className="text-xs text-gray-500">
                                    {preview.stats.projects.active} em andamento
                                </p>
                            </div>

                            <div className="text-center p-4 bg-amber-50 rounded-xl">
                                <p className="text-3xl font-bold text-amber-600">
                                    {preview.stats.orientations.total}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Orientações
                                </p>
                                <p className="text-xs text-gray-500">
                                    {preview.stats.orientations.completed} concluídas
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LattesImport;
