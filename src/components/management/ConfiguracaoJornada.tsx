import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, Loader2, ListOrdered, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  const { currentChurchId } = useAuthStore();

  useEffect(() => {
    const carregarEtapas = async () => {
      if (!currentChurchId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      console.log('ConfiguracaoJornada: Carregando etapas para a igreja:', currentChurchId);

      try {
        // 1. Encontrar a trilha ativa
        const { data: trilha, error: trilhaError } = await supabase
          .from('trilhas_crescimento')
          .select('id')
          .eq('id_igreja', currentChurchId)
          .eq('is_ativa', true)
          .single();

        if (trilhaError && trilhaError.code !== 'PGRST116') { // PGRST116 = No rows found
          console.error('ConfiguracaoJornada: Erro ao buscar trilha ativa:', trilhaError);
          toast.error('Erro ao carregar a trilha de crescimento: ' + trilhaError.message);
          setEtapas([]);
          return;
        }

        if (trilha) {
          // 2. Buscar as etapas da trilha
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
        }
      } catch (error) {
        console.error("ConfiguracaoJornada: Erro inesperado ao carregar etapas:", error);
        toast.error('Ocorreu um erro inesperado ao carregar as etapas da jornada.');
      } finally {
        setLoading(false);
      }
    };

    carregarEtapas();
  }, [currentChurchId]);

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
          <Button className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Nova Etapa
          </Button>
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
            <div className="space-y-4">
              {etapas.map((etapa) => (
                <Card key={etapa.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{etapa.titulo}</h3>
                      <p className="text-sm text-gray-600">{etapa.descricao}</p>
                      <p className="text-xs text-gray-500 mt-1">Ordem: {etapa.ordem}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracaoJornada;