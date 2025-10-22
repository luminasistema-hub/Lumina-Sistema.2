import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

export interface Kid {
  id: string;
  id_igreja: string;
  nome_crianca: string;
  idade: number;
  data_nascimento: string;
  responsavel_id: string;
  responsavel_nome?: string;
  email_responsavel?: string;
  informacoes_especiais?: string;
  alergias?: string;
  medicamentos?: string;
  autorizacao_fotos: boolean;
  contato_emergencia?: { nome: string; telefone: string; parentesco: string };
  status_checkin?: 'Presente' | 'Ausente';
  ultimo_checkin?: string;
  codigo_seguranca?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckinRecord {
  id: string;
  id_igreja: string;
  crianca_id: string;
  data_checkin: string;
  data_checkout?: string;
  responsavel_checkin_id: string;
  responsavel_checkin_nome?: string;
  responsavel_checkout_id?: string;
  responsavel_checkout_nome?: string;
  codigo_seguranca: string;
  observacoes?: string;
  created_at: string;
}

const fetchKidsData = async (churchId: string | null, userId: string | null, canManageKids: boolean) => {
  if (!churchId || !userId) return { kids: [], checkinRecords: [] };

  const { data: ipData } = await supabase.from('informacoes_pessoais').select('conjuge_id').eq('membro_id', userId).maybeSingle();
  const spouseId: string | null = ipData?.conjuge_id || null;

  let kidsQuery = supabase.from('criancas').select('*, membros!criancas_responsavel_id_fkey(nome_completo, email)').eq('id_igreja', churchId).order('nome_crianca', { ascending: true });
  if (!canManageKids) {
    kidsQuery = spouseId ? kidsQuery.in('responsavel_id', [userId, spouseId]) : kidsQuery.eq('responsavel_id', userId);
  }
  const { data: kidsData, error: kidsError } = await kidsQuery;
  if (kidsError) throw kidsError;

  const formattedKids: Kid[] = (kidsData || []).map(k => ({
    ...k,
    responsavel_nome: k.membros?.nome_completo || 'Desconhecido',
    email_responsavel: k.membros?.email || '',
    idade: Math.floor((new Date().getTime() - new Date(k.data_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
  }));

  let checkinQuery = supabase.from('kids_checkin').select('*, responsavel_checkin:membros!kids_checkin_responsavel_checkin_id_fkey(nome_completo), responsavel_checkout:membros!kids_checkin_responsavel_checkout_id_fkey(nome_completo)').eq('id_igreja', churchId).order('created_at', { ascending: false });
  if (!canManageKids) {
    const userKidsIds = formattedKids.map(k => k.id);
    checkinQuery = checkinQuery.in('crianca_id', userKidsIds);
  }
  const { data: checkinData, error: checkinError } = await checkinQuery;
  if (checkinError) throw checkinError;

  const formattedCheckinRecords: CheckinRecord[] = (checkinData || []).map(c => ({
    ...c,
    responsavel_checkin_nome: c.responsavel_checkin?.nome_completo || 'Desconhecido',
    responsavel_checkout_nome: c.responsavel_checkout?.nome_completo || 'Desconhecido',
  }));

  return { kids: formattedKids, checkinRecords: formattedCheckinRecords };
};

export const useKidsData = () => {
  const { user, currentChurchId } = useAuthStore();
  const canManageKids = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio' || user?.role === 'gestao_kids';

  return useQuery({
    queryKey: ['kidsData', currentChurchId, user?.id],
    queryFn: () => fetchKidsData(currentChurchId, user?.id, canManageKids),
    enabled: !!currentChurchId && !!user?.id,
  });
};