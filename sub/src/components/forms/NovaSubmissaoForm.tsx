'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, X, Save, FileText, Target } from 'lucide-react'
import PeriodicoMultiSelector from '@/components/PeriodicoMultiSelector'

interface Periodico {
  id: string
  nome: string
  area: string
  qualis?: string
}

interface Usuario {
  id: string
  name: string
  email: string
  role: string
}

interface Autor {
  nome: string
  email?: string
  instituicao?: string
}

interface NovaSubmissaoFormProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
}

export default function NovaSubmissaoForm({ onSubmit, onCancel }: NovaSubmissaoFormProps) {
  const [loading, setLoading] = useState(false)
  const [periodicos, setPeriodicos] = useState<Periodico[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [autores, setAutores] = useState<Autor[]>([{ nome: '' }])
  const [palavrasChave, setPalavrasChave] = useState('')
  const [usarBuscaAvancada, setUsarBuscaAvancada] = useState(false)
  const [periodicosAlternativos, setPeriodicosAlternativos] = useState<any[]>([])
  const [formData, setFormData] = useState({
    titulo: '',
    resumo: '',
    periodicoId: '',
    criadorId: ''
  })

  useEffect(() => {
    // Carregar periódicos e usuários
    const loadData = async () => {
      try {
        const [periodicosRes, usuariosRes] = await Promise.all([
          fetch('/api/periodicos'),
          fetch('/api/usuarios')
        ])

        if (periodicosRes.ok) {
          const periodicosData = await periodicosRes.json()
          setPeriodicos(periodicosData)
        }

        if (usuariosRes.ok) {
          const usuariosData = await usuariosRes.json()
          setUsuarios(usuariosData.filter((u: Usuario) => u.role === 'PESQUISADOR'))
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    loadData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addAutor = () => {
    setAutores([...autores, { nome: '' }])
  }

  const removeAutor = (index: number) => {
    if (autores.length > 1) {
      setAutores(autores.filter((_, i) => i !== index))
    }
  }

  const updateAutor = (index: number, field: keyof Autor, value: string) => {
    const newAutores = [...autores]
    newAutores[index] = {
      ...newAutores[index],
      [field]: value
    }
    setAutores(newAutores)
  }

  // Função para criar periódico se não existir
  const handleCreatePeriodicoIfNeeded = async (periodicoData: any) => {
    try {
      // Primeiro, verificar se o periódico já existe pelo nome ou ISSN
      const existingResponse = await fetch('/api/periodicos')
      if (existingResponse.ok) {
        const existing = await existingResponse.json()
        const found = existing.find((p: Periodico) => 
          p.nome.toLowerCase() === periodicoData.nome.toLowerCase() ||
          (periodicoData.issn && p.issn === periodicoData.issn)
        )
        
        if (found) {
          setFormData(prev => ({ ...prev, periodicoId: found.id }))
          return
        }
      }

      // Se não existe, criar novo
      const createResponse = await fetch('/api/periodicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: periodicoData.nome,
          issn: periodicoData.issn || null,
          area: periodicoData.area,
          qualis: periodicoData.qualis || null,
          descricao: `Importado da base principal do JournalScope`
        })
      })

      if (createResponse.ok) {
        const newPeriodico = await createResponse.json()
        setFormData(prev => ({ ...prev, periodicoId: newPeriodico.id }))
        // Recarregar lista de periódicos
        const updatedList = await fetch('/api/periodicos')
        if (updatedList.ok) {
          const data = await updatedList.json()
          setPeriodicos(data)
        }
      }
    } catch (error) {
      console.error('Erro ao criar periódico:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obrigatórios
      if (!formData.titulo || !formData.resumo || !formData.periodicoId || !formData.criadorId) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      // Validar autores
      const autoresValidos = autores.filter(a => a.nome.trim() !== '')
      if (autoresValidos.length === 0) {
        alert('Adicione pelo menos um autor')
        return
      }

      // Validar palavras-chave
      if (!palavrasChave.trim()) {
        alert('Adicione pelo menos uma palavra-chave')
        return
      }

      const submissionData = {
        ...formData,
        palavrasChave: palavrasChave.split(',').map(k => k.trim()).join(','),
        autores: autoresValidos,
        periodicosAlternativos: usarBuscaAvancada ? periodicosAlternativos.filter(p => p.prioridade > 1) : []
      }

      const response = await fetch('/api/submissoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      if (response.ok) {
        const newSubmissao = await response.json()
        alert('Submissão criada com sucesso!')
        onSubmit?.(newSubmissao)
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao criar submissão:', error)
      alert('Erro ao criar submissão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Nova Submissão
        </CardTitle>
        <CardDescription>
          Preencha os dados para submeter seu artigo a um periódico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Artigo *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  placeholder="Digite o título do artigo"
                  required
                />
              </div>

            </div>

            {/* Seleção de Periódico */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-medium">Seleção de Periódico(s)</h3>
              </div>

              <Tabs defaultValue="simples" onValueChange={(v) => setUsarBuscaAvancada(v === 'avancada')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simples">Seleção Simples</TabsTrigger>
                  <TabsTrigger value="avancada">Busca Avançada + Ranking</TabsTrigger>
                </TabsList>

                <TabsContent value="simples" className="space-y-2 mt-4">
                  <Label htmlFor="periodico">Periódico Principal *</Label>
                  <Select value={formData.periodicoId} onValueChange={(value) => handleInputChange('periodicoId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um periódico cadastrado" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodicos.map((periodico) => (
                        <SelectItem key={periodico.id} value={periodico.id}>
                          <div>
                            <div className="font-medium">{periodico.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              {periodico.area} {periodico.qualis && `• ${periodico.qualis}`}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecione apenas o periódico principal onde deseja submeter
                  </p>
                </TabsContent>

                <TabsContent value="avancada" className="mt-4">
                  <PeriodicoMultiSelector 
                    onPeriodicosChange={(periodicos) => {
                      setPeriodicosAlternativos(periodicos)
                      // O primeiro da lista (prioridade 1) deve ser definido como periódico principal
                      if (periodicos.length > 0 && periodicos[0]) {
                        // Buscar ou criar o periódico no banco
                        handleCreatePeriodicoIfNeeded(periodicos[0])
                      }
                    }}
                    maxPeriodicos={5}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo *</Label>
              <Textarea
                id="resumo"
                value={formData.resumo}
                onChange={(e) => handleInputChange('resumo', e.target.value)}
                placeholder="Digite o resumo do artigo"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="palavrasChave">Palavras-chave *</Label>
              <Input
                id="palavrasChave"
                value={palavrasChave}
                onChange={(e) => setPalavrasChave(e.target.value)}
                placeholder="Separe as palavras-chave por vírgula"
                required
              />
              <p className="text-sm text-muted-foreground">
                Ex: metodologia científica, pesquisa qualitativa, análise de dados
              </p>
            </div>
          </div>

          {/* Autores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Autores</h3>
              <Button type="button" onClick={addAutor} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Autor
              </Button>
            </div>

            <div className="space-y-3">
              {autores.map((autor, index) => (
                <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`autor-nome-${index}`}>Nome *</Label>
                      <Input
                        id={`autor-nome-${index}`}
                        value={autor.nome}
                        onChange={(e) => updateAutor(index, 'nome', e.target.value)}
                        placeholder="Nome do autor"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`autor-email-${index}`}>Email</Label>
                      <Input
                        id={`autor-email-${index}`}
                        type="email"
                        value={autor.email || ''}
                        onChange={(e) => updateAutor(index, 'email', e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`autor-instituicao-${index}`}>Instituição</Label>
                      <Input
                        id={`autor-instituicao-${index}`}
                        value={autor.instituicao || ''}
                        onChange={(e) => updateAutor(index, 'instituicao', e.target.value)}
                        placeholder="Nome da instituição"
                      />
                    </div>
                  </div>
                  {autores.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeAutor(index)}
                      variant="outline"
                      size="sm"
                      className="mt-6"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Criador */}
          <div className="space-y-2">
            <Label htmlFor="criador">Criador da Submissão *</Label>
            <Select value={formData.criadorId} onValueChange={(value) => handleInputChange('criadorId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o criador" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    <div>
                      <div className="font-medium">{usuario.name}</div>
                      <div className="text-sm text-muted-foreground">{usuario.email}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Criar Submissão'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}