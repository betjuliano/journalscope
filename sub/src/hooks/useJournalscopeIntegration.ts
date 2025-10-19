import { useState, useEffect, useCallback } from 'react';

interface Journal {
  journal: string;
  issn?: string;
  abdc?: string;
  abs?: string;
  jcr?: {
    issn?: string;
    quartile?: string;
    impactFactor?: number;
  };
  sjr?: {
    quartile?: string;
    score?: number;
  };
  publisher?: string;
  [key: string]: any;
}

interface JournalscopeMessage {
  type: string;
  data: {
    language?: string;
    theme?: string;
    parentUrl?: string;
    selectedJournals?: Journal[];
    journals?: Journal[];
  };
}

export const useJournalscopeIntegration = () => {
  const [isIntegrated, setIsIntegrated] = useState(false);
  const [selectedJournals, setSelectedJournals] = useState<Journal[]>([]);
  const [language, setLanguage] = useState('pt');
  const [parentUrl, setParentUrl] = useState<string | null>(null);

  // Função para enviar mensagem para o parent
  const sendToParent = useCallback((type: string, data: any) => {
    if (window.parent && parentUrl) {
      window.parent.postMessage({ type, data }, parentUrl);
    }
  }, [parentUrl]);

  // Listener para mensagens do parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent<JournalscopeMessage>) => {
      // Aceitar mensagens de qualquer origem por enquanto (para desenvolvimento)
      // Em produção, validar event.origin
      
      const { type, data } = event.data;

      switch (type) {
        case 'JOURNALSCOPE_INIT':
          console.log('📡 Journalscope integration initialized', data);
          setIsIntegrated(true);
          if (data.language) setLanguage(data.language);
          if (data.parentUrl) setParentUrl(data.parentUrl);
          if (data.selectedJournals) setSelectedJournals(data.selectedJournals);
          
          // Enviar confirmação
          if (data.parentUrl) {
            window.parent.postMessage({
              type: 'SUB_SYSTEM_READY',
              data: { status: 'ready' }
            }, data.parentUrl);
          }
          break;

        case 'JOURNALSCOPE_JOURNALS_UPDATE':
          console.log('📚 Journals updated from Journalscope', data.journals);
          if (data.journals) {
            setSelectedJournals(data.journals);
          }
          break;

        case 'JOURNALSCOPE_THEME_UPDATE':
          console.log('🎨 Theme updated from Journalscope', data);
          if (data.language) setLanguage(data.language);
          break;

        default:
          console.log('⚠️ Unknown message type:', type);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notificar parent que está pronto
    window.parent.postMessage({
      type: 'SUB_SYSTEM_READY',
      data: { status: 'ready' }
    }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Função para requisitar fechamento do container
  const requestClose = useCallback(() => {
    sendToParent('SUB_SYSTEM_CLOSE_REQUEST', {});
  }, [sendToParent]);

  // Função para notificar atividade
  const notifyActivity = useCallback(() => {
    sendToParent('SUB_SYSTEM_ACTIVITY', { timestamp: new Date().toISOString() });
  }, [sendToParent]);

  return {
    isIntegrated,
    selectedJournals,
    language,
    parentUrl,
    sendToParent,
    requestClose,
    notifyActivity
  };
};

