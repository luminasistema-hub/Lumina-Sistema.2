lida) e filtrar apenas notificações diretas do usuário ao marcar como lidas.">
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export const useNotifications = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();

  const queryKey = ['notifications', user?.id, currentChurchId];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id || !currentChurchId) return [];
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('id_igreja', currentChurchId)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!currentChurchId,
  });

  const unreadCount = notifications.filter(n => !n.lida).length;

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const unreadIds = notifications
        .filter(n => !n.lida && n.user_id === user.id)
        .map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .in('id', unreadIds)
        .eq('user_id', user.id);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  useEffect(() => {
    if (!user?.id || !currentChurchId) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `id_igreja=eq.${currentChurchId}`,
        },
        (payload) => {
          // Invalida a query para buscar as novas notificações
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, currentChurchId, queryClient, queryKey]);

  return { notifications, isLoading, unreadCount, markAllAsRead: markAsReadMutation.mutate };
};