# JournalScope

Sistema de Consulta de Journals Acadêmicos - Ferramenta completa para consulta e análise de classificações ABDC, ABS e Wiley de journals acadêmicos.

## 🚀 Funcionalidades

- **Consulta Unificada**: Base de dados com mais de 4.000 journals acadêmicos
- **Classificações Múltiplas**: ABDC, ABS e dados Wiley em uma única interface
- **Filtros Avançados**: Busca por nome, classificação e área temática
- **Exportação**: Dados em CSV e Excel com estatísticas detalhadas
- **Interface Responsiva**: Otimizada para desktop e mobile
- **Performance**: Carregamento rápido com cache inteligente

## 📊 Fontes de Dados

- **ABDC 2022**: Australian Business Deans Council Journal Quality List
- **ABS 2024**: Association of Business Schools Academic Journal Guide
- **Wiley**: Dados de APC e áreas temáticas dos journals Wiley

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Processing**: SheetJS para processamento de Excel
- **Deployment**: Vercel

## 🚀 Deploy no Vercel

### Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Repositório Git (GitHub, GitLab, ou Bitbucket)

### Passos para Deploy

1. **Push do código para o repositório**:
   ```bash
   git add .
   git commit -m "Projeto pronto para deploy"
   git push origin main
   ```

2. **Conectar ao Vercel**:
   - Acesse [vercel.com](https://vercel.com)
   - Faça login e clique em "New Project"
   - Importe seu repositório
   - Configure as seguintes opções:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Deploy automático**:
   - O Vercel detectará automaticamente as configurações
   - O deploy será iniciado automaticamente
   - Aguarde a conclusão (geralmente 2-3 minutos)

### Configurações do Vercel

O projeto já inclui o arquivo `vercel.json` com as configurações otimizadas:

```json
{
  "version": 2,
  "name": "journalscope",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/data/(.*)",
      "dest": "/data/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 💻 Desenvolvimento Local

### Instalação
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Estrutura do Projeto
```
journalscope/
├── public/
│   ├── data/           # Arquivos Excel (ABDC, ABS, Wiley)
│   ├── favicon.ico
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── components/     # Componentes React
│   ├── App.jsx        # Componente principal
│   └── main.jsx       # Entry point
├── hooks/             # Custom hooks
├── utils/             # Utilitários e constantes
├── vercel.json        # Configuração Vercel
└── vite.config.js     # Configuração Vite
```

## 📁 Arquivos de Dados

Os arquivos Excel devem estar na pasta `public/data/`:
- `ABDC2022.xlsx` - Lista ABDC 2022
- `ABS2024.xlsx` - Guia ABS 2024  
- `Wiley.xlsx` - Dados Wiley

## 🔧 Configurações

### Variáveis de Ambiente (opcional)
```env
VITE_APP_TITLE=JournalScope
VITE_APP_VERSION=1.0.0
```

### Personalização
- **Cores**: Edite `utils/constants.js` para alterar o tema
- **Dados**: Substitua os arquivos Excel em `public/data/`
- **Funcionalidades**: Modifique os componentes em `src/components/`

## 📱 PWA (Progressive Web App)

O projeto inclui configurações PWA:
- **Manifest**: `public/manifest.json`
- **Service Worker**: `public/sw.js`
- **Offline**: Cache de recursos estáticos

## 🐛 Solução de Problemas

### Build Errors
- Verifique se todos os arquivos Excel estão em `public/data/`
- Confirme que as dependências estão instaladas: `npm install`
- Limpe o cache: `rm -rf node_modules package-lock.json && npm install`

### Deploy Issues
- Verifique se o `vercel.json` está na raiz do projeto
- Confirme que o build local funciona: `npm run build`
- Verifique os logs no dashboard do Vercel

### Performance
- Os arquivos Excel são grandes (~10MB total)
- O primeiro carregamento pode demorar alguns segundos
- Dados são cacheados no navegador após o primeiro acesso

## 📄 Licença

Este projeto é de código aberto. Sinta-se livre para usar, modificar e distribuir.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no repositório
- Verifique a documentação
- Consulte os logs de erro no console do navegador

---

**JournalScope** - Facilitando a pesquisa acadêmica com dados unificados e interface intuitiva.
