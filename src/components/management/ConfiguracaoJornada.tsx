import { useState, useEffect } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  })

  const trilhaAtual = jornadaData ? {
    id: jornadaData.id,
    titulo: jornadaData.titulo,
    descricao: jornadaData.descricao
  } : null

  const etapasAninhadas = jornadaData?.etapas_trilha || []

  useEffect(() => {
    if (!currentChurchId) return

    const channel = supabase
      .channel(`jornada-config-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trilhas_crescimento', filter: `id_igreja=eq.${currentChurchId}` },
        () => queryClient.invalidateQueries({ queryKey: ['jornadaCompleta', currentChurchId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'etapas_trilha' },
        () => queryClient.invalidateQueries({ queryKey: ['jornadaCompleta', currentChurchId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'passos_etapa' },
        () => queryClient.invalidateQueries({ queryKey: ['jornadaCompleta', currentChurchId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_perguntas' },
        () => queryClient.invalidateQueries({ queryKey: ['jornadaCompleta', currentChurchId] })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentChurchId, queryClient])

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para configurar a jornada do membro.
      </div>
    )
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
      {isFetching && (
        <div className="fixed top-4 right-4 z-50">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
        </div>
      )}
      
      {!trilhaAtual && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Nenhuma trilha ativa encontrada.</p>
          <Button>Criar Nova Trilha</Button>
        </Card>
      )}

      {trilhaAtual && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-2">{trilhaAtual.titulo}</h2>
            <p className="text-gray-600">{trilhaAtual.descricao}</p>
          </Card>

          <div className="space-y-4">
            {etapasAninhadas.map((etapa) => (
              <Card key={etapa.id} className="p-6">
                <h3 className="text-xl font-semibold mb-2">{etapa.titulo}</h3>
                <p className="text-gray-600 mb-4">{etapa.descricao}</p>
                
                <div className="space-y-2">
                  {etapa.passos_etapa.map((passo) => (
                    <div key={passo.id} className="p-3 border rounded-md">
                      <p className="font-medium">{passo.titulo}</p>
                      <p className="text-sm text-gray-500">{passo.tipo_passo}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfiguracaoJornada