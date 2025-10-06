import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Loader2, Search, UserCog } from 'lucide-react';

type MemberRow = {
  id: string;
  id_igreja: string | null;
  nome_completo: string | null;
  email: string;
  funcao: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

const roleOptions = [
  { value: 'membro', label: 'Membro' },
  { value: 'lider_ministerio', label: 'Líder de Ministério' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'admin', label: 'Admin' },
  { value: 'financeiro', label: 'Financeiro' },
];

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'ativo', label: 'Ativo' },
];

const MembersManagementCard = () => {
  const { user, currentChurchId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = async () => {
    if (!user?.id || !currentChurchId) {
      setLoading(false);
      setMembers([]);
      setIsAdmin(false);
      return;
    }

    setLoading(true);
    try {
      // Busca a função do usuário atual nessa igreja (para habilitar edição)
      const { data: me, error: meErr } = await supabase
        .from('membros')
        .select('funcao')
        .eq('id', user.id)
        .eq('id_igreja', currentChurchId)
        .maybeSingle();
      if (meErr) throw meErr;

      const myRole = me?.funcao || 'membro';
      setIsAdmin(['admin', 'pastor', 'integra'].includes(myRole));

      // Lista de membros da igreja
      const { data, error } = await supabase
        .from('membros')
        .select('id, id_igreja, nome_completo, email, funcao, status, created_at, updated_at')
        .eq('id_igreja', currentChurchId)
        .order('nome_completo', { ascending: true });
      if (error) throw error;

      setMembers(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar membros:', err);
      toast.error('Não foi possível carregar os membros.');
      setMembers([]);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, currentChurchId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter(m =>
      (m.nome_completo || '').toLowerCase().includes(term) ||
      (m.email || '').toLowerCase().includes(term) ||
      (m.funcao || '').toLowerCase().includes(term) ||
      (m.status || '').toLowerCase().includes(term)
    );
  }, [members, search]);

  const updateMember = async (id: string, patch: Partial<MemberRow>) => {
    try {
      const { error } = await supabase
        .from('membros')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
      toast.success('Dados do membro atualizados!');
      await loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar membro:', err);
      toast.error('Não foi possível atualizar. Verifique suas permissões.');
    }
  };

  return (
    <Card className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <CardHeader className="p-0 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <UserCog className="w-5 h-5 text-purple-500" />
          Gestão de Membros
        </CardTitle>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome, email, função, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" onClick={loadData}>
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-3 text-gray-600">Carregando membros...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-600">Nenhum membro encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Função</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{m.nome_completo || '—'}</td>
                    <td className="py-3 px-4">{m.email}</td>
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <Select
                          value={m.funcao}
                          onValueChange={(val) => updateMember(m.id, { funcao: val })}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map(r => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {roleOptions.find(r => r.value === m.funcao)?.label || m.funcao}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <Select
                          value={m.status}
                          onValueChange={(val) => updateMember(m.id, { status: val })}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {statusOptions.find(s => s.value === m.status)?.label || m.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MembersManagementCard;