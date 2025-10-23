import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/components/ui/sonner';
import { useMemo, useEffect } from 'react';
import { createInAppNotification } from '@/services/notificationService';
import { useChurchStore } from '@/stores/churchStore';

type DevotionalStatus = 'Rascunho' | 'Publicado' | 'Arquivado' | 'Pendente';
type DevotionalCategory = 'Diário' | 'Semanal' | 'Especial' | 'Temático';

export interface Devotional {
  id: string;
  id_igreja: string;
  titulo: string;
  conteudo: string;
  versiculo_referencia: string;
  versiculo_texto?: string | null;
  categoria: DevotionalCategory;
  tags: string[];
  autor_id: string;
  data_publicacao: string | null;
  status: DevotionalStatus;
  imagem_capa?: string | null;
  tempo_leitura: number;
  featured: boolean;
  membros?: { nome_completo: string | null };
  created_at: string;
  compartilhar_com_filhas?: boolean;
}

interface DevotionalFilters {
  statusFilter: string;
  categoryFilter: string;
  searchTerm: string;
}

const fetchDevotionals = async (
  churchId: string,
  filters: DevotionalFilters
) => {
  let query = supabase
    .from('devocionais')
    .select('*, membros(nome_completo)')
    .eq('id_igreja', churchId)
    .order('data_publicacao', { ascending: false, nullsFirst: false });

  if (filters.statusFilter !== 'all') {
    query = query.eq('status', filters.statusFilter);
  }
  if (filters.categoryFilter !== 'all') {
    query = query.eq('categoria', filters.categoryFilter);
  }
  if (filters.searchTerm) {
    query = query.ilike('titulo', `%${filters.searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Devotional[];
};

export const useDevotionalsManagement = (filters: DevotionalFilters) => {
  const { currentChurchId, user } = useAuthStore();
  const qc = useQueryClient();
  const churchStore = useChurchStore();

  const queryKey = useMemo(
    () => ['devos-mgmt', currentChurchId, filters],
    [currentChurchId, filters]
  );

  useEffect(() => {
    if (!currentChurchId) return;
    const channel = supabase
      .channel(`devotionals-management-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devocionais', filter: `id_igreja=eq.${currentChurchId}` },
        () => qc.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChurchId, qc, queryKey]);

  const { data: devotionals, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchDevotionals(currentChurchId!, filters),
    enabled: !!currentChurchId,
  });

  const handleNotification = (devotional: Partial<Devotional>, action: 'create' | 'update') => {
    if (devotional.status === 'Publicado' && currentChurchId) {
      createInAppNotification({
        id_igreja: currentChurchId,
        membro_id: null, // Broadcast
        titulo: `Novo Devocional: ${devotional.titulo}`,
        descricao: 'Um novo devocional foi publicado para sua leitura e meditação.',
        link: '/dashboard?module=devotionals',
        tipo: 'NEW_DEVOTIONAL'
      });
    }
  };

  const createDevotional = useMutation({
    mutationFn: async (form: Partial<Devotional>) => {
      if (!user || !currentChurchId) throw new Error('Usuário não autenticado.');
      if (!form.titulo || !form.conteudo || !form.versiculo_referencia) throw new Error('Preencha os campos obrigatórios.');
      
      const tempo = Math.ceil((form.conteudo?.length || 0) / 200);
      const payload = {
        ...form,
        id_igreja: currentChurchId,
        autor_id: user.id,
        tempo_leitura: tempo,
        data_publicacao: form.status === 'Publicado' ? new Date().toISOString() : null,
        compartilhar_com_filhas: form.compartilhar_com_filhas ?? (churchStore.getChurchById(currentChurchId!)?.share_devocionais_to_children ?? false),
      };
      const { error } = await supabase.from('devocionais').insert(payload);
      if (error) throw new Error(error.message);
      return payload;
    },
    onSuccess: (data) => {
      toast.success('Devocional criado com sucesso!');
      qc.invalidateQueries({ queryKey });
      handleNotification(data, 'create');
    },
    onError: (err: any) => toast.error(`Erro ao criar: ${err.message}`),
  });

  const updateDevotional = useMutation({
    mutationFn: async ({ form, editingItem }: { form: Partial<Devotional>, editingItem: Devotional }) => {
      const tempo = Math.ceil((form.conteudo?.length || editingItem.conteudo.length || 0) / 200);
      const payload: Partial<Devotional> = {
        ...form,
        tempo_leitura: tempo,
        data_publicacao: (form.status ?? editingItem.status) === 'Publicado'
          ? (editingItem.data_publicacao || new Date().toISOString())
          : null,
      };
      const { error } = await supabase.from('devocionais').update(payload).eq('id', editingItem.id);
      if (error) throw new Error(error.message);
      return { oldStatus: editingItem.status, newStatus: payload.status, ...payload };
    },
    onSuccess: (data) => {
      toast.success('Devocional atualizado!');
      qc.invalidateQueries({ queryKey });
      if (data.oldStatus !== 'Publicado' && data.newStatus === 'Publicado') {
        handleNotification(data, 'update');
      }
    },
    onError: (err: any) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const deleteDevotional = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devocionais').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Devocional removido!');
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(`Erro ao remover: ${err.message}`),
  });

  const toggleFeatured = useMutation({
    mutationFn: async (item: Devotional) => {
      const { error } = await supabase.from('devocionais').update({ featured: !item.featured }).eq('id', item.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (err: any) => toast.error(`Erro ao alterar destaque: ${err.message}`),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DevotionalStatus }) => {
      const payload: Partial<Devotional> = {
        status,
        data_publicacao: status === 'Publicado' ? new Date().toISOString() : null,
      };
      const { data, error } = await supabase.from('devocionais').update(payload).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data as Devotional;
    },
    onSuccess: (data) => {
      toast.success('Status alterado!');
      qc.invalidateQueries({ queryKey });
      if (data.status === 'Publicado') {
        handleNotification(data, 'update');
      }
    },
    onError: (err: any) => toast.error(`Erro ao alterar status: ${err.message}`),
  });

  return {
    devotionals,
    isLoading,
    error,
    createDevotional,
    updateDevotional,
    deleteDevotional,
    toggleFeatured,
    setStatus,
  };
};