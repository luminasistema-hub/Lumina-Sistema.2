import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useChurchStore } from '@/stores/churchStore';
import { toast } from 'sonner';
import { Church, Users, Crown, FolderTree, Plus, Eye, Loader2, BookOpen, Calendar, Route, Sparkles, Share2 } from 'lucide-react';
import ChildChurchDashboardDialog from './ChildChurchDashboardDialog';
import CopyRegisterLinkButton from './CopyRegisterLinkButton';
import EditChildChurchDialog from './EditChildChurchDialog';
import DeleteChildChurchDialog from './DeleteChildChurchDialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useChildChurches, ChildChurch as ChildItem } from '@/hooks/useChildChurches';

const childFormSchema = z.object({
  nome: z.string().min(3, 'Nome da igreja é obrigatório.'),
  nome_responsavel: z.string().min(3, 'Nome do responsável é obrigatório.'),
  email: z.string().email('Email inválido.'),
  telefone_contato: z.string().optional(),
  endereco: z.string().optional(),
  cnpj: z.string().optional(),
  panel_password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

type ChildFormValues = z.infer<typeof childFormSchema>;

const ChildChurchesPage = () => {
  const { currentChurchId, user } = useAuthStore();
  const { updateChurch } = useChurchStore();
  const { childChurches: children, parentInfo, isLoading: loading, refetch: loadPageData } = useChildChurches();
  
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openDashboard, setOpenDashboard] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildItem | null>(null);

  const form = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      nome: '',
      nome_responsavel: '',
      email: '',
      telefone_contato: '',
      endereco: '',
      cnpj: '',
      panel_password: ''
    },
  });

  const canManage = useMemo(() => user?.role === 'admin' || user?.role === 'pastor', [user?.role]);

  const handleCreate = async (values: ChildFormValues) => {
    if (!currentChurchId) return toast.error('Nenhuma igreja selecionada.');
    if (!canManage) return toast.error('Você não tem permissão para criar igrejas filhas.');
    if (parentInfo?.isChild) return toast.error('Igrejas filhas não podem criar novas igrejas.');

    setCreating(true);

    const { error } = await supabase.functions.invoke('register-child-church', {
      body: { motherChurchId: currentChurchId, child: values },
    });

    setCreating(false);

    if (error) {
      const serverMsg = (error as any)?.context?.body?.error || error.message;
      return toast.error('Erro ao criar igreja filha: ' + serverMsg);
    }

    toast.success('Igreja filha criada e pastor habilitado para login!');
    form.reset();
    loadPageData();
  };

  const handleSharingToggle = async (childId: string, key: keyof ChildItem, value: boolean) => {
    const updated = await updateChurch(childId, { [key]: value });

    if (!updated) {
      toast.error('Falha ao atualizar a preferência.');
      loadPageData(); // Revert on failure by refetching
    } else {
      toast.success('Preferência de compartilhamento atualizada!');
      loadPageData(); // Refetch to ensure UI is in sync
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (!currentChurchId) {
    return <div className="p-6 text-center text-muted-foreground">Selecione uma igreja para gerenciar.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold">Gestão de Igrejas Filhas</h1>
        <p className="text-indigo-100 mt-1">
          Crie e gerencie as igrejas que estão sob sua liderança direta.
        </p>
      </div>

      {!parentInfo?.isChild && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />Nova Igreja Filha</CardTitle>
            <CardDescription>Preencha os dados para cadastrar uma nova igreja e habilitar o acesso do pastor responsável.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem><FormLabel>Nome da Igreja</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="nome_responsavel" render={({ field }) => (
                    <FormItem><FormLabel>Responsável (Pastor)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email (para login)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="panel_password" render={({ field }) => (
                    <FormItem><FormLabel>Senha de Acesso</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="telefone_contato" render={({ field }) => (
                    <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="cnpj" render={({ field }) => (
                    <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="endereco" render={({ field }) => (
                  <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={creating}>
                    {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cadastrando...</> : 'Cadastrar Igreja'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Church className="w-5 h-5 text-primary" />Igrejas Filhas ({children.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma igreja filha cadastrada.</p>
              {!parentInfo?.isChild && <p className="text-sm">Use o formulário acima para começar.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {children.map((c) => (
                <Card key={c.id} className="border flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{c.nome}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm pt-2">
                      <Badge variant="secondary"><Users className="w-3 h-3 mr-1" /> {c.metrics.members}</Badge>
                      <Badge variant="secondary"><Crown className="w-3 h-3 mr-1" /> {c.metrics.leaders}</Badge>
                      <Badge variant="secondary"><FolderTree className="w-3 h-3 mr-1" /> {c.metrics.ministries}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow">
                    <div className="space-y-2 p-3 border rounded-md">
                      <h4 className="font-medium text-sm flex items-center gap-2"><Share2 className="w-4 h-4" /> Herdar Conteúdo da Igreja Mãe</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center justify-between"><Label htmlFor={`sh-escolas-${c.id}`} className="flex items-center gap-1.5"><BookOpen size={14}/>Escolas</Label><Switch id={`sh-escolas-${c.id}`} checked={c.compartilha_escolas_da_mae} onCheckedChange={(val) => handleSharingToggle(c.id, 'compartilha_escolas_da_mae', val)} /></div>
                        <div className="flex items-center justify-between"><Label htmlFor={`sh-eventos-${c.id}`} className="flex items-center gap-1.5"><Calendar size={14}/>Eventos</Label><Switch id={`sh-eventos-${c.id}`} checked={c.compartilha_eventos_da_mae} onCheckedChange={(val) => handleSharingToggle(c.id, 'compartilha_eventos_da_mae', val)} /></div>
                        <div className="flex items-center justify-between"><Label htmlFor={`sh-jornada-${c.id}`} className="flex items-center gap-1.5"><Route size={14}/>Jornada</Label><Switch id={`sh-jornada-${c.id}`} checked={c.compartilha_jornada_da_mae} onCheckedChange={(val) => handleSharingToggle(c.id, 'compartilha_jornada_da_mae', val)} /></div>
                        <div className="flex items-center justify-between"><Label htmlFor={`sh-devos-${c.id}`} className="flex items-center gap-1.5"><Sparkles size={14}/>Devocionais</Label><Switch id={`sh-devos-${c.id}`} checked={c.compartilha_devocionais_da_mae} onCheckedChange={(val) => handleSharingToggle(c.id, 'compartilha_devocionais_da_mae', val)} /></div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedChild(c); setOpenDashboard(true); }}><Eye className="w-4 h-4 mr-1" /> Painel</Button>
                    <CopyRegisterLinkButton churchId={c.id} />
                    <Button variant="outline" size="sm" onClick={() => { setSelectedChild(c); setOpenEdit(true); }}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => { setSelectedChild(c); setOpenDelete(true); }}>Excluir</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ChildChurchDashboardDialog churchId={selectedChild?.id || ''} churchName={selectedChild?.nome || ''} open={openDashboard} onOpenChange={setOpenDashboard} />
      <EditChildChurchDialog open={openEdit} onOpenChange={setOpenEdit} child={selectedChild} onSaved={loadPageData} />
      <DeleteChildChurchDialog open={openDelete} onOpenChange={setOpenDelete} churchId={selectedChild?.id || null} churchName={selectedChild?.nome || ''} onDeleted={loadPageData} />
    </div>
  );
};

export default ChildChurchesPage;