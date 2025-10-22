import { useState, useEffect } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Plus, Loader2, Edit, Trash2, GripVertical, Video, FileText, HelpCircle, Link, CheckCircle, BookOpen, GraduationCap } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableEtapaItem } from './SortableEtapaItem'
import { SortablePassoItem } from './SortablePassoItem'
import CreateTrilhaDialog from './CreateTrilhaDialog'
import { useSchools } from '../../hooks/useSchools'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '../ui/badge'

interface QuizPergunta {
  id?: string
  passo_id?: string
  ordem: number
  pergunta_texto: string
  opcoes: string[]
  resposta_correta: number
  pontuacao: number
}

interface PassoEtapa {
  id: string
  id_etapa: string
  ordem: number
  titulo: string
  tipo_passo: 'video' | 'quiz' | 'leitura' | 'acao' | 'link_externo' | 'conclusao_escola'
  conteudo?: string
  created_at: string
  quiz_perguntas?: QuizPergunta[]
  nota_de_corte_quiz?: number
  escola_pre_requisito_id?: string | null
}

interface EtapaTrilha {
  id: string
  id_trilha: string
  ordem: number
  titulo: string
  descricao: string
  cor: string
  created_at: string
  passos_etapa: PassoEtapa[]
}

interface TrilhaData {
  id: string
  titulo: string
  descricao: string
  etapas_trilha: EtapaTrilha[]
}

