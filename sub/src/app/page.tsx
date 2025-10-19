'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, FileText, Clock, CheckCircle, XCircle, AlertCircle, Plus, ArrowRight, Search, ExternalLink } from 'lucide-react'
import NovaSubmissaoForm from '@/components/forms/NovaSubmissaoForm'
import PeriodicoForm from '@/components/forms/PeriodicoForm'
import UsuarioForm from '@/components/forms/UsuarioForm'
import { useJournalscopeIntegration } from '@/hooks/useJournalscopeIntegration'

interface DashboardStats {
  totalSubmissoes: number
  emAvaliacao: number
  aprovadas: number
  rejeitadas: number
  revisaoSolicitada: number
}

interface Submissao {
  id: string
  titulo: string
  status: string
  dataSubmissao: string
  periodico: {
    nome: string
  }
  criador: {
    name: string
  }
}

interface Periodico {
  id: string
  nome: string
  area: string
  qualis?: string
  _count?: {
    submissoes: number
  }
}

export default function Dashboard() {
  // Integração com Journalscope
  const { isIntegrated, selectedJournals, language: integrationLanguage } = useJournalscopeIntegration();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissoes: 0,
    emAvaliacao: 0,
    aprovadas: 0,
    rejeitadas: 0,
    revisaoSolicitada: 0
  })
  const [submissoes, setSubmissoes] = useState<Submissao[]>([])
  const [periodicos, setPeriodicos] = useState<Periodico[]>([])
  const [loading, setLoading] = useState(true)
  const [activeForm, setActiveForm] = useState<'submissao' | 'periodico' | 'usuario' | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setSubmissoes(data.submissoesRecentes)
        setPeriodicos(data.periodicosMaisUtilizados)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
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

  const handleFormSubmit = () => {
    setActiveForm(null)
    loadDashboardData() // Recarregar dados após submit
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (activeForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setActiveForm(null)}
            className="mb-6"
          >
            ← Voltar ao Dashboard
          </Button>
          
          {activeForm === 'submissao' && (
            <NovaSubmissaoForm onSubmit={handleFormSubmit} onCancel={() => setActiveForm(null)} />
          )}
          {activeForm === 'periodico' && (
            <PeriodicoForm onSubmit={handleFormSubmit} onCancel={() => setActiveForm(null)} />
          )}
          {activeForm === 'usuario' && (
            <UsuarioForm onSubmit={handleFormSubmit} onCancel={() => setActiveForm(null)} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="journalscope-theme min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hero-title text-3xl font-bold tracking-tight">Sistema de Gestão Acadêmica</h1>
            <p className="text-gray-600">
              Acompanhe suas submissões e gerencie o fluxo de publicações
            </p>
            {isIntegrated && selectedJournals.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {selectedJournals.length} periódicos selecionados do Journalscope
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/periodicos-pesquisa'}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Pesquisar Periódico
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setActiveForm('periodico')}
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Periódico
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setActiveForm('usuario')}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Usuário
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/revisoes'}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Revisões
            </Button>
            <Button 
              onClick={() => setActiveForm('submissao')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Submissão
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissoes}</div>
              <p className="text-xs text-muted-foreground">submissões</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Avaliação</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.emAvaliacao}</div>
              <p className="text-xs text-muted-foreground">aguardando parecer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.aprovadas}</div>
              <p className="text-xs text-muted-foreground">aceitas para publicação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejeitadas}</div>
              <p className="text-xs text-muted-foreground">não aceitas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisão</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.revisaoSolicitada}</div>
              <p className="text-xs text-muted-foreground">precisam de ajustes</p>
            </CardContent>
          </Card>
        </div>

        {/* Periódicos do Journalscope */}
        {isIntegrated && selectedJournals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Periódicos Selecionados do Journalscope
              </CardTitle>
              <CardDescription>
                Periódicos importados para você criar submissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedJournals.map((journal, idx) => (
                  <Card key={idx} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-2 line-clamp-2">{journal.journal}</h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {journal.issn && (
                          <div className="flex justify-between">
                            <span>ISSN:</span>
                            <span className="font-mono">{journal.issn}</span>
                          </div>
                        )}
                        {journal.abdc && (
                          <div className="flex justify-between">
                            <span>ABDC:</span>
                            <Badge variant="outline" className="text-xs">{journal.abdc}</Badge>
                          </div>
                        )}
                        {journal.abs && (
                          <div className="flex justify-between">
                            <span>ABS:</span>
                            <Badge variant="outline" className="text-xs">{journal.abs}</Badge>
                          </div>
                        )}
                        {journal.sjr?.quartile && (
                          <div className="flex justify-between">
                            <span>SJR:</span>
                            <Badge variant="outline" className="text-xs">{journal.sjr.quartile}</Badge>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => {
                          // Preencher form de submissão com este periódico
                          setActiveForm('submissao');
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Criar Submissão
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="submissoes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submissoes">Submissões Recentes</TabsTrigger>
            <TabsTrigger value="periodicos">Periódicos</TabsTrigger>
            <TabsTrigger value="alertas">Alertas de Prazo</TabsTrigger>
          </TabsList>

          <TabsContent value="submissoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submissões Recentes</CardTitle>
                <CardDescription>
                  Acompanhe o status das suas submissões mais recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissoes.length > 0 ? (
                    submissoes.map((submissao) => (
                      <div
                        key={submissao.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <h3 className="font-medium">{submissao.titulo}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {submissao.periodico.nome}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {submissao.criador.name}
                            </span>
                            <span>{new Date(submissao.dataSubmissao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`gap-1 ${getStatusColor(submissao.status)}`}>
                            {getStatusIcon(submissao.status)}
                            {getStatusText(submissao.status)}
                          </Badge>
                          {submissao.status === 'REJEITADO' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/reencaminhar?submissaoId=${submissao.id}`}
                              className="gap-1"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Reencaminhar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma submissão encontrada</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setActiveForm('submissao')}
                      >
                        Criar Primeira Submissão
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="periodicos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Periódicos Mais Utilizados</CardTitle>
                <CardDescription>
                  Periódicos com mais submissões no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {periodicos.length > 0 ? (
                    periodicos.map((periodico) => (
                      <div
                        key={periodico.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <h3 className="font-medium">{periodico.nome}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{periodico.area}</span>
                            {periodico.qualis && (
                              <Badge variant="outline">{periodico.qualis}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{periodico._count?.submissoes || 0}</div>
                            <p className="text-xs text-muted-foreground">submissões</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = '/periodicos-pesquisa'}
                            className="gap-1"
                          >
                            <Search className="w-3 h-3" />
                            Ver Histórico
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum periódico cadastrado ainda</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setActiveForm('periodico')}
                      >
                        Cadastrar Periódico
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Prazo</CardTitle>
                <CardDescription>
                  Submissões que precisam de atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum alerta de prazo no momento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}