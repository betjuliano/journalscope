'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  MessageSquare,
  Eye,
  Edit
} from 'lucide-react'
import RevisaoForm from '@/components/forms/RevisaoForm'

interface Revisao {
  id: string
  dataRecebimento: string
  numeroRevisores: number
  comentarios: string
  revisor?: {
    id: string
    name: string
    email: string
  }
  submissao: {
    id: string
    titulo: string
    status: string
    criador: {
      id: string
      name: string
      email: string
    }
    periodico: {
      id: string
      nome: string
      area: string
    }
    planoAcao?: string
  }
}

interface RevisoesManagerProps {
  onNovaRevisao?: () => void
}

export default function RevisoesManager({ onNovaRevisao }: RevisoesManagerProps) {
  const [revisoes, setRevisoes] = useState<Revisao[]>([])
  const [loading, setLoading] = useState(true)
  const [activeForm, setActiveForm] = useState(false)
  const [selectedRevisao, setSelectedRevisao] = useState<Revisao | null>(null)

  useEffect(() => {
    loadRevisoes()
  }, [])

  const loadRevisoes = async () => {
    try {
      const response = await fetch('/api/revisoes')
      if (response.ok) {
        const data = await response.json()
        setRevisoes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar revisões:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = () => {
    setActiveForm(false)
    setSelectedRevisao(null)
    loadRevisoes()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_AVALIACAO':
        return 'bg-yellow-100 text-yellow-800'
      case 'APROVADO':
        return 'bg-green-100 text-green-800'
      case 'REJEITADO':
        return 'bg-red-100 text-red-800'
      case 'REVISAO_SOLICITADA':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EM_AVALIACAO':
        return <Clock className="w-4 h-4" />
      case 'APROVADO':
        return <CheckCircle className="w-4 h-4" />
      case 'REJEITADO':
        return <XCircle className="w-4 h-4" />
      case 'REVISAO_SOLICITADA':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EM_AVALIACAO':
        return 'Em Avaliação'
      case 'APROVADO':
        return 'Aprovado'
      case 'REJEITADO':
        return 'Rejeitado'
      case 'REVISAO_SOLICITADA':
        return 'Revisão Solicitada'
      default:
        return status
    }
  }

  if (activeForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setActiveForm(false)}
            className="mb-6"
          >
            ← Voltar às Revisões
          </Button>
          
          <RevisaoForm 
            onSubmit={handleFormSubmit} 
            onCancel={() => setActiveForm(false)}
            initialData={selectedRevisao}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando revisões...</p>
        </div>
      </div>
    )
  }

  const revisoesPendentes = revisoes.filter(r => r.submissao.status === 'REVISAO_SOLICITADA')
  const revisoesConcluidas = revisoes.filter(r => 
    r.submissao.status === 'APROVADO' || r.submissao.status === 'REJEITADO'
  )

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Revisões</h1>
            <p className="text-muted-foreground">
              Acompanhe e gerencie o processo de revisão das submissões
            </p>
          </div>
          <Button onClick={() => setActiveForm(true)} className="gap-2">
            <FileText className="w-4 h-4" />
            Nova Revisão
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Revisões</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revisoes.length}</div>
              <p className="text-xs text-muted-foreground">revisões registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{revisoesPendentes.length}</div>
              <p className="text-xs text-muted-foreground">aguardando ações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{revisoesConcluidas.length}</div>
              <p className="text-xs text-muted-foreground">processo finalizado</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pendentes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pendentes">
              Revisões Pendentes ({revisoesPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Revisões Concluídas ({revisoesConcluidas.length})
            </TabsTrigger>
            <TabsTrigger value="todas">
              Todas as Revisões ({revisoes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revisões Pendentes</CardTitle>
                <CardDescription>
                  Submissões que aguardam ações dos autores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revisoesPendentes.length > 0 ? (
                    revisoesPendentes.map((revisao) => (
                      <RevisaoCard 
                        key={revisao.id} 
                        revisao={revisao} 
                        onEdit={() => {
                          setSelectedRevisao(revisao)
                          setActiveForm(true)
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma revisão pendente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="concluidas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revisões Concluídas</CardTitle>
                <CardDescription>
                  Submissões com processo de revisão finalizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revisoesConcluidas.length > 0 ? (
                    revisoesConcluidas.map((revisao) => (
                      <RevisaoCard 
                        key={revisao.id} 
                        revisao={revisao} 
                        onEdit={() => {
                          setSelectedRevisao(revisao)
                          setActiveForm(true)
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma revisão concluída</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Revisões</CardTitle>
                <CardDescription>
                  Histórico completo de revisões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revisoes.length > 0 ? (
                    revisoes.map((revisao) => (
                      <RevisaoCard 
                        key={revisao.id} 
                        revisao={revisao} 
                        onEdit={() => {
                          setSelectedRevisao(revisao)
                          setActiveForm(true)
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma revisão encontrada</p>
                      <Button className="mt-4" onClick={() => setActiveForm(true)}>
                        Registrar Primeira Revisão
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface RevisaoCardProps {
  revisao: Revisao
  onEdit: () => void
}

function RevisaoCard({ revisao, onEdit }: RevisaoCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_AVALIACAO':
        return 'bg-yellow-100 text-yellow-800'
      case 'APROVADO':
        return 'bg-green-100 text-green-800'
      case 'REJEITADO':
        return 'bg-red-100 text-red-800'
      case 'REVISAO_SOLICITADA':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EM_AVALIACAO':
        return <Clock className="w-4 h-4" />
      case 'APROVADO':
        return <CheckCircle className="w-4 h-4" />
      case 'REJEITADO':
        return <XCircle className="w-4 h-4" />
      case 'REVISAO_SOLICITADA':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EM_AVALIACAO':
        return 'Em Avaliação'
      case 'APROVADO':
        return 'Aprovado'
      case 'REJEITADO':
        return 'Rejeitado'
      case 'REVISAO_SOLICITADA':
        return 'Revisão Solicitada'
      default:
        return status
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">{revisao.submissao.titulo}</h3>
            <Badge className={`gap-1 ${getStatusColor(revisao.submissao.status)}`}>
              {getStatusIcon(revisao.submissao.status)}
              {getStatusText(revisao.submissao.status)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {revisao.submissao.periodico.nome}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {revisao.submissao.criador.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(revisao.dataRecebimento).toLocaleDateString('pt-BR')}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {revisao.numeroRevisores} revisores
            </span>
          </div>

          {revisao.revisor && (
            <div className="text-sm text-muted-foreground">
              Revisor: {revisao.revisor.name}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Eye className="w-4 h-4 mr-1" />
            {showDetails ? 'Ocultar' : 'Detalhes'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
        </div>
      </div>

      {showDetails && (
        <div className="border-t pt-4 space-y-3">
          <div>
            <h4 className="font-medium mb-2">Comentários dos Revisores</h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
              {revisao.comentarios || 'Nenhum comentário registrado.'}
            </p>
          </div>

          {revisao.submissao.planoAcao && (
            <div>
              <h4 className="font-medium mb-2">Plano de Ação</h4>
              <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                <pre className="whitespace-pre-wrap">{revisao.submissao.planoAcao}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}