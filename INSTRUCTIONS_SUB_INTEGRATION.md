# 📘 Instruções: Integração Journalscope + SUB

## 🎯 Funcionalidades Implementadas

### ✅ 1. Modo Escuro Completo
- Todas as cores hardcoded foram substituídas por variáveis CSS
- Transição suave entre temas claro e escuro
- Cards, modais, filtros e inputs adaptados
- Footer com cores dinâmicas

### ✅ 2. Sistema SUB Integrado
- Interface via iframe para o sistema de gestão acadêmica
- Comunicação bidirecional via postMessage
- Seleção de periódicos na tabela principal
- Envio automático de periódicos selecionados para o SUB

### ✅ 3. Seleção de Periódicos
- Checkboxes em cada linha da tabela
- Seleção múltipla (individual ou todos)
- Contador de periódicos selecionados
- Botão "Enviar para SUB" visível quando há seleções

## 🚀 Como Testar

### Passo 1: Iniciar o Journalscope (App Principal)
```bash
# Na raiz do projeto
npm install
npm run dev
```
O app estará disponível em: `http://localhost:5173`

### Passo 2: Iniciar o Sistema SUB
```bash
# Entrar na pasta sub
cd sub

# Instalar dependências (primeira vez)
npm install

# Rodar o servidor de desenvolvimento
npm run dev
```
O sistema SUB estará disponível em: `http://localhost:3001`

### Passo 3: Testar o Modo Escuro

1. Abra o Journalscope em `http://localhost:5173`
2. Clique no botão de tema (Sol/Lua) no canto superior direito
3. Verifique se **todos** os elementos mudam de cor:
   - ✅ Cards de estatísticas (hero section)
   - ✅ Filtros rápidos
   - ✅ Campos de busca
   - ✅ Selects de filtros
   - ✅ Tabela de resultados
   - ✅ Modal do SUB
   - ✅ Footer

### Passo 4: Testar a Seleção e Envio para SUB

1. **Selecionar Periódicos:**
   - Na tabela de resultados, use os checkboxes para selecionar periódicos
   - Você pode selecionar individual ou clicar no checkbox do cabeçalho para selecionar todos da página
   - Observe o contador de selecionados aparecer

2. **Enviar para SUB:**
   - Clique no botão **"Enviar para SUB"** (roxo, com ícone de documento)
   - O modal do SUB abrirá automaticamente

3. **Verificar no SUB:**
   - Aguarde o SUB carregar (indicador "Conectado" aparecerá)
   - No dashboard do SUB, você verá uma seção **"Periódicos Selecionados do Journalscope"**
   - Todos os periódicos selecionados aparecerão em cards com suas informações
   - Cada card tem um botão "Criar Submissão"

### Passo 5: Verificar Comunicação

Abra o DevTools (F12) do navegador e observe o Console:

#### No Journalscope (Parent):
- Você verá mensagens de envio de dados
- Status da conexão com o SUB

#### No SUB (dentro do iframe):
- `📡 Journalscope integration initialized` - quando conectar
- `📚 Journals updated from Journalscope` - quando receber periódicos

## 🐛 Troubleshooting

### Problema: SUB não carrega
**Solução:** 
- Verifique se o servidor SUB está rodando na porta 3001
- Execute `cd sub && npm run dev`
- Verifique no console se há erros

### Problema: Periódicos não aparecem no SUB
**Solução:**
- Abra o DevTools (F12) em ambas as janelas
- Verifique mensagens no console
- Confirme que vê `selectedJournals` no console do SUB

### Problema: Modo escuro com partes brancas
**Solução:**
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Force refresh (Ctrl+F5)
- Verifique se o arquivo `themes.css` está sendo carregado

### Problema: CORS ou comunicação bloqueada
**Solução:**
- Verifique o `server.ts` do SUB
- Confirme que a porta 5173 está nos `allowedOrigins`
- Reinicie ambos os servidores

## 📋 Checklist de Teste Completo

### Modo Escuro
- [ ] Cards de stats mudam de cor
- [ ] Filtros e inputs ficam escuros
- [ ] Modal do SUB fica escuro
- [ ] Footer muda de cor
- [ ] Tabela de resultados fica escura
- [ ] Sem partes brancas visíveis no modo escuro

### Seleção de Periódicos
- [ ] Checkbox individual funciona
- [ ] Checkbox "selecionar todos" funciona
- [ ] Contador aparece quando há seleção
- [ ] Botão "Enviar para SUB" aparece
- [ ] Botão funciona e abre o SUB

### Integração SUB
- [ ] SUB abre em modal
- [ ] Indicador "Conectado" aparece
- [ ] Periódicos selecionados aparecem no SUB
- [ ] Cards de periódicos mostram informações corretas
- [ ] Possível criar submissão a partir dos periódicos
- [ ] Console mostra mensagens de comunicação

### Funcionalidades Gerais
- [ ] Busca por nome funciona
- [ ] Busca por ISSN funciona
- [ ] Filtros (ABDC, ABS, SJR) funcionam
- [ ] Paginação funciona
- [ ] Exportar CSV funciona
- [ ] Troca de idioma (PT/EN) funciona

## 🎨 Variáveis CSS do Tema

As variáveis estão definidas em `src/styles/themes.css`:

```css
/* Tema Light */
:root {
  --js-bg-primary: #f0f7ff;
  --js-bg-card: #ffffff;
  --js-text-primary: #1f2937;
  /* ... mais variáveis */
}

/* Tema Dark */
[data-theme="dark"] {
  --js-bg-primary: #0f172a;
  --js-bg-card: #1e293b;
  --js-text-primary: #f1f5f9;
  /* ... mais variáveis */
}
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Verifique se ambos os servidores estão rodando
3. Confirme as portas (5173 para Journalscope, 3001 para SUB)
4. Limpe cache e tente novamente

## 🎉 Pronto!

Agora você tem:
- ✅ Modo escuro completo e funcional
- ✅ Seleção de periódicos na tabela
- ✅ Integração bidirecional com o sistema SUB
- ✅ Comunicação via postMessage
- ✅ Interface intuitiva e moderna

