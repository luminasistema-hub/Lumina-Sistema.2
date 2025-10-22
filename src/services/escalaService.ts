import { supabase } from "@/integrations/supabase/client"

// Buscar escalas de um ministério
export const getEscalasByMinisterio = async (idMinisterio) => {

}

/**
 * Busca uma escala específica pelo seu ID, incluindo detalhes do ministério.
 */
export const getEscalaById = async (escalaId: string) => {
  const { data, error } = await supabase
    .from('escalas_servico')
    .select(`
      *,
      ministerio:ministerios(nome)
    `)
    .eq('id', escalaId)
    .single();

  if (error) {
    console.error('Erro ao buscar escala por ID:', error);
    return null;
  }
  return data;
};

/**
 * Atualiza o status de uma escala de serviço.
 * @param escalaId O ID da escala a ser atualizada.
 * @param novoStatus O novo status da escala.
 * @returns O status atualizado da escala.
 */
export const updateEscalaStatus = async (escalaId: string, novoStatus: string) => {
  const { data, error } = await supabase
    .from('escalas_servico')
    .update({ status: novoStatus })
    .eq('id', escalaId);

  if (error) {
    console.error('Erro ao atualizar status da escala:', error);
    return null;
  }
  return data;
};