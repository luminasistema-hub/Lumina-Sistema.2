import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Plus, Loader2, ListOrdered, AlertCircle, Edit, Trash2, GripVertical, Video, FileText, HelpCircle, Link, CheckCircle, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableEtapaItem } from './SortableEtapaItem'; // Reutilizando o componente SortableEtapaItem
import { SortablePassoItem } from './SortablePassoItem'; // Novo componente para passos

interface PassoEtapa {
  id: string;
  id_etapa: string;
  ordem: number;
  titulo: string;
  tipo_passo: 'video' | 'quiz' | 'leitura' | 'acao' | 'link_externo';
  conteudo?: string;
  created_at: string;
}

interface EtapaTrilha {
  id: string;
  id_trilha: string;
  ordem: number;
  titulo: string;
  descricao: string;
  tipo_conteudo: string; // Pode ser removido se o conteúdo for apenas nos passos
  conteudo: string; // Pode ser removido se o conteúdo for apenas nos passos
  cor: string;
  created_at: string;
  passos: PassoEtapa[]; // Nova propriedade para aninhar os passos
}

const ConfiguracaoJornada = () => {
  const [etapasAninhadas, setEtapasAninhadas] = useState<EtapaTrilha[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentChurchId } = useAuthStore();
  const [etapaAberta, setEtapaAberta] = useState<string | null>(null); // Estado para controlar qual etapa está aberta

  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [etapaParaEditar, setEtapaParaEditar] = useState<EtapaTrilha | null>(null);
  const [formEtapaData, setFormEtapaData] = useState<Partial<EtapaTrilha>>({
    titulo: '',
    descricao: '',
    cor: '#e0f2fe', // Cor padrão
  });

  const [isPassoModalOpen, setIsPassoModalOpen] = useState(false);
  const [passoParaEditar, setPassoParaEditar] = useState<PassoEtapa | null>(null);
  const [etapaAtualParaPasso, setEtapaAtualParaPasso] = useState<EtapaTrilha | null>(null);
  const [formPassoData, setFormPassoData] = useState<Partial<PassoEtapa>>({
    titulo: '',
    tipo_passo: 'leitura',
    conteudo: '',
  });

  const coresDisponiveis = [
    { value: '#e0f2fe', name: 'Azul Claro' },
    { value: '#dcfce7', name: 'Verde Claro' },
    { value: '#f3e8ff', name: 'Roxo Claro' },
    { value: '#ffe4e6', name: 'Rosa Claro' },
    { value: '#fffbe5', name: 'Amarelo Claro' },
    { value: '#e5e7eb', name: 'Cinza Claro' },
  ];

  const tiposPasso = [
    { value: 'leitura', name: 'Leitura', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'video', name: 'Vídeo', icon: <Video className="w-4 h-4" /> },
    { value: 'quiz', name: 'Quiz', icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'acao', name: 'Ação Prática', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'link_externo', name: 'Link Externo', icon: <Link className="w-4 h-4" /> },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const carregarJornadaCompleta = async () => {
    if (!currentChurchId) {
      setLoading(false);
      setEtapasAninhadas([]);
      return;
    }
    setLoading(true);
    try {
      // 1. Busca a trilha principal da igreja
      const { data: trilha, error: trilhaError } = await supabase
        .from('trilhas_crescimento')
        .select('id')
        .eq('id_igreja', currentChurchId)
        .eq('is_ativa', true)
        .single();
      
      if (trilhaError && trilhaError.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('Erro ao buscar trilha ativa:', trilhaError);
        setEtapasAninhadas([]);
        return;
      }

      if (trilha) {
        // 2. Busca as etapas principais dessa trilha
        const { data: etapasData, error: etapasDataError } = await supabase
          .from('etapas_trilha')
          .select('*')
          .eq('id_trilha', trilha.id)
          .order('ordem', { ascending: true });
        if (etapasDataError) throw etapasDataError;

        // 3. Busca todos os passos de todas as etapas de uma vez
        const etapaIds = (etapasData || []).map(e => e.id);
        const { data: passosData, error: passosError } = await supabase
          .from('passos_etapa')
          .select('*')
          .in('id_etapa', etapaIds)
          .order('ordem', { ascending: true });
        if (passosError) throw passosError;

        // 4. Combina os dados: aninha os passos dentro de suas respectivas etapas
        const etapasComPassos = (etapasData || []).map(etapa => ({
          ...etapa,
          passos: (passosData || []).filter(passo => passo.id_etapa === etapa.id) || []
        }));
        
        setEtapasAninhadas(etapasComPassos);
      } else {
        setEtapasAninhadas([]);
      }
    } catch (error) {
      console.error("Erro ao carregar a jornada completa:", error);
      toast.error("Erro ao carregar a jornada. Tente novamente.");
      setEtapasAninhadas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarJornadaCompleta();
  }, [currentChurchId]);

  const handleOpenCreateEtapaModal = () => {
    setEtapaParaEditar(null);
    setFormEtapaData({
      titulo: '',
      descricao: '',
      cor: '#e0f2fe',
    });
    setIsEtapaModalOpen(true);
  };

  const handleOpenEditEtapaModal = (etapa: EtapaTrilha) => {
    setEtapaParaEditar(etapa);
    setFormEtapaData({
      titulo: etapa.titulo,
      descricao: etapa.descricao,
      cor: etapa.cor,
    });
    setIsEtapaModalOpen(true);
  };

  const handleSaveEtapa = async () => {
    if (!currentChurchId) {
      toast.error('Selecione uma igreja para configurar a jornada.');
      return;
    }
    if (!formEtapaData.titulo || !formEtapaData.descricao) {
      toast.error('Título e descrição da etapa são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const { data: trilha, error: trilhaError } = await supabase
        .from('trilhas_crescimento')
        .select('id')
        .eq('id_igreja', currentChurchId)
        .eq('is_ativa', true)
        .single();

      if (trilhaError || !trilha) {
        toast.error('Nenhuma trilha de crescimento ativa encontrada para esta igreja.');
        setLoading(false);
        return;
      }

      if (etapaParaEditar) {
        // Atualizar etapa existente
        const { error } = await supabase
          .from('etapas_trilha')
          .update({
            titulo: formEtapaData.titulo,
            descricao: formEtapaData.descricao,
            cor: formEtapaData.cor,
          })
          .eq('id', etapaParaEditar.id);

        if (error) throw error;
        toast.success('Etapa atualizada com sucesso!');
      } else {
        // Criar nova etapa
        const novaOrdem = etapasAninhadas.length > 0 ? Math.max(...etapasAninhadas.map(e => e.ordem)) + 1 : 1;
        const { error } = await supabase
          .from('etapas_trilha')
          .insert({
            id_trilha: trilha.id,
            ordem: novaOrdem,
            titulo: formEtapaData.titulo,
            descricao: formEtapaData.descricao,
            cor: formEtapaData.cor,
          });

        if (error) throw error;
        toast.success('Nova etapa criada com sucesso!');
      }
      setIsEtapaModalOpen(false);
      carregarJornadaCompleta();
    } catch (error: any) {
      console.error("Erro ao salvar etapa:", error);
      toast.error('Erro ao salvar etapa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEtapa = async (etapaId: string) => {
    if (!confirm('Tem certeza que deseja apagar esta etapa e todos os seus passos? Esta ação é irreversível.')) {
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('etapas_trilha')
        .delete()
        .eq('id', etapaId);

      if (error) throw error;
      toast.success('Etapa e seus passos apagados com sucesso!');
      carregarJornadaCompleta();
    } catch (error: any) {
      console.error("Erro ao apagar etapa:", error);
      toast.error('Erro ao apagar etapa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreatePassoModal = (etapa: EtapaTrilha) => {
    setEtapaAtualParaPasso(etapa);
    setPassoParaEditar(null);
    setFormPassoData({
      titulo: '',
      tipo_passo: 'leitura',
      conteudo: '',
    });
    setIsPassoModalOpen(true);
  };

  const handleOpenEditPassoModal = (passo: PassoEtapa, etapa: EtapaTrilha) => {
    setEtapaAtualParaPasso(etapa);
    setPassoParaEditar(passo);
    setFormPassoData({
      titulo: passo.titulo,
      tipo_passo: passo.tipo_passo,
      conteudo: passo.conteudo,
    });
    setIsPassoModalOpen(true);
  };

  const handleSavePasso = async () => {
    if (!etapaAtualParaPasso) {
      toast.error('Nenhuma etapa selecionada para adicionar o passo.');
      return;
    }
    if (!formPassoData.titulo || !formPassoData.tipo_passo) {
      toast.error('Título e tipo do passo são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      if (passoParaEditar) {
        // Atualizar passo existente
        const { error } = await supabase
          .from('passos_etapa')
          .update({
            titulo: formPassoData.titulo,
            tipo_passo: formPassoData.tipo_passo,
            conteudo: formPassoData.conteudo,
          })
          .eq('id', passoParaEditar.id);

        if (error) throw error;
        toast.success('Passo atualizado com sucesso!');
      } else {
        // Criar novo passo
        const novaOrdem = etapaAtualParaPasso.passos.length > 0 ? Math.max(...etapaAtualParaPasso.passos.map(p => p.ordem)) + 1 : 1;
        const { error } = await supabase
          .from('passos_etapa')
          .insert({
            id_etapa: etapaAtualParaPasso.id,
            ordem: novaOrdem,
            titulo: formPassoData.titulo,
            tipo_passo: formPassoData.tipo_passo,
            conteudo: formPassoData.conteudo,
          });

        if (error) throw error;
        toast.success('Novo passo criado com sucesso!');
      }
      setIsPassoModalOpen(false);
      carregarJornadaCompleta();
    } catch (error: any) {
      console.error("Erro ao salvar passo:", error);
      toast.error('Erro ao salvar passo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePasso = async (passoId: string) => {
    if (!confirm('Tem certeza que deseja apagar este passo? Esta ação é irreversível.')) {
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('passos_etapa')
        .delete()
        .eq('id', passoId);

      if (error) throw error;
      toast.success('Passo apagado com sucesso!');
      carregarJornadaCompleta();
    } catch (error: any) {
      console.error("Erro ao apagar passo:", error);
      toast.error('Erro ao apagar passo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const isEtapaDrag = etapasAninhadas.some(etapa => etapa.id === active.id);

    if (isEtapaDrag) {
      // Reordenar etapas
      const oldIndex = etapasAninhadas.findIndex(etapa => etapa.id === active.id);
      const newIndex = etapasAninhadas.findIndex(etapa => etapa.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newEtapas = Array.from(etapasAninhadas);
        const [movedEtapa] = newEtapas.splice(oldIndex, 1);
        newEtapas.splice(newIndex, 0, movedEtapa);

        setEtapasAninhadas(newEtapas);

        // Atualizar ordem no banco de dados
        setLoading(true);
        try {
          const updates = newEtapas.map((etapa, index) => ({
            id: etapa.id,
            ordem: index + 1,
          }));
          const { error } = await supabase.from('etapas_trilha').upsert(updates);
          if (error) throw error;
          toast.success('Ordem das etapas atualizada!');
        } catch (error: any) {
          console.error("Erro ao atualizar ordem das etapas:", error);
          toast.error('Erro ao salvar a nova ordem das etapas: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Reordenar passos dentro de uma etapa
      const etapaId = etapasAninhadas.find(etapa => etapa.passos.some(passo => passo.id === active.id))?.id;
      if (!etapaId) return;

      const etapaIndex = etapasAninhadas.findIndex(etapa => etapa.id === etapaId);
      if (etapaIndex === -1) return;

      const oldIndex = etapasAninhadas[etapaIndex].passos.findIndex(passo => passo.id === active.id);
      const newIndex = etapasAninhadas[etapaIndex].passos.findIndex(passo => passo.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newEtapasAninhadas = Array.from(etapasAninhadas);
        const newPassos = Array.from(newEtapasAninhadas[etapaIndex].passos);
        const [movedPasso] = newPassos.splice(oldIndex, 1);
        newPassos.splice(newIndex, 0, movedPasso);

        newEtapasAninhadas[etapaIndex] = {
          ...newEtapasAninhadas[etapaIndex],
          passos: newPassos,
        };
        setEtapasAninhadas(newEtapasAninhadas);

        // Atualizar ordem no banco de dados
        setLoading(true);
        try {
          const updates = newPassos.map((passo, index) => ({
            id: passo.id,
            ordem: index + 1,
          }));
          const { error } = await supabase.from('passos_etapa').upsert(updates);
          if (error) throw error;
          toast.success('Ordem dos passos atualizada!');
        } catch (error: any) {
          console.error("Erro ao atualizar ordem dos passos:", error);
          toast.error('Erro ao salvar a nova ordem dos passos: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para configurar a jornada do membro.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-600">Carregando configuração da jornada...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white mb-6 shadow-lg">
         <h1 className="text-3xl font-bold">Configuração da Jornada 🗺️</h1>
         <p className="opacity-90 mt-1">Gerencie as etapas e passos da trilha de crescimento da sua igreja.</p>
      </div>

      <Card className="bg-white p-6 rounded-xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 p-0">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-purple-500" />
            Etapas da Trilha
          </CardTitle>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleOpenCreateEtapaModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Etapa
          </Button>
        </CardHeader>

        {etapasAninhadas.length > 0 ? (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={etapasAninhadas.map(e => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {etapasAninhadas.map((etapa) => (
                  <SortableEtapaItem 
                    key={etapa.id} 
                    etapa={etapa} 
                    onEdit={handleOpenEditEtapaModal} 
                    onDelete={handleDeleteEtapa} 
                    isExpanded={etapaAberta === etapa.id}
                    onToggleExpand={() => setEtapaAberta(etapaAberta === etapa.id ? null : etapa.id)}
                  >
                    {/* Passos dentro da etapa, renderizados como children */}
                    <div className="ml-4 mt-2 space-y-3">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <ListOrdered className="w-4 h-4" />
                        Passos da Etapa
                      </h4>
                      <SortableContext items={etapa.passos.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {etapa.passos.length > 0 ? (
                          etapa.passos.map((passo) => (
                            <SortablePassoItem 
                              key={passo.id} 
                              passo={passo} 
                              onEdit={(p) => handleOpenEditPassoModal(p, etapa)} 
                              onDelete={handleDeletePasso} 
                            />
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">Nenhum passo adicionado a esta etapa.</p>
                        )}
                      </SortableContext>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => handleOpenCreatePassoModal(etapa)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Passo
                      </Button>
                    </div>
                  </SortableEtapaItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-800">Nenhuma etapa encontrada</h3>
            <p className="text-gray-500 mt-2">Parece que ainda não há uma jornada configurada para esta igreja.<br/>Clique em "+ Nova Etapa" para começar a criar.</p>
          </div>
        )}
      </Card>

      {/* Modal para Etapas */}
      <Dialog open={isEtapaModalOpen} onOpenChange={setIsEtapaModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{etapaParaEditar ? 'Editar Etapa' : 'Criar Nova Etapa'}</DialogTitle>
            <DialogDescription>
              {etapaParaEditar ? `Edite os detalhes da etapa "${etapaParaEditar.titulo}"` : 'Preencha os detalhes da nova etapa da jornada.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="etapa-titulo">Título da Etapa *</Label>
              <Input
                id="etapa-titulo"
                value={formEtapaData.titulo}
                onChange={(e) => setFormEtapaData({...formEtapaData, titulo: e.target.value})}
                placeholder="Ex: Início da Jornada"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etapa-descricao">Descrição *</Label>
              <Textarea
                id="etapa-descricao"
                value={formEtapaData.descricao}
                onChange={(e) => setFormEtapaData({...formEtapaData, descricao: e.target.value})}
                placeholder="Descreva os marcos, objetivos e ferramentas desta etapa."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etapa-cor">Cor da Etapa</Label>
              <Select
                value={formEtapaData.cor}
                onValueChange={(value) => setFormEtapaData({...formEtapaData, cor: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent>
                  {coresDisponiveis.map(cor => (
                    <SelectItem key={cor.value} value={cor.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cor.value }}></div>
                        {cor.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEtapaModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEtapa}>
              {etapaParaEditar ? 'Salvar Alterações' : 'Criar Etapa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Passos */}
      <Dialog open={isPassoModalOpen} onOpenChange={setIsPassoModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{passoParaEditar ? 'Editar Passo' : 'Criar Novo Passo'}</DialogTitle>
            <DialogDescription>
              {passoParaEditar ? `Edite os detalhes do passo "${passoParaEditar.titulo}"` : `Preencha os detalhes do novo passo para a etapa "${etapaAtualParaPasso?.titulo}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="passo-titulo">Título do Passo *</Label>
              <Input
                id="passo-titulo"
                value={formPassoData.titulo}
                onChange={(e) => setFormPassoData({...formPassoData, titulo: e.target.value})}
                placeholder="Ex: Assista ao vídeo sobre Batismo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passo-tipo">Tipo de Passo *</Label>
              <Select
                value={formPassoData.tipo_passo}
                onValueChange={(value) => setFormPassoData({...formPassoData, tipo_passo: value as PassoEtapa['tipo_passo']})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposPasso.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div className="flex items-center gap-2">
                        {tipo.icon}
                        {tipo.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passo-conteudo">Conteúdo (URL ou Texto)</Label>
              <Input
                id="passo-conteudo"
                value={formPassoData.conteudo}
                onChange={(e) => setFormPassoData({...formPassoData, conteudo: e.target.value})}
                placeholder="Link para vídeo, PDF, ou texto adicional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsPassoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePasso}>
              {passoParaEditar ? 'Salvar Alterações' : 'Criar Passo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfiguracaoJornada;