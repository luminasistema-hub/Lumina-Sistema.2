import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuthStore } from '@/stores/authStore'
import { useEvents } from '@/hooks/useEvents'
import { Event, NewEvent } from '@/types/event'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EventForm } from './EventForm'
import { Plus, Calendar, MapPin, Users, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

const EventsPage = () => {
  const { user } = useAuthStore()
  const { events, isLoading, createEvent, enrollInEvent, cancelEnrollment } = useEvents()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const canManage = user?.role === 'admin' || user?.role === 'pastor'

  const handleCreateEvent = (eventData: NewEvent, coverFile: File | null) => {
    createEvent({ eventData, coverFile }, {
      onSuccess: () => setIsCreateOpen(false)
    })
  }

  const handleEnroll = (event: Event) => {
    if (event.vagas && event.participantes.length >= event.vagas) {
      alert('Vagas esgotadas!')
      return
    }
    enrollInEvent(event.id)
  }

  const handleCancel = (event: Event) => {
    const participation = event.participantes.find(p => p.membro_id === user?.id)
    if (participation) {
      cancelEnrollment(participation.id)
    }
  }

  const upcomingEvents = events.filter(e => new Date(e.data_hora) >= new Date())
  const pastEvents = events.filter(e => new Date(e.data_hora) < new Date())

  if (isLoading) return <div className="p-6">Carregando eventos...</div>

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Eventos</h1>
        {canManage && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Criar Evento</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
              </DialogHeader>
              <EventForm onSubmit={handleCreateEvent} isSubmitting={false} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Próximos Eventos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
            const userIsEnrolled = event.participantes.some(p => p.membro_id === user?.id)
            const vagasDisponiveis = event.vagas ? event.vagas - event.participantes.length : Infinity
            return (
              <Card key={event.id} className="flex flex-col">
                {event.imagem_capa && <img src={event.imagem_capa} alt={event.nome} className="w-full h-40 object-cover rounded-t-lg" />}
                <CardHeader>
                  <CardTitle>{event.nome}</CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-2">
                    <Calendar className="h-4 w-4" /> {format(new Date(event.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{event.descricao}</p>
                  <div className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.local || 'Online'}</div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {event.vagas ? `${vagasDisponiveis} vagas de ${event.vagas}` : 'Vagas ilimitadas'}</div>
                    <Badge variant="secondary">R$ {event.valor.toFixed(2)}</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-2">
                  {userIsEnrolled ? (
                    <Button variant="destructive" onClick={() => handleCancel(event)}><XCircle className="mr-2 h-4 w-4" /> Cancelar Inscrição</Button>
                  ) : (
                    <Button onClick={() => handleEnroll(event)} disabled={vagasDisponiveis <= 0}><CheckCircle className="mr-2 h-4 w-4" /> Inscrever-se</Button>
                  )}
                  {event.link_externo && <Button asChild variant="outline"><a href={event.link_externo} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Acessar Link</a></Button>}
                </CardFooter>
              </Card>
            )
          }) : <p className="text-muted-foreground col-span-full">Nenhum evento futuro agendado.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Eventos Passados</h2>
        {/* A listagem de eventos passados pode ser implementada de forma similar se necessário */}
        <p className="text-muted-foreground">Aqui serão listados os eventos que já aconteceram.</p>
      </section>
    </div>
  )
}

export default EventsPage