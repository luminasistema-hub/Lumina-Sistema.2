import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { Event, NewEvent } from '@/types/event'
import { v4 as uuidv4 } from 'uuid'

const uploadEventCover = async (file: File): Promise<string> => {
  const fileName = `event_covers/${uuidv4()}-${file.name}`
  const { data, error } = await supabase.storage.from('imagens').upload(fileName, file)

  if (error) throw new Error(`Erro no upload da imagem: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage.from('imagens').getPublicUrl(data.path)
  return publicUrl
}

export const useEvents = () => {
  const { currentChurchId, user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: events = [], isLoading, error } = useQuery<Event[]>({
    queryKey: ['events', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return []
      const { data, error } = await supabase
        .from('eventos')
        .select('*, participantes:evento_participantes(*)')
        .eq('id_igreja', currentChurchId)
        .order('data_hora', { ascending: true })
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!currentChurchId,
  })

  const createEventMutation = useMutation({
    mutationFn: async ({ eventData, coverFile }: { eventData: NewEvent, coverFile: File | null }) => {
      let imageUrl: string | undefined = undefined
      if (coverFile) {
        imageUrl = await uploadEventCover(coverFile)
      }
      const { data, error } = await supabase
        .from('eventos')
        .insert([{ ...eventData, id_igreja: currentChurchId, imagem_capa: imageUrl }])
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast.success('Evento criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['events', currentChurchId] })
    },
    onError: (err) => toast.error(`Erro ao criar evento: ${err.message}`),
  })

  const enrollInEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const { data, error } = await supabase
        .from('evento_participantes')
        .insert({ evento_id: eventId, membro_id: user.id })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast.success('Inscrição realizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['events', currentChurchId] })
    },
    onError: (err) => toast.error(`Erro na inscrição: ${err.message}`),
  })

  const cancelEnrollmentMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase.from('evento_participantes').delete().eq('id', participantId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Inscrição cancelada.')
      queryClient.invalidateQueries({ queryKey: ['events', currentChurchId] })
    },
    onError: (err) => toast.error(`Erro ao cancelar: ${err.message}`),
  })

  return {
    events,
    isLoading,
    error,
    createEvent: createEventMutation.mutate,
    enrollInEvent: enrollInEventMutation.mutate,
    cancelEnrollment: cancelEnrollmentMutation.mutate,
  }
}