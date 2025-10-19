import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Buscar estatísticas gerais
    const [
      totalSubmissoes,
      emAvaliacao,
      aprovadas,
      rejeitadas,
      revisaoSolicitada
    ] = await Promise.all([
      db.submissao.count(),
      db.submissao.count({ where: { status: 'EM_AVALIACAO' } }),
      db.submissao.count({ where: { status: 'APROVADO' } }),
      db.submissao.count({ where: { status: 'REJEITADO' } }),
      db.submissao.count({ where: { status: 'REVISAO_SOLICITADA' } })
    ])

    // Buscar submissões recentes
    const submissoesRecentes = await db.submissao.findMany({
      take: 10,
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
            area: true,
            qualis: true
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
        },
        historico: {
          orderBy: {
            data: 'desc'
          }
        }
      },
      orderBy: {
        dataSubmissao: 'desc'
      }
    })

    // Buscar periódicos mais utilizados
    const periodicosMaisUtilizados = await db.periodico.findMany({
      include: {
        _count: {
          select: {
            submissoes: true
          }
        }
      },
      orderBy: {
        submissoes: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // Buscar alertas de prazo (simulação - em produção usaria datas reais)
    const alertasPrazo = await db.submissao.findMany({
      where: {
        status: 'EM_AVALIACAO'
      },
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
            nome: true
          }
        }
      },
      orderBy: {
        dataSubmissao: 'asc'
      },
      take: 5
    })

    const stats = {
      totalSubmissoes,
      emAvaliacao,
      aprovadas,
      rejeitadas,
      revisaoSolicitada
    }

    return NextResponse.json({
      stats,
      submissoesRecentes,
      periodicosMaisUtilizados,
      alertasPrazo
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}