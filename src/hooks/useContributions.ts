import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { useEffect } from 'react'

export interface Contribution {
  id: string
  tipo: 'Entrada' | 'Saída'
  categoria: 'Dízimos' | 'Ofertas' | 'Doações Especiais' | 'Missões' | 'Obras'
  subcategoria?: string
  valor: number
  data_transacao: string
  descricao: string
  metodo_pagamento: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência'
  responsavel?: string
  status: 'Pendente' | 'Confirmado' | 'Cancelado'
  comprovante?: string
  observacoes?: string
  membro_id: string
  membro_nome?: string
  recibo_emitido: boolean
  numero_documento?: string
  centro_custo?: string
  aprovado_por?: string
  data_aprovacao?: string
  id_igreja: string
}

const fetchContributions = async (churchId: string, userId: string): Promise<Contribution[]> => {
  const { data, error } = await supabase
    .from('transacoes_financeiras')
    .select('*')
    .eq('id_igreja', churchId)
    .eq('tipo', 'Entrada')
    .eq('membro_id', userId)
    .order('data_transacao', { ascending: false })

  if (error) {
    throw new Error('Erro ao carregar contribuições: ' + error.message)
  }
  return data as Contribution[]
}

export const useContributions = () => {
  const { user, currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()
  const queryKey = ['contributions', currentChurchId, user?.id]

  useEffect(() => {
    if (!currentChurchId || !user?.id) return

    const channel = supabase
      .channel(`contributions-${currentChurchId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacoes_financeiras',
          filter: `membro_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentChurchId, user?.id, queryClient, queryKey])

  const { data: contributions = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchContributions(currentChurchId!, user!.id),
    enabled: !!currentChurchId && !!user?.id,
    refetchOnWindowFocus: false,
  })

  if (error) {
    toast.error(error.message)
  }

  const markReceiptAsIssuedMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update({ recibo_emitido: true })
        .eq('id', contributionId)

      if (error) {
        throw new Error('Erro ao marcar recibo como emitido: ' + error.message)
      }
    },
    onSuccess: () => {
      toast.success('Recibo marcado como emitido!')
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return {
    contributions,
    isLoading,
    markReceiptAsIssued: markReceiptAsIssuedMutation.mutate,
  }
}