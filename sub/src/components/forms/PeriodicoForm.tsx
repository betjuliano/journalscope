'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Save, BookOpen, X } from 'lucide-react'

interface PeriodicoFormProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
  initialData?: any
}

const areasConhecimento = [
  'Ciências Exatas e da Terra',
  'Ciências Biológicas',
  'Engenharias',
  'Ciências da Saúde',
  'Ciências Agrárias',
  'Ciências Sociais Aplicadas',
  'Ciências Humanas',
  'Linguística, Letras e Artes',
  'Outros'
]

const qualisOptions = [
  'A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'B5', 'C'
]

export default function PeriodicoForm({ onSubmit, onCancel, initialData }: PeriodicoFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    issn: '',
    area: '',
    qualis: '',
    descricao: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

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
      if (!formData.nome || !formData.area) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      const response = await fetch('/api/periodicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newPeriodico = await response.json()
        alert('Periódico cadastrado com sucesso!')
        onSubmit?.(newPeriodico)
        
        // Limpar formulário
        setFormData({
          nome: '',
          issn: '',
          area: '',
          qualis: '',
          descricao: ''
        })
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao cadastrar periódico:', error)
      alert('Erro ao cadastrar periódico')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {initialData ? 'Editar Periódico' : 'Cadastrar Periódico'}
        </CardTitle>
        <CardDescription>
          {initialData ? 'Atualize as informações do periódico' : 'Preencha os dados para cadastrar um novo periódico'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Periódico *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Revista Brasileira de Ciências"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issn">ISSN</Label>
                <Input
                  id="issn"
                  value={formData.issn}
                  onChange={(e) => handleInputChange('issn', e.target.value)}
                  placeholder="Ex: 1234-5678"
                  pattern="[0-9]{4}-[0-9]{3}[0-9X]"
                  title="Formato: 1234-5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Área do Conhecimento *</Label>
                <Select value={formData.area} onValueChange={(value) => handleInputChange('area', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areasConhecimento.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualis">Classificação Qualis</Label>
                <Select value={formData.qualis} onValueChange={(value) => handleInputChange('qualis', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Não informado</SelectItem>
                    {qualisOptions.map((qualis) => (
                      <SelectItem key={qualis} value={qualis}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{qualis}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descreva o foco e escopo do periódico"
                rows={4}
              />
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
              {loading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Cadastrar Periódico')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}