import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useChurchStore } from '@/stores/churchStore';
import { toast } from 'sonner';
import { Church, Users, Crown, FolderTree, Plus, Eye, Loader2 } from 'lucide-react';
import ChildChurchDashboardDialog from './ChildChurchDashboardDialog';
import CopyRegisterLinkButton from './CopyRegisterLinkButton';
import EditChildChurchDialog from './EditChildChurchDialog';
import DeleteChildChurchDialog from './DeleteChildChurchDialog';

type ChildForm = {
  nome: string;
  nome_responsavel: string;
  email: string;
  telefone_contato: string;
  endereco: string;
  cnpj?: string;
  panel_password?: string;
};

type ChurchRow = {
  id: string;
  nome: string;
  parent_church_id: string | null;
  plano_id: string | null;
  limite_membros: number | null;
  valor_mensal_assinatura: number | null;
};

type ChildItem = {
  id: string;
  nome: string;
  created_at: string;
  metrics: {
    members: number;
    leaders: number;
    ministries: number;
  };
};

const ChildChurchesPage = () => {
  const { currentChurchId, user, setCurrentChurchId } = useAuthStore();
  const churchStore = useChurchStore();
  const [loading, setLoading] = useState(true);
  const [parentInfo, setParentInfo] = useState<{ isChild: boolean; motherId: string | null; motherName?: string } | null>(null);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ChildForm>({
    nome: '',
    nome_responsavel: '',
    email: '',
    telefone_contato: '',
    endereco: '',
    cnpj: '',
    panel_password: ''
  });
  const [openDashboard, setOpenDashboard] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildItem | null>(null);
  const [prefs, setPrefs] = useState({
    shareDevos: false,
    shareEvents: false,
    shareTrilha: false,
  });

  const canManage = useMemo(() => user?.role === 'admin' || user?.role === 'pastor', [user?.role]);

  useEffect(() => {
    if (currentChurchId) {
      const church = churchStore.getChurchById(currentChurchId);
      setPrefs({
        shareDevos: church?.share_devocionais_to_children ?? false,
        shareEvents: church?.share_eventos_to_children ?? false,
        shareTrilha: church?.share_trilha_to_children ?? false,
      });
    }
  }, [currentChurchId, churchStore.churches]);

  const load = useCallback(async () => {
    if (!currentChurchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Carrega dados da igreja atual
    const { data: mother, error: motherErr } = await supabase
      .from('igrejas')
      .select('id, nome, parent_church_id, plano_id, limite_membros, valor_mensal_assinatura')
      .eq('id', currentChurchId)
      .maybeSingle();

    if (motherErr) {
      toast.error('Erro ao carregar igreja atual.');
      setLoading(false);
      return;
    }
    const isChild = !!mother?.parent_church_id;
    setParentInfo({ isChild, motherId: mother?.parent_church_id || null, motherName: undefined });

    // Lista igrejas filhas
    const { data: childs, error: childErr } = await supabase
      .from('igrejas')
      .select('id, nome, created_at')
      .eq('parent_church_id', currentChurchId)
      .order('nome');

    if (childErr) {
      toast.error('Erro ao carregar igrejas filhas.');
      setChildren([]);
      setLoading(false);
      return;
    }

    // Coletar métricas para cada filha
    const items: ChildItem[] = [];
    for (const ch of (childs || [])) {
      // membros
      const { count: members } = await supabase
        .from('membros')
        .select('id', { count: 'exact', head: true })
        .eq('id_igreja', ch.id);
      // líderes (admin/pastor/lider)
      const { count: leaders } = await supabase
        .from('membros')
        .select('id', { count: 'exact', head: true })
        .eq('id_igreja', ch.id)
        .in('funcao', ['admin', 'pastor', 'lider']);
      // ministérios
      const { count: ministries } = await supabase
        .from('ministerios')
        .select('id', { count: 'exact', head: true })
        .eq('id_igreja', ch.id);

      items.push({
        id: ch.id,
        nome: ch.nome,
        created_at: ch.created_at,
        metrics: {
          members: members || 0,
          leaders: leaders || 0,
          ministries: ministries || 0
        }
      });
    }

    setChildren(items);
    setLoading(false);
  }, [currentChurchId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!currentChurchId) return toast.error('Nenhuma igreja selecionada.');
    if (!canManage) return toast.error('Você não tem permissão para criar igrejas filhas.');
    if (parentInfo?.isChild) {
      return toast.error('Igrejas filhas não podem criar novas igrejas.');
    }
    if (!form.nome || !form.nome_responsavel || !form.email || !form.panel_password) {
      return toast.error('Preencha nome, responsável, email e a senha da igreja filha.');
    }

    setCreating(true);

    const { data, error } = await supabase.functions.invoke('register-child-church', {
      body: {
        motherChurchId: currentChurchId,
        child: {
          nome: form.nome,
          nome_responsavel: form.nome_responsavel,
          email: form.email,
          telefone_contato: form.telefone_contato,
          endereco: form.endereco,
          cnpj: form.cnpj,
          panel_password: form.panel_password,
        },
      },
    });

    setCreating(false);

    if (error) {
      let serverMsg = error.message;
      const raw = (error as any)?.context?.body;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) serverMsg = parsed.error;
        } catch {
          serverMsg = raw;
        }
      }
      return toast.error('Erro ao criar igreja filha: ' + serverMsg);
    }

    toast.success('Igreja filha criada e pastor habilitado para login!');
    setOpenCreate(false);
    setForm({ nome: '', nome_responsavel: '', email: '', telefone_contato: '', endereco: '', cnpj: '', panel_password: '' });
    load();
  };

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja para gerenciar.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold">Gestão de Igrejas Filhas</h1>
        <p className="text-indigo-100 mt-1">
          Crie e gerencie igrejas filhas. Conteúdos de Devocionais e Jornada podem ser compartilhados com filhas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            Hierarquia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Church className="w-4 h-4 text-gray-700" />
            <span>Tipo: {parentInfo?.isChild ? 'Igreja Filha' : 'Igreja Mãe'}</span>
          </div>
          {parentInfo?.isChild && canManage && (
            <div className="mt-4 p-3 border rounded-md space-y-3">
              <h3 className="font-medium">Configurações da Igreja Filha</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  placeholder="Nova senha do painel"
                  value={(form as any).novaSenhaFilha || ''}
                  onChange={(e) => setForm({ ...form, panel_password: e.target.value, novaSenhaFilha: e.target.value } as any)}
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!currentChurchId) return toast.error('Nenhuma igreja selecionada.');
                    if (!form.panel_password) return toast.error('Digite a nova senha.');
                    const { error } = await supabase
                      .from('igrejas')
                      .update({ panel_password: form.panel_password })
                      .eq('id', currentChurchId);
                    if (error) {
                      return toast.error('Erro ao alterar a senha: ' + error.message);
                    }
                    toast.success('Senha atualizada com sucesso!');
                    setForm({ ...form, panel_password: '', novaSenhaFilha: '' } as any);
                  }}
                >
                  Salvar nova senha
                </Button>
              </div>
              <p className="text-xs text-gray-500">A senha é utilizada para acesso/gestão específica desta igreja. Guarde-a com segurança.</p>
            </div>
          )}
          {!parentInfo?.isChild && canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-indigo-600" />
                  Preferências de Compartilhamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-md flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Devocionais</p>
                      <p className="text-sm text-gray-600">Compartilhar novos devocionais com igrejas filhas por padrão.</p>
                    </div>
                    <Switch
                      checked={prefs.shareDevos}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, shareDevos: v }))}
                      aria-label="Compartilhar devocionais com igrejas filhas"
                    />
                  </div>
                  <div className="p-3 border rounded-md flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Eventos</p>
                      <p className="text-sm text-gray-600">Compartilhar novos eventos com igrejas filhas por padrão.</p>
                    </div>
                    <Switch
                      checked={prefs.shareEvents}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, shareEvents: v }))}
                      aria-label="Compartilhar eventos com igrejas filhas"
                    />
                  </div>
                  <div className="p-3 border rounded-md flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Trilha de Membro</p>
                      <p className="text-sm text-gray-600">Compartilhar trilha ativa com igrejas filhas por padrão.</p>
                    </div>
                    <Switch
                      checked={prefs.shareTrilha}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, shareTrilha: v }))}
                      aria-label="Compartilhar trilha com igrejas filhas"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    onClick={async () => {
                      if (!currentChurchId) return toast.error('Nenhuma igreja selecionada.');
                      const saved = await churchStore.updateChurch(currentChurchId, {
                        share_devocionais_to_children: prefs.shareDevos,
                        share_eventos_to_children: prefs.shareEvents,
                        share_trilha_to_children: prefs.shareTrilha,
                      });
                      if (!saved) return toast.error('Não foi possível salvar preferências.');
                      toast.success('Preferências atualizadas!');
                    }}
                  >
                    Salvar preferências
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Igrejas Filhas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children.length === 0 ? (
            <div className="text-gray-600">Nenhuma igreja filha cadastrada.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((c) => (
                <Card key={c.id} className="border">
                  <CardHeader>
                    <CardTitle className="text-lg">{c.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline">Membros: {c.metrics.members}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Líderes: {c.metrics.leaders}
                      </Badge>
                      <Badge variant="outline">Ministérios: {c.metrics.ministries}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedChild(c);
                        setOpenDashboard(true);
                      }}>
                        <Eye className="w-4 h-4 mr-1" /> Ir para painel
                      </Button>
                      <CopyRegisterLinkButton churchId={c.id} />
                      <Button variant="outline" size="sm" onClick={() => { setSelectedChild(c); setOpenEdit(true); }}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setSelectedChild(c); setOpenDelete(true); }}>
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel da Igreja Filha */}
      <ChildChurchDashboardDialog
        churchId={selectedChild?.id || ''}
        churchName={selectedChild?.nome || 'Igreja Filha'}
        open={openDashboard}
        onOpenChange={(o) => setOpenDashboard(o)}
      />

      <EditChildChurchDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        child={selectedChild}
        onSaved={load}
      />

      <DeleteChildChurchDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        churchId={selectedChild?.id || null}
        churchName={selectedChild?.nome || ''}
        onDeleted={load}
      />
    </div>
  );
};

export default ChildChurchesPage;