import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Props = {
  onViewRequests?: () => void;
};

const MasterAdminUpgradeRequestsAlert: React.FC<Props> = ({ onViewRequests }) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPending = async () => {
      setLoading(true);
      const { count, error } = await supabase
        .from('plan_change_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
        .limit(1);

      if (!isMounted) return;
      if (error) {
        console.error('Erro ao buscar solicitações de upgrade:', error.message);
        toast.error('Falha ao carregar solicitações de upgrade.');
        setPendingCount(0);
      } else {
        setPendingCount(count || 0);
      }
      setLoading(false);
    };

    fetchPending();
    const interval = setInterval(fetchPending, 20000); // atualiza a cada 20s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <Alert className="border-orange-300 bg-orange-50">
      <AlertTitle className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-orange-600" />
        Solicitações de upgrade pendentes
      </AlertTitle>
      <AlertDescription className="mt-1">
        Há {pendingCount} solicitação{pendingCount > 1 ? 's' : ''} aguardando aprovação do Super Admin.
      </AlertDescription>
      <div className="mt-3">
        <Button variant="outline" onClick={() => onViewRequests?.()}>
          Ver pedidos
        </Button>
      </div>
    </Alert>
  );
};

export default MasterAdminUpgradeRequestsAlert;