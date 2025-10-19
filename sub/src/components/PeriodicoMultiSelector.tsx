'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Plus, 
  X, 
  GripVertical, 
  Award,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface Periodico {
  nome: string
  issn?: string | null
  area: string
  qualis?: string | null
  abdc?: string | null
  abs?: string | null
}

interface PeriodicoSelecionado extends Periodico {
  prioridade: number
  motivo: string
}

interface PeriodicoMultiSelectorProps {
  onPeriodicosChange: (periodicos: PeriodicoSelecionado[]) => void
  maxPeriodicos?: number
}

export default function PeriodicoMultiSelector({ 
  onPeriodicosChange, 
  maxPeriodicos = 5 
}: PeriodicoMultiSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Periodico[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPeriodicos, setSelectedPeriodicos] = useState<PeriodicoSelecionado[]>([])
  const [showResults, setShowResults] = useState(false)

  // Buscar periódicos quando o usuário digita
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 500) // Debounce de 500ms

    return () => clearTimeout(searchTimeout)
  }, [searchQuery])

  const handleSearch = async () => {
    setSearching(true)
    try {
      const response = await fetch(`/api/periodicos/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        setShowResults(true)
      }
    } catch (error) {
      console.error('Erro ao buscar periódicos:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddPeriodico = (periodico: Periodico) => {
    // Verificar se já foi selecionado
    const jaExiste = selectedPeriodicos.some(p => p.nome === periodico.nome)
    if (jaExiste) {
      alert('Este periódico já foi selecionado!')
      return
    }

    // Verificar limite
    if (selectedPeriodicos.length >= maxPeriodicos) {
      alert(`Você só pode selecionar até ${maxPeriodicos} periódicos`)
      return
    }

    const novoPeriodico: PeriodicoSelecionado = {
      ...periodico,
      prioridade: selectedPeriodicos.length + 1,
      motivo: ''
    }

    const novosSelected = [...selectedPeriodicos, novoPeriodico]
    setSelectedPeriodicos(novosSelected)
    onPeriodicosChange(novosSelected)
    setSearchQuery('')
    setShowResults(false)
  }

  const handleRemovePeriodico = (prioridade: number) => {
    const novosSelected = selectedPeriodicos
      .filter(p => p.prioridade !== prioridade)
      .map((p, idx) => ({ ...p, prioridade: idx + 1 }))
    
    setSelectedPeriodicos(novosSelected)
    onPeriodicosChange(novosSelected)
  }

  const handleUpdateMotivo = (prioridade: number, motivo: string) => {
    const novosSelected = selectedPeriodicos.map(p =>
      p.prioridade === prioridade ? { ...p, motivo } : p
    )
    setSelectedPeriodicos(novosSelected)
    onPeriodicosChange(novosSelected)
  }

  const handleMoveUp = (prioridade: number) => {
    if (prioridade === 1) return

    const novosSelected = [...selectedPeriodicos]
    const currentIndex = novosSelected.findIndex(p => p.prioridade === prioridade)
    const previousIndex = currentIndex - 1

    // Trocar posições
    const temp = novosSelected[currentIndex]
    novosSelected[currentIndex] = novosSelected[previousIndex]
    novosSelected[previousIndex] = temp

    // Reajustar prioridades
    const comPrioridadeAtualizada = novosSelected.map((p, idx) => ({
      ...p,
      prioridade: idx + 1
    }))

    setSelectedPeriodicos(comPrioridadeAtualizada)
    onPeriodicosChange(comPrioridadeAtualizada)
  }

  const handleMoveDown = (prioridade: number) => {
    if (prioridade === selectedPeriodicos.length) return

    const novosSelected = [...selectedPeriodicos]
    const currentIndex = novosSelected.findIndex(p => p.prioridade === prioridade)
    const nextIndex = currentIndex + 1

    // Trocar posições
    const temp = novosSelected[currentIndex]
    novosSelected[currentIndex] = novosSelected[nextIndex]
    novosSelected[nextIndex] = temp

    // Reajustar prioridades
    const comPrioridadeAtualizada = novosSelected.map((p, idx) => ({
      ...p,
      prioridade: idx + 1
    }))

    setSelectedPeriodicos(comPrioridadeAtualizada)
    onPeriodicosChange(comPrioridadeAtualizada)
  }

  const getPrioridadeIcon = (prioridade: number) => {
    if (prioridade === 1) return <Award className="w-4 h-4 text-yellow-600" />
    if (prioridade === 2) return <TrendingUp className="w-4 h-4 text-blue-600" />
    return <CheckCircle className="w-4 h-4 text-gray-600" />
  }

  const getPrioridadeLabel = (prioridade: number) => {
    if (prioridade === 1) return 'Principal'
    if (prioridade === 2) return '2ª Opção'
    if (prioridade === 3) return '3ª Opção'
    return `${prioridade}ª Opção`
  }

  return (
    <div className="space-y-4">
      {/* Campo de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Periódicos (Base: 7.379 periódicos)
          </CardTitle>
          <CardDescription>
            Digite o nome, ISSN ou área do periódico. Você pode selecionar até {maxPeriodicos} periódicos com ordem de prioridade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              type="text"
              placeholder="Ex: Journal of Operations Management"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            {searching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Resultados da Busca */}
          {showResults && searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
              {searchResults.map((periodico, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{periodico.nome}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{periodico.area}</span>
                      {periodico.issn && <span>• ISSN: {periodico.issn}</span>}
                      {periodico.qualis && <Badge variant="outline">{periodico.qualis}</Badge>}
                      {periodico.abdc && <Badge variant="outline">ABDC: {periodico.abdc}</Badge>}
                      {periodico.abs && <Badge variant="outline">ABS: {periodico.abs}</Badge>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddPeriodico(periodico)}
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && (
            <div className="mt-4 text-center py-8 border rounded-lg">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum periódico encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Periódicos Selecionados */}
      {selectedPeriodicos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Periódicos Selecionados ({selectedPeriodicos.length}/{maxPeriodicos})</CardTitle>
            <CardDescription>
              Arraste para reordenar ou use as setas. O primeiro da lista é o periódico principal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedPeriodicos.map((periodico) => (
                <div
                  key={periodico.prioridade}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Controles de Ordenação */}
                    <div className="flex flex-col gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveUp(periodico.prioridade)}
                        disabled={periodico.prioridade === 1}
                      >
                        ↑
                      </Button>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveDown(periodico.prioridade)}
                        disabled={periodico.prioridade === selectedPeriodicos.length}
                      >
                        ↓
                      </Button>
                    </div>

                    {/* Informações do Periódico */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getPrioridadeIcon(periodico.prioridade)}
                        <Badge 
                          variant={periodico.prioridade === 1 ? 'default' : 'secondary'}
                          className="font-semibold"
                        >
                          {getPrioridadeLabel(periodico.prioridade)}
                        </Badge>
                      </div>

                      <h4 className="font-medium">{periodico.nome}</h4>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span>{periodico.area}</span>
                        {periodico.issn && <span>• ISSN: {periodico.issn}</span>}
                        {periodico.qualis && <Badge variant="outline" className="text-xs">{periodico.qualis}</Badge>}
                        {periodico.abdc && <Badge variant="outline" className="text-xs">ABDC: {periodico.abdc}</Badge>}
                        {periodico.abs && <Badge variant="outline" className="text-xs">ABS: {periodico.abs}</Badge>}
                      </div>

                      {/* Campo de Motivo */}
                      {periodico.prioridade > 1 && (
                        <div className="space-y-1">
                          <Label htmlFor={`motivo-${periodico.prioridade}`} className="text-xs">
                            Motivo da escolha (opcional)
                          </Label>
                          <Textarea
                            id={`motivo-${periodico.prioridade}`}
                            value={periodico.motivo}
                            onChange={(e) => handleUpdateMotivo(periodico.prioridade, e.target.value)}
                            placeholder="Ex: Escopo similar, aceita artigos rejeitados, prazo mais curto..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Botão Remover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePeriodico(periodico.prioridade)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Legenda */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-900 dark:text-blue-100">
                  <strong>Estratégia de Submissão:</strong> O primeiro periódico é onde você irá submeter inicialmente. 
                  Os demais são opções alternativas em caso de rejeição, ordenados por prioridade.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


