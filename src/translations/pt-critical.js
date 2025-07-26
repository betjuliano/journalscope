// Critical Portuguese translations for fast initial loading
export default {
  hero: {
    title: 'JournalScope',
    subtitle: 'Sistema Integrado de Consulta de Journals Acadêmicos',
    description: 'Plataforma unificada para consulta e análise de journals acadêmicos com dados consolidados de múltiplas bases de classificação internacional, incluindo ABDC, ABS, JCR, SJR, CiteScore e Wiley.'
  },
  
  loading: {
    title: 'Carregando JournalScope',
    titleFast: 'JournalScope ⚡',
    processingData: 'Carregando dados embarcados...',
    loadingTranslations: 'Carregando traduções...',
    fastLoadingEnabled: 'Carregamento rápido ativado!',
    loadingStatus: 'Carregando...',
    journalsLoaded: 'journals ✓',
    performanceTip: '💡 Dica: Após o primeiro carregamento, os dados ficam em cache para acesso mais rápido!',
    systemDescription: 'Sistema de Consulta de Journals Acadêmicos'
  },
  
  error: {
    title: 'Erro ao carregar dados',
    retry: 'Tentar novamente',
    translationError: 'Erro ao carregar traduções',
    unknownError: 'Erro desconhecido durante o carregamento'
  },
  
  table: {
    actions: 'AÇÕES',
    columns: {
      journal: 'Journal',
      abdc: 'ABDC',
      abs: 'ABS',
      sjrQuartile: 'SJR Quartile',
      jcrQuartile: 'JCR Quartile',
      qualis: 'Qualis',
      sjrHIndex: 'SJR H-Index'
    },
    noResults: 'Nenhum journal encontrado com os filtros aplicados.',
    showingResults: 'Mostrando {count} de {total} journals'
  },
  
  filters: {
    search: {
      label: 'Buscar Journal',
      placeholder: 'Digite o nome do journal...'
    }
  },
  
  stats: {
    totalJournals: 'Total Journals',
    withABDC: 'ABDC',
    withABS: 'ABS',
    withJCR: 'JCR',
    withSJR: 'SJR',
    withCiteScore: 'CiteScore',
    withWiley: 'Wiley',
    withPredatory: 'Predatórios'
  }
};