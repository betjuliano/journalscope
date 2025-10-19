import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const periodicos = await db.periodico.findMany({
      orderBy: {
        nome: 'asc'
      }
    })

    return NextResponse.json(periodicos)
  } catch (error) {
    console.error('Erro ao buscar periódicos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar periódicos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, issn, area, qualis, descricao } = body

    if (!nome || !area) {
      return NextResponse.json(
        { error: 'Nome e área são obrigatórios' },
        { status: 400 }
      )
    }

    const periodico = await db.periodico.create({
      data: {
        nome,
        issn,
        area,
        qualis,
        descricao
      }
    })

    return NextResponse.json(periodico, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar periódico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar periódico' },
      { status: 500 }
    )
  }
}