import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, UserPlus, UserX, CheckCircle, XCircle, Plus, MapPin } from 'lucide-react';

type Ministry = { id: string; nome: string; descricao: string; lider_id: string | null; isLeader: boolean; };
type MemberOption = { id: string; nome_completo: string; };
type ScheduleRow = {
  id: string;
  data_servico: string;
  observacoes: string | null;
  evento?: { id: string; nome: string } | null;
  voluntarios: { id: string; nome_completo: string; email?: string }[];
};
type AssignmentRow = {
  escala_id: string;
  status_confirmacao: 'Pendente' | 'Confirmado' | 'Recusado';
  data_servico: string;
  evento_nome?: string | null;
};

const MyMinistryPage = () => {
  const { user, currentChurchId } = useAuthStore();
  const [myMinistries, setMyMinistries] = useState<Ministry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [volunteers, setVolunteers] = useState<MemberOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [eventOptions, setEventOptions] = useState<{ id: string; nome: string; data_hora?: string; local?: string | null }[]>([]);
  const [selectedVolunteerToAdd, setSelectedVolunteerToAdd] = useState<string | null>(null);
  const [newScheduleEventId, setNewScheduleEventId] = useState<string | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState<string>('');
  const [newScheduleNotes, setNewScheduleNotes] = useState<string>('');

  const selectedMinistry = useMemo(
    () => myMinistries.find(m => m.id === selectedMinistryId) || null,
    [myMinistries, selectedMinistryId]
  );

  const isLeader = !!selectedMinistry?.isLeader;

  const loadMyMinistries = useCallback(async () => {
    if (!user?.id || !currentChurchId) { setMyMinistries([]); return; }
    // Carrega os ministérios onde o usuário é voluntário
    const { data: mv } = await supabase
      .from('ministerio_voluntarios')
      .select('ministerio:ministerios(id, nome, descricao, lider_id)')
      .eq('membro_id', user.id)
      .eq('id_igreja', currentChurchId);
    const volunteerList = (mv || []).map((row: any) => ({
      id: row.ministerio.id,
      nome: row.ministerio.nome,
      descricao: row.ministerio.descricao,
      lider_id: row.ministerio.lider_id,
      isLeader: row.ministerio.lider_id === user.id
    })) as Ministry[];

    // Carrega também os ministérios onde o usuário é LÍDER (mesmo que não esteja na tabela de voluntários)
    const { data: leaderRows } = await supabase
      .from('ministerios')
      .select('id, nome, descricao, lider_id')
      .eq('id_igreja', currentChurchId)
      .eq('lider_id', user.id);

    const leaderList = (leaderRows || []).map((m: any) => ({
      id: m.id,
      nome: m.nome,
      descricao: m.descricao,
      lider_id: m.lider_id,
      isLeader: true
    })) as Ministry[];

    // Mescla e remove duplicados, priorizando a entrada onde isLeader = true
    const merged = [...volunteerList, ...leaderList];
    const uniqueMap = new Map<string, Ministry>();
    for (const item of merged) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      } else {
        const existing = uniqueMap.get(item.id)!;
        uniqueMap.set(item.id, { ...existing, ...item, isLeader: existing.isLeader || item.isLeader });
      }
    }
    const unique = Array.from(uniqueMap.values());
    setMyMinistries(unique);

    // Se nada selecionado ainda, prioriza um ministério onde o usuário é líder
    if (unique.length > 0 && !selectedMinistryId) {
      const leaderFirst = unique.find(m => m.isLeader) || unique[0];
      setSelectedMinistryId(leaderFirst.id);
    }
  }, [user?.id, currentChurchId, selectedMinistryId]);

  const loadMembersAndEvents = useCallback(async () => {
    if (!currentChurchId) return;
    const { data: members } = await supabase
      .from('membros')
      .select('id, nome_completo')
      .eq('id_igreja', currentChurchId)
      .eq('status', 'ativo')
      .order('nome_completo');
    setMemberOptions(members || []);
    const { data: events } = await supabase
      .from('eventos')
      .select('id, nome, data_hora, local')
      .eq('id_igreja', currentChurchId)
      .order('data_hora', { ascending: false });
    setEventOptions(events || []);
  }, [currentChurchId]);

  const loadVolunteers = useCallback(async (ministryId: string) => {
    const { data, error } = await supabase
      .from('ministerio_voluntarios')
      .select('membro:membros(id, nome_completo)')
      .eq('ministerio_id', ministryId);
    if (error) { toast.error('Erro ao carregar voluntários'); return; }
    setVolunteers((data || []).map((v: any) => ({ id: v.membro.id, nome_completo: v.membro.nome_completo })));
  }, []);

  const loadSchedules = useCallback(async (ministryId: string) => {
    const { data, error } = await supabase
      .from('escalas_servico')
      .select('*, evento:eventos(id, nome), voluntarios:escala_voluntarios(membro:membros(id, nome_completo, email))')
      .eq('ministerio_id', ministryId)
      .order('data_servico', { ascending: true });
    if (error) { toast.error('Erro ao carregar escalas'); return; }
    const mapped: ScheduleRow[] = (data || []).map((s: any) => ({
      id: s.id,
      data_servico: s.data_servico,
      observacoes: s.observacoes,
      evento: s.evento ? { id: s.evento.id, nome: s.evento.nome } : null,
      voluntarios: (s.voluntarios || []).map((ev: any) => ({
        id: ev.membro?.id,
        nome_completo: ev.membro?.nome_completo,
        email: ev.membro?.email
      }))
    }));
    setSchedules(mapped);
  }, []);

  const loadMyAssignments = useCallback(async (ministryId: string) => {
    if (!user?.id) { setAssignments([]); return; }
    // Buscar escalas do ministério nas quais o usuário está na escala_voluntarios
    const { data, error } = await supabase
      .from('escala_voluntarios')
      .select(`
        escala_id,
        status_confirmacao,
        escala:escalas_servico(id, data_servico, evento:eventos(nome), ministerio_id)
      `)
      .eq('membro_id', user.id);
    if (error) { toast.error('Erro ao carregar suas escalas'); setAssignments([]); return; }
    const rows = (data || [])
      .filter((r: any) => r.escala?.ministerio_id === ministryId)
      .map((r: any) => ({
        escala_id: r.escala_id,
        status_confirmacao: r.status_confirmacao,
        data_servico: r.escala?.data_servico,
        evento_nome: r.escala?.evento?.nome || null
      })) as AssignmentRow[];
    setAssignments(rows);
  }, [user?.id]);

  useEffect(() => {
    loadMyMinistries();
    loadMembersAndEvents();
  }, [loadMyMinistries, loadMembersAndEvents]);

  useEffect(() => {
    if (!selectedMinistryId) return;
    loadVolunteers(selectedMinistryId);
    loadSchedules(selectedMinistryId);
    loadMyAssignments(selectedMinistryId);
  }, [selectedMinistryId, loadVolunteers, loadSchedules, loadMyAssignments]);

  const selectedEvent = useMemo(
    () => eventOptions.find(e => e.id === newScheduleEventId),
    [eventOptions, newScheduleEventId]
  );

  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleAddVolunteer = async () => {
    if (!selectedMinistryId || !selectedVolunteerToAdd || !currentChurchId) return;
    const { error } = await supabase
      .from('ministerio_voluntarios')
      .upsert(
        { ministerio_id: selectedMinistryId, membro_id: selectedVolunteerToAdd, id_igreja: currentChurchId },
        { onConflict: 'ministerio_id,membro_id', ignoreDuplicates: true }
      );
    if (error) { toast.error('Erro ao adicionar voluntário: ' + error.message); return; }
    toast.success('Voluntário adicionado!');
    setSelectedVolunteerToAdd(null);
    loadVolunteers(selectedMinistryId);
  };

  const handleRemoveVolunteer = async (membroId: string) => {
    if (!selectedMinistryId) return;
    const { error } = await supabase
      .from('ministerio_voluntarios')
      .delete()
      .eq('ministerio_id', selectedMinistryId)
      .eq('membro_id', membroId);
    if (error) { toast.error('Erro ao remover voluntário'); return; }
    toast.success('Voluntário removido!');
    loadVolunteers(selectedMinistryId);
  };

  const handleCreateSchedule = async (date: string, notes: string) => {
    if (!selectedMinistryId || !currentChurchId) return;
    if (!newScheduleEventId) {
      toast.error('Selecione um evento para criar a escala.');
      return;
    }
    const { error } = await supabase
      .from('escalas_servico')
      .insert({ ministerio_id: selectedMinistryId, evento_id: newScheduleEventId, data_servico: date, observacoes: notes, id_igreja: currentChurchId });
    if (error) { toast.error('Erro ao criar escala: ' + error.message); return; }
    toast.success('Escala criada!');
    setNewScheduleEventId(null);
    setNewScheduleDate('');
    setNewScheduleNotes('');
    loadSchedules(selectedMinistryId);
  };

  const handleAssignVolunteerToSchedule = async (escalaId: string, membroId: string) => {
    const { error } = await supabase
      .from('escala_voluntarios')
      .insert({ escala_id: escalaId, membro_id: membroId, id_igreja: currentChurchId, status_confirmacao: 'Pendente' });
    if (error) { toast.error('Erro ao atribuir voluntário: ' + error.message); return; }
    toast.success('Voluntário atribuído à escala!');
    loadSchedules(selectedMinistryId!);
    if (membroId === user?.id) loadMyAssignments(selectedMinistryId!);
  };

  const handleRemoveVolunteerFromSchedule = async (escalaId: string, membroId: string) => {
    const { error } = await supabase
      .from('escala_voluntarios')
      .delete()
      .eq('escala_id', escalaId)
      .eq('membro_id', membroId);
    if (error) { toast.error('Erro ao remover da escala'); return; }
    toast.success('Voluntário removido da escala!');
    loadSchedules(selectedMinistryId!);
    if (membroId === user?.id) loadMyAssignments(selectedMinistryId!);
  };

  const handleConfirmPresence = async (escalaId: string, confirm: boolean) => {
    if (!user?.id) return;
    const status = confirm ? 'Confirmado' : 'Recusado';
    const { error } = await supabase
      .from('escala_voluntarios')
      .update({ status_confirmacao: status })
      .eq('escala_id', escalaId)
      .eq('membro_id', user.id);
    if (error) { toast.error('Erro ao atualizar presença'); return; }
    toast.success(confirm ? 'Presença confirmada!' : 'Presença recusada.');
    loadMyAssignments(selectedMinistryId!);
  };

  if (!user) {
    return <div className="p-6 text-center text-gray-600">Faça login para acessar seu ministério.</div>;
  }

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja para continuar.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Meu Ministério</h1>
        <p className="text-blue-100 mt-1">Gerencie sua equipe e confirme suas escalas.</p>
      </div>

      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Selecione o ministério</label>
            <Select value={selectedMinistryId || ''} onValueChange={setSelectedMinistryId}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {myMinistries.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}{m.isLeader ? ' (Líder)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-600 self-center md:text-right truncate">
            {selectedMinistry ? selectedMinistry.descricao : '—'}
          </div>
        </CardContent>
      </Card>

      {/* Seção do Líder */}
      {selectedMinistry && isLeader && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Voluntários do Ministério</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Select onValueChange={setSelectedVolunteerToAdd}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um membro para adicionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {memberOptions
                      .filter(m => !volunteers.some(v => v.id === m.id))
                      .map(m => <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddVolunteer} disabled={!selectedVolunteerToAdd}>
                  <UserPlus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {volunteers.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{v.nome_completo}</span>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveVolunteer(v.id)}>
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {volunteers.length === 0 && (
                  <p className="text-center text-gray-500">Nenhum voluntário neste ministério ainda.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Criar Escala</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newScheduleEventId || !newScheduleDate) return;
                  handleCreateSchedule(newScheduleDate, newScheduleNotes);
                }}
              >
                <Select
                  onValueChange={(val) => {
                    setNewScheduleEventId(val);
                    const ev = eventOptions.find(e => e.id === val);
                    if (ev?.data_hora) {
                      const d = new Date(ev.data_hora);
                      setNewScheduleDate(toYMD(d));
                    }
                  }}
                >
                  <SelectTrigger className="truncate">
                    <SelectValue placeholder="Selecione um evento para a escala" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventOptions.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedEvent && (
                  <div className="text-sm text-gray-600 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="truncate">
                        {new Date(selectedEvent.data_hora || '').toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {selectedEvent.local && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{selectedEvent.local}</span>
                      </div>
                    )}
                  </div>
                )}
                <Input
                  type="date"
                  name="data"
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  required
                />
                <Textarea
                  name="observacoes"
                  value={newScheduleNotes}
                  onChange={(e) => setNewScheduleNotes(e.target.value)}
                  placeholder="Observações (ex: chegar 30 min antes)"
                  className="placeholder:text-gray-500"
                />
                <Button type="submit" className="w-full" disabled={!newScheduleEventId || !newScheduleDate}>
                  <Plus className="w-4 h-4 mr-2" />Criar Escala
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Escalas do Ministério</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {schedules.map((s) => (
                <div key={s.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(s.data_servico).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </div>
                    <Badge variant="outline" className="max-w-[60%] truncate">{s.evento?.nome || 'Sem evento'}</Badge>
                  </div>
                  {s.observacoes && <p className="text-sm text-gray-600 mt-1">{s.observacoes}</p>}

                  <div className="mt-3">
                    <h4 className="font-semibold text-sm mb-1">Voluntários na escala:</h4>
                    <div className="space-y-1">
                      {s.voluntarios.length > 0 ? s.voluntarios.map(v => (
                        <div key={v.id} className="flex items-center justify-between text-sm">
                          <span>- {v.nome_completo}</span>
                          <Button variant="ghost" size="sm" className="text-red-600"
                            onClick={() => handleRemoveVolunteerFromSchedule(s.id, v.id)}>
                            Remover
                          </Button>
                        </div>
                      )) : <p className="text-sm italic">Nenhum voluntário escalado.</p>}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Select onValueChange={(mId) => handleAssignVolunteerToSchedule(s.id, mId)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Adicionar voluntário à escala" /></SelectTrigger>
                        <SelectContent>
                          {volunteers
                            .filter(v => !s.voluntarios.some(x => x.id === v.id))
                            .map(v => <SelectItem key={v.id} value={v.id}>{v.nome_completo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              {schedules.length === 0 && (
                <p className="text-center text-gray-500">Nenhuma escala criada ainda.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seção do Voluntário */}
      {selectedMinistry && (
        <Card>
          <CardHeader><CardTitle>Minhas Escalas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {assignments.length > 0 ? assignments.map(a => (
              <div key={a.escala_id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{a.evento_nome || 'Escala'}</p>
                  <p className="text-xs text-gray-500">
                    Data: {new Date(a.data_servico).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </p>
                  <Badge className={
                    a.status_confirmacao === 'Confirmado' ? 'bg-green-100 text-green-800' :
                    a.status_confirmacao === 'Recusado' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {a.status_confirmacao}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleConfirmPresence(a.escala_id, false)}>
                    <XCircle className="w-4 h-4 mr-1" /> Não posso
                  </Button>
                  <Button size="sm" onClick={() => handleConfirmPresence(a.escala_id, true)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Confirmar
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-gray-500">Você ainda não foi escalado(a) neste ministério.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyMinistryPage;