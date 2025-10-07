"use client";

import React from 'react'
import { useMyGrowthGroups } from '@/hooks/useGrowthGroups'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin, Phone, Users } from 'lucide-react'

const MyGrowthGroup: React.FC = () => {
  const { data: myGroups } = useMyGrowthGroups()

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Meu(s) Grupo(s) de Crescimento</h1>
        <p className="text-sm text-muted-foreground">Veja as informações das próximas reuniões e contatos do seu GC.</p>
      </div>

      {(myGroups || []).length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum grupo encontrado</CardTitle>
            <CardDescription>Você ainda não faz parte de um grupo de crescimento.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(myGroups || []).map(g => (
          <Card key={g.id} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> {g.nome}
              </CardTitle>
              {g.descricao && <CardDescription>{g.descricao}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> <span>Dia: {g.meeting_day || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> <span>Horário: {g.meeting_time || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> <span>Local: {g.meeting_location || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> <span>Contato: {g.contact_phone || '—'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default MyGrowthGroup