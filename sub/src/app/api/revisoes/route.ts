import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const submissaoId = searchParams.get('submissaoId')

    const where = submissaoId ? { submissaoId } : {}

    const revisoes = await db.revisao.findMany({
      where,
      include: {
        revisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        submissao: {
          include: {
            criador: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            periodico: {
              select: {
                id: true,
                nome: true,
                area: true
              }
            }
          }
        }
      },
      orderBy: {
        dataRecebimento: 'desc'
      }
    })

    return NextResponse.json(revisoes)
  } catch (error) {
    console.error('Erro ao buscar revisões:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar revisões' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      dataRecebimento, 
      numeroRevisores, 
      comentarios, 
      revisorId, 
      submissaoId,
      gerarPlanoAcao = false
    } = body

    if (!dataRecebimento || !numeroRevisores || !submissaoId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Criar revisão
    const revisao = await db.revisao.create({
      data: {
        dataRecebimento: new Date(dataRecebimento),
        numeroRevisores,
        comentarios,
        revisorId,
        submissaoId
      },
      include: {
        revisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        submissao: {
          include: {
            criador: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            periodico: {
              select: {
                id: true,
                nome: true,
                area: true
              }
            }
          }
        }
      }
    })

    // Atualizar status da submissão para REVISAO_SOLICITADA
    await db.submissao.update({
      where: { id: submissaoId },
      data: { status: 'REVISAO_SOLICITADA' }
    })

    // Criar histórico de status
    await db.historicoStatus.create({
      data: {
        status: 'REVISAO_SOLICITADA',
        submissaoId
      }
    })

    // Gerar plano de ação automaticamente se solicitado
    if (gerarPlanoAcao && comentarios) {
      const planoAcao = await gerarPlanoAcaoAutomatico(comentarios)
      
      await db.submissao.update({
        where: { id: submissaoId },
        data: { planoAcao }
      })
    }

    return NextResponse.json(revisao, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar revisão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar revisão' },
      { status: 500 }
    )
  }
}

async function gerarPlanoAcaoAutomatico(comentarios: string): Promise<string> {
  try {
    // Usar ZAI para gerar plano de ação baseado nos comentários
    const ZAI = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente acadêmico especializado em analisar pareceres de revisores e criar planos de ação estruturados. Baseado nos comentários dos revisores, crie um plano de ação claro e organizado com tarefas específicas para o autor.'
        },
        {
          role: 'user',
          content: `Comentários dos revisores: "${comentarios}".\n\nCrie um plano de ação estruturado com:\n1. Resumo dos pontos principais\n2. Ações necessárias organizadas por categoria\n3. Prioridades das modificações\n4. Sugestões de melhoria\n\nResponda de forma clara e objetiva.`
        }
      ]
    })

    return completion.choices[0]?.message?.content || 'Plano de ação não gerado automaticamente.'
  } catch (error) {
    console.error('Erro ao gerar plano de ação:', error)
    return 'Plano de ação não gerado automaticamente devido a um erro.'
  }
}