import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { 
  Church, 
  Plus, 
  Users, 
  Crown,
  Settings,
  Search,
  Loader2,
  UserX,
  UserPlus
} from 'lucide-react'
import AddMinistryDialog from './AddMinistryDialog'
import { useLoadingProtection } from '@/hooks/useLoadingProtection'

// Interfaces
interface Ministry {
  id: string; nome: string; descricao: string; lider_id: string | null;
  lider_nome?: string; created_at: string; id_igreja: string;
  volunteers_count?: number;
}

const MinistriesPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [selectedVolunteerToAdd, setSelectedVolunteerToAdd] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const { protectedFetch, cleanup } = useLoadingProtection();
  const channelRef = useRef<any>(null)

  const canManage = user?.role === 'admin' || user?.role === 'pastor';
  const isLeaderOfSelected = selectedMinistry?.lider_id === user?.id;

  const loadData = useCallback(async () => {
    return protectedFetch(
      async () => {
        if (!currentChurchId) {
          return { ministries: [], members: [] };
        }
        
        let { data: ministriesData, error: ministriesError } = await supabase.from('ministerios')
          .select(`*, volunteers:ministerio_voluntarios!ministerio_voluntarios_ministerio_id_fkey(count)`)
          .eq('id_igreja', currentChurchId).order('nome');
        if (ministriesError) throw ministriesError;

        const leaderIds = ministriesData.map(m => m.lider_id).filter(Boolean) as string[];
        const leadersMap = new Map<string, string>();
        if (leaderIds.length > 0) {
            const { data: leadersData, error: leadersError } = await supabase.from('membros')
                .select('id, nome_completo').in('id', leaderIds);
            if (leadersError) throw leadersError;
            leadersData.forEach(l => leadersMap.set(l.id, l.nome_completo));
        }

        const formattedMinistries: Ministry[] = ministriesData.map((m: any) => ({
          ...m,
          lider_nome: leadersMap.get(m.lider_id) || 'Não Atribuído',
          volunteers_count: m.volunteers[0]?.count || 0,
        }));
        
        // Buscar TODOS os usuários da igreja (sem filtrar por status),
        // permitindo eleger líder dentre qualquer membro vinculado à igreja.
        const { data: membersData, error: membersError } = await supabase
          .from('membros')
          .select('id, nome_completo')
          .eq('id_igreja', currentChurchId)
          .order('nome_completo');
        if (membersError) throw membersError;
        
        return { ministries: formattedMinistries, members: membersData };
      },
      (result) => {
        setMinistries(result.ministries);
        setMemberOptions(result.members);
      },
      (error: any) => {
        toast.error('Falha ao carregar dados: ' + error.message);
        setMinistries([]);
        setMemberOptions([]);
      },
      () => {
        setLoading(false);
      }
    );
  }, [currentChurchId]);

  useEffect(() => {
    setLoading(true);
    loadData();
    
    // Realtime subscription com proteção única
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }
    
    if (currentChurchId) {
      const channel = supabase
        .channel(`ministries-management-${currentChurchId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ministerios', filter: `id_igreja=eq.${currentChurchId}` },
          () => { loadData(); }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ministerio_voluntarios', filter: `id_igreja=eq.${currentChurchId}` },
          () => { loadData(); }
        )
        .subscribe();
      channelRef.current = channel;
    }
    
    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
      }
      cleanup();
    };
  }, [loadData]);

  const loadMinistryDetails = useCallback(async (ministryId: string) => {
    const { data: volunteerData, error: volunteerError } = await supabase.from('ministerio_voluntarios')
      .select('id, membro:membros(id, nome_completo)').eq('ministerio_id', ministryId);
    if (volunteerError) toast.error('Erro ao carregar voluntários.');
    else setVolunteers(volunteerData.map((v: any) => ({ volunteer_id: v.id, ...v.membro })) as Volunteer[]);
  }, []);
  
  useEffect(() => {
    if (selectedMinistry) {
      loadMinistryDetails(selectedMinistry.id);
    } else {
      setVolunteers([]);
    }
  }, [selectedMinistry, loadMinistryDetails]);

  const handleAddVolunteer = (ministryId: string, memberId: string | null) => {
    if (!memberId) return toast.error("Selecione um membro para adicionar.");
    if (volunteers.some(v => v.id === memberId)) return toast.info("Este membro já é voluntário.");
    
    // CORREÇÃO: Usando upsert para evitar erros de chave duplicada em race conditions.
    const promise = async () => {
      const { error } = await supabase
        .from('ministerio_voluntarios')
        .upsert(
            { ministerio_id: ministryId, membro_id: memberId, id_igreja: currentChurchId },
            { onConflict: 'ministerio_id,membro_id', ignoreDuplicates: true }
        );
      if (error) throw error;
    };

    toast.promise(promise(), {
      loading: 'Adicionando voluntário...',
      success: () => { 
        loadMinistryDetails(ministryId); 
        loadData(); 
        setSelectedVolunteerToAdd(null);
        return "Voluntário adicionado!"; 
      },
      error: (err: any) => `Erro: ${err.message}`,
    });
  }

  const handleRemoveVolunteer = (volunteerId: string, ministryId: string) => {
    const promise = async () => {
      const { error } = await supabase.from('ministerio_voluntarios').delete().eq('id', volunteerId);
      if (error) throw error;
    };
    toast.promise(promise(), {
      loading: 'Removendo voluntário...',
      success: () => { loadMinistryDetails(ministryId); loadData(); return "Voluntário removido!"; },
      error: (err: any) => `Erro: ${err.message}`,
    });
  }

  // Removido: criação de escalas agora fica apenas em "Meu Ministério"

  const filteredMinistries = ministries.filter(m => m.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-10 h-10 text-purple-600 animate-spin" /><p className="ml-4 text-lg">Carregando...</p></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 md:p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Gestão de Ministério</h1>
        <p className="text-purple-100 mt-1">Crie ministérios, defina líderes e gerencie voluntários e escalas.</p>
      </div>
      
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar ministério..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          {canManage && (
            <Button onClick={() => setOpenAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Novo Ministério
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMinistries.map((ministry) => (
          <Card key={ministry.id} className="shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle className="text-xl font-bold text-gray-800">{ministry.nome}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1"><Crown className="w-4 h-4 text-yellow-500" />{ministry.lider_nome}</CardDescription>
                  </div>
                  <Badge variant="secondary">{ministry.volunteers_count} voluntários</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ministry.descricao}</p>
              <Button className="w-full" variant="outline" onClick={() => setSelectedMinistry(ministry)}>
                <Settings className="w-4 h-4 mr-2" /> Gerenciar Ministério
              </Button>
            </CardContent>
          </Card>
        ))}
        {filteredMinistries.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-3">Nenhum ministério criado ainda.</p>
              {canManage && (
                <Button onClick={() => setOpenAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Criar primeiro ministério
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo para criar novo ministério */}
      {canManage && (
        <AddMinistryDialog
          open={openAddDialog}
          onOpenChange={setOpenAddDialog}
          churchId={currentChurchId}
          onCreated={() => loadData()}
        />
      )}
      
      {/* DIÁLOGO DE DETALHES/GERENCIAMENTO */}
      <Dialog open={!!selectedMinistry} onOpenChange={() => setSelectedMinistry(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-2xl">{selectedMinistry?.nome}</DialogTitle><DialogDescription>Liderado por {selectedMinistry?.lider_nome}</DialogDescription></DialogHeader>
          <Tabs defaultValue="volunteers" className="mt-4">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="volunteers">Voluntários</TabsTrigger>
            </TabsList>
            <TabsContent value="volunteers" className="mt-4 max-h-[60vh] overflow-y-auto pr-4">
              {(canManage) && (
                <Card className="mb-4">
                  <CardContent className="p-4 grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <Label className="text-sm">Definir Líder do Ministério</Label>
                      <Select
                        value={selectedMinistry?.lider_id || ''}
                        onValueChange={async (memberId) => {
                          if (!selectedMinistry) return;
                          const { error } = await supabase
                            .from('ministerios')
                            .update({ lider_id: memberId === 'null' ? null : memberId })
                            .eq('id', selectedMinistry.id);
                          if (error) { toast.error('Falha ao definir líder: ' + error.message); return; }
                          // Atualização otimista do item selecionado
                          const newLeaderId = memberId === 'null' ? null : memberId;
                          const newLeaderName = newLeaderId ? (memberOptions.find(m => m.id === newLeaderId)?.nome_completo || 'Líder') : 'Não Atribuído';
                          setSelectedMinistry((prev) => prev ? { ...prev, lider_id: newLeaderId, lider_nome: newLeaderName } as Ministry : prev);
                          setMinistries((prev) => prev.map(m => m.id === selectedMinistry.id ? { ...m, lider_id: newLeaderId, lider_nome: newLeaderName } : m));
                          toast.success('Líder definido!');
                        }}
                      >
                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um líder" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Sem líder</SelectItem>
                          {memberOptions.length === 0 ? (
                            <SelectItem value="__empty" disabled>
                              Nenhum membro encontrado na sua igreja
                            </SelectItem>
                          ) : (
                            memberOptions.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-gray-600 flex items-end">Líder atual: <span className="ml-1 font-medium">{selectedMinistry?.lider_nome || '—'}</span></div>
                  </CardContent>
                </Card>
              )}
              {(canManage || isLeaderOfSelected) && (
                  <Card className="mb-4"><CardContent className="p-4 flex items-center gap-4">
                      <Select onValueChange={setSelectedVolunteerToAdd}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um membro para adicionar..." /></SelectTrigger>
                          <SelectContent>{memberOptions.filter(m => !volunteers.some(v => v.id === m.id)).map(m => <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button onClick={() => handleAddVolunteer(selectedMinistry!.id, selectedVolunteerToAdd)} disabled={!selectedVolunteerToAdd}><UserPlus className="w-4 h-4 mr-2"/>Adicionar</Button>
                  </CardContent></Card>
              )}
              <div className="space-y-2">
                  {volunteers.map(v => (
                      <div key={v.volunteer_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium">{v.nome_completo}</p>
                          {(canManage || isLeaderOfSelected) && <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveVolunteer(v.volunteer_id, selectedMinistry!.id)}><UserX className="w-4 h-4"/></Button>}
                      </div>
                  ))}
                  {volunteers.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum voluntário neste ministério ainda.</p>}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MinistriesPage