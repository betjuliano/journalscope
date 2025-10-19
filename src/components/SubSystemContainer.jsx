import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

const SubSystemContainer = ({ isOpen, onClose, selectedJournals = [] }) => {
  const { t, language } = useI18n();
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);

  // URL do sistema SUB (ajustar conforme necessário)
  const SUB_SYSTEM_URL = process.env.NODE_ENV === 'production' 
    ? (process.env.VITE_SUB_SYSTEM_URL || 'https://sub.iaprojetos.com.br')
    : 'http://localhost:3001';

  // Estados de comunicação
  const [messages, setMessages] = useState([]);

  // Função para enviar mensagem para o iframe
  const sendMessageToIframe = useCallback((message) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, SUB_SYSTEM_URL);
    }
  }, []);

  // Função para lidar com mensagens do iframe
  const handleMessage = useCallback((event) => {
    // Verificar origem da mensagem
    if (event.origin !== SUB_SYSTEM_URL) {
      return;
    }

    const { type, data } = event.data;

    switch (type) {
      case 'SUB_SYSTEM_READY':
        setIsConnected(true);
        setIsLoading(false);
        setHasError(false);
        setLastActivity(new Date());
        break;

      case 'SUB_SYSTEM_ERROR':
        setHasError(true);
        setErrorMessage(data.message || 'Erro desconhecido');
        setIsLoading(false);
        break;

      case 'SUB_SYSTEM_ACTIVITY':
        setLastActivity(new Date());
        break;

      case 'SUB_SYSTEM_CLOSE_REQUEST':
        onClose();
        break;

      default:
        console.log('Mensagem recebida do sistema SUB:', event.data);
    }

    // Adicionar mensagem ao log
    setMessages(prev => [...prev.slice(-9), {
      timestamp: new Date(),
      type,
      data
    }]);
  }, [onClose]);

  // Configurar listener de mensagens
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isOpen, handleMessage]);

  // Função para recarregar o iframe
  const reloadIframe = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      setIsConnected(false);
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  // Função para abrir em nova aba
  const openInNewTab = useCallback(() => {
    window.open(SUB_SYSTEM_URL, '_blank');
  }, []);

  // Enviar mensagem de inicialização quando o iframe carregar
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    
    // Aguardar um pouco para o sistema SUB inicializar
    setTimeout(() => {
      sendMessageToIframe({
        type: 'JOURNALSCOPE_INIT',
        data: {
          language,
          theme: 'journalscope-theme',
          parentUrl: window.location.origin,
          selectedJournals: selectedJournals
        }
      });
    }, 1000);
  }, [language, sendMessageToIframe, selectedJournals]);

  // Enviar periódicos quando mudarem
  useEffect(() => {
    if (isConnected && selectedJournals && selectedJournals.length > 0) {
      sendMessageToIframe({
        type: 'JOURNALSCOPE_JOURNALS_UPDATE',
        data: {
          journals: selectedJournals
        }
      });
    }
  }, [selectedJournals, isConnected, sendMessageToIframe]);

  // Função para lidar com erro do iframe
  const handleIframeError = useCallback(() => {
    setHasError(true);
    setErrorMessage(
      language === 'pt' 
        ? 'Erro ao carregar o sistema de submissões. Verifique se o servidor está rodando na porta 3001.'
        : 'Error loading submission system. Please check if the server is running on port 3001.'
    );
    setIsLoading(false);
  }, [language]);

  // Sincronizar tema quando mudar
  useEffect(() => {
    if (isConnected) {
      sendMessageToIframe({
        type: 'JOURNALSCOPE_THEME_UPDATE',
        data: {
          theme: 'journalscope-theme',
          language
        }
      });
    }
  }, [language, isConnected, sendMessageToIframe]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'var(--js-bg-overlay)'}}>
      <div className="card rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="card-header flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold" style={{color: 'var(--js-text-primary)'}}>
                {language === 'pt' ? 'Sistema de Gestão de Submissões' : 'Submission Management System'}
              </h2>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="flex items-center gap-1 text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {language === 'pt' ? 'Carregando...' : 'Loading...'}
                  </span>
                </div>
              )}
              
              {isConnected && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {language === 'pt' ? 'Conectado' : 'Connected'}
                  </span>
                </div>
              )}
              
              {hasError && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {language === 'pt' ? 'Erro' : 'Error'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão para abrir em nova aba */}
            <button
              onClick={openInNewTab}
              className="p-2 rounded-md transition-colors hover:opacity-70"
              style={{color: 'var(--js-text-secondary)'}}
              title={language === 'pt' ? 'Abrir em nova aba' : 'Open in new tab'}
            >
              <ExternalLink className="h-4 w-4" />
            </button>

            {/* Botão para recarregar */}
            <button
              onClick={reloadIframe}
              className="p-2 rounded-md transition-colors hover:opacity-70"
              style={{color: 'var(--js-text-secondary)'}}
              title={language === 'pt' ? 'Recarregar' : 'Reload'}
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Botão para fechar */}
            <button
              onClick={onClose}
              className="p-2 rounded-md transition-colors hover:opacity-70"
              style={{color: 'var(--js-text-secondary)'}}
              title={language === 'pt' ? 'Fechar' : 'Close'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {hasError && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  {language === 'pt' ? 'Erro ao carregar o sistema' : 'Error loading system'}
                </p>
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{background: 'var(--js-bg-card)', opacity: 0.95}}>
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p style={{color: 'var(--js-text-secondary)'}}>
                {language === 'pt' ? 'Carregando sistema de submissões...' : 'Loading submission system...'}
              </p>
            </div>
          </div>
        )}

        {/* Iframe container */}
        <div className="flex-1 relative">
          <iframe
            ref={iframeRef}
            src={SUB_SYSTEM_URL}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={language === 'pt' ? 'Sistema de Gestão de Submissões' : 'Submission Management System'}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>

        {/* Footer com informações */}
        <div className="p-3 text-xs" style={{background: 'var(--js-bg-card-hover)', borderTop: '1px solid var(--js-border-primary)', color: 'var(--js-text-muted)'}}>
          <div className="flex items-center justify-between">
            <div>
              {language === 'pt' ? 'Sistema integrado via iframe' : 'Integrated system via iframe'}
              {lastActivity && (
                <span className="ml-2">
                  • {language === 'pt' ? 'Última atividade:' : 'Last activity:'} {lastActivity.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div>
              {messages.length > 0 && (
                <span>
                  {language === 'pt' ? 'Mensagens:' : 'Messages:'} {messages.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubSystemContainer;
