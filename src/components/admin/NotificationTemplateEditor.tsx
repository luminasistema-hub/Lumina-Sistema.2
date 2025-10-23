import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Template {
  tipo: string;
  titulo: string;
  descricao: string;
  link?: string | null;
  placeholders?: string[];
}

const TEMPLATE_CONFIG: Record<string, Omit<Template, 'titulo'|'descricao'|'link'>> = {
  'ANIVERSARIO': {
    tipo: 'Aniversário de Membro',
    placeholders: ['{{nome_membro}}'],
  },
  'ANIVERSARIO_CASAMENTO': {
    tipo: 'Aniversário de Casamento',
    placeholders: ['{{nome_casal}}'],
  },
  'NOVA_ESCALA': {
    tipo: 'Nova Escala de Serviço',
    placeholders: ['{{nome_evento}}', '{{data_evento}}'],
  },
  'ACCESS_GRANTED': {
    tipo: 'Aprovação de Novo Membro',
    placeholders: ['{{nome_membro}}'],
  },
  'KIDS_CHECKIN': {
    tipo: 'Check-in no Ministério Infantil',
    placeholders: ['{{nome_crianca}}', '{{codigo_seguranca}}'],
  },
  'KIDS_CHECKOUT': {
    tipo: 'Check-out no Ministério Infantil',
    placeholders: ['{{nome_crianca}}'],
  },
  'NOVO_EVENTO': {
    tipo: 'Notificação de Novo Evento',
    placeholders: ['{{nome_evento}}', '{{data_evento}}'],
  },
  'NEW_DEVOTIONAL': {
    tipo: 'Publicação de Novo Devocional',
    placeholders: ['{{titulo_devocional}}'],
  },
};

const DEFAULT_TEMPLATES: Record<string, Omit<Template, 'tipo'>> = {
    'ANIVERSARIO': {
        titulo: 'Feliz Aniversário, {{nome_membro}}! 🎉',
        descricao: 'Hoje é um dia especial! Desejamos a você um feliz aniversário, que Deus te abençoe grandemente.',
    },
    'ANIVERSARIO_CASAMENTO': {
        titulo: 'Feliz Aniversário de Casamento! 💑',
        descricao: 'Parabéns por mais um ano de união, {{nome_casal}}! Que Deus continue abençoando o casamento de vocês.',
    },
    'NOVA_ESCALA': {
        titulo: 'Você foi escalado para um evento!',
        descricao: 'Você foi adicionado à equipe de serviço do evento "{{nome_evento}}", que acontecerá em {{data_evento}}.',
        link: '/dashboard?module=my-ministry',
    },
    'ACCESS_GRANTED': {
        titulo: 'Bem-vindo(a) à nossa igreja!',
        descricao: 'Olá, {{nome_membro}}! Seu acesso à nossa plataforma foi liberado. Explore os recursos e conecte-se com a comunidade.',
        link: '/dashboard',
    },
    'KIDS_CHECKIN': {
        titulo: 'Check-in realizado!',
        descricao: '{{nome_crianca}} foi recebido(a) no ministério infantil. O código de segurança para retirada é: {{codigo_seguranca}}.',
        link: '/dashboard?module=kids-management',
    },
    'KIDS_CHECKOUT': {
        titulo: 'Check-out realizado!',
        descricao: '{{nome_crianca}} foi retirado(a) com segurança do ministério infantil.',
        link: '/dashboard?module=kids-management',
    },
    'NOVO_EVENTO': {
        titulo: 'Temos um novo evento!',
        descricao: 'Não perca! O evento "{{nome_evento}}" acontecerá em {{data_evento}}. Participe conosco!',
        link: '/dashboard?module=events',
    },
    'NEW_DEVOTIONAL': {
        titulo: 'Novo Devocional Disponível',
        descricao: 'Um novo devocional, "{{titulo_devocional}}", foi publicado para sua leitura e meditação. Acesse agora!',
        link: '/dashboard?module=devotionals',
    },
}

const TemplateEditor = ({ templateKey }: { templateKey: string }) => {
  const { currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState<Partial<Template>>({});

  const queryKey = ['notification_template', currentChurchId, templateKey];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('id_igreja', currentChurchId!)
        .eq('tipo', templateKey)
        .maybeSingle();
      return data;
    },
    enabled: !!currentChurchId,
  });

  useEffect(() => {
    if (data) {
      setTemplate(data);
    } else if (!isLoading) {
      setTemplate(DEFAULT_TEMPLATES[templateKey]);
    }
  }, [data, isLoading, templateKey]);

  const mutation = useMutation({
    mutationFn: async (newTemplate: Partial<Template>) => {
      const { error } = await supabase.from('notification_templates').upsert({
        id_igreja: currentChurchId!,
        tipo: templateKey,
        titulo: newTemplate.titulo,
        descricao: newTemplate.descricao,
        link: newTemplate.link,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Modelo "${TEMPLATE_CONFIG[templateKey].tipo}" salvo com sucesso!`);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  const handleSave = () => {
    mutation.mutate(template);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando modelo...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{TEMPLATE_CONFIG[templateKey].tipo}</CardTitle>
        {TEMPLATE_CONFIG[templateKey].placeholders && TEMPLATE_CONFIG[templateKey].placeholders!.length > 0 && (
            <CardDescription>
                Variáveis disponíveis: {TEMPLATE_CONFIG[templateKey].placeholders!.join(', ')}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input
            value={template.titulo || ''}
            onChange={(e) => setTemplate(prev => ({ ...prev, titulo: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            value={template.descricao || ''}
            onChange={(e) => setTemplate(prev => ({ ...prev, descricao: e.target.value }))}
            rows={4}
          />
        </div>
        {DEFAULT_TEMPLATES[templateKey]?.link !== undefined && (
            <div className="space-y-2">
                <Label>Link (Opcional)</Label>
                <Input
                    value={template.link || ''}
                    onChange={(e) => setTemplate(prev => ({ ...prev, link: e.target.value }))}
                />
            </div>
        )}
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Modelo
        </Button>
      </CardContent>
    </Card>
  );
};

const NotificationTemplateEditor = () => {
  return (
    <div className="space-y-6">
      {Object.keys(TEMPLATE_CONFIG).map(key => (
        <TemplateEditor key={key} templateKey={key} />
      ))}
    </div>
  );
};

export default NotificationTemplateEditor;