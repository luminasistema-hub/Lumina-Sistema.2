import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';

export type UserRole = 'super_admin' | 'admin' | 'pastor' | 'lider_ministerio' | 'financeiro' | 'voluntario' | 'midia_tecnologia' | 'integra' | 'gestao_kids' | 'membro';

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

const fetchMembers = async (churchId: string | null, getChurchById: (id: string) => { name: string } | undefined, _userId?: string | null): Promise<MemberProfile[]> => {
  if (!churchId) return [];

  const { data, error } = await supabase.functions.invoke('get-church-members', {
    body: { church_id: churchId }
  });

  if (error) throw new Error(error.message);

  const membersDataRaw = (data as any)?.members || [];
  const membersData: MemberProfile[] = (membersDataRaw as any[]).map((member: any) => ({
    id: member.id,
    id_igreja: member.id_igreja,
    funcao: member.funcao,
    perfil_completo: member.perfil_completo,
    nome_completo: member.nome_completo,
    status: member.status,
    created_at: member.created_at,
    email: member.email,
    ultimo_teste_data: member.ultimo_teste_data,
    ministerio_recomendado: member.ministerio_recomendado,
    telefone: member.informacoes_pessoais?.telefone,
    endereco: member.informacoes_pessoais?.endereco,
    data_nascimento: member.informacoes_pessoais?.data_nascimento,
    estado_civil: member.informacoes_pessoais?.estado_civil,
    profissao: member.informacoes_pessoais?.profissao,
    conjuge_id: member.informacoes_pessoais?.conjuge_id,
    data_casamento: member.informacoes_pessoais?.data_casamento,
    pais_cristaos: member.informacoes_pessoais?.pais_cristaos,
    tempo_igreja: member.informacoes_pessoais?.tempo_igreja,
    batizado: member.informacoes_pessoais?.batizado,
    data_batismo: member.informacoes_pessoais?.data_batismo,
    participa_ministerio: member.informacoes_pessoais?.participa_ministerio,
    ministerio_anterior: member.informacoes_pessoais?.ministerio_anterior,
    experiencia_anterior: member.informacoes_pessoais?.experiencia_anterior,
    data_conversao: member.informacoes_pessoais?.data_conversao,
    dias_disponiveis: member.informacoes_pessoais?.dias_disponiveis,
    horarios_disponiveis: member.informacoes_pessoais?.horarios_disponiveis,
    churchName: getChurchById?.(churchId)?.name
  }));

  return membersData;
};

export const useMembers = () => {
  const { user, currentChurchId } = useAuthStore();
  const { getChurchById } = useChurchStore();

  return useQuery({
    queryKey: ['members', currentChurchId, user?.id],
    queryFn: () => fetchMembers(currentChurchId, getChurchById, user?.id || null),
    enabled: !!currentChurchId && !!user?.id,
  });
};