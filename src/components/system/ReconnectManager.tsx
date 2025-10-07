import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const ReconnectManager = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let isRunning = false;

    const runRecovery = async () => {
      if (isRunning) return;
      isRunning = true;

      try {
        await supabase.auth.getSession();
        await useAuthStore.getState().checkAuth();

        // Marcar queries como stale e refetch imediato das ativas
        await queryClient.invalidateQueries();
        await queryClient.refetchQueries({ type: 'active' });

        toast.success('Conexão recuperada. Dados atualizados.');
      } finally {
        isRunning = false;
      }
    };

    const onFocus = () => {
      if (document.visibilityState === 'visible') runRecovery();
    };
    const onOnline = () => runRecovery();

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [queryClient]);

  return null;
};

export default ReconnectManager;