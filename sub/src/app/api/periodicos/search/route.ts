import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

interface JournalData {
  journal: string
  issn?: string
  category?: string
  qualis?: string
  abdc?: string
  abs?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Caminho para o arquivo de dados do projeto principal
    const dataPath = path.join(process.cwd(), '..', 'public', 'data', 'embeddedJournals.json')
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Base de dados principal não encontrada' },
        { status: 404 }
      )
    }

    // Ler e parsear os dados
    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    const journals: JournalData[] = JSON.parse(fileContent)

    // Buscar periódicos que correspondam à query
    const searchTerm = query.toLowerCase()
    const results = journals
      .filter(journal => {
        const name = journal.journal?.toLowerCase() || ''
        const issn = journal.issn?.toLowerCase() || ''
        const category = journal.category?.toLowerCase() || ''
        
        return name.includes(searchTerm) || 
               issn.includes(searchTerm) ||
               category.includes(searchTerm)
      })
      .slice(0, limit)
      .map(journal => ({
        nome: journal.journal || 'Nome não disponível',
        issn: journal.issn || null,
        area: journal.category || 'Não especificada',
        qualis: journal.qualis || null,
        abdc: journal.abdc || null,
        abs: journal.abs || null,
        relevance: calculateRelevance(journal.journal || '', searchTerm)
      }))
      .sort((a, b) => b.relevance - a.relevance)

    return NextResponse.json({
      query,
      total: results.length,
      results: results.map(({ relevance, ...rest }) => rest)
    })
  } catch (error) {
    console.error('Erro ao buscar periódicos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar periódicos na base principal' },
      { status: 500 }
    )
  }
}

// Função para calcular relevância da busca
function calculateRelevance(text: string, searchTerm: string): number {
  const textLower = text.toLowerCase()
  const termLower = searchTerm.toLowerCase()
  
  let score = 0
  
  // Correspondência exata do início
  if (textLower.startsWith(termLower)) {
    score += 100
  }
  
  // Correspondência exata em qualquer lugar
  if (textLower.includes(termLower)) {
    score += 50
  }
  
  // Correspondência de palavras individuais
  const words = termLower.split(' ')
  words.forEach(word => {
    if (textLower.includes(word)) {
      score += 10
    }
  })
  
  return score
}


