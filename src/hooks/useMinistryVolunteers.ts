import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addVoluntario, getVoluntarios, removeVoluntario } from '@/services/voluntariosService';

// Hook para buscar a lista de voluntários de um ministério
export const useMinistryVolunteers = (ministryId: string) => {
  return useQuery({
    queryKey: ['volunteers', ministryId],
    queryFn: () => getVoluntarios(ministryId),
    enabled: !!ministryId,
  });
};

// Hook (mutation) para adicionar um novo voluntário
export const useAddVoluntario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVoluntario,
    onSuccess: (_, variables) => {
      toast.success('Voluntário adicionado com sucesso!');
      // Invalida o cache para forçar a atualização da lista de voluntários e de membros disponíveis
      queryClient.invalidateQueries({ queryKey: ['volunteers', variables.ministerio_id] });
      queryClient.invalidateQueries({ queryKey: ['availableMembers', variables.ministerio_id] });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar voluntário: ${error.message}`);
    },
  });
};

// Hook (mutation) para remover um voluntário
export const useRemoveVoluntario = (ministryId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeVoluntario,
    onSuccess: () => {
      toast.success('Voluntário removido com sucesso!');
      // Invalida o cache para forçar a atualização da lista de voluntários e de membros disponíveis
      queryClient.invalidateQueries({ queryKey: ['volunteers', ministryId] });
      queryClient.invalidateQueries({ queryKey: ['availableMembers', ministryId] });
    },
    onError: (error) => {
      toast.error(`Erro ao remover voluntário: ${error.message}`);
    },
  });
};