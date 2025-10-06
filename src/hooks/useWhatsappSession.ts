import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export type SessionRow = {
  id: string;
  church_id: string;
  status: 'awaiting_qr' | 'connected' | 'disconnected';
  phone_number?: string | null;
  qr_code?: string | null;
  last_heartbeat?: string | null;
};

const fetchWhatsappSession = async (churchId: string | null, _userId: string | null): Promise<SessionRow | null> => {
  if (!churchId) return null;
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('church_id', churchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

export const useWhatsappSession = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = ['whatsapp_session', currentChurchId, user?.id];

  const { data: session, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchWhatsappSession(currentChurchId, user?.id || null),
    enabled: !!currentChurchId && !!user?.id,
  });

  const initSessionMutation = useMutation({
    mutationFn: async () => {
      if (!currentChurchId) throw new Error('ID da Igreja não encontrado.');
      const { data, error } = await supabase.functions.invoke('init-whatsapp-session', {
        body: { churchId: currentChurchId },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);
      
      return data.session as SessionRow;
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(queryKey, newSession);
    },
  });

  return {
    session,
    isLoading,
    error,
    initSession: initSessionMutation.mutate,
    isInitializing: initSessionMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
};