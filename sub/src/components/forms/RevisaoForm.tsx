'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Save, FileText, Users, Calendar, AlertCircle, CheckCircle } from 'lucide-react'

interface Submissao {
  id: string
  titulo: string
  status: string
  criador: {
    id: string
    name: string
  }
  periodico: {
    id: string
    nome: string
    area: string
  }
}

interface Usuario {
  id: string
  name: string
  email: string
  role: string
}

interface RevisaoFormProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
  initialData?: any
}

export default function RevisaoForm({ onSubmit, onCancel, initialData }: RevisaoFormProps) {
  const [loading, setLoading] = useState(false)
  const [submissoes, setSubmissoes] = useState<Submissao[]>([])
  const [revisores, setRevisores] = useState<Usuario[]>([])
  const [gerarPlanoAcao, setGerarPlanoAcao] = useState(true)
  const [formData, setFormData] = useState({
    dataRecebimento: new Date().toISOString().split('T')[0],
    numeroRevisores: '2',
    comentarios: '',
    revisorId: '',
    submissaoId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar submissões em avaliação
      const submissoesRes = await fetch('/api/submissoes')
      if (submissoesRes.ok) {
        const submissoesData = await submissoesRes.json()
        setSubmissoes(submissoesData.filter((s: Submissao) => 
          s.status === 'EM_AVALIACAO' || s.status === 'REJEITADO'
        ))
      }

      // Carregar revisores
      const usuariosRes = await fetch('/api/usuarios')
      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json()
        setRevisores(usuariosData.filter((u: Usuario) => 
          u.role === 'EDITOR' || u.role === 'ADMIN'
        ))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obrigatórios
      if (!formData.dataRecebimento || !formData.numeroRevisores || !formData.submissaoId) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      const submissionData = {
        ...formData,
        numeroRevisores: parseInt(formData.numeroRevisores),
        gerarPlanoAcao
      }

      const response = await fetch('/api/revisoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      if (response.ok) {
        const newRevisao = await response.json()
        alert('Revisão registrada com sucesso!')
        onSubmit?.(newRevisao)
        
        // Limpar formulário
        setFormData({
          dataRecebimento: new Date().toISOString().split('T')[0],
          numeroRevisores: '2',
          comentarios: '',
          revisorId: '',
          submissaoId: ''
        })
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao registrar revisão:', error)
      alert('Erro ao registrar revisão')
    } finally {
      setLoading(false)
    }
  }

  const selectedSubmissao = submissoes.find(s => s.id === formData.submissaoId)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {initialData ? 'Editar Revisão' : 'Registrar Revisão'}
        </CardTitle>
        <CardDescription>
          {initialData ? 'Atualize as informações da revisão' : 'Registre o parecer dos revisores para uma submissão'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Submissão */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações da Submissão</h3>
            
            <div className="space-y-2">
              <Label htmlFor="submissao">Submissão *</Label>
              <Select value={formData.submissaoId} onValueChange={(value) => handleInputChange('submissaoId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma submissão" />
                </SelectTrigger>
                <SelectContent>
                  {submissoes.map((submissao) => (
                    <SelectItem key={submissao.id} value={submissao.id}>
                      <div>
                        <div className="font-medium">{submissao.titulo}</div>
                        <div className="text-sm text-muted-foreground">
                          {submissao.periodico.nome} • {submissao.criador.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={submissao.status === 'EM_AVALIACAO' ? 'default' : 'secondary'}>
                            {submissao.status === 'EM_AVALIACAO' ? 'Em Avaliação' : 'Rejeitado'}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubmissao && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Detalhes da Submissão</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Periódico:</span> {selectedSubmissao.periodico.nome}
                  </div>
                  <div>
                    <span className="font-medium">Área:</span> {selectedSubmissao.periodico.area}
                  </div>
                  <div>
                    <span className="font-medium">Autor:</span> {selectedSubmissao.criador.name}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge variant="outline" className="ml-2">
                      {selectedSubmissao.status === 'EM_AVALIACAO' ? 'Em Avaliação' : 'Rejeitado'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Informações da Revisão */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações da Revisão</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataRecebimento">Data de Recebimento *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dataRecebimento"
                    type="date"
                    value={formData.dataRecebimento}
                    onChange={(e) => handleInputChange('dataRecebimento', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroRevisores">Número de Revisores *</Label>
                <Select value={formData.numeroRevisores} onValueChange={(value) => handleInputChange('numeroRevisores', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o número" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Revisor</SelectItem>
                    <SelectItem value="2">2 Revisores</SelectItem>
                    <SelectItem value="3">3 Revisores</SelectItem>
                    <SelectItem value="4">4 Revisores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revisor">Revisor Responsável</Label>
              <Select value={formData.revisorId} onValueChange={(value) => handleInputChange('revisorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um revisor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum revisor atribuído</SelectItem>
                  {revisores.map((revisor) => (
                    <SelectItem key={revisor.id} value={revisor.id}>
                      <div>
                        <div className="font-medium">{revisor.name}</div>
                        <div className="text-sm text-muted-foreground">{revisor.email}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comentarios">Comentários dos Revisores</Label>
              <Textarea
                id="comentarios"
                value={formData.comentarios}
                onChange={(e) => handleInputChange('comentarios', e.target.value)}
                placeholder="Digite os comentários e pedidos dos revisores..."
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Inclua todos os comentários, sugestões e pedidos de modificação dos revisores
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="gerarPlanoAcao"
                checked={gerarPlanoAcao}
                onCheckedChange={(checked) => setGerarPlanoAcao(checked as boolean)}
              />
              <Label htmlFor="gerarPlanoAcao" className="text-sm">
                Gerar plano de ação automaticamente baseado nos comentários
              </Label>
            </div>
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
              {loading ? 'Salvando...' : 'Registrar Revisão'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}