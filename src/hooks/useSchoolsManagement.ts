import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface School {
  id?: string;
  nome: string;
  descricao: string;
  id_igreja: string;
  professor_id: string | null;
  compartilhar_com_filhas: boolean;
  data_inicio: string | null;
  data_fim: string | null;
  status: 'aberta' | 'fechada' | 'em_andamento';
}

export const useSchoolsManagement = () => {
  const qc = useQueryClient();
  const { currentChurchId } = useAuthStore();

  const createSchool = useMutation({
    mutationFn: async (school: Omit<School, 'id_igreja'>) => {
      if (!currentChurchId) throw new Error('ID da Igreja não encontrado.');
      const { error } = await supabase.from('escolas').insert({ ...school, id_igreja: currentChurchId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Escola criada com sucesso!');
      qc.invalidateQueries({ queryKey: ['schools', currentChurchId] });
    },
    onError: (err: any) => toast.error(`Erro ao criar escola: ${err.message}`),
  });

  const updateSchool = useMutation({
    mutationFn: async (school: School) => {
      const { id, ...updates } = school;
      if (!id) throw new Error('ID da escola é necessário para atualizar.');
      const { error } = await supabase.from('escolas').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Escola atualizada com sucesso!');
      qc.invalidateQueries({ queryKey: ['schools', currentChurchId] });
    },
    onError: (err: any) => toast.error(`Erro ao atualizar escola: ${err.message}`),
  });

  const deleteSchool = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('escolas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Escola removida com sucesso!');
      qc.invalidateQueries({ queryKey: ['schools', currentChurchId] });
    },
    onError: (err: any) => toast.error(`Erro ao remover escola: ${err.message}`),
  });

  return { createSchool, updateSchool, deleteSchool };
};