import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Plus, Loader2, ListOrdered, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

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
  const { currentChurchId } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [etapaParaEditar, setEtapaParaEditar] = useState<EtapaTrilha | null>(null);
  const [formEtapaData, setFormEtapaData] = useState<Partial<EtapaTrilha>>({
    titulo: '',
    descricao: '',
    tipo_conteudo: 'Texto',
    conteudo: '',
    cor: '#e0f2fe', // Cor padrão
  });

  const coresDisponiveis = [
    { value: '#e0f2fe', name: 'Azul Claro' },
    { value: '#dcfce7', name: 'Verde Claro' },
    { value: '#f3e8ff', name: 'Roxo Claro' },
    { value: '#ffe4e6', name: 'Rosa Claro' },
    { value: '#fffbe5', name: 'Amarelo Claro' },
    { value: '#e5e7eb', name: 'Cinza Claro' },
  ];

  const tiposConteudo = ['Texto', 'Video', 'PDF', 'Quiz', 'Link Externo'];

  const carregarEtapas = async () => {
    if (!currentChurchId) {
      setLoading(false);
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
      
      if (trilhaError && trilhaError.code !== 'PGRST116') {
        console.error('Erro ao buscar trilha ativa:', trilhaError);
        setEtapas([]);
        return;
      }

      if (trilha) {
        const { data: etapasData, error: etapasDataError } = await supabase
          .from('etapas_trilha')
          .select('*')
          .eq('id_trilha', trilha.id)
          .order('ordem', { ascending: true });

        if (etapasDataError) {
          console.error("Erro ao carregar etapas:", etapasDataError);
          setEtapas([]);
          return;
        }
        setEtapas(etapasData || []);
      } else {
        setEtapas([]);
      }
    } catch (error) {
      console.error("Erro inesperado ao carregar etapas:", error);
      setEtapas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEtapas();
  }, [currentChurchId]);

  const handleOpenCreateModal = () => {
    setEtapaParaEditar(null);
    setFormEtapaData({
      titulo: '',
      descricao: '',
      tipo_conteudo: 'Texto',
      conteudo: '',
      cor: '#e0f2fe',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (etapa: EtapaTrilha) => {
    setEtapaParaEditar(etapa);
    setFormEtapaData({
      titulo: etapa.titulo,
      descricao: etapa.descricao,
      tipo_conteudo: etapa.tipo_conteudo,
      conteudo: etapa.conteudo,
      cor: etapa.cor,
    });
    setIsModalOpen(true);
  };

  const handleSaveEtapa = async () => {
    if (!currentChurchId) {
      toast.error('Selecione uma igreja para configurar a jornada.');
      return;
    }
    if (!formEtapaData.titulo || !formEtapaData.descricao) {
      toast.error('Título e descrição são obrigatórios.');
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
            tipo_conteudo: formEtapaData.tipo_conteudo,
            conteudo: formEtapaData.conteudo,
            cor: formEtapaData.cor,
          })
          .eq('id', etapaParaEditar.id);

        if (error) throw error;
        toast.success('Etapa atualizada com sucesso!');
      } else {
        // Criar nova etapa
        const novaOrdem = etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem)) + 1 : 1;
        const { error } = await supabase
          .from('etapas_trilha')
          .insert({
            id_trilha: trilha.id,
            ordem: novaOrdem,
            titulo: formEtapaData.titulo,
            descricao: formEtapaData.descricao,
            tipo_conteudo: formEtapaData.tipo_conteudo,
            conteudo: formEtapaData.conteudo,
            cor: formEtapaData.cor,
          });

        if (error) throw error;
        toast.success('Nova etapa criada com sucesso!');
      }
      setIsModalOpen(false);
      carregarEtapas(); // Recarregar a lista de etapas
    } catch (error: any) {
      console.error("Erro ao salvar etapa:", error);
      toast.error('Erro ao salvar etapa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEtapa = async (etapaId: string) => {
    if (!confirm('Tem certeza que deseja apagar esta etapa? Esta ação é irreversível.')) {
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('etapas_trilha')
        .delete()
        .eq('id', etapaId);

      if (error) throw error;
      toast.success('Etapa apagada com sucesso!');
      carregarEtapas();
    } catch (error: any) {
      console.error("Erro ao apagar etapa:", error);
      toast.error('Erro ao apagar etapa: ' + error.message);
    } finally {
      setLoading(false);
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
         <p className="opacity-90 mt-1">Gerencie as etapas da trilha de crescimento da sua igreja.</p>
      </div>

      <Card className="bg-white p-6 rounded-xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 p-0">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-purple-500" />
            Etapas da Trilha
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline">Salvar Ordem</Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleOpenCreateModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Etapa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{etapaParaEditar ? 'Editar Etapa' : 'Criar Nova Etapa'}</DialogTitle>
                  <DialogDescription>
                    {etapaParaEditar ? `Edite os detalhes da etapa "${etapaParaEditar.titulo}"` : 'Preencha os detalhes da nova etapa da jornada.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título da Etapa *</Label>
                    <Input
                      id="titulo"
                      value={formEtapaData.titulo}
                      onChange={(e) => setFormEtapaData({...formEtapaData, titulo: e.target.value})}
                      placeholder="Ex: Início da Jornada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Textarea
                      id="descricao"
                      value={formEtapaData.descricao}
                      onChange={(e) => setFormEtapaData({...formEtapaData, descricao: e.target.value})}
                      placeholder="Descreva os marcos, objetivos e ferramentas desta etapa."
                      rows={5}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_conteudo">Tipo de Conteúdo</Label>
                      <Select
                        value={formEtapaData.tipo_conteudo}
                        onValueChange={(value) => setFormEtapaData({...formEtapaData, tipo_conteudo: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposConteudo.map(tipo => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cor">Cor da Etapa</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="conteudo">Conteúdo (URL ou Texto)</Label>
                    <Input
                      id="conteudo"
                      value={formEtapaData.conteudo}
                      onChange={(e) => setFormEtapaData({...formEtapaData, conteudo: e.target.value})}
                      placeholder="Link para vídeo, PDF, ou texto adicional"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEtapa}>
                    {etapaParaEditar ? 'Salvar Alterações' : 'Criar Etapa'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        {etapas.length > 0 ? (
          <div className="space-y-3">
            {etapas.map((etapa) => (
              <div key={etapa.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 cursor-grab" title="Arraste para reordenar">☰</span>
                  <div style={{ borderLeft: `4px solid ${etapa.cor || '#cccccc'}`, paddingLeft: '1rem' }}>
                    <h3 className="font-bold text-lg text-gray-900">{etapa.ordem}. {etapa.titulo}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">{etapa.descricao.split('\n')[0]}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(etapa)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteEtapa(etapa.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Apagar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-800">Nenhuma etapa encontrada</h3>
            <p className="text-gray-500 mt-2">Parece que ainda não há uma jornada configurada para esta igreja.<br/>Clique em "+ Nova Etapa" para começar a criar.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConfiguracaoJornada;