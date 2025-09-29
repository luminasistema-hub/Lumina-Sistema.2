import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Calendar, Clock, ArrowRight, Bell } from 'lucide-react';

const AdminPastorDashboardContent = () => {
  // Próximos eventos (versão admin)
  const upcomingEvents = [
    {
      title: 'Culto de Domingo',
      date: '15 Set',
      time: '19:00',
      type: 'Culto',
    },
    {
      title: 'Estudo Bíblico',
      date: '17 Set',
      time: '20:00',
      type: 'Ensino',
    },
    {
      title: 'Conferência de Avivamento',
      date: '20 Set',
      time: '19:30',
      type: 'Evento Especial',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas atualizações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'Novo membro cadastrado', description: 'Maria Silva se juntou à igreja', time: '2 horas atrás' },
              { title: 'Evento atualizado', description: 'Culto de Louvor - Domingo 15/09', time: '4 horas atrás' },
              { title: 'Doação recebida', description: 'Oferta de R$ 250,00 via PIX', time: '1 dia atrás' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>Eventos programados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-green-700">{event.date}</p>
                    <p className="text-xs text-green-600">{event.time}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-gray-600">{event.type}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Progresso Mensal</CardTitle>
            <CardDescription>Metas e objetivos da igreja</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Membros Ativos</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Meta Financeira</span>
                  <span>72%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Alertas e lembretes importantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Reunião de Liderança</p>
                <p className="text-xs text-gray-600">Amanhã às 19:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Aniversário de Membro</p>
                <p className="text-xs text-gray-600">3 aniversários esta semana</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AdminPastorDashboardContent;