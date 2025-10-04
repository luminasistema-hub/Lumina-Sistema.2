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
import { Copy, RefreshCcw } from 'lucide-react';
import QRCode from 'react-qr-code';

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

  // Realtime: atualiza sessão quando QR/status mudar
  useEffect(() => {
    if (!currentChurchId) return;
    const channel = supabase
      .channel(`whatsapp_sessions_${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_sessions', filter: `church_id=eq.${currentChurchId}` },
        (payload) => {
          const row = (payload.new || payload.old) as SessionRow | null;
          if (row) {
            setSession(row);
            if (row.status === 'connected') {
              toast.success('WhatsApp conectado com sucesso!');
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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

    const baseUpdate = {
      status: 'awaiting_qr' as const,
      qr_code: null as string | null,
      last_heartbeat: new Date().toISOString(),
    };

    // Verifica se já existe sessão para a igreja
    const { data: existing, error: findErr } = await supabase
      .from('whatsapp_sessions')
      .select('id')
      .eq('church_id', currentChurchId)
      .limit(1)
      .maybeSingle();

    if (findErr) {
      toast.error('Erro ao verificar sessão existente');
      return;
    }

    if (existing?.id) {
      // Atualiza sessão existente
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .update(baseUpdate)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) {
        toast.error('Erro ao atualizar sessão');
        return;
      }
      setSession(data as SessionRow);
      toast.success('Sessão atualizada. Aguarde o QR...');
    } else {
      // Cria nova sessão
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .insert({
          church_id: currentChurchId,
          ...baseUpdate,
        })
        .select('*')
        .single();

      if (error) {
        toast.error('Erro ao criar sessão');
        return;
      }
      setSession(data as SessionRow);
      toast.success('Sessão criada. Aguarde o QR...');
    }
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

  const refreshSession = async () => {
    if (!currentChurchId) return;
    const { data: sessRows, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('church_id', currentChurchId)
      .limit(1);
    if (!error) {
      setSession((sessRows || [])[0] || null);
      toast.success('Sessão atualizada.');
    }
  };

  const copyQr = async () => {
    if (!session?.qr_code) return;
    await navigator.clipboard.writeText(session.qr_code);
    toast.success('Chave do QR copiada!');
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={refreshSession}>
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
                  {console.log("Rendering QR Code with value:", session.qr_code)}
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
              <Button variant="outline" onClick={handleSaveTemplate}>Salvar Template</Button>
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