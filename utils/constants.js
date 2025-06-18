/**
 * Constantes da aplicação JournalScope
 * Centraliza todos os valores fixos e configurações
 */

// Informações da aplicação
export const APP_INFO = {
  name: 'JournalScope',
  version: '1.0.0',
  description: 'Sistema de Consulta de Journals Acadêmicos',
  author: 'JournalScope Team',
  website: 'https://journalscope.app'
};

// Configurações dos arquivos Excel
export const FILE_CONFIG = {
  // Nomes dos arquivos
  files: {
    ABDC: 'ABDC2022.xlsx',
    ABS: 'ABS2024.xlsx',
    WILEY: 'Wiley.xlsx'
  },
  
  // Caminhos possíveis para os arquivos
  paths: [
    '/data/',
    './data/',
    'data/',
    'public/data/',
    '/public/data/'
  ],
  
  // Configurações das planilhas
  sheets: {
    ABDC: '2022 JQL',
    ABS: 'Sheet1',
    WILEY: 'Hybrid OA Journals Updated'
  },
  
  // Colunas dos dados
  columns: {
    ABDC: {
      JOURNAL_TITLE: 0,
      PUBLISHER: 1,
      ISSN: 2,
      ISSN_ONLINE: 3,
      YEAR_INCEPTION: 4,
      FOR: 5,
      RATING: 6
    },
    ABS: {
      FIELD: 0,
      JOURNAL_TITLE: 1,
      AJG_2024: 2,
      AJG_2021: 3,
      AJG_2018: 4,
      AJG_2015: 5,
      ABS_2010: 6
    },
    WILEY: {
      JOURNAL_TITLE: 0,
      ISSN_ONLINE: 1,
      SUBJECT_AREA: 2,
      LICENSE_TYPES: 3,
      APC_USD: 4,
      APC_GBP: 5,
      APC_EUR: 6
    }
  }
};

// Classificações disponíveis
export const CLASSIFICATIONS = {
  ABDC: {
    'A*': {
      label: 'A*',
      description: 'Revistas de elite acadêmica',
      color: '#059669', // green-600
      priority: 4
    },
    'A': {
      label: 'A',
      description: 'Revistas de excelente qualidade',
      color: '#2563eb', // blue-600
      priority: 3
    },
    'B': {
      label: 'B',
      description: 'Revistas de boa qualidade',
      color: '#d97706', // amber-600
      priority: 2
    },
    'C': {
      label: 'C',
      description: 'Revistas de qualidade aceitável',
      color: '#6b7280', // gray-500
      priority: 1
    }
  },
  
  ABS: {
    '4*': {
      label: '4*',
      description: 'Revistas de classe mundial',
      color: '#059669', // green-600
      priority: 5
    },
    '4': {
      label: '4',
      description: 'Revistas de alta qualidade',
      color: '#2563eb', // blue-600
      priority: 4
    },
    '3': {
      label: '3',
      description: 'Revistas de boa qualidade',
      color: '#d97706', // amber-600
      priority: 3
    },
    '2': {
      label: '2',
      description: 'Revistas reconhecidas',
      color: '#ea580c', // orange-600
      priority: 2
    },
    '1': {
      label: '1',
      description: 'Revistas modestas',
      color: '#6b7280', // gray-500
      priority: 1
    }
  }
};

// Presets de filtros
export const FILTER_PRESETS = {
  'clear': {
    name: 'Limpar Filtros',
    description: 'Remove todos os filtros aplicados',
    icon: 'RotateCcw',
    filters: {
      abdc: '',
      abs: '',
      wiley: false,
      search: ''
    }
  },
  
  'top-tier': {
    name: 'Top Tier',
    description: 'Journals de elite (A* + 4*)',
    icon: 'Crown',
    filters: {
      abdc: 'A*',
      abs: '4*',
      wiley: false
    }
  },
  
  'high-quality': {
    name: 'Alta Qualidade',
    description: 'Journals de alta qualidade (A + 4)',
    icon: 'Star',
    filters: {
      abdc: 'A',
      abs: '4',
      wiley: false
    }
  },
  
  'wiley-only': {
    name: 'Apenas Wiley',
    description: 'Somente journals da Wiley',
    icon: 'BookOpen',
    filters: {
      abdc: '',
      abs: '',
      wiley: true
    }
  },
  
  'abdc-a-star': {
    name: 'ABDC A*',
    description: 'Journals classificados como A* pela ABDC',
    icon: 'Award',
    filters: {
      abdc: 'A*',
      abs: '',
      wiley: false
    }
  },
  
  'abs-four-star': {
    name: 'ABS 4*',
    description: 'Journals classificados como 4* pela ABS',
    icon: 'Trophy',
    filters: {
      abdc: '',
      abs: '4*',
      wiley: false
    }
  },
  
  'good-quality': {
    name: 'Boa Qualidade',
    description: 'Journals de boa qualidade (B + 3)',
    icon: 'ThumbsUp',
    filters: {
      abdc: 'B',
      abs: '3',
      wiley: false
    }
  }
};

// Configurações de exportação
export const EXPORT_CONFIG = {
  csv: {
    encoding: 'utf-8',
    delimiter: ',',
    quote: '"',
    escape: '"',
    headers: [
      'Journal',
      'Classificação ABDC',
      'Classificação ABS',
      'Área Wiley',
      'APC Wiley (USD)',
      'APC Wiley (GBP)',
      'APC Wiley (EUR)'
    ]
  },
  
  json: {
    pretty: true,
    indent: 2
  },
  
  excel: {
    sheetName: 'Journals',
    creator: 'JournalScope',
    created: new Date()
  }
};

