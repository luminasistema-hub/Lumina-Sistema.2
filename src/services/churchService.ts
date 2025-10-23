import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Obtém o nome da igreja de forma confiável.
 * Primeiro, tenta obter do authStore. Se não encontrar ou for de outra igreja,
 * busca via Supabase function, atualiza o store e retorna o nome.
 * @param churchId - O ID da igreja.
 * @returns O nome da igreja ou um nome padrão 'Sua Igreja' em caso de falha.
 */
export const getChurchName = async (churchId: string): Promise<string> => {
  const { user, currentChurchId } = useAuthStore.getState();

  // Retorna o nome do store se já estiver lá e for da igreja correta
  if (user?.churchName && currentChurchId === churchId) {
    return user.churchName;
  }

  try {
    const { data: churchResult, error: functionError } = await supabase.functions.invoke('get-church-public', {
      body: { churchId },
    });

    if (functionError) throw functionError;
    if (churchResult.error) throw new Error(churchResult.error);
    
    const fetchedChurchName = churchResult.nome;
    
    // Atualiza o store para usos futuros se o nome for encontrado
    if (fetchedChurchName && churchId === currentChurchId) {
        useAuthStore.getState().setChurchName(fetchedChurchName);
    }

    return fetchedChurchName || 'Sua Igreja';
  } catch (e) {
    console.error("Falha ao buscar nome da igreja, usando fallback:", e);
    return 'Sua Igreja';
  }
};