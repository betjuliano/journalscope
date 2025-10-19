import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissaoId } = body

    if (!submissaoId) {
      return NextResponse.json(
        { error: 'ID da submissão é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar informações da submissão
    const submissao = await db.submissao.findUnique({
      where: { id: submissaoId },
      include: {
        periodico: true,
        autores: true,
        revisoes: true
      }
    })

    if (!submissao) {
      return NextResponse.json(
        { error: 'Submissão não encontrada' },
        { status: 404 }
      )
    }

    // Buscar todos os periódicos exceto o atual
    const todosPeriodicos = await db.periodico.findMany({
      where: {
        id: { not: submissao.periodicoId }
      },
      include: {
        _count: {
          select: {
            submissoes: true
          }
        }
      }
    })

    // Gerar sugestões usando IA
    const sugestoes = await gerarSugestoesPeriodicos(submissao, todosPeriodicos)

    return NextResponse.json({
      submissao,
      sugestoes
    })
  } catch (error) {
    console.error('Erro ao gerar sugestões:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões' },
      { status: 500 }
    )
  }
}

async function gerarSugestoesPeriodicos(submissao: any, periodicos: any[]) {
  try {
    // Usar ZAI para analisar e sugerir periódicos
    const ZAI = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()

    // Preparar informações da submissão
    const submissaoInfo = {
      titulo: submissao.titulo,
      resumo: submissao.resumo,
      palavrasChave: submissao.palavrasChave,
      areaAtual: submissao.periodico.area,
      status: submissao.status,
      motivoRejeicao: submissao.revisoes[0]?.comentarios || 'Não especificado'
    }

    // Preparar lista de periódicos disponíveis
    const periodicosDisponiveis = periodicos.map(p => ({
      id: p.id,
      nome: p.nome,
      area: p.area,
      qualis: p.qualis,
      descricao: p.descricao,
      popularidade: p._count.submissoes
    }))

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Você é um especialista acadêmico em publicações científicas. Sua tarefa é analisar uma submissão rejeitada e sugerir os 5 melhores periódicos alternativos.

Considere os seguintes critérios:
1. Relevância da área do conhecimento
2. Alinhamento com o tema do artigo
3. Qualificação Qualis adequada
4. Similaridade com o escopo do periódico
5. Popularidade/credibilidade do periódico

Responda exclusivamente com um JSON no formato:
{
  "sugestoes": [
    {
      "periodicoId": "id",
      "motivo": "explicação detalhada",
      "pontuacao": 85,
      "alinhamento": "alto/medio/baixo"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Dados da submissão rejeitada:
Título: ${submissaoInfo.titulo}
Resumo: ${submissaoInfo.resumo}
Palavras-chave: ${submissaoInfo.palavrasChave}
Área atual: ${submissaoInfo.areaAtual}
Motivo da rejeição: ${submissaoInfo.motivoRejeicao}

Periódicos disponíveis:
${JSON.stringify(periodicosDisponiveis, null, 2)}`
        }
      ]
    })

    const responseText = completion.choices[0]?.message?.content || ''
    
    // Tentar fazer parse do JSON
    let sugestoesIA = []
    try {
      const parsed = JSON.parse(responseText)
      sugestoesIA = parsed.sugestoes || []
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta da IA:', parseError)
      // Fallback para sugestões baseadas em similaridade de área
      sugestoesIA = gerarSugestoesFallback(submissao, periodicos)
    }

    // Combinar sugestões da IA com dados dos periódicos
    const sugestoesCompletas = sugestoesIA.map((sugestao: any) => {
      const periodico = periodicos.find(p => p.id === sugestao.periodicoId)
      return {
        ...sugestao,
        periodico: periodico ? {
          id: periodico.id,
          nome: periodico.nome,
          area: periodico.area,
          qualis: periodico.qualis,
          descricao: periodico.descricao,
          popularidade: periodico._count.submissoes
        } : null
      }
    }).filter(s => s.periodico !== null)

    // Se não houver sugestões da IA, gerar fallback
    if (sugestoesCompletas.length === 0) {
      return gerarSugestoesFallback(submissao, periodicos)
    }

    return sugestoesCompletas
  } catch (error) {
    console.error('Erro ao gerar sugestões com IA:', error)
    return gerarSugestoesFallback(submissao, periodicos)
  }
}

function gerarSugestoesFallback(submissao: any, periodicos: any[]) {
  // Sugestões baseadas em similaridade de área e qualis
  const areaAtual = submissao.periodico.area.toLowerCase()
  const qualisAtual = submissao.periodico.qualis

  // Filtrar periódicos da mesma área ou áreas relacionadas
  const periodicosRelacionados = periodicos
    .filter(p => {
      const areaPeriodico = p.area.toLowerCase()
      return areaPeriodico.includes(areaAtual) || 
             areaAtual.includes(areaPeriodico) ||
             p.area.toLowerCase().includes('ciências') // Área genérica
    })
    .sort((a, b) => {
      // Priorizar mesmo qualis ou qualis superior
      const qualisOrder = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'B5', 'C']
      const aIndex = qualisOrder.indexOf(a.qualis || 'C')
      const bIndex = qualisOrder.indexOf(b.qualis || 'C')
      return aIndex - bIndex
    })
    .slice(0, 5)

  return periodicosRelacionados.map((periodico, index) => ({
    periodicoId: periodico.id,
    motivo: `Periódico da mesma área de conhecimento (${periodico.area}) com classificação Qualis ${periodico.qualis || 'não informada'}. Boa alternativa para submissão.`,
    pontuacao: Math.max(70 - index * 10, 30),
    alinhamento: index === 0 ? 'alto' : index <= 2 ? 'medio' : 'baixo',
    periodico: {
      id: periodico.id,
      nome: periodico.nome,
      area: periodico.area,
      qualis: periodico.qualis,
      descricao: periodico.descricao,
      popularidade: periodico._count.submissoes
    }
  }))
}