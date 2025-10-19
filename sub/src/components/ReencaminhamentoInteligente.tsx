'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight, 
  BookOpen, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Calendar,
  User,
  Lightbulb
} from 'lucide-react'

interface Submissao {
  id: string
  titulo: string
  resumo: string
  palavrasChave: string
  status: string
  dataSubmissao: string
  criador: {
    id: string
    name: string
  }
  periodico: {
    id: string
    nome: string
    area: string
    qualis?: string
  }
}

interface Sugestao {
  periodicoId: string
  motivo: string
  pontuacao: number
  alinhamento: 'alto' | 'medio' | 'baixo'
  periodico: {
    id: string
    nome: string
    area: string
    qualis?: string
    descricao?: string
    popularidade: number
  }
}

interface ReencaminhamentoInteligenteProps {
  submissaoId: string
  onReencaminhado?: () => void
  onCancel?: () => void
}

export default function ReencaminhamentoInteligente({ 
  submissaoId, 
  onReencaminhado, 
  onCancel 
}: ReencaminhamentoInteligenteProps) {
  const [loading, setLoading] = useState(true)
  const [gerandoSugestoes, setGerandoSugestoes] = useState(false)
  const [reencaminhando, setReencaminhando] = useState(false)
  const [submissao, setSubmissao] = useState<Submissao | null>(null)
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [selectedSugestao, setSelectedSugestao] = useState<Sugestao | null>(null)
  const [manterDados, setManterDados] = useState(true)
  const [ajustes, setAjustes] = useState({
    titulo: '',
    resumo: '',
    palavrasChave: ''
  })
  const [relatorio, setRelatorio] = useState('')

  useEffect(() => {
    if (submissaoId) {
      carregarSubmissaoEGerarSugestoes()
    }
  }, [submissaoId])

  const carregarSubmissaoEGerarSugestoes = async () => {
    try {
      setGerandoSugestoes(true)
      
      const response = await fetch('/api/sugestoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ submissaoId })
      })

      if (response.ok) {
        const data = await response.json()
        setSubmissao(data.submissao)
        setSugestoes(data.sugestoes)
        
        // Inicializar ajustes com dados originais
        setAjustes({
          titulo: data.submissao.titulo,
          resumo: data.submissao.resumo,
          palavrasChave: data.submissao.palavrasChave
        })
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados da submissão')
    } finally {
      setGerandoSugestoes(false)
      setLoading(false)
    }
  }

  const handleReencaminhar = async () => {
    if (!selectedSugestao || !submissao) return

    setReencaminhando(true)
    try {
      const response = await fetch('/api/reencaminhar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissaoId,
          novoPeriodicoId: selectedSugestao.periodicoId,
          manterDados,
          ajustes: manterDados ? {} : ajustes
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRelatorio(data.relatorio)
        alert('Submissão reencaminhada com sucesso!')
        onReencaminhado?.()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao reencaminhar:', error)
      alert('Erro ao reencaminhar submissão')
    } finally {
      setReencaminhando(false)
    }
  }

  const getAlinhamentoColor = (alinhamento: string) => {
    switch (alinhamento) {
      case 'alto':
        return 'bg-green-100 text-green-800'
      case 'medio':
        return 'bg-yellow-100 text-yellow-800'
      case 'baixo':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAlinhamentoIcon = (alinhamento: string) => {
    switch (alinhamento) {
      case 'alto':
        return <Target className="w-4 h-4" />
      case 'medio':
        return <TrendingUp className="w-4 h-4" />
      case 'baixo':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {gerandoSugestoes ? 'Gerando sugestões inteligentes...' : 'Carregando dados...'}
          </p>
        </div>
      </div>
    )
  }

  if (!submissao) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Submissão não encontrada</p>
      </div>
    )
  }

  if (relatorio) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Reencaminhamento Concluído
          </CardTitle>
          <CardDescription>
            Sua submissão foi reencaminhada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">Resumo da Operação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Artigo:</span> {submissao.titulo}
                </div>
                <div>
                  <span className="font-medium">De:</span> {submissao.periodico.nome}
                </div>
                <div>
                  <span className="font-medium">Para:</span> {selectedSugestao?.periodico.nome}
                </div>
                <div>
                  <span className="font-medium">Data:</span> {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Relatório Detalhado</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{relatorio}</pre>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Fechar
                </Button>
              )}
              <Button onClick={() => window.location.href = '/'}>
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reencaminhamento Inteligente</h1>
            <p className="text-muted-foreground">
              Sugestões baseadas em IA para sua submissão rejeitada
            </p>
          </div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>

        {/* Informações da Submissão */}
        <Card>
          <CardHeader>
            <CardTitle>Submissão Original</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">{submissao.titulo}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {submissao.periodico.nome}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {submissao.criador.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(submissao.dataSubmissao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Rejeitado</Badge>
                <span className="text-sm text-muted-foreground">
                  Área: {submissao.periodico.area}
                </span>
                {submissao.periodico.qualis && (
                  <Badge variant="outline">{submissao.periodico.qualis}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sugestões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Sugestões de Novos Periódicos
            </CardTitle>
            <CardDescription>
              Baseado na análise do seu artigo, selecionamos os melhores periódicos alternativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sugestoes.map((sugestao, index) => (
                <div
                  key={sugestao.periodicoId}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedSugestao?.periodicoId === sugestao.periodicoId
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedSugestao(sugestao)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{sugestao.periodico.nome}</h3>
                        <Badge className={`gap-1 ${getAlinhamentoColor(sugestao.alinhamento)}`}>
                          {getAlinhamentoIcon(sugestao.alinhamento)}
                          Alinhamento {sugestao.alinhamento}
                        </Badge>
                        {sugestao.periodico.qualis && (
                          <Badge variant="outline">{sugestao.periodico.qualis}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Área: {sugestao.periodico.area}</span>
                        <span>Popularidade: {sugestao.periodico.popularidade} submissões</span>
                        <span>Pontuação: {sugestao.pontuacao}/100</span>
                      </div>

                      <p className="text-sm">{sugestao.motivo}</p>

                      {sugestao.periodico.descricao && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          <strong>Descrição:</strong> {sugestao.periodico.descricao}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      {selectedSugestao?.periodicoId === sugestao.periodicoId && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Reencaminhamento */}
        {selectedSugestao && (
          <Card>
            <CardHeader>
              <CardTitle>Configurar Reencaminhamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manter" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="manter">Manter Dados</TabsTrigger>
                  <TabsTrigger value="ajustar">Ajustar Conteúdo</TabsTrigger>
                </TabsList>

                <TabsContent value="manter" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="manterDados"
                      checked={manterDados}
                      onCheckedChange={(checked) => setManterDados(checked as boolean)}
                    />
                    <Label htmlFor="manterDados">
                      Manter todos os dados da submissão original
                    </Label>
                  </div>
                  
                  {manterDados && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Título, resumo, palavras-chave e autores serão mantidos exatamente como na submissão original.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ajustar" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título</Label>
                      <Input
                        id="titulo"
                        value={ajustes.titulo}
                        onChange={(e) => setAjustes(prev => ({ ...prev, titulo: e.target.value }))}
                        disabled={manterDados}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resumo">Resumo</Label>
                      <Textarea
                        id="resumo"
                        value={ajustes.resumo}
                        onChange={(e) => setAjustes(prev => ({ ...prev, resumo: e.target.value }))}
                        rows={4}
                        disabled={manterDados}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="palavrasChave">Palavras-chave</Label>
                      <Input
                        id="palavrasChave"
                        value={ajustes.palavrasChave}
                        onChange={(e) => setAjustes(prev => ({ ...prev, palavrasChave: e.target.value }))}
                        disabled={manterDados}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={handleReencaminhar}
                  disabled={reencaminhando}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  {reencaminhando ? 'Reencaminhando...' : 'Reencaminhar Submissão'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}