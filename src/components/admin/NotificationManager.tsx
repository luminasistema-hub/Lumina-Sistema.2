import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Send, History, FileText, ChevronsUpDown, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NotificationTemplateEditor from './NotificationTemplateEditor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '../ui/badge';
import { Switch } from '@/components/ui/switch';
import { sendEmailNotification } from '@/services/notificationService';
import { createStandardEmailHtml } from '@/lib/emailTemplates';

const NotificationManager = () => {
  const { currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  const historyQueryKey = ['all-notifications', currentChurchId];
  const membersQueryKey = ['church-members', currentChurchId];

  const { data: notifications, isLoading: isLoadingHistory } = useQuery({
    queryKey: historyQueryKey,
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

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: membersQueryKey,
    queryFn: async () => {
      if (!currentChurchId) return [];
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_completo, email')
        .eq('id_igreja', currentChurchId)
        .order('nome_completo');
      if (error) throw error;
      return data;
    },
    enabled: !!currentChurchId,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ sendAsEmail }: { sendAsEmail: boolean }) => {
      if (!currentChurchId || !title || !description) {
        throw new Error('Título e descrição são obrigatórios.');
      }

      let inAppPayload: any[];
      let emailRecipients: { id: string; nome_completo: string; email: string }[] = [];

      if (selectedMembers.length > 0) {
        inAppPayload = selectedMembers.map((member) => ({
          id_igreja: currentChurchId,
          membro_id: member.id,
          tipo: 'CUSTOM_ADMIN',
          titulo: title,
          descricao: description,
          link: link || null,
        }));
        emailRecipients = selectedMembers;
      } else {
        // Enviar para todos
        inAppPayload = [
          {
            id_igreja: currentChurchId,
            membro_id: null, // Broadcast in-app
            tipo: 'CUSTOM_ADMIN',
            titulo: title,
            descricao: description,
            link: link || null,
          },
        ];
        emailRecipients = members || [];
      }

      // 1. Enviar Notificações In-App
      const { error: inAppError } = await supabase.from('notificacoes').insert(inAppPayload);
      if (inAppError) {
        throw new Error(`Erro ao criar notificações no app: ${inAppError.message}`);
      }

      // 2. Enviar E-mails se solicitado
      if (sendAsEmail) {
        if (!emailRecipients || emailRecipients.length === 0) {
          toast.warning('Nenhum destinatário com e-mail encontrado para enviar.');
          return;
        }

        const churchName = useAuthStore.getState().churchName || 'Sua Igreja';
        const emailHtmlContent = createStandardEmailHtml({
          title,
          description,
          link,
          churchName,
          notificationType: 'Comunicado da Igreja',
        });

        const emailPromises = emailRecipients
          .filter((member) => member.email)
          .map((member) =>
            sendEmailNotification({
              to: member.email,
              subject: `[${churchName}] ${title}`,
              htmlContent: emailHtmlContent,
            })
          );

        await Promise.all(emailPromises);
      }
    },
    onSuccess: () => {
      const target = selectedMembers.length > 0 ? `${selectedMembers.length} membro(s)` : 'toda a igreja';
      toast.success(`Notificação enviada para ${target}!`);
      if (sendEmail) {
        toast.info('Os e-mails estão sendo processados em segundo plano.');
      }
      queryClient.invalidateQueries({ queryKey: historyQueryKey });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setTitle('');
      setDescription('');
      setLink('');
      setSelectedMembers([]);
      setSendEmail(false);
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
              <CardDescription>Envie uma mensagem para membros específicos ou para toda a igreja.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Destinatários</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between">
                      {selectedMembers.length > 0 ? `${selectedMembers.length} membro(s) selecionado(s)` : "Selecionar membros..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar membro..." />
                      <CommandList>
                        <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                        <CommandGroup>
                          {members?.map((member) => (
                            <CommandItem
                              key={member.id}
                              value={member.nome_completo}
                              onSelect={() => {
                                const isSelected = selectedMembers.some(m => m.id === member.id);
                                if (isSelected) {
                                  setSelectedMembers(prev => prev.filter(m => m.id !== member.id));
                                } else {
                                  setSelectedMembers(prev => [...prev, member]);
                                }
                                setOpenCombobox(false);
                              }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${selectedMembers.some(m => m.id === member.id) ? "opacity-100" : "opacity-0"}`} />
                              {member.nome_completo}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">Deixe em branco para enviar para todos os membros da igreja.</p>
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedMembers.map(member => (
                      <Badge key={member.id} variant="secondary" className="flex items-center gap-1">
                        {member.nome_completo}
                        <button onClick={() => setSelectedMembers(prev => prev.filter(m => m.id !== member.id))} className="rounded-full hover:bg-muted-foreground/20">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
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
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="send-email" checked={sendEmail} onCheckedChange={setSendEmail} />
                <Label htmlFor="send-email">Enviar também por e-mail</Label>
              </div>
              <Button onClick={() => sendMutation.mutate({ sendAsEmail: sendEmail })} disabled={sendMutation.isPending || !title || !description}>
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {sendMutation.isPending ? 'Enviando...' : (selectedMembers.length > 0 ? `Enviar para ${selectedMembers.length} Membro(s)` : 'Enviar para Todos')}
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
                        Enviado {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        {n.membro_id ? ` para um usuário específico` : ' para toda a igreja'}
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