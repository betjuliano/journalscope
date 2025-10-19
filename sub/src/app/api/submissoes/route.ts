import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheService } from '@/lib/redis'

export async function GET() {
  try {
    // Tentar buscar do cache primeiro
    const cacheKey = 'submissoes:all';
    const cachedSubmissoes = await cacheService.get(cacheKey);
    
    if (cachedSubmissoes) {
      console.log('📦 Returning cached submissions');
      return NextResponse.json(cachedSubmissoes);
    }

    const submissoes = await db.submissao.findMany({
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

    // Cache os resultados por 10 minutos
    await cacheService.set(cacheKey, submissoes, 600);
    console.log('💾 Cached submissions for 10 minutes');

    return NextResponse.json(submissoes)
  } catch (error) {
    console.error('Erro ao buscar submissões:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar submissões' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      titulo, 
      resumo, 
      palavrasChave, 
      periodicoId, 
      criadorId, 
      autores,
      periodicosAlternativos
    } = body

    if (!titulo || !resumo || !palavrasChave || !periodicoId || !criadorId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    const submissao = await db.submissao.create({
      data: {
        titulo,
        resumo,
        palavrasChave,
        periodicoId,
        criadorId,
        status: 'EM_AVALIACAO',
        autores: {
          create: autores || []
        },
        periodicosAlternativos: {
          create: (periodicosAlternativos || []).map((p: any) => ({
            periodicoNome: p.nome,
            periodicoISSN: p.issn || null,
            periodicoArea: p.area || null,
            prioridade: p.prioridade,
            motivo: p.motivo || null
          }))
        }
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
            nome: true,
            area: true,
            qualis: true
          }
        },
        autores: true,
        periodicosAlternativos: {
          orderBy: {
            prioridade: 'asc'
          }
        }
      }
    })

    // Criar histórico inicial
    await db.historicoStatus.create({
      data: {
        status: 'EM_AVALIACAO',
        submissaoId: submissao.id
      }
    })

    // Invalidar cache de submissões
    await cacheService.del('submissoes:all');
    console.log('🗑️ Cache invalidated after new submission');

    return NextResponse.json(submissao, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar submissão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar submissão' },
      { status: 500 }
    )
  }
}