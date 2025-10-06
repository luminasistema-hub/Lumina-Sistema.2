import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';

export type UserRole = 'super_admin' | 'admin' | 'pastor' | 'lider_ministerio' | 'financeiro' | 'voluntario' | 'midia_tecnologia' | 'integra' | 'membro';

export interface MemberProfile {
  id: string;
  id_igreja: string;
  funcao: UserRole;
  perfil_completo: boolean;
  nome_completo: string;
  status: 'ativo' | 'pendente' | 'inativo';
  created_at: string;
  telefone?: string;
  endereco?: string;
  data_nascimento?: string;
  data_casamento?: string;
  estado_civil?: string;
  profissao?: string;
  conjuge_id?: string | null;
  conjuge_nome?: string;
  filhos?: Array<{ nome: string; idade: number }>;
  pais_cristaos?: string;
  tempo_igreja?: string;
  batizado?: boolean;
  data_batismo?: string;
  participa_ministerio?: boolean;
  ministerio_anterior?: string;
  experiencia_anterior?: string;
  data_conversao?: string;
  dias_disponiveis?: string[];
  horarios_disponiveis?: string;
  ultimo_teste_data?: string;
  ministerio_recomendado?: string;
  email: string;
  churchName?: string;
}

const fetchMembers = async (churchId: string | null, getChurchById: (id: string) => { name: string } | undefined): Promise<MemberProfile[]> => {
  if (!churchId) return [];

  const { data, error } = await supabase
    .from('membros')
    .select(`
      id, id_igreja, funcao, perfil_completo, nome_completo, status, created_at, email, ultimo_teste_data, ministerio_recomendado,
      informacoes_pessoais!membro_id (
        telefone, endereco, data_nascimento, estado_civil, profissao, conjuge_id, data_casamento, pais_cristaos, tempo_igreja,
        batizado, data_batismo, participa_ministerio, ministerio_anterior, experiencia_anterior, data_conversao,
        dias_disponiveis, horarios_disponiveis
      )
    `)
    .eq('id_igreja', churchId);

  if (error) throw new Error(error.message);

  let membersData: MemberProfile[] = data.map((member: any) => ({
    ...member,
    churchName: getChurchById(churchId)?.name,
    ...(member.informacoes_pessoais || {}),
  }));

  const memberIds = membersData.map(m => m.id);
  const spouseIds = Array.from(new Set(membersData.map(m => m.conjuge_id).filter(Boolean))) as string[];

  const [spouseRes, kidsRes] = await Promise.all([
    spouseIds.length > 0 ? supabase.from('membros').select('id, nome_completo').in('id', spouseIds) : Promise.resolve({ data: [] }),
    memberIds.length > 0 ? supabase.from('criancas').select('responsavel_id, nome_crianca, data_nascimento').in('responsavel_id', memberIds).eq('id_igreja', churchId) : Promise.resolve({ data: [] }),
  ]);

  const spouseMap = Object.fromEntries((spouseRes.data || []).map(s => [s.id, s.nome_completo]));
  const kidsByResponsible: Record<string, Array<{ nome: string; idade: number }>> = {};
  (kidsRes.data || []).forEach(k => {
    const idade = Math.floor((new Date().getTime() - new Date(k.data_nascimento).getTime()) / 31557600000);
    const entry = { nome: k.nome_crianca, idade };
    if (!kidsByResponsible[k.responsavel_id]) kidsByResponsible[k.responsavel_id] = [];
    kidsByResponsible[k.responsavel_id].push(entry);
  });

  membersData = membersData.map(m => {
    const ownKids = kidsByResponsible[m.id] || [];
    const spouseKids = m.conjuge_id ? (kidsByResponsible[m.conjuge_id] || []) : [];
    const combined = [...ownKids, ...spouseKids];
    const unique = combined.reduce((acc, kid) => {
      if (!acc.some(k => k.nome === kid.nome && k.idade === kid.idade)) acc.push(kid);
      return acc;
    }, [] as Array<{ nome: string; idade: number }>);
    return {
      ...m,
      conjuge_nome: m.conjuge_id ? spouseMap[m.conjuge_id] : undefined,
      filhos: unique,
    };
  });

  return membersData;
};

export const useMembers = () => {
  const { currentChurchId } = useAuthStore();
  const { getChurchById } = useChurchStore();

  return useQuery({
    queryKey: ['members', currentChurchId],
    queryFn: () => fetchMembers(currentChurchId, getChurchById),
    enabled: !!currentChurchId,
  });
};