// Configurações da interface
export const UI_CONFIG = {
  // Paginação
  pagination: {
    defaultPageSize: 100,
    pageSizeOptions: [25, 50, 100, 200, 500],
    maxDisplayedPages: 7
  },
  
  // Cores do tema
  colors: {
    primary: '#2563eb',      // blue-600
    secondary: '#64748b',    // slate-500
    success: '#059669',      // emerald-600
    warning: '#d97706',      // amber-600
    error: '#dc2626',        // red-600
    info: '#0891b2'          // cyan-600
  },
  
  // Animações
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Breakpoints responsivos
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Mensagens do sistema
export const MESSAGES = {
  loading: {
    initial: 'Iniciando carregamento...',
    abdc: 'Carregando dados ABDC...',
    abs: 'Carregando dados ABS...',
    wiley: 'Carregando dados Wiley...',
    unifying: 'Unificando dados...',
    cache: 'Usando dados em cache...',
    complete: 'Carregamento concluído!'
  },
  
  errors: {
    fileNotFound: 'Arquivo não encontrado',
    sheetNotFound: 'Planilha não encontrada',
    invalidData: 'Dados inválidos encontrados',
    processingError: 'Erro durante o processamento',
    exportError: 'Erro durante a exportação',
    networkError: 'Erro de conexão'
  },
  
  success: {
    dataLoaded: 'Dados carregados com sucesso',
    exported: 'Dados exportados com sucesso',
    filtersCleared: 'Filtros limpos',
    presetApplied: 'Preset aplicado com sucesso'
  },
  
  empty: {
    noResults: 'Nenhum journal encontrado com os critérios especificados',
    noData: 'Nenhum dado disponível',
    noFilters: 'Nenhum filtro aplicado'
  }
};

// Configurações de cache
export const CACHE_CONFIG = {
  keys: {
    processedData: 'journalscope_processed_data',
    userPreferences: 'journalscope_user_prefs',
    recentSearches: 'journalscope_recent_searches',
    favorites: 'journalscope_favorites'
  },
  
  expiration: {
    data: 24 * 60 * 60 * 1000,        // 24 horas
    preferences: 30 * 24 * 60 * 60 * 1000, // 30 dias
    searches: 7 * 24 * 60 * 60 * 1000      // 7 dias
  }
};

// Configurações de validação
export const VALIDATION = {
  journal: {
    minLength: 2,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-&().,;:]+$/
  },
  
  search: {
    minLength: 1,
    maxLength: 100,
    debounceDelay: 300
  },
  
  export: {
    maxRecords: 10000,
    fileNamePattern: /^[a-zA-Z0-9_\-]+$/
  }
};

// URLs e endpoints (para futuras integrações)
export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL || 'https://api.journalscope.app',
  endpoints: {
    journals: '/api/journals',
    search: '/api/search',
    stats: '/api/stats',
    export: '/api/export'
  },
  timeout: 30000, // 30 segundos
  retryAttempts: 3
};

// Configurações de analytics (para futuro)
export const ANALYTICS_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',
  events: {
    search: 'journal_search',
    filter: 'filter_applied',
    export: 'data_exported',
    preset: 'preset_applied'
  }
};

// Configurações de acessibilidade
export const A11Y_CONFIG = {
  announcements: {
    dataLoaded: 'Dados carregados. Use as teclas de seta para navegar pelos resultados.',
    filterApplied: 'Filtro aplicado. Resultados atualizados.',
    noResults: 'Nenhum resultado encontrado para os critérios especificados.'
  },
  
  shortcuts: {
    search: 'Ctrl+K',
    clearFilters: 'Ctrl+R',
    export: 'Ctrl+E',
    stats: 'Ctrl+S'
  }
};

// Metadados para SEO e PWA
export const META_CONFIG = {
  title: 'JournalScope - Sistema de Consulta de Journals Acadêmicos',
  description: 'Ferramenta completa para consulta e análise de classificações ABDC, ABS e Wiley de journals acadêmicos. Base de dados unificada com mais de 4.000 periódicos.',
  keywords: [
    'journals acadêmicos',
    'ABDC',
    'ABS',
    'Wiley',
    'classificação de periódicos',
    'pesquisa acadêmica',
    'publicação científica'
  ],
  
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'JournalScope'
  },
  
  twitter: {
    card: 'summary_large_image',
    creator: '@journalscope'
  }
};

// Configuração de desenvolvimento
export const DEV_CONFIG = {
  enableDebug: process.env.NODE_ENV === 'development',
  enableMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true',
  logLevel: process.env.REACT_APP_LOG_LEVEL || 'info',
  showPerformanceMetrics: process.env.REACT_APP_SHOW_PERF === 'true'
};

// Freeze objects para evitar modificações acidentais
Object.freeze(APP_INFO);
Object.freeze(FILE_CONFIG);
Object.freeze(CLASSIFICATIONS);
Object.freeze(FILTER_PRESETS);
Object.freeze(EXPORT_CONFIG);
Object.freeze(UI_CONFIG);
Object.freeze(MESSAGES);
Object.freeze(CACHE_CONFIG);
Object.freeze(VALIDATION);
Object.freeze(API_CONFIG);
Object.freeze(ANALYTICS_CONFIG);
Object.freeze(A11Y_CONFIG);
Object.freeze(META_CONFIG);
Object.freeze(DEV_CONFIG);
