import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Phone, QrCode, Link2, CheckCircle, Clock, Copy, RefreshCcw, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useWhatsappSession } from '@/hooks/useWhatsappSession';
import { useWhatsappTemplates } from '@/hooks/useWhatsappTemplates';

const WhatsappIntegration = () => {
  const { user, currentChurchId } = useAuthStore();
  const { session, isLoading: isLoadingSession, isInitializing, initSession, refetch: refetchSession } = useWhatsappSession();
  const { templates, isLoading: isLoadingTemplates, saveTemplate, isSaving: isSavingTemplate } = useWhatsappTemplates();
  
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('schedule_assigned');
  const [selectedTemplateContent, setSelectedTemplateContent] = useState<string>('');
  const [testPhone, setTestPhone] = useState<string>('');
  const [lastProcessInfo, setLastProcessInfo] = useState<string>('');

  const isLeader = useMemo(() => user?.role === 'admin' || user?.role === 'pastor', [user?.role]);

  // Realtime subscription to update session
  useEffect(() => {
    if (!currentChurchId) return;
    const channel = supabase
      .channel(`whatsapp_sessions_${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_sessions', filter: `church_id=eq.${currentChurchId}` },
        (payload) => {
          if (payload.new) {
            refetchSession();
            if ((payload.new as any).status === 'connected' && (payload.old as any)?.status !== 'connected') {
              toast.success('WhatsApp conectado com sucesso!');
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentChurchId, refetchSession]);

  // Update content when template selection changes
  useEffect(() => {
    const t = templates.find(t => t.key === selectedTemplateKey);
    setSelectedTemplateContent(t?.content || '');
  }, [selectedTemplateKey, templates]);

  const handleStartLinking = () => {
    initSession(undefined, {
      onError: (err: any) => toast.error(`Erro ao iniciar vinculação: ${err.message}`),
      onSuccess: () => toast.info('Solicitando novo QR Code...'),
    });
  };

  const handleSaveTemplate = () => {
    saveTemplate({ key: selectedTemplateKey, content: selectedTemplateContent }, {
      onSuccess: () => toast.success('Template atualizado!'),
      onError: (err: any) => toast.error(`Erro ao salvar: ${err.message}`),
    });
  };

  const handleSendTest = async () => {
    if (!currentChurchId || !testPhone || !selectedTemplateKey) {
      toast.error('Informe telefone e selecione um template.');
      return;
    }
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        church_id: currentChurchId,
        recipient_phone: testPhone,
        template_key: selectedTemplateKey,
        payload: { exemplo: 'teste' },
      });
    if (error) { toast.error('Erro ao enfileirar teste'); return; }
    toast.success('Mensagem de teste enfileirada!');
  };

  const handleProcessNow = async () => {
    const { data, error } = await supabase.functions.invoke('process-whatsapp', { body: {} });
    if (error) { toast.error('Falha ao processar fila'); return; }
    setLastProcessInfo(`Processado às ${new Date().toLocaleTimeString('pt-BR')}: ${data?.processed ?? 0} mensagens`);
    toast.success('Fila processada!');
  };

  const copyQr = async () => {
    if (!session?.qr_code) return;
    await navigator.clipboard.writeText(session.qr_code);
    toast.success('Chave do QR copiada!');
  };

  if (isLoadingSession || isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados de integração...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow">
        <h1 className="text-2xl md:text-3xl font-bold">Integração WhatsApp</h1>
        <p className="text-emerald-100 mt-1">Vincule um número por igreja e gerencie templates e fila de envio.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status da Sessão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Badge className={
                  session.status === 'connected' ? 'bg-green-100 text-green-800' :
                  session.status === 'awaiting_qr' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {session.status}
                </Badge>
                <p className="text-sm text-gray-600">Número vinculado: {session.phone_number || '—'}</p>
                <p className="text-xs text-gray-500">Último sinal: {session.last_heartbeat ? new Date(session.last_heartbeat).toLocaleString('pt-BR') : '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleStartLinking} disabled={!isLeader || isInitializing}>
                  {isInitializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                  {isInitializing ? 'Iniciando...' : 'Iniciar Vinculação'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Nenhuma sessão configurada ainda.</p>
              <Button onClick={handleStartLinking} disabled={!isLeader || isInitializing}>
                {isInitializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                {isInitializing ? 'Criando...' : 'Criar Sessão'}
              </Button>
            </div>
          )}

          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => refetchSession()}>
                  <RefreshCcw className="w-4 h-4 mr-1" /> Atualizar
                </Button>
                <Button variant="ghost" size="sm" onClick={copyQr} disabled={!session?.qr_code}>
                  <Copy className="w-4 h-4 mr-1" /> Copiar
                </Button>
              </div>
            </div>
            {session?.status === 'awaiting_qr' && session?.qr_code ? (
              <div className="mt-3 flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded">
                  <QRCode value={session.qr_code} size={192} />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  No celular: WhatsApp → Dispositivos conectados → Conectar aparelho. Escaneie o QR acima.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1 text-center">
                {session?.status === 'connected'
                  ? 'Dispositivo conectado ao WhatsApp.'
                  : 'Aguardando QR do serviço de sessão. Clique em "Iniciar Vinculação" para gerar um novo QR.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates de Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTemplateKey} onValueChange={setSelectedTemplateKey}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.key} value={t.key}>{t.key}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <Textarea
              value={selectedTemplateContent}
              onChange={(e) => setSelectedTemplateContent(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSaveTemplate} disabled={isSavingTemplate}>
                {isSavingTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isSavingTemplate ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Variáveis: use chaves duplas, por exemplo:
              <span className="ml-1 font-mono">{'{{evento_nome}}'}</span>, <span className="font-mono">{'{{data}}'}</span>, <span className="font-mono">{'{{ministerio}}'}</span>, <span className="font-mono">{'{{codigo}}'}</span>, <span className="font-mono">{'{{hora}}'}</span>, <span className="font-mono">{'{{valor}}'}</span>, <span className="font-mono">{'{{numero_documento}}'}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Telefone para teste (com DDI/DDD)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Button onClick={handleSendTest}>
              <Phone className="w-4 h-4 mr-2" /> Enfileirar Teste
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Clock className="w-4 h-4" />
            <span>{lastProcessInfo || 'Fila processa automaticamente a cada 60s.'}</span>
            <Button variant="outline" size="sm" onClick={handleProcessNow} className="ml-2">Processar agora</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsappIntegration;