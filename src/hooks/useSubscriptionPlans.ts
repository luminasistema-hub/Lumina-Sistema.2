import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  nome: string;
  preco_mensal: number;
  limite_membros: number;
  limite_quizes_por_etapa: number;
  limite_armazenamento_mb: number;
  descricao: string;
}

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('planos_assinatura')
        .select('*')
        .order('preco_mensal', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setPlans(data as SubscriptionPlan[]);
    } catch (err: any) {
      console.error('Error fetching subscription plans:', err);
      setError('Falha ao carregar os planos de assinatura.');
      toast.error('Falha ao carregar os planos de assinatura.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, isLoading, error, refetch: fetchPlans };
};