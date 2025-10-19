import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      submissaoId, 
      novoPeriodicoId, 
      manterDados = true,
      ajustes = {}
    } = body

    if (!submissaoId || !novoPeriodicoId) {
      return NextResponse.json(
        { error: 'ID da submissão e novo periódico são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar submissão original
    const submissaoOriginal = await db.submissao.findUnique({
      where: { id: submissaoId },
      include: {
        autores: true,
        criador: true,
        periodico: true
      }
    })

    if (!submissaoOriginal) {
      return NextResponse.json(
        { error: 'Submissão não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o novo periódico existe
    const novoPeriodico = await db.periodico.findUnique({
      where: { id: novoPeriodicoId }
    })

    if (!novoPeriodico) {
      return NextResponse.json(
        { error: 'Novo periódico não encontrado' },
        { status: 404 }
      )
    }

    // Criar nova submissão
    const novaSubmissao = await db.submissao.create({
      data: {
        titulo: ajustes.titulo || submissaoOriginal.titulo,
        resumo: ajustes.resumo || submissaoOriginal.resumo,
        palavrasChave: ajustes.palavrasChave || submissaoOriginal.palavrasChave,
        periodicoId: novoPeriodicoId,
        criadorId: submissaoOriginal.criadorId,
        status: 'EM_AVALIACAO',
        autores: {
          create: manterDados 
            ? submissaoOriginal.autores.map(a => ({
                nome: a.nome,
                email: a.email,
                instituicao: a.instituicao
              }))
            : (ajustes.autores || [])
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
        autores: true
      }
    })

    // Criar histórico inicial para nova submissão
    await db.historicoStatus.create({
      data: {
        status: 'EM_AVALIACAO',
        submissaoId: novaSubmissao.id
      }
    })

    // Atualizar status da submissão original para SUBMETIDO_NOVAMENTE
    await db.submissao.update({
      where: { id: submissaoId },
      data: { status: 'SUBMETIDO_NOVAMENTE' }
    })

    // Criar histórico para submissão original
    await db.historicoStatus.create({
      data: {
        status: 'SUBMETIDO_NOVAMENTE',
        submissaoId
      }
    })

    // Gerar relatório do reencaminhamento
    const relatorio = await gerarRelatorioReencaminhamento(
      submissaoOriginal,
      novaSubmissao,
      novoPeriodico
    )

    return NextResponse.json({
      novaSubmissao,
      relatorio,
      mensagem: 'Submissão reencaminhada com sucesso!'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao reencaminhar submissão:', error)
    return NextResponse.json(
      { error: 'Erro ao reencaminhar submissão' },
      { status: 500 }
    )
  }
}

async function gerarRelatorioReencaminhamento(submissaoOriginal: any, novaSubmissao: any, novoPeriodico: any) {
  try {
    // Usar ZAI para gerar um relatório detalhado
    const ZAI = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente acadêmico especializado em gerar relatórios de reencaminhamento de submissões. Crie um relatório profissional e detalhado sobre o processo de reencaminhamento.'
        },
        {
          role: 'user',
          content: `Gere um relatório de reencaminhamento com as seguintes informações:

Submissão Original:
- Título: ${submissaoOriginal.titulo}
- Periódico Original: ${submissaoOriginal.periodico.nome}
- Status Original: ${submissaoOriginal.status}
- Data da Submissão Original: ${submissaoOriginal.dataSubmissao}

Nova Submissão:
- Título: ${novaSubmissao.titulo}
- Novo Periódico: ${novaSubmissao.periodico.nome}
- Área: ${novaSubmissao.periodico.area}
- Classificação Qualis: ${novaSubmissao.periodico.qualis || 'Não informada'}
- Data do Reencaminhamento: ${new Date().toLocaleDateString('pt-BR')}

Crie um relatório estruturado com:
1. Sumário executivo
2. Justificativa do reencaminhamento
3. Análise do novo periódico
4. Recomendações
5. Próximos passos

Mantenha um tom profissional e construtivo.`
        }
      ]
    })

    return completion.choices[0]?.message?.content || 'Relatório não gerado automaticamente.'
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return `Relatório de Reencaminhamento

Submissão: ${submissaoOriginal.titulo}
Periódico Original: ${submissaoOriginal.periodico.nome}
Novo Periódico: ${novaSubmissao.periodico.nome}
Data: ${new Date().toLocaleDateString('pt-BR')}

A submissão foi reencaminhada com sucesso para o novo periódico. 
Recomendamos acompanhar o status através do sistema.`
  }
}