const ConfiguracaoJornada = () => {
  const { currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()
  const [etapaAberta, setEtapaAberta] = useState<string | null>(null)
  const { data: schoolsData } = useSchools()
  const availableSchools = schoolsData || []

  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false)
  const [etapaParaEditar, setEtapaParaEditar] = useState<EtapaTrilha | null>(null)
  const [formEtapaData, setFormEtapaData] = useState<Partial<EtapaTrilha>>({ titulo: '', descricao: '', cor: '#e0f2fe' })

  const [isPassoModalOpen, setIsPassoModalOpen] = useState(false)
  const [passoParaEditar, setPassoParaEditar] = useState<PassoEtapa | null>(null)
  const [etapaAtualParaPasso, setEtapaAtualParaPasso] = useState<EtapaTrilha | null>(null)
  const [formPassoData, setFormPassoData] = useState<Partial<PassoEtapa>>({ 
    titulo: '', 
    tipo_passo: 'leitura', 
    conteudo: '', 
    quiz_perguntas: [], 
    nota_de_corte_quiz: 70, 
    escola_pre_requisito_id: null 
  })

  const [isCreateTrilhaOpen, setIsCreateTrilhaOpen] = useState(false)

  const coresDisponiveis = [
    { value: '#e0f2fe', name: 'Azul Claro' },
    { value: '#dcfce7', name: 'Verde Claro' },
    { value: '#f3e8ff', name: 'Roxo Claro' },
    { value: '#ffe4e6', name: 'Rosa Claro' },
    { value: '#fffbe5', name: 'Amarelo Claro' },
    { value: '#e5e7eb', name: 'Cinza Claro' }
  ]

  const tiposPasso = [
    { value: 'leitura', name: 'Leitura', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'video', name: 'Vídeo', icon: <Video className="w-4 h-4" /> },
    { value: 'quiz', name: 'Quiz', icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'acao', name: 'Ação Prática', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'link_externo', name: 'Link Externo', icon: <Link className="w-4 h-4" /> },
    { value: 'conclusao_escola', name: 'Conclusão de Escola', icon: <GraduationCap className="w-4 h-4" /> }
  ]

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const { data: jornadaData, isLoading, isFetching } = useQuery({
    queryKey: ['jornadaCompleta', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return null
      const { data, error } = await supabase
        .from('trilhas_crescimento')
        .select(`
          id,
          titulo,
          descricao,
          etapas_trilha (
            *,
            passos_etapa (
              *,
              quiz_perguntas (*)
            )
          )
        `)
        .eq('id_igreja', currentChurchId)
        .eq('is_ativa', true)
        .order('ordem', { foreignTable: 'etapas_trilha', ascending: true })
        .order('ordem', { foreignTable: 'etapas_trilha.passos_etapa', ascending: true })
        .order('ordem', { foreignTable: 'etapas_trilha.passos_etapa.quiz_perguntas', ascending: true })
        .maybeSingle()
      
      if (error) throw error
      return data as TrilhaData | null
    },
    enabled: !!currentChurchId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const trilhaAtual = jornadaData ? { id: jornadaData.id, titulo: jornadaData.titulo, descricao: jornadaData.descricao } : null
  const etapasAninhadas = (jornadaData?.etapas_trilha as EtapaTrilha[]) || []

  useEffect(() => {
    if (!currentChurchId) return
    const channel = supabase
      .channel(`jornada-config-${currentChurchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trilhas_crescimento', filter: `id_igreja=eq.${currentChurchId}` },
        () => queryClient.invalidateQueries({ queryKey: ['jornadaCompleta', currentChurchId] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'etapas_trilha' },
        () => queryClient.invalidateQueries({ queryKey: ['jornadaCompleta', currentChurchId] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passos_etapa' },
        () => queryClient.invalidateQueries({ queryKey: ['jornadaCompleta', currentChurchId] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_perguntas' },
        () => queryClient.invalidateQueries({ queryKey: ['jornadaCompleta', currentChurchId] })
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentChurchId, queryClient])

  const saveEtapaMutation = useMutation({
    mutationFn: async (etapaData: any) => {
      if (etapaParaEditar) {
        const { error } = await supabase.from('etapas_trilha').update(etapaData).eq('id', etapaParaEditar.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('etapas_trilha').insert(etapaData)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(`Etapa ${etapaParaEditar ? 'atualizada' : 'criada'} com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['jornadaCompleta'] })
      setIsEtapaModalOpen(false)
      setEtapaParaEditar(null)
      setFormEtapaData({ titulo: '', descricao: '', cor: '#e0f2fe' })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const deleteEtapaMutation = useMutation({
    mutationFn: async (etapaId: string) => {
      const { error } = await supabase.from('etapas_trilha').delete().eq('id', etapaId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Etapa apagada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['jornadaCompleta'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const savePassoMutation = useMutation({
    mutationFn: async ({ passoData, quizPerguntas }: { passoData: any, quizPerguntas?: any[] }) => {
      let passoId: string
      if (passoData.id) {
        const { data, error } = await supabase.from('passos_etapa').update(passoData).eq('id', passoData.id).select('id').single()
        if (error) throw error
        passoId = data.id
      } else {
        const { data, error } = await supabase.from('passos_etapa').insert(passoData).select('id').single()
        if (error) throw error
        passoId = data.id
      }

      if (passoData.tipo_passo === 'quiz' && quizPerguntas) {
        await supabase.from('quiz_perguntas').delete().eq('passo_id', passoId)
        if (quizPerguntas.length > 0) {
          const perguntasToInsert = quizPerguntas.map((q, i) => ({ 
            ...q, 
            passo_id: passoId, 
            ordem: i + 1, 
            id_igreja: currentChurchId 
          }))
          const { error: quizError } = await supabase.from('quiz_perguntas').insert(perguntasToInsert)
          if (quizError) throw quizError
        }
      }
      return passoId
    },
    onSuccess: () => {
      toast.success('Passo salvo com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['jornadaCompleta'] })
      setIsPassoModalOpen(false)
      setPassoParaEditar(null)
      setFormPassoData({ titulo: '', tipo_passo: 'leitura', conteudo: '', quiz_perguntas: [], nota_de_corte_quiz: 70, escola_pre_requisito_id: null })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const deletePassoMutation = useMutation({
    mutationFn: async (passoId: string) => {
      const { error } = await supabase.from('passos_etapa').delete().eq('id', passoId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Passo apagado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['jornadaCompleta'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const handleSaveEtapa = () => {
    if (!currentChurchId || !formEtapaData.titulo || !formEtapaData.descricao) {
      toast.error('Título e descrição são obrigatórios.')
      return
    }
    if (!trilhaAtual) {
      toast.error('Crie uma trilha antes de adicionar etapas.')
      setIsCreateTrilhaOpen(true)
      return
    }
    const payload = {
      ...formEtapaData,
      id_trilha: trilhaAtual.id,
      id_igreja: currentChurchId,
      ordem: etapaParaEditar ? etapaParaEditar.ordem : (etapasAninhadas.length > 0 ? Math.max(...etapasAninhadas.map(e => e.ordem)) + 1 : 1),
    }
    saveEtapaMutation.mutate(payload)
  }

  const handleDeleteEtapa = (etapaId: string) => {
    if (confirm('Tem certeza que deseja apagar esta etapa e todos os seus passos?')) {
      deleteEtapaMutation.mutate(etapaId)
    }
  }

  const handleSavePasso = () => {
    if (!etapaAtualParaPasso || !formPassoData.titulo || !formPassoData.tipo_passo) {
      toast.error('Título e tipo do passo são obrigatórios.')
      return
    }
    const { id, quiz_perguntas, ...restOfForm } = formPassoData
    const payload = {
      ...restOfForm,
      id_etapa: etapaAtualParaPasso.id,
      id_igreja: currentChurchId,
      ordem: passoParaEditar ? passoParaEditar.ordem : (etapaAtualParaPasso.passos_etapa.length > 0 ? Math.max(...etapaAtualParaPasso.passos_etapa.map(p => p.ordem)) + 1 : 1),
    }
    if (id) (payload as any).id = id
    savePassoMutation.mutate({ passoData: payload, quizPerguntas: quiz_perguntas })
  }

  const handleDeletePasso = (passoId: string) => {
    if (confirm('Tem certeza que deseja apagar este passo?')) {
      deletePassoMutation.mutate(passoId)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.id.toString().startsWith('etapa-') ? 'etapa' : 'passo'
    
    if (activeType === 'etapa') {
      const oldIndex = etapasAninhadas.findIndex(e => `etapa-${e.id}` === active.id)
      const newIndex = etapasAninhadas.findIndex(e => `etapa-${e.id}` === over.id)
      
      if (oldIndex === -1 || newIndex === -1) return
      
      const reordered = [...etapasAninhadas]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)
      
      const updates = reordered.map((etapa, index) => 
        supabase.from('etapas_trilha').update({ ordem: index + 1 }).eq('id', etapa.id)
      )
      
      await Promise.all(updates)
      queryClient.invalidateQueries({ queryKey: ['jornadaCompleta'] })
      toast.success('Ordem das etapas atualizada!')
    }
  }

  const addQuizQuestion = () => {
    const newQuestion: QuizPergunta = {
      ordem: (formPassoData.quiz_perguntas?.length || 0) + 1,
      pergunta_texto: '',
      opcoes: ['', '', '', ''],
      resposta_correta: 0,
      pontuacao: 10
    }
    setFormPassoData({
      ...formPassoData,
      quiz_perguntas: [...(formPassoData.quiz_perguntas || []), newQuestion]
    })
  }

  const removeQuizQuestion = (index: number) => {
    const updated = [...(formPassoData.quiz_perguntas || [])]
    updated.splice(index, 1)
    setFormPassoData({ ...formPassoData, quiz_perguntas: updated })
  }

  const updateQuizQuestion = (index: number, field: keyof QuizPergunta, value: any) => {
    const updated = [...(formPassoData.quiz_perguntas || [])]
    updated[index] = { ...updated[index], [field]: value }
    setFormPassoData({ ...formPassoData, quiz_perguntas: updated })
  }

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja para configurar a jornada do membro.</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-600">Carregando configuração da jornada...</span>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {isFetching && <div className="fixed top-4 right-4 z-50"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuração da Jornada</h1>
        {!trilhaAtual && (
          <Button onClick={() => setIsCreateTrilhaOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Criar Trilha
          </Button>
        )}
      </div>

      {!trilhaAtual && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Nenhuma trilha ativa encontrada.</p>
          <Button onClick={() => setIsCreateTrilhaOpen(true)}>Criar Nova Trilha</Button>
        </Card>
      )}

      {trilhaAtual && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{trilhaAtual.titulo}</h2>
                <p className="text-gray-600">{trilhaAtual.descricao}</p>
              </div>
              <Button onClick={() => { setIsEtapaModalOpen(true); setEtapaParaEditar(null); setFormEtapaData({ titulo: '', descricao: '', cor: '#e0f2fe' }) }}>
                <Plus className="w-4 h-4 mr-2" /> Nova Etapa
              </Button>
            </div>
          </Card>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={etapasAninhadas.map(e => `etapa-${e.id}`)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {etapasAninhadas.map((etapa) => (
                  <Card key={etapa.id} style={{ backgroundColor: etapa.cor }} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                        <div>
                          <h3 className="text-xl font-semibold">{etapa.titulo}</h3>
                          <p className="text-gray-600">{etapa.descricao}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEtapaParaEditar(etapa); setFormEtapaData(etapa); setIsEtapaModalOpen(true) }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteEtapa(etapa.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => { setEtapaAtualParaPasso(etapa); setPassoParaEditar(null); setFormPassoData({ titulo: '', tipo_passo: 'leitura', conteudo: '', quiz_perguntas: [], nota_de_corte_quiz: 70, escola_pre_requisito_id: null }); setIsPassoModalOpen(true) }}>
                          <Plus className="w-4 h-4 mr-1" /> Passo
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {etapa.passos_etapa.map((passo) => (
                        <div key={passo.id} className="p-3 bg-white border rounded-md flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {tiposPasso.find(t => t.value === passo.tipo_passo)?.icon}
                            <div>
                              <p className="font-medium">{passo.titulo}</p>
                              <Badge variant="secondary" className="text-xs">{tiposPasso.find(t => t.value === passo.tipo_passo)?.name}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setPassoParaEditar(passo); setEtapaAtualParaPasso(etapa); setFormPassoData(passo); setIsPassoModalOpen(true) }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeletePasso(passo.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Dialog para criar/editar etapa */}
      <Dialog open={isEtapaModalOpen} onOpenChange={setIsEtapaModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{etapaParaEditar ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={formEtapaData.titulo} onChange={(e) => setFormEtapaData({...formEtapaData, titulo: e.target.value})} />
            </div>
            <div>
              <Label>Descrição *</Label>
              <Textarea value={formEtapaData.descricao} onChange={(e) => setFormEtapaData({...formEtapaData, descricao: e.target.value})} rows={3} />
            </div>
            <div>
              <Label>Cor</Label>
              <Select value={formEtapaData.cor} onValueChange={(v) => setFormEtapaData({...formEtapaData, cor: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {coresDisponiveis.map(c => <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEtapaModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveEtapa} disabled={saveEtapaMutation.isPending}>
                {saveEtapaMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar/editar passo */}
      <Dialog open={isPassoModalOpen} onOpenChange={setIsPassoModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{passoParaEditar ? 'Editar Passo' : 'Novo Passo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={formPassoData.titulo} onChange={(e) => setFormPassoData({...formPassoData, titulo: e.target.value})} />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={formPassoData.tipo_passo} onValueChange={(v: any) => setFormPassoData({...formPassoData, tipo_passo: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposPasso.map(t => <SelectItem key={t.value} value={t.value}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {(formPassoData.tipo_passo === 'leitura' || formPassoData.tipo_passo === 'video' || formPassoData.tipo_passo === 'acao' || formPassoData.tipo_passo === 'link_externo') && (
              <div>
                <Label>Conteúdo</Label>
                <Textarea value={formPassoData.conteudo} onChange={(e) => setFormPassoData({...formPassoData, conteudo: e.target.value})} rows={5} />
              </div>
            )}

            {formPassoData.tipo_passo === 'conclusao_escola' && (
              <div>
                <Label>Escola Pré-requisito *</Label>
                <Select value={formPassoData.escola_pre_requisito_id || ''} onValueChange={(v) => setFormPassoData({...formPassoData, escola_pre_requisito_id: v || null})}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma escola" /></SelectTrigger>
                  <SelectContent>
                    {availableSchools.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formPassoData.tipo_passo === 'quiz' && (
              <div className="space-y-4">
                <div>
                  <Label>Nota de Corte (%)</Label>
                  <Input type="number" min="0" max="100" value={formPassoData.nota_de_corte_quiz} onChange={(e) => setFormPassoData({...formPassoData, nota_de_corte_quiz: parseInt(e.target.value) || 70})} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Perguntas do Quiz</Label>
                    <Button size="sm" onClick={addQuizQuestion}><Plus className="w-4 h-4 mr-1" /> Pergunta</Button>
                  </div>
                  {(formPassoData.quiz_perguntas || []).map((q, idx) => (
                    <Card key={idx} className="p-4 mb-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Pergunta {idx + 1}</Label>
                          <Button size="sm" variant="ghost" onClick={() => removeQuizQuestion(idx)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <Input placeholder="Texto da pergunta" value={q.pergunta_texto} onChange={(e) => updateQuizQuestion(idx, 'pergunta_texto', e.target.value)} />
                        {q.opcoes.map((op, opIdx) => (
                          <Input key={opIdx} placeholder={`Opção ${opIdx + 1}`} value={op} onChange={(e) => {
                            const newOpcoes = [...q.opcoes]
                            newOpcoes[opIdx] = e.target.value
                            updateQuizQuestion(idx, 'opcoes', newOpcoes)
                          }} />
                        ))}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Resposta Correta</Label>
                            <Select value={String(q.resposta_correta)} onValueChange={(v) => updateQuizQuestion(idx, 'resposta_correta', parseInt(v))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[0, 1, 2, 3].map(i => <SelectItem key={i} value={String(i)}>Opção {i + 1}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Pontuação</Label>
                            <Input type="number" value={q.pontuacao} onChange={(e) => updateQuizQuestion(idx, 'pontuacao', parseInt(e.target.value) || 10)} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPassoModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSavePasso} disabled={savePassoMutation.isPending}>
                {savePassoMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateTrilhaDialog isOpen={isCreateTrilhaOpen} onOpenChange={setIsCreateTrilhaOpen} />
    </div>
  )
}

export default ConfiguracaoJornada