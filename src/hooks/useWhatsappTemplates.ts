import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export type TemplateRow = { id: string; key: string; content: string };

const fetchWhatsappTemplates = async (churchId: string | null, _userId: string | null): Promise<TemplateRow[]> => {
  if (!churchId) return [];
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .select('id, key, content')
    .eq('church_id', churchId)
    .order('key');
  if (error) throw new Error(error.message);
  return data || [];
};

export const useWhatsappTemplates = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = ['whatsapp_templates', currentChurchId, user?.id];

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchWhatsappTemplates(currentChurchId, user?.id || null),
    enabled: !!currentChurchId && !!user?.id,
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ key, content }: { key: string; content: string }) => {
      if (!currentChurchId) throw new Error('ID da Igreja não encontrado.');
      const { error } = await supabase
        .from('whatsapp_templates')
        .upsert({ church_id: currentChurchId, key, content }, { onConflict: 'church_id,key' });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    templates,
    isLoading,
    error,
    saveTemplate: saveTemplateMutation.mutate,
    isSaving: saveTemplateMutation.isPending,
  };
};