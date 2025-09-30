import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button'; // Adapte o caminho se necessário
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'; // Adicionado para consistência
import { Plus, Loader2, ListOrdered, AlertCircle } from 'lucide-react'; // Adicionado ícones

const ConfiguracaoJornada = () => {
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentChurchId } = useAuthStore();

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
        .eq('is_ativa', true) // Buscar apenas trilhas ativas
        .single();
      
      if (trilhaError && trilhaError.code !== 'PGRST116') { // PGRST116 = No rows found
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
            <Button className="bg-indigo-600 hover:bg-indigo-700">+ Nova Etapa</Button>
          </div>
        </CardHeader>

        {etapas.length > 0 ? (
          <div className="space-y-3">
            {etapas.map((etapa: any) => (
              <div key={etapa.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 cursor-grab" title="Arraste para reordenar">☰</span>
                  <div style={{ borderLeft: `4px solid ${etapa.cor || '#cccccc'}`, paddingLeft: '1rem' }}>
                    <h3 className="font-bold text-lg text-gray-900">{etapa.ordem}. {etapa.titulo}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">{etapa.descricao.split('\n')[0]}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Editar</Button>
                  <Button size="sm" variant="destructive">Apagar</Button>
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