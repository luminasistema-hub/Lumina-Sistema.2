import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, Loader2, ListOrdered, AlertCircle, Edit, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableEtapaItem } from './SortableEtapaItem'; // Importar o novo componente

// Interfaces para os dados do Supabase
interface EtapaTrilha {
  id: string;
  id_trilha: string;
  ordem: number;
  titulo: string;
  descricao: string;
  tipo_conteudo: string;
  conteudo: string;
  cor: string;
  created_at: string;
}

const ConfiguracaoJornada = () => {
  const [etapas, setEtapas] = useState<EtapaTrilha[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddEtapaDialogOpen, setIsAddEtapaDialogOpen] = useState(false);
  const [activeTrilhaId, setActiveTrilhaId] = useState<string | null>(null);
  const { currentChurchId } = useAuthStore();
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [newEtapa, setNewEtapa] = useState({
    id: '',
    titulo: '',
    descricao: '',
    ordem: 1,
    tipo_conteudo: 'Texto',
    conteudo: '',
    cor: '#FFFFFF',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const carregarEtapas = async () => {
    if (!currentChurchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    console.log('ConfiguracaoJornada: Carregando etapas para a igreja:', currentChurchId);

    try {
      const { data: trilha, error: trilhaError } = await supabase
        .from('trilhas_crescimento')
        .select('id')
        .eq('id_igreja', currentChurchId)
        .eq('is_ativa', true)
        .single();

      if (trilhaError && trilhaError.code !== 'PGRST116') {
        console.error('ConfiguracaoJornada: Erro ao buscar trilha ativa:', trilhaError);
        toast.error('Erro ao carregar a trilha de crescimento: ' + trilhaError.message);
        setEtapas([]);
        setActiveTrilhaId(null);
        return;
      }

      if (trilha) {
        setActiveTrilhaId(trilha.id);
        const { data: etapasData, error: etapasDataError } = await supabase
          .from('etapas_trilha')
          .select('*')
          .eq('id_trilha', trilha.id)
          .order('ordem', { ascending: true });

        if (etapasDataError) {
          console.error('ConfiguracaoJornada: Erro ao buscar etapas da trilha:', etapasDataError);
          toast.error('Erro ao carregar as etapas: ' + etapasDataError.message);
          setEtapas([]);
          return;
        }
        console.log('ConfiguracaoJornada: Etapas carregadas:', etapasData);
        setEtapas(etapasData || []);
      } else {
        console.log('ConfiguracaoJornada: Nenhuma trilha ativa encontrada para esta igreja.');
        setEtapas([]);
        setActiveTrilhaId(null);
      }
    } catch (error) {
      console.error("ConfiguracaoJornada: Erro inesperado ao carregar etapas:", error);
      toast.error('Ocorreu um erro inesperado ao carregar as etapas da jornada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEtapas();
  }, [currentChurchId]);

  const handleAddEtapaClick = () => {
    setNewEtapa({
      id: '',
      titulo: '',
      descricao: '',
      ordem: etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem)) + 1 : 1,
      tipo_conteudo: 'Texto',
      conteudo: '',
      cor: '#FFFFFF',
    });
    setIsAddEtapaDialogOpen(true);
  };

  const handleEditEtapaClick = (etapa: EtapaTrilha) => {
    setNewEtapa({
      id: etapa.id,
      titulo: etapa.titulo,
      descricao: etapa.descricao,
      ordem: etapa.ordem,
      tipo_conteudo: etapa.tipo_conteudo,
      conteudo: etapa.conteudo,
      cor: etapa.cor,
    });
    setIsAddEtapaDialogOpen(true);
  };

  const handleSaveEtapa = async () => {
    if (!activeTrilhaId) {
      toast.error('Nenhuma trilha de crescimento ativa encontrada para esta igreja.');
      return;
    }

    if (!newEtapa.titulo || !newEtapa.descricao || !newEtapa.conteudo) {
      toast.error('Título, descrição e conteúdo são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      if (newEtapa.id) {
        const { data, error } = await supabase
          .from('etapas_trilha')
          .update({
            ordem: newEtapa.ordem,
            titulo: newEtapa.titulo,
            descricao: newEtapa.descricao,
            tipo_conteudo: newEtapa.tipo_conteudo,
            conteudo: newEtapa.conteudo,
            cor: newEtapa.cor,
          })
          .eq('id', newEtapa.id)
          .select()
          .single();

        if (error) {
          console.error('ConfiguracaoJornada: Erro ao atualizar etapa:', error);
          toast.error('Erro ao atualizar etapa: ' + error.message);
          return;
        }
        toast.success('Etapa atualizada com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('etapas_trilha')
          .insert({
            id_trilha: activeTrilhaId,
            ordem: newEtapa.ordem,
            titulo: newEtapa.titulo,
            descricao: newEtapa.descricao,
            tipo_conteudo: newEtapa.tipo_conteudo,
            conteudo: newEtapa.conteudo,
            cor: newEtapa.cor,
          })
          .select()
          .single();

        if (error) {
          console.error('ConfiguracaoJornada: Erro ao salvar nova etapa:', error);
          toast.error('Erro ao criar nova etapa: ' + error.message);
          return;
        }
        toast.success('Etapa criada com sucesso!');
      }

      setIsAddEtapaDialogOpen(false);
      setNewEtapa({
        id: '',
        titulo: '',
        descricao: '',
        ordem: 1,
        tipo_conteudo: 'Texto',
        conteudo: '',
        cor: '#FFFFFF',
      });
      carregarEtapas();
    } catch (error) {
      console.error("ConfiguracaoJornada: Erro inesperado ao salvar etapa:", error);
      toast.error('Ocorreu um erro inesperado ao salvar a etapa.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEtapa = async (etapaId: string) => {
    if (!window.confirm('Tem certeza que deseja apagar esta etapa? Esta ação é irreversível.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('etapas_trilha')
        .delete()
        .eq('id', etapaId);

      if (error) {
        console.error('ConfiguracaoJornada: Erro ao apagar etapa:', error);
        toast.error('Erro ao apagar etapa: ' + error.message);
        return;
      }

      toast.success('Etapa apagada com sucesso!');
      carregarEtapas();
    } catch (error) {
      console.error("ConfiguracaoJornada: Erro inesperado ao apagar etapa:", error);
      toast.error('Ocorreu um erro inesperado ao apagar a etapa.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setEtapas((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Atualiza a propriedade 'ordem' no estado local para refletir a nova posição
        return newOrder.map((item, index) => ({ ...item, ordem: index + 1 }));
      });
    }
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const updates = etapas.map(etapa => ({
        id: etapa.id,
        ordem: etapa.ordem,
      }));

      // Usar Promise.all para enviar todas as atualizações em paralelo
      const { error } = await supabase
        .from('etapas_trilha')
        .upsert(updates, { onConflict: 'id' }); // upsert para atualizar se existir, inserir se não (embora aqui só atualize)

      if (error) {
        console.error('ConfiguracaoJornada: Erro ao salvar nova ordem:', error);
        toast.error('Erro ao salvar a nova ordem das etapas: ' + error.message);
        return;
      }

      toast.success('Ordem das etapas salva com sucesso!');
      carregarEtapas(); // Recarrega para garantir que o estado do DB está sincronizado
    } catch (error) {
      console.error("ConfiguracaoJornada: Erro inesperado ao salvar ordem:", error);
      toast.error('Ocorreu um erro inesperado ao salvar a ordem das etapas.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para configurar a jornada do membro.
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Configuração da Jornada 🗺️</h1>
        <p className="text-indigo-100 text-base md:text-lg">
          Gerencie as etapas da trilha de crescimento da sua igreja
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-purple-500" />
            Etapas da Trilha
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              className="bg-green-500 hover:bg-green-600" 
              onClick={handleSaveOrder}
              disabled={isSavingOrder || loading}
            >
              {isSavingOrder ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Ordem
            </Button>
            <Button className="bg-purple-500 hover:bg-purple-600" onClick={handleAddEtapaClick}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <span className="ml-3 text-gray-600">Carregando etapas...</span>
            </div>
          ) : etapas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhuma etapa encontrada</p>
              <p>Comece criando a primeira etapa da trilha de crescimento da sua igreja.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={etapas.map(etapa => etapa.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {etapas.map((etapa) => (
                    <SortableEtapaItem
                      key={etapa.id}
                      etapa={etapa}
                      onEdit={handleEditEtapaClick}
                      onDelete={handleDeleteEtapa}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Criar/Editar Etapa */}
      <Dialog open={isAddEtapaDialogOpen} onOpenChange={setIsAddEtapaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{newEtapa.id ? 'Editar Etapa da Jornada' : 'Criar Nova Etapa da Jornada'}</DialogTitle>
            <DialogDescription>
              {newEtapa.id ? 'Atualize os detalhes desta etapa.' : 'Defina os detalhes para uma nova etapa na trilha de crescimento.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Etapa *</Label>
              <Input
                id="titulo"
                value={newEtapa.titulo}
                onChange={(e) => setNewEtapa({ ...newEtapa, titulo: e.target.value })}
                placeholder="Ex: Decisão por Cristo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição Curta *</Label>
              <Textarea
                id="descricao"
                value={newEtapa.descricao}
                onChange={(e) => setNewEtapa({ ...newEtapa, descricao: e.target.value })}
                placeholder="Breve descrição do objetivo desta etapa"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem da Etapa</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={newEtapa.ordem}
                  onChange={(e) => setNewEtapa({ ...newEtapa, ordem: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor de Destaque</Label>
                <Input
                  id="cor"
                  type="color"
                  value={newEtapa.cor}
                  onChange={(e) => setNewEtapa({ ...newEtapa, cor: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_conteudo">Tipo de Conteúdo</Label>
              <Select
                value={newEtapa.tipo_conteudo}
                onValueChange={(value) => setNewEtapa({ ...newEtapa, tipo_conteudo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de conteúdo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Texto">Texto</SelectItem>
                  <SelectItem value="Video">Vídeo (YouTube)</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo (Texto ou URL) *</Label>
              <Textarea
                id="conteudo"
                value={newEtapa.conteudo}
                onChange={(e) => setNewEtapa({ ...newEtapa, conteudo: e.target.value })}
                placeholder="Insira o texto do conteúdo ou a URL do vídeo/PDF"
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddEtapaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEtapa}>
                {newEtapa.id ? 'Salvar Alterações' : 'Criar Etapa'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfiguracaoJornada;