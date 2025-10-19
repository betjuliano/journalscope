'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Search,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react'
import NovaSubmissaoForm from '@/components/forms/NovaSubmissaoForm'

interface Periodico {
  id: string
  nome: string
  issn?: string
  area: string
  qualis?: string
  descricao?: string
}

interface Submissao {
  id: string
  titulo: string
  resumo: string
  palavrasChave: string
  status: string
  dataSubmissao: string
  planoAcao?: string
  criador: {
    id: string
    name: string
    email: string
  }
  autores: Array<{
    id: string
    nome: string
    email?: string
    instituicao?: string
  }>
  revisoes: Array<{
    id: string
    dataRecebimento: string
    numeroRevisores: number
    comentarios: string
    revisor?: {
      id: string
      name: string
      email: string
    }
  }>
}

interface Estatisticas {
  total: number
  emAvaliacao: number
  aprovadas: number
  rejeitadas: number
  revisaoSolicitada: number
  submetidasNovamente: number
}

export default function PeriodicoPesquisaManager() {
  const searchParams = useSearchParams()
  const [periodicos, setPeriodicos] = useState<Periodico[]>([])
  const [selectedPeriodico, setSelectedPeriodico] = useState<string>('')
  const [periodocoDetails, setPeriodocoDetails] = useState<Periodico | null>(null)
  const [submissoes, setSubmissoes] = useState<Submissao[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(false)
  const [showNovaSubmissao, setShowNovaSubmissao] = useState(false)
  const [initialPeriodico, setInitialPeriodico] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Carregar lista de periódicos
  useEffect(() => {
    loadPeriodicos()
    
    // Verificar se há parâmetro de busca na URL
    const search = searchParams?.get('search')
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  const loadPeriodicos = async () => {
    try {
      const response = await fetch('/api/periodicos')
      if (response.ok) {
        const data = await response.json()
        setPeriodicos(data)
      }
    } catch (error) {
      console.error('Erro ao carregar periódicos:', error)
    }
  }

  const loadPeriodicoSubmissoes = async (periodicoId: string) => {
    if (!periodicoId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/periodicos/${periodicoId}/submissoes`)
      if (response.ok) {
        const data = await response.json()
        setPeriodocoDetails(data.periodico)
        setSubmissoes(data.submissoes)
        setEstatisticas(data.estatisticas)
      } else {
        alert('Erro ao carregar dados do periódico')
      }
    } catch (error) {
      console.error('Erro ao carregar submissões:', error)
      alert('Erro ao carregar submissões')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodicoChange = (value: string) => {
    setSelectedPeriodico(value)
    loadPeriodicoSubmissoes(value)
  }

  const handleNovaSubmissao = () => {
    setInitialPeriodico(selectedPeriodico)
    setShowNovaSubmissao(true)
  }

  const handleSubmissaoCreated = () => {
    setShowNovaSubmissao(false)
    // Recarregar dados do periódico
    if (selectedPeriodico) {
      loadPeriodicoSubmissoes(selectedPeriodico)
    }
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
      case 'SUBMETIDO_NOVAMENTE':
        return 'bg-purple-100 text-purple-800'
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
      case 'SUBMETIDO_NOVAMENTE':
        return 'Resubmetido'
      default:
        return status
    }
  }

  if (showNovaSubmissao) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setShowNovaSubmissao(false)}
            className="mb-6"
          >
            ← Voltar à Pesquisa
          </Button>
          
          <NovaSubmissaoFormWithPeriodico 
            onSubmit={handleSubmissaoCreated}
            onCancel={() => setShowNovaSubmissao(false)}
            initialPeriodicoId={initialPeriodico}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Search className="w-8 h-8" />
              Pesquisa por Periódico
            </h1>
            <p className="text-muted-foreground">
              Selecione um periódico para ver histórico de submissões e criar novas
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Seletor de Periódico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Selecione um Periódico
            </CardTitle>
            <CardDescription>
              Escolha um periódico para visualizar estatísticas e histórico de submissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Select value={selectedPeriodico} onValueChange={handlePeriodicoChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um periódico" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodicos.map((periodico) => (
                      <SelectItem key={periodico.id} value={periodico.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{periodico.nome}</span>
                          <span className="text-sm text-muted-foreground">
                            {periodico.area} {periodico.qualis && `• ${periodico.qualis}`} {periodico.issn && `• ISSN: ${periodico.issn}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPeriodico && (
                <Button onClick={handleNovaSubmissao} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Submissão
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        )}

        {/* Detalhes do Periódico */}
        {!loading && periodocoDetails && estatisticas && (
          <>
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {periodocoDetails.nome}
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Área: {periodocoDetails.area}
                    </span>
                    {periodocoDetails.qualis && (
                      <Badge variant="outline">{periodocoDetails.qualis}</Badge>
                    )}
                    {periodocoDetails.issn && (
                      <span>ISSN: {periodocoDetails.issn}</span>
                    )}
                  </div>
                  {periodocoDetails.descricao && (
                    <p className="text-sm mt-2">{periodocoDetails.descricao}</p>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.total}</div>
                  <p className="text-xs text-muted-foreground">submissões</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Avaliação</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{estatisticas.emAvaliacao}</div>
                  <p className="text-xs text-muted-foreground">aguardando</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{estatisticas.aprovadas}</div>
                  <p className="text-xs text-muted-foreground">aceitas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{estatisticas.rejeitadas}</div>
                  <p className="text-xs text-muted-foreground">não aceitas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revisão</CardTitle>
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{estatisticas.revisaoSolicitada}</div>
                  <p className="text-xs text-muted-foreground">ajustes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resubmetidas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{estatisticas.submetidasNovamente}</div>
                  <p className="text-xs text-muted-foreground">novas versões</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Submissões */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Submissões</CardTitle>
                <CardDescription>
                  Todas as submissões registradas para este periódico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissoes.length > 0 ? (
                  <Tabs defaultValue="todas" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="todas">
                        Todas ({estatisticas.total})
                      </TabsTrigger>
                      <TabsTrigger value="avaliacao">
                        Em Avaliação ({estatisticas.emAvaliacao})
                      </TabsTrigger>
                      <TabsTrigger value="aprovadas">
                        Aprovadas ({estatisticas.aprovadas})
                      </TabsTrigger>
                      <TabsTrigger value="rejeitadas">
                        Rejeitadas ({estatisticas.rejeitadas})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="todas" className="space-y-4">
                      {submissoes.map((submissao) => (
                        <SubmissaoCard key={submissao.id} submissao={submissao} />
                      ))}
                    </TabsContent>

                    <TabsContent value="avaliacao" className="space-y-4">
                      {submissoes
                        .filter(s => s.status === 'EM_AVALIACAO')
                        .map((submissao) => (
                          <SubmissaoCard key={submissao.id} submissao={submissao} />
                        ))}
                    </TabsContent>

                    <TabsContent value="aprovadas" className="space-y-4">
                      {submissoes
                        .filter(s => s.status === 'APROVADO')
                        .map((submissao) => (
                          <SubmissaoCard key={submissao.id} submissao={submissao} />
                        ))}
                    </TabsContent>

                    <TabsContent value="rejeitadas" className="space-y-4">
                      {submissoes
                        .filter(s => s.status === 'REJEITADO')
                        .map((submissao) => (
                          <SubmissaoCard key={submissao.id} submissao={submissao} />
                        ))}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Nenhuma submissão encontrada para este periódico
                    </p>
                    <Button onClick={handleNovaSubmissao} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Criar Primeira Submissão
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!loading && !selectedPeriodico && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Periódico</h3>
                <p className="text-muted-foreground">
                  Escolha um periódico acima para visualizar o histórico de submissões
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Componente auxiliar para exibir cada submissão
function SubmissaoCard({ submissao }: { submissao: Submissao }) {
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
      case 'SUBMETIDO_NOVAMENTE':
        return 'bg-purple-100 text-purple-800'
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
      case 'SUBMETIDO_NOVAMENTE':
        return 'Resubmetido'
      default:
        return status
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">{submissao.titulo}</h3>
            <Badge className={`gap-1 ${getStatusColor(submissao.status)}`}>
              {getStatusIcon(submissao.status)}
              {getStatusText(submissao.status)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {submissao.criador.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(submissao.dataSubmissao).toLocaleDateString('pt-BR')}
            </span>
            {submissao.revisoes.length > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {submissao.revisoes.length} revisões
              </span>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Ocultar' : 'Ver Detalhes'}
        </Button>
      </div>

      {showDetails && (
        <div className="border-t pt-3 space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-1">Resumo</h4>
            <p className="text-sm text-muted-foreground">{submissao.resumo}</p>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-1">Palavras-chave</h4>
            <div className="flex flex-wrap gap-1">
              {submissao.palavrasChave.split(',').map((palavra, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {palavra.trim()}
                </Badge>
              ))}
            </div>
          </div>

          {submissao.autores.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-1">Autores</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {submissao.autores.map((autor) => (
                  <li key={autor.id}>
                    {autor.nome}
                    {autor.instituicao && ` - ${autor.instituicao}`}
                    {autor.email && ` (${autor.email})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submissao.planoAcao && (
            <div>
              <h4 className="font-medium text-sm mb-1">Plano de Ação</h4>
              <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200">
                <pre className="whitespace-pre-wrap text-xs">{submissao.planoAcao}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Wrapper para NovaSubmissaoForm com periódico pré-selecionado
function NovaSubmissaoFormWithPeriodico({ 
  onSubmit, 
  onCancel, 
  initialPeriodicoId 
}: { 
  onSubmit?: () => void
  onCancel?: () => void
  initialPeriodicoId?: string 
}) {
  return <NovaSubmissaoForm onSubmit={onSubmit} onCancel={onCancel} />
}

