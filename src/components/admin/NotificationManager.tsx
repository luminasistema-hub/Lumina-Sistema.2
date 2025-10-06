import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Send, History, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NotificationTemplateEditor from './NotificationTemplateEditor';

const NotificationManager = () => {
  const { currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');

  const queryKey = ['all-notifications', currentChurchId];

  const { data: notifications, isLoading: isLoadingHistory } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!currentChurchId) return [];
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('id_igreja', currentChurchId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!currentChurchId,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!currentChurchId || !title || !description) {
        throw new Error('Título e descrição são obrigatórios.');
      }
      const { error } = await supabase.from('notificacoes').insert({
        id_igreja: currentChurchId,
        user_id: null, // Para todos
        tipo: 'CUSTOM_ADMIN',
        titulo: title,
        descricao: description,
        link: link || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notificação enviada para toda a igreja!');
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Invalida o hook de notificações dos usuários
      setTitle('');
      setDescription('');
      setLink('');
    },
    onError: (err: any) => {
      toast.error(`Erro ao enviar: ${err.message}`);
    },
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Gestão de Notificações</h1>
      <Tabs defaultValue="send">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send"><Send className="w-4 h-4 mr-2" />Enviar Nova</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-2" />Modelos</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-2" />Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Notificação Personalizada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião de Oração" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a notificação..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link (Opcional)</Label>
                <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Ex: /dashboard?module=events" />
              </div>
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {sendMutation.isPending ? 'Enviando...' : 'Enviar para Todos'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates">
            <Card>
                <CardHeader>
                    <CardTitle>Modelos de Notificação Automática</CardTitle>
                </CardHeader>
                <CardContent>
                    <NotificationTemplateEditor />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {notifications?.map(n => (
                    <div key={n.id} className="p-3 border rounded-md">
                      <p className="font-semibold">{n.titulo}</p>
                      <p className="text-sm text-gray-600">{n.descricao}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationManager;