import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePastorItems, PastorAreaItem } from '@/hooks/usePastorItems';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, FileText, Book, ClipboardSignature, Trash2, Edit, Download, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BUCKET_NAME = 'pastor_documents';

const PastorAreaPage = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = usePastorItems();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PastorAreaItem | null>(null);
  const [itemToView, setItemToView] = useState<PastorAreaItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PastorAreaItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  const [formState, setFormState] = useState({
    titulo: '',
    tipo: 'anotacao' as PastorAreaItem['tipo'],
    conteudo: '',
    file: null as File | null,
  });

  const resetForm = () => {
    setFormState({ titulo: '', tipo: 'anotacao', conteudo: '', file: null });
    setItemToEdit(null);
    setIsFormOpen(false);
  };

  const handleEditClick = (item: PastorAreaItem) => {
    setItemToEdit(item);
    setFormState({
      titulo: item.titulo,
      tipo: item.tipo,
      conteudo: item.conteudo || '',
      file: null,
    });
    setIsFormOpen(true);
  };

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastorAreaItems', currentChurchId] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(`Ocorreu um erro: ${err.message}`);
    },
  };

  const createItemMutation = useMutation({
    mutationFn: async (newItem: typeof formState) => {
      if (!user || !currentChurchId) throw new Error('Usuário ou igreja não identificados.');
      
      let filePath = undefined;
      if (newItem.tipo === 'documento_pdf' && newItem.file) {
        const fileExt = newItem.file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        filePath = `${currentChurchId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, newItem.file);
        if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const { error } = await supabase.from('pastor_area_items').insert({
        id_igreja: currentChurchId,
        pastor_id: user.id,
        titulo: newItem.titulo,
        tipo: newItem.tipo,
        conteudo: newItem.tipo !== 'documento_pdf' ? newItem.conteudo : null,
        file_path: filePath,
      });

      if (error) {
        if (filePath) await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw error;
      }
    },
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Item criado com sucesso!');
      mutationOptions.onSuccess();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (updatedItem: { id: string, values: typeof formState }) => {
      if (!itemToEdit) throw new Error('Nenhum item selecionado para edição.');
      const { error } = await supabase.from('pastor_area_items').update({
        titulo: updatedItem.values.titulo,
        conteudo: updatedItem.values.conteudo,
        updated_at: new Date().toISOString(),
      }).eq('id', updatedItem.id);
      if (error) throw error;
    },
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Item atualizado com sucesso!');
      mutationOptions.onSuccess();
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (item: PastorAreaItem) => {
      if (item.tipo === 'documento_pdf' && item.file_path) {
        const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([item.file_path]);
        if (storageError) console.warn(`Não foi possível remover o arquivo do storage: ${storageError.message}`);
      }
      const { error } = await supabase.from('pastor_area_items').delete().eq('id', item.id);
      if (error) throw error;
    },
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Item excluído com sucesso!');
      setItemToDelete(null);
      mutationOptions.onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemToEdit) {
      updateItemMutation.mutate({ id: itemToEdit.id, values: formState });
    } else {
      createItemMutation.mutate(formState);
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(filePath, 60); // URL válida por 60s
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast.error(`Erro ao gerar link para download: ${err.message}`);
    }
  };

  const filteredItems = useMemo(() => {
    return items
      .filter(item => activeTab === 'todos' || item.tipo === activeTab)
      .filter(item => item.titulo.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, activeTab, searchTerm]);

  const typeMap = {
    documento_pdf: { icon: <FileText className="w-5 h-5 text-red-500" />, label: 'Documento', color: 'bg-red-100 text-red-800' },
    anotacao: { icon: <Book className="w-5 h-5 text-yellow-500" />, label: 'Anotação', color: 'bg-yellow-100 text-yellow-800' },
    esboco_sermao: { icon: <ClipboardSignature className="w-5 h-5 text-blue-500" />, label: 'Esboço', color: 'bg-blue-100 text-blue-800' },
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="p-6 text-center text-red-500">Erro ao carregar itens: {error.message}</div>;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3"><ClipboardSignature /> Área do Pastor</h1>
        <p className="text-gray-300 text-base md:text-lg">Seu espaço para documentos, anotações e esboços de sermões.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={isFormOpen} onOpenChange={open => !open && resetForm()}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsFormOpen(true)} className="w-full md:w-auto"><Plus className="w-4 h-4 mr-2" /> Novo Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{itemToEdit ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input id="titulo" value={formState.titulo} onChange={e => setFormState(s => ({ ...s, titulo: e.target.value }))} required />
                  </div>
                  {!itemToEdit && (
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={formState.tipo} onValueChange={val => setFormState(s => ({ ...s, tipo: val as any, conteudo: '', file: null }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anotacao">Anotação</SelectItem>
                          <SelectItem value="esboco_sermao">Esboço de Sermão</SelectItem>
                          {/* Upload de PDF desativado */}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {formState.tipo !== 'documento_pdf' ? (
                    <div className="space-y-2">
                      <Label htmlFor="conteudo">Conteúdo</Label>
                      <Textarea id="conteudo" value={formState.conteudo} onChange={e => setFormState(s => ({ ...s, conteudo: e.target.value }))} rows={10} />
                    </div>
                  ) : !itemToEdit && (
                    <div className="space-y-2">
                      <Label htmlFor="file">Arquivo PDF</Label>
                      <Input id="file" type="file" accept=".pdf" onChange={e => setFormState(s => ({ ...s, file: e.target.files?.[0] || null }))} required />
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                    <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                      {(createItemMutation.isPending || updateItemMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="documento_pdf">Documentos</TabsTrigger>
              <TabsTrigger value="anotacao">Anotações</TabsTrigger>
              <TabsTrigger value="esboco_sermao">Esboços</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhum item encontrado.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map(item => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className={typeMap[item.tipo].color}>{typeMap[item.tipo].label}</Badge>
                            <CardTitle className="mt-2">{item.titulo}</CardTitle>
                          </div>
                          {typeMap[item.tipo].icon}
                        </div>
                        <CardDescription>
                          Criado por {item.pastor_name} em {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {item.tipo === 'documento_pdf' && item.file_path && (
                          <Button variant="outline" size="sm" onClick={() => handleDownload(item.file_path!)}><Download className="w-4 h-4 mr-2" /> Baixar</Button>
                        )}
                        {item.tipo !== 'documento_pdf' && (
                          <>
                            <Button variant="secondary" size="sm" onClick={() => setItemToView(item)}><Eye className="w-4 h-4 mr-2" /> Visualizar</Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
                          </>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => setItemToDelete(item)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o item "{itemToDelete?.titulo}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setItemToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteItemMutation.mutate(itemToDelete!)} disabled={deleteItemMutation.isPending}>
              {deleteItemMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToView} onOpenChange={() => setItemToView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemToView?.titulo}</DialogTitle>
            <DialogDescription>
              Criado por {itemToView?.pastor_name} em {itemToView && format(new Date(itemToView.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-4 prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap">{itemToView?.conteudo}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToView(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PastorAreaPage;