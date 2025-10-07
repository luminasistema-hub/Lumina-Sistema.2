import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useMinistrySchedules } from '@/hooks/useMinistrySchedules';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MinistrySchedulesProps {
  ministerioId: string;
}

const MinistrySchedules: React.FC<MinistrySchedulesProps> = ({ ministerioId }) => {
  const { user, currentChurchId } = useAuthStore();
  const { data: schedules = [], isLoading: loading } = useMinistrySchedules(ministerioId, currentChurchId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Escalas de Serviço</h3>
        {(user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio') && (
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Escala
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{schedule.evento?.nome}</CardTitle>
                <Badge variant={schedule.status === 'Confirmado' ? 'default' : 'secondary'}>
                  {schedule.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(schedule.data_servico), 'PPP', { locale: ptBR })}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {schedule.voluntarios?.length || 0} voluntários confirmados
                </div>

                {schedule.observacoes && (
                  <p className="text-sm text-gray-600 italic">{schedule.observacoes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {schedules.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Nenhuma escala disponível</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MinistrySchedules;