import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, User, Tag, Pencil, Trash2, Star, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useChurchStore } from '@/stores/churchStore';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDevotionalsManagement, Devotional } from '@/hooks/useDevotionalsManagement';

type DevotionalStatus = 'Rascunho' | 'Publicado' | 'Arquivado' | 'Pendente';
type DevotionalCategory = 'Diário' | 'Semanal' | 'Especial' | 'Temático';

const DevotionalsManagementPage = () => {
  const { currentChurchId, user } = useAuthStore();
  const churchStore = useChurchStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<Devotional | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'pastor' || user?.extraPermissions?.includes('devotional-approver');

  const {
    devotionals: devotionalsData,
    isLoading,
    error,
    createDevotional,
    updateDevotional,
    deleteDevotional,
    toggleFeatured,
    setStatus,
  } = useDevotionalsManagement({ statusFilter, categoryFilter, searchTerm });

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
    compartilhar_com_filhas: churchStore.getChurchById(currentChurchId!)?.share_devocionais_to_children ?? false,
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
      compartilhar_com_filhas: churchStore.getChurchById(currentChurchId!)?.share_devocionais_to_children ?? false,
    });
    setEditingItem(null);
  };

  const handleSave = () => {
    const mutation = editingItem ? updateDevotional : createDevotional;
    const payload = editingItem ? { form, editingItem } : form;
    
    mutation.mutate(payload as any, {
      onSuccess: () => {
        setIsDialogOpen(false);
        resetForm();
      }
    });
  };

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
      compartilhar_com_filhas: item.compartilhar_com_filhas ?? false,
    });
    setIsDialogOpen(true);
  };

  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const categories: string[] = ['all', 'Diário', 'Semanal', 'Especial', 'Temático'];
  const statusOptions: string[] = ['all', 'Publicado', 'Pendente', 'Rascunho', 'Arquivado'];

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
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === 'all' ? 'Todas' : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'Todos' : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="p-8 text-center text-gray-500">Carregando...</div>}
      {error && <div className="p-8 text-center text-red-500">Erro ao carregar: {(error as any).message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(devotionalsData || []).map((d) => (
          <Card key={d.id} className="border hover:shadow-sm transition">
            {d.imagem_capa && (
              <img src={d.imagem_capa} alt={d.titulo} className="h-40 w-full object-cover rounded-t-lg" />
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg line-clamp-2">{d.titulo}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <Badge variant={d.status === 'Pendente' ? 'destructive' : 'outline'}>{d.status}</Badge>
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
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant={d.featured ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFeatured.mutate(d)}>
                      <Star className="w-4 h-4 mr-1" /> {d.featured ? 'Destacado' : 'Destacar'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(d)}>
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteDevotional.mutate(d.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Remover
                    </Button>
                  </div>
                  {d.status === 'Pendente' && canManage && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm font-medium text-yellow-800">Aguardando aprovação</p>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => setStatus.mutate({ id: d.id, status: 'Publicado' })}>Aprovar</Button>
                      <Button size="sm" variant="destructive" onClick={() => setStatus.mutate({ id: d.id, status: 'Arquivado' })}>Rejeitar</Button>
                    </div>
                  )}
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
                  <SelectItem value="Pendente">Pendente</SelectItem>
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

            <div className="p-3 border rounded-md flex items-center justify-between">
              <div className="space-y-1">
                <Label>Compartilhar com igrejas filhas</Label>
                <p className="text-xs text-gray-600">Se ativado, este devocional ficará visível para igrejas filhas.</p>
              </div>
              <Switch
                checked={!!form.compartilhar_com_filhas}
                onCheckedChange={(v) => setForm({ ...form, compartilhar_com_filhas: v })}
                aria-label="Compartilhar devocional com igrejas filhas"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createDevotional.isPending || updateDevotional.isPending}>
                {createDevotional.isPending || updateDevotional.isPending ? 'Salvando...' : (editingItem ? 'Salvar Alterações' : 'Criar Devocional')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DevotionalsManagementPage;