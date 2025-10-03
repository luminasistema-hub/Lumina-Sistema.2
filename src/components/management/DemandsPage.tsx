import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Filter, Clock, User, AlertTriangle, Check, CheckCircle, Upload, Paperclip, ClipboardList } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

// Interfaces
interface Demanda {
  id: string; titulo: string; descricao: string; status: 'Pendente' | 'Em Andamento' | 'Concluído';
  prazo: string; prioridade: 'Baixa' | 'Média' | 'Alta';
  ministerio: { id: string; nome: string } | null;
  responsavel: { id: string, nome_completo: string } | null;
  culto: { id: string, titulo: string, arte_url: string | null } | null;
  observacoes: string | null;
}
interface MinistryOption { id: string; nome: string; }
interface VolunteerOption { id: string; nome_completo: string; }

const DemandsPage = () => {
    const { user, currentChurchId } = useAuthStore();
    const [demands, setDemands] = useState<Demanda[]>([]);
    const [filteredDemands, setFilteredDemands] = useState<Demanda[]>([]);
    const [ministryOptions, setMinistryOptions] = useState<MinistryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [ministryFilter, setMinistryFilter] = useState('all');
    
    const [selectedDemand, setSelectedDemand] = useState<Demanda | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ministryVolunteers, setMinistryVolunteers] = useState<VolunteerOption[]>([]);
    const [editData, setEditData] = useState<Partial<Demanda>>({});

    const canManage = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio';

    const loadData = useCallback(async () => {
        if (!currentChurchId) return setLoading(false);
        setLoading(true);
        try {
            // 1. Fetch core demands data
            const { data: demandsData, error: demandsError } = await supabase
                .from('demandas_ministerios')
                .select(`id, titulo, descricao, status, prazo, prioridade, observacoes, ministerio_id, responsavel_id, culto_id`)
                .eq('id_igreja', currentChurchId)
                .order('prazo', { ascending: true });
            if (demandsError) throw demandsError;
            if (!demandsData) { setDemands([]); return; }

            // 2. Collect all related IDs
            const ministryIds = [...new Set(demandsData.map(d => d.ministerio_id).filter(Boolean))];
            const responsavelIds = [...new Set(demandsData.map(d => d.responsavel_id).filter(Boolean))];
            const cultoIds = [...new Set(demandsData.map(d => d.culto_id).filter(Boolean))];

            // 3. Fetch related data in parallel
            const [
                { data: ministriesData },
                { data: responsaveisData },
                { data: cultosData },
                { data: ministryOptionsData }
            ] = await Promise.all([
                supabase.from('ministerios').select('id, nome').in('id', ministryIds),
                supabase.from('membros').select('id, nome_completo').in('id', responsavelIds),
                supabase.from('cultos').select('id, titulo, arte_url').in('id', cultoIds),
                supabase.from('ministerios').select('id, nome').eq('id_igreja', currentChurchId).order('nome')
            ]);

            // 4. Create maps for easy lookup
            const ministriesMap = new Map(ministriesData?.map(m => [m.id, m]));
            const responsaveisMap = new Map(responsaveisData?.map(r => [r.id, r]));
            const cultosMap = new Map(cultosData?.map(c => [c.id, c]));

            // 5. Combine the data
            const combinedData = demandsData.map((demand: any) => ({
                ...demand,
                ministerio: ministriesMap.get(demand.ministerio_id) || null,
                responsavel: responsaveisMap.get(demand.responsavel_id) || null,
                culto: cultosMap.get(demand.culto_id) || null,
            })) as Demanda[];

            setDemands(combinedData);
            setMinistryOptions(ministryOptionsData || []);

        } catch (error: any) {
            toast.error("Falha ao carregar as demandas: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [currentChurchId]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        let filtered = demands;
        if (statusFilter !== 'all') filtered = filtered.filter(d => d.status === statusFilter);
        if (ministryFilter !== 'all') filtered = filtered.filter(d => d.ministerio?.id === ministryFilter);
        setFilteredDemands(filtered);
    }, [statusFilter, ministryFilter, demands]);

    const handleOpenDemandModal = async (demand: Demanda) => {
        setSelectedDemand(demand);
        setEditData(demand);
        if (demand.ministerio) {
            const { data, error } = await supabase.from('ministerio_voluntarios').select('membro:membros(id, nome_completo)').eq('ministerio_id', demand.ministerio.id);
            if(error) toast.error("Erro ao buscar voluntários.");
            else setMinistryVolunteers(data?.map((v: any) => v.membro).filter(Boolean) || []);
        }
        setIsModalOpen(true);
    }

    const handleSaveChanges = () => {
        if (!selectedDemand) return;
        const promise = async () => {
            const { error } = await supabase.from('demandas_ministerios').update({
                status: editData.status,
                responsavel_id: editData.responsavel?.id,
                observacoes: editData.observacoes,
            }).eq('id', selectedDemand.id);
            if (error) throw error;
        };
        toast.promise(promise(), {
            loading: 'Salvando alterações...',
            success: () => { loadData(); setIsModalOpen(false); return "Demanda atualizada!"; },
            error: (err: any) => `Erro: ${err.message}`
        });
    }
    
    const handleArtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedDemand?.culto) return;
        const file = e.target.files?.[0];
        if (!file) return;
        const filePath = `${currentChurchId}/${selectedDemand.culto.id}/${Date.now()}_${file.name}`;
        const promise = async () => {
            const { error: uploadError } = await supabase.storage.from('artes_cultos').upload(filePath, file, { upsert: true });
            if(uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('artes_cultos').getPublicUrl(filePath);
            const { error: updateError } = await supabase.from('cultos').update({ arte_url: publicUrl }).eq('id', selectedDemand.culto!.id);
            if(updateError) throw updateError;
            return publicUrl;
        };
        toast.promise(promise(), {
          loading: 'Enviando arte...',
          success: (publicUrl) => { 
            loadData(); 
            setEditData(prev => ({...prev, culto: {...prev.culto, arte_url: publicUrl as string}}));
            return 'Arte anexada!'; 
          },
          error: (err: any) => `Erro ao enviar arte: ${err.message}`,
        });
    }

    if (loading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /><p className="ml-4">Carregando...</p></div>;

    return (
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Demandas dos Ministérios</h1><p className="text-gray-500 mt-1">Acompanhe e gerencie todas as tarefas.</p></div></div>
          <Card><CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4"><div className="flex items-center gap-2 w-full sm:w-auto"><Filter className="w-5 h-5 text-gray-500" /><Select value={ministryFilter} onValueChange={setMinistryFilter}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filtrar por ministério" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Ministérios</SelectItem>{ministryOptions.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.nome}</SelectItem>)}</SelectContent></Select></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Status</SelectItem><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Em Andamento">Em Andamento</SelectItem><SelectItem value="Concluído">Concluído</SelectItem></SelectContent></Select></CardContent></Card>
    
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDemands.map(demand => (
              <Card key={demand.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer" onClick={() => canManage && handleOpenDemandModal(demand)}>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex-1"><h3 className="font-bold text-lg text-gray-800">{demand.titulo}</h3><p className="text-sm text-gray-600 mt-1">{demand.descricao || demand.culto?.titulo}</p><div className="flex flex-wrap gap-2 mt-3"><Badge>{demand.ministerio?.nome}</Badge><Badge variant="secondary">{demand.status}</Badge></div><div className="text-sm text-gray-500 space-y-2 mt-4 border-t pt-3">{demand.responsavel && <p className="flex items-center gap-2"><User className="w-4 h-4" /><strong>Responsável:</strong> {demand.responsavel.nome_completo}</p>}<p className="flex items-center gap-2"><Clock className="w-4 h-4" /><strong>Prazo:</strong> {new Date(demand.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p></div>{demand.observacoes && <div className="mt-3 bg-yellow-50 text-yellow-800 p-3 text-xs"><AlertTriangle className="w-4 h-4 inline-block mr-2" />{demand.observacoes}</div>}</div>
                  {demand.status === 'Concluído' && <div className="w-full mt-4 bg-green-100 text-green-800 text-sm font-semibold p-2 rounded-md flex items-center justify-center"><CheckCircle className="w-4 h-4 mr-2"/>Concluída</div>}
                </CardContent>
              </Card>
            ))}
            {filteredDemands.length === 0 && !loading && <div className="col-span-3 text-center py-12"><ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-semibold">Nenhuma demanda encontrada</h3><p>Tente ajustar os filtros ou aguarde novas tarefas.</p></div>}
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedDemand?.titulo}</DialogTitle>
                    <DialogDescription>Gerencie os detalhes desta demanda.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Em Andamento">Em Andamento</SelectItem><SelectItem value="Concluído">Concluído</SelectItem></SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Atribuir Responsável</Label>
                        <Select value={editData.responsavel?.id || ''} onValueChange={(value) => setEditData({...editData, responsavel: {id: value, nome_completo: ministryVolunteers.find(v => v.id === value)?.nome_completo || ''}})}>
                            <SelectTrigger><SelectValue placeholder="Selecione um voluntário"/></SelectTrigger>
                            <SelectContent>{ministryVolunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.nome_completo}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Avisos / Observações</Label>
                        <Textarea value={editData.observacoes || ''} onChange={(e) => setEditData({...editData, observacoes: e.target.value})} />
                    </div>
                    {selectedDemand?.ministerio?.nome?.includes("Mídia") && (
                        <div className="space-y-2">
                            <Label>Arte do Evento</Label>
                            {editData.culto?.arte_url && <img src={editData.culto.arte_url} alt="Arte do evento" className="rounded-md border p-2" />}
                            <div className="flex items-center gap-2"><Paperclip className="w-4 h-4"/><Input id="art-upload" type="file" accept="image/*" onChange={handleArtUpload} /></div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
}

export default DemandsPage;

