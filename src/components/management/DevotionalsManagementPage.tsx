import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, User, Tag, Pencil, Trash2, Star, Plus } from 'lucide-react';

type DevotionalStatus = 'Rascunho' | 'Publicado' | 'Arquivado';
type DevotionalCategory = 'Diário' | 'Semanal' | 'Especial' | 'Temático';

interface Devotional {
  id: string;
  id_igreja: string;
  titulo: string;
  conteudo: string;
  versiculo_referencia: string;
  versiculo_texto?: string | null;
  categoria: DevotionalCategory;
  tags: string[];
  autor_id: string;
  data_publicacao: string | null;
  status: DevotionalStatus;
  imagem_capa?: string | null;
  tempo_leitura: number;
  featured: boolean;
  membros?: { nome_completo: string | null };
  created_at: string;
}

const fetchDevotionals = async (churchId: string, statusFilter: string, categoryFilter: string, searchTerm: string) => {
  let query = supabase
    .from('devocionais')
    .select('*, membros ( nome_completo )')
    .eq('id_igreja', churchId);

  if (statusFilter !== 'Todos') query = query.eq('status', statusFilter);
  if (categoryFilter !== 'Todos') query = query.eq('categoria', categoryFilter);
  if (searchTerm) query = query.or(`titulo.ilike.%${searchTerm}%,conteudo.ilike.%${searchTerm}%`);

  const { data, error } = await query.order('featured', { ascending: false }).order('data_publicacao', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Devotional[];
};

const DevotionalsManagementPage = () => {
  const { currentChurchId, user } = useAuthStore();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Devotional | null>(null);

  const [form, setForm] = useState<Partial<Devotional>>({
    titulo: '',
    conteudo: '',
    versiculo_referencia: '',
    versiculo_texto: '',
    categoria: 'Diário',
    tags: [],
    status: 'Rascunho',
    imagem_capa: '',
    featured: false,
  });

  const queryKey = useMemo(() => ['devos-mgmt', currentChurchId, { statusFilter, categoryFilter, searchTerm }], [currentChurchId, statusFilter, categoryFilter, searchTerm]);

  const { data: devotionals, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchDevotionals(currentChurchId!, statusFilter, categoryFilter, searchTerm),
    enabled: !!currentChurchId,
  });

  const resetForm = () => {
    setForm({
      titulo: '',
      conteudo: '',
      versiculo_referencia: '',
      versiculo_texto: '',
      categoria: 'Diário',
      tags: [],
      status: 'Rascunho',
      imagem_capa: '',
      featured: false,
    });
    setEditingItem(null);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user || !currentChurchId) throw new Error('Usuário não autenticado.');
      if (!form.titulo || !form.conteudo || !form.versiculo_referencia) throw new Error('Preencha os campos obrigatórios.');
      const tempo = Math.ceil((form.conteudo?.length || 0) / 200);
      const payload = {
        ...form,
        id_igreja: currentChurchId,
        autor_id: user.id,
        tempo_leitura: tempo,
        // Ajusta data_publicacao ao publicar
        data_publicacao: form.status === 'Publicado' ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from('devocionais').insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Devocional criado com sucesso!');
      qc.invalidateQueries({ queryKey });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(`Erro ao criar: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingItem) return;
      const tempo = Math.ceil((form.conteudo?.length || editingItem.conteudo.length || 0) / 200);
      const payload: Partial<Devotional> = {
        titulo: form.titulo ?? editingItem.titulo,
        conteudo: form.conteudo ?? editingItem.conteudo,
        versiculo_referencia: form.versiculo_referencia ?? editingItem.versiculo_referencia,
        versiculo_texto: form.versiculo_texto ?? editingItem.versiculo_texto,
        categoria: (form.categoria as DevotionalCategory) ?? editingItem.categoria,
        tags: form.tags ?? editingItem.tags,
        status: (form.status as DevotionalStatus) ?? editingItem.status,
        imagem_capa: form.imagem_capa ?? editingItem.imagem_capa,
        featured: form.featured ?? editingItem.featured,
        tempo_leitura: tempo,
        data_publicacao: (form.status ?? editingItem.status) === 'Publicado'
          ? (editingItem.data_publicacao || new Date().toISOString())
          : null,
      };
      const { error } = await supabase.from('devocionais').update(payload).eq('id', editingItem.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Devocional atualizado!');
      qc.invalidateQueries({ queryKey });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devocionais').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Devocional removido.');
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(`Erro ao remover: ${err.message}`),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async (item: Devotional) => {
      const { error } = await supabase.from('devocionais').update({ featured: !item.featured }).eq('id', item.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(`Erro ao alterar destaque: ${err.message}`),
  });

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DevotionalStatus }) => {
      const payload: Partial<Devotional> = {
        status,
        data_publicacao: status === 'Publicado' ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from('devocionais').update(payload).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(`Erro ao alterar status: ${err.message}`),
  });

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Devotional) => {
    setEditingItem(item);
    setForm({
      titulo: item.titulo,
      conteudo: item.conteudo,
      versiculo_referencia: item.versiculo_referencia,
      versiculo_texto: item.versiculo_texto || '',
      categoria: item.categoria,
      tags: item.tags || [],
      status: item.status,
      imagem_capa: item.imagem_capa || '',
      featured: item.featured,
    });
    setIsDialogOpen(true);
  };

  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const categories: string[] = ['Todos', 'Diário', 'Semanal', 'Especial', 'Temático'];
  const statusOptions: string[] = ['Todos', 'Publicado', 'Rascunho', 'Arquivado'];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Devocionais</h1>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 mr-2" /> Novo Devocional
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Input
                placeholder="Pesquisar título ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="p-8 text-center text-gray-500">Carregando...</div>}
      {error && <div className="p-8 text-center text-red-500">Erro ao carregar: {(error as any).message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(devotionals || []).map((d) => (
          <Card key={d.id} className="border hover:shadow-sm transition">
            {d.imagem_capa && (
              <img src={d.imagem_capa} alt={d.titulo} className="h-40 w-full object-cover rounded-t-lg" />
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg line-clamp-2">{d.titulo}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <Badge variant="outline">{d.status}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">{d.categoria}</Badge>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{d.membros?.nome_completo || 'Autor'}</span>
                    </div>
                    {d.data_publicacao && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(d.data_publicacao).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={d.featured ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFeaturedMutation.mutate(d)}>
                    <Star className="w-4 h-4 mr-1" /> {d.featured ? 'Destacado' : 'Destacar'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(d)}>
                    <Pencil className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setStatusMutation.mutate({ id: d.id, status: d.status === 'Publicado' ? 'Arquivado' : 'Publicado' })}>
                    {d.status === 'Publicado' ? 'Arquivar' : 'Publicar'}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteMutation.mutate(d.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Remover
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 line-clamp-3">{stripHtml(d.conteudo)}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(d.tags || []).slice(0, 4).map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" /> {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Devocional' : 'Novo Devocional'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Título *" value={form.titulo || ''} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Versículo de Referência *" value={form.versiculo_referencia || ''} onChange={(e) => setForm({ ...form, versiculo_referencia: e.target.value })} />
              <Select value={(form.categoria as string) || 'Diário'} onValueChange={(v) => setForm({ ...form, categoria: v as DevotionalCategory })}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diário">Diário</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Especial">Especial</SelectItem>
                  <SelectItem value="Temático">Temático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Texto do Versículo (opcional)" value={form.versiculo_texto || ''} onChange={(e) => setForm({ ...form, versiculo_texto: e.target.value })} rows={2} />
            <Textarea placeholder="Conteúdo * (HTML básico suportado)" value={form.conteudo || ''} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={10} />
            <Input placeholder="Imagem de capa (URL)" value={form.imagem_capa || ''} onChange={(e) => setForm({ ...form, imagem_capa: e.target.value })} />
            <Input
              placeholder="Tags separadas por vírgula"
              value={(form.tags || []).join(', ')}
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select value={(form.status as string) || 'Rascunho'} onValueChange={(v) => setForm({ ...form, status: v as DevotionalStatus })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Publicado">Publicado</SelectItem>
                  <SelectItem value="Arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(form.featured ? 'true' : 'false')} onValueChange={(v) => setForm({ ...form, featured: v === 'true' })}>
                <SelectTrigger><SelectValue placeholder="Destaque" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Sem destaque</SelectItem>
                  <SelectItem value="true">Destacado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
              {editingItem ? (
                <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              ) : (
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Criar Devocional'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DevotionalsManagementPage;