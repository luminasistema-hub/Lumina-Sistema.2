import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export interface ChildChurch {
  id: string;
  nome: string;
  created_at: string;
  metrics: {
    members: number;
    leaders: number;
    ministries: number;
  };
  compartilha_escolas_da_mae: boolean;
  compartilha_eventos_da_mae: boolean;
  compartilha_jornada_da_mae: boolean;
  compartilha_devocionais_da_mae: boolean;
}

export interface ParentInfo {
  isChild: boolean;
  motherId: string | null;
}

const fetchChildChurches = async (churchId: string): Promise<ChildChurch[]> => {
  const { data, error } = await supabase.rpc('get_child_churches_with_metrics', {
    mother_church_id: churchId,
  });

  if (error) {
    throw new Error('Erro ao carregar igrejas filhas: ' + error.message);
  }
  return data as ChildChurch[];
};

const fetchParentInfo = async (churchId: string): Promise<ParentInfo> => {
  const { data, error } = await supabase
    .from('igrejas')
    .select('parent_church_id')
    .eq('id', churchId)
    .maybeSingle();

  if (error) {
    throw new Error('Erro ao verificar hierarquia da igreja: ' + error.message);
  }

  return {
    isChild: !!data?.parent_church_id,
    motherId: data?.parent_church_id || null,
  };
};

export const useChildChurches = () => {
  const { currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();

  const childChurchesQuery = useQuery({
    queryKey: ['childChurches', currentChurchId],
    queryFn: () => fetchChildChurches(currentChurchId!),
    enabled: !!currentChurchId,
  });

  const parentInfoQuery = useQuery({
    queryKey: ['parentInfo', currentChurchId],
    queryFn: () => fetchParentInfo(currentChurchId!),
    enabled: !!currentChurchId,
  });

  useEffect(() => {
    if (!currentChurchId) return;

    const channel = supabase
      .channel(`child-churches-updates-${currentChurchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'igrejas',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['childChurches', currentChurchId] });
          queryClient.invalidateQueries({ queryKey: ['parentInfo', currentChurchId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membros',
        },
        () => {
            queryClient.invalidateQueries({ queryKey: ['childChurches', currentChurchId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ministerios',
        },
        () => {
            queryClient.invalidateQueries({ queryKey: ['childChurches', currentChurchId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChurchId, queryClient]);

  return {
    childChurches: childChurchesQuery.data ?? [],
    parentInfo: parentInfoQuery.data,
    isLoading: childChurchesQuery.isLoading || parentInfoQuery.isLoading,
    refetch: () => {
        childChurchesQuery.refetch();
        parentInfoQuery.refetch();
    }
  };
};