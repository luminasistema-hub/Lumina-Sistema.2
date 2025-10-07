import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Culto {
  id: string;
  titulo: string;
  data: string;
}

export const useCultos = () => {
  return useQuery<Culto[]>({
    queryKey: ['cultos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cultos')
        .select('id, titulo, data')
        .order('data', { ascending: true });
      if (error) throw error;
      return (data || []) as Culto[];
    },
  });
};