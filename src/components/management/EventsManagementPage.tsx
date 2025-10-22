import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, Search, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import CreateEventDialog from './CreateEventDialog'
import EditEventDialog from './EditEventDialog'
import EventCard from './EventCard'
import useDebouncedValue from '@/hooks/useDebouncedValue'

interface Event {
  id: string
  id_igreja: string
  nome: string
  descricao?: string
  data_hora: string
  local: string
  tipo: string
  status: string
  capacidade_maxima?: number
  inscricoes_abertas: boolean
  valor_inscricao?: number
  link_externo?: string
  compartilhar_com_filhas?: boolean
}

const EventsManagementPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const debouncedSearch = useDebouncedValue(searchTerm, 300)

  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['events-management', currentChurchId, debouncedSearch, typeFilter, statusFilter],
    queryFn: async () => {
      if (!currentChurchId) return []

      try {
        let query = supabase
          .from('eventos')
          .select('*')
          .eq('id_igreja', currentChurchId)
          .order('data_hora', { ascending: false })

        if (debouncedSearch) {
          query = query.ilike('nome', `%${debouncedSearch}%`)
        }
        if (typeFilter !== 'all') {
          query = query.eq('tipo', typeFilter)
        }
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (error) throw error
        return (data || []) as Event[]
      } catch (err: any) {
        console.error('Erro ao buscar eventos:', err)
        toast.error('Erro ao carregar eventos: ' + err.message)
        return []
      }
    },
    enabled: !!currentChurchId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('eventos').delete().eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Evento excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['events-management'] })
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir evento: ' + error.message)
    },
  })

  const handleDelete = (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      deleteMutation.mutate(eventId)
    }
  }

  const filteredEvents = useMemo(() => events, [events])

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Selecione uma igreja para gerenciar eventos.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar eventos</h3>
            <p className="text-red-700 mb-4">{(error as Error).message}</p>
            <Button onClick={() => refetch()} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Eventos</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie os eventos da igreja</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Culto">Culto</SelectItem>
                <SelectItem value="Conferência">Conferência</SelectItem>
                <SelectItem value="Retiro">Retiro</SelectItem>
                <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Planejado">Planejado</SelectItem>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Carregando eventos...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro evento'}
            </p>
            {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => setEditingEvent(event)}
              onDelete={() => handleDelete(event.id)}
            />
          ))}
        </div>
      )}

      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['events-management'] })
        }}
      />

      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          onSuccess={() => {
            setEditingEvent(null)
            queryClient.invalidateQueries({ queryKey: ['events-management'] })
          }}
        />
      )}
    </div>
  )
}

export default EventsManagementPage