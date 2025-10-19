import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const periodicoId = params.id

    // Buscar informações do periódico
    const periodico = await db.periodico.findUnique({
      where: { id: periodicoId }
    })

    if (!periodico) {
      return NextResponse.json(
        { error: 'Periódico não encontrado' },
        { status: 404 }
      )
    }

    // Buscar todas as submissões deste periódico
    const submissoes = await db.submissao.findMany({
      where: { periodicoId },
      include: {
        criador: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        autores: true,
        revisoes: {
          include: {
            revisor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        dataSubmissao: 'desc'
      }
    })

    // Agrupar submissões por status
    const estatisticas = {
      total: submissoes.length,
      emAvaliacao: submissoes.filter(s => s.status === 'EM_AVALIACAO').length,
      aprovadas: submissoes.filter(s => s.status === 'APROVADO').length,
      rejeitadas: submissoes.filter(s => s.status === 'REJEITADO').length,
      revisaoSolicitada: submissoes.filter(s => s.status === 'REVISAO_SOLICITADA').length,
      submetidasNovamente: submissoes.filter(s => s.status === 'SUBMETIDO_NOVAMENTE').length
    }

    return NextResponse.json({
      periodico,
      submissoes,
      estatisticas
    })
  } catch (error) {
    console.error('Erro ao buscar submissões do periódico:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar submissões' },
      { status: 500 }
    )
  }
}

