'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ReencaminhamentoInteligente from '@/components/ReencaminhamentoInteligente'

function ReencaminharContent() {
  const searchParams = useSearchParams()
  const [submissaoId, setSubmissaoId] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('submissaoId')
    if (id) {
      setSubmissaoId(id)
    }
  }, [searchParams])

  if (!submissaoId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">ID da Submissão Não Fornecido</h1>
          <p className="text-muted-foreground mb-4">
            Para acessar esta página, você precisa fornecer o ID da submissão.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <ReencaminhamentoInteligente
      submissaoId={submissaoId}
      onReencaminhado={() => window.location.href = '/'}
      onCancel={() => window.location.href = '/'}
    />
  )
}

export default function ReencaminharPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <ReencaminharContent />
    </Suspense>
  )
}