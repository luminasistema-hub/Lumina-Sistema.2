import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Filter, Clock, User, AlertTriangle, Check, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';

// Interfaces
interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  prazo: string;
  prioridade: 'Baixa' | 'Média' | 'Alta';
  ministerio: { id: string; nome: string } | null;
  responsavel: { nome_completo: string } | null;
  culto: { titulo: string } | null;
  observacoes: string | null;
}
interface MinistryOption { id: string; nome: string; }

const DemandsPage = () => {
    const { currentChurchId } = useAuthStore();
    const [demands, setDemands] = useState<Demanda[]>([]);
    const [filteredDemands, setFilteredDemands] = useState<Demanda[]>([]);
    const [ministryOptions, setMinistryOptions] = useState<MinistryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [ministryFilter, setMinistryFilter] = useState('all');

    const loadData = useCallback(async () => {
        if (!currentChurchId) return setLoading(false);
        setLoading(true);
        try {
            const { data: demandsData, error: demandsError } = await supabase
                .from('demandas_ministerios')
                .select(`
                    id, titulo, descricao, status, prazo, prioridade, observacoes,
                    ministerio:ministerios(id, nome),
                    responsavel:membros(nome_completo),
                    culto:cultos(titulo)
                `)
                .eq('id_igreja', currentChurchId)
                .order('prazo', { ascending: true });
            if (demandsError) throw demandsError;
            setDemands(demandsData as Demanda[]);

            const { data: ministriesData, error: ministriesError } = await supabase
                .from('ministerios')
                .select('id, nome')
                .eq('id_igreja', currentChurchId);
            if (ministriesError) throw ministriesError;
            setMinistryOptions(ministriesData);

        } catch (error: any) {
            toast.error("Falha ao carregar as demandas: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [currentChurchId]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        let filtered = demands;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(d => d.status === statusFilter);
        }
        if (ministryFilter !== 'all') {
            filtered = filtered.filter(d => d.ministerio?.id === ministryFilter);
        }
        setFilteredDemands(filtered);
    }, [statusFilter, ministryFilter, demands]);

    const handleCompleteDemand = (demandId: string) => {
        const promise = async () => {
            const { error } = await supabase
                .from('demandas_ministerios')
                .update({ status: 'Concluído' })
                .eq('id', demandId);
            if (error) throw error;
        };
        toast.promise(promise(), {
            loading: 'Concluindo demanda...',
            success: () => { loadData(); return "Demanda concluída!"; },
            error: (err: any) => `Erro: ${err.message}`
        });
    }

    const getStatusBadgeVariant = (status: Demanda['status']) => {
        switch(status) {
            case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Em Andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Concluído': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }
    const getMinistryBadgeVariant = (ministryName: string | undefined) => {
        if (!ministryName) return 'bg-gray-100 text-gray-800 border-gray-200';
        const lowerName = ministryName.toLowerCase();
        if (lowerName.includes('recepcao') || lowerName.includes('diaconato')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (lowerName.includes('mídia')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        if (lowerName.includes('infantil')) return 'bg-pink-100 text-pink-800 border-pink-200';
        if (lowerName.includes('louvor')) return 'bg-purple-100 text-purple-800 border-purple-200';
        if (lowerName.includes('som')) return 'bg-gray-700 text-white border-gray-800';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }

    if (loading) {
        return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /><p className="ml-4">Carregando demandas...</p></div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Demandas dos Ministérios</h1>
              <p className="text-gray-500 mt-1">Acompanhe todas as tarefas e atividades em andamento.</p>
            </div>
          </div>
    
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-5 h-5 text-gray-500" />
                <Select value={ministryFilter} onValueChange={setMinistryFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar por ministério" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Ministérios</SelectItem>
                    {ministryOptions.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
    
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDemands.map(demand => (
              <Card key={demand.id} className="shadow-sm flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">{demand.titulo}</h3>
                    <p className="text-sm text-gray-600 mt-1">{demand.descricao || demand.culto?.titulo}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {demand.ministerio && <Badge className={getMinistryBadgeVariant(demand.ministerio.nome)}>{demand.ministerio.nome}</Badge>}
                        <Badge className={getStatusBadgeVariant(demand.status)}>{demand.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 space-y-2 mt-4 border-t pt-3">
                      {demand.responsavel && <p className="flex items-center gap-2"><User className="w-4 h-4" /><strong>Responsável:</strong> {demand.responsavel.nome_completo}</p>}
                      <p className="flex items-center gap-2"><Clock className="w-4 h-4" /><strong>Prazo:</strong> {new Date(demand.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    </div>
                    {demand.observacoes && <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-300 text-yellow-800 p-3 rounded-r-lg text-xs"><AlertTriangle className="w-4 h-4 inline-block mr-2" />{demand.observacoes}</div>}
                  </div>
                  {demand.status !== 'Concluído' && (
                    <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={() => handleCompleteDemand(demand.id)}>
                        <Check className="w-4 h-4 mr-2"/>
                        Concluir
                    </Button>
                  )}
                   {demand.status === 'Concluído' && (
                    <div className="w-full mt-4 bg-green-100 text-green-800 text-sm font-semibold p-2 rounded-md flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 mr-2"/>
                        Concluída
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredDemands.length === 0 && (
              <p className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-gray-500 py-12">Nenhuma demanda encontrada com os filtros selecionados.</p>
            )}
          </div>
        </div>
      );
}

export default DemandsPage;

