import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const ReconnectManager = () => {
  const queryClient = useQueryClient();
  const lastRunRef = useRef<number>(0);

  useEffect(() => {
    let isRunning = false;

    const runRecovery = async () => {
      if (isRunning) return;
      const now = Date.now();
      // Throttle: no máximo 1 execução a cada 8s
      if (now - (lastRunRef.current || 0) < 8000) return;
      isRunning = true;
      lastRunRef.current = now;

      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Atualiza estado de auth
        await useAuthStore.getState().checkAuth();

        const { user, currentChurchId } = useAuthStore.getState();

        // Só invalida queries se houver sessão e usuário logado
        if (session && user?.id) {
          await queryClient.invalidateQueries();
          // Não forçar refetch imediato; deixar React Query decidir
        }
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