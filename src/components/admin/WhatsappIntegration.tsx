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
import { Phone, QrCode, Link2, CheckCircle, Clock } from 'lucide-react';

type SessionRow = {
  id: string;
  church_id: string;
  status: 'awaiting_qr' | 'connected' | 'disconnected';
  phone_number?: string | null;
  qr_code?: string | null;
  last_heartbeat?: string | null;
};

type TemplateRow = { id: string; key: string; content: string };

const WhatsappIntegration = () => {
  const { user, currentChurchId } = useAuthStore();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('schedule_assigned');
  const [selectedTemplateContent, setSelectedTemplateContent] = useState<string>('');
  const [testPhone, setTestPhone] = useState<string>('');
  const [lastProcessInfo, setLastProcessInfo] = useState<string>('');

  const isLeader = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'pastor';
  }, [user?.role]);

  useEffect(() => {
    if (!currentChurchId) return;
    const load = async () => {
      const { data: sessRows } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('church_id', currentChurchId)
        .limit(1);
      const sess = (sessRows || [])[0] || null;
      setSession(sess);

      const { data: tmplRows } = await supabase
        .from('whatsapp_templates')
        .select('id, key, content')
        .eq('church_id', currentChurchId)
        .order('key');
      setTemplates(tmplRows || []);
      const initial = (tmplRows || []).find(t => t.key === 'schedule_assigned');
      setSelectedTemplateContent(initial?.content || '');
    };
    load();
  }, [currentChurchId]);

  useEffect(() => {
    const t = templates.find(t => t.key === selectedTemplateKey);
    setSelectedTemplateContent(t?.content || '');
  }, [selectedTemplateKey, templates]);

  useEffect(() => {
    if (!currentChurchId) return;
    const interval = setInterval(async () => {
      const { data, error } = await supabase.functions.invoke('process-whatsapp', { body: {} });
      if (!error) {
        setLastProcessInfo(`Processado às ${new Date().toLocaleTimeString('pt-BR')}: ${data?.processed ?? 0} mensagens`);
      }
    }, 60000); // 60s
    return () => clearInterval(interval);
  }, [currentChurchId]);

  const handleStartLinking = async () => {
    if (!currentChurchId) return;
    const payload = {
      church_id: currentChurchId,
      status: 'awaiting_qr' as const,
      qr_code: 'QR será exibido pelo serviço de sessão externo.',
      last_heartbeat: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .upsert(payload, { onConflict: 'church_id' })
      .select('*')
      .maybeSingle();
    if (error) { toast.error('Erro ao iniciar vinculação'); return; }
    setSession(data as SessionRow);
    toast.success('Sessão iniciada. Escaneie o QR no serviço de sessão.');
  };

  const handleSaveTemplate = async () => {
    if (!currentChurchId) return;
    const { error } = await supabase
      .from('whatsapp_templates')
      .upsert({ church_id: currentChurchId, key: selectedTemplateKey, content: selectedTemplateContent }, { onConflict: 'church_id,key' });
    if (error) { toast.error('Erro ao salvar template'); return; }
    toast.success('Template atualizado!');
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
                <Button onClick={handleStartLinking} disabled={!isLeader}>
                  <Link2 className="w-4 h-4 mr-2" /> Iniciar Vinculação
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Nenhuma sessão configurada ainda.</p>
              <Button onClick={handleStartLinking} disabled={!isLeader}>
                <Link2 className="w-4 h-4 mr-2" /> Criar Sessão
              </Button>
            </div>
          )}

          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {session?.qr_code || 'QR será fornecido pelo serviço de sessão.'}
            </p>
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
              <Button variant="outline" onClick={handleSaveTemplate}>Salvar Template</Button>
            </div>
            <p className="text-xs text-gray-500">
              Variáveis: use {{'{{chaves}}'}} como {{'{{evento_nome}}'}}, {{'{{data}}'}}, {{'{{ministerio}}'}}, {{'{{codigo}}'}}, {{'{{hora}}'}}, {{'{{valor}}'}}, {{'{{numero_documento}}'}}.
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