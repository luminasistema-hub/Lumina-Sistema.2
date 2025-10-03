import { supabase } from "@/integrations/supabase/client";

// Buscar voluntários de uma escala
export const getVoluntariosByEscala = async (idEscala) => {
  const { data, error } = await supabase
    .from('escala_voluntarios')
    .select(`
      *,
      membro:membros(id, nome_completo, email)
    `)
    .eq('escala_id', idEscala);

  if (error) throw error;
  return data;
};

// Adicionar voluntário a uma escala
export const addVoluntarioToEscala = async (escalaId, membroId) => {
  const { data, error } = await supabase
    .from('escala_voluntarios')
    .insert({
      escala_id: escalaId,
      membro_id: membroId,
      status_confirmacao: 'Pendente'
    });

  if (error) throw error;
  return data;
};

// Remover voluntário de uma escala
export const removeVoluntarioFromEscala = async (escalaId, membroId) => {
  const { error } = await supabase
    .from('escala_voluntarios')
    .delete()
    .eq('escala_id', escalaId)
    .eq('membro_id', membroId);

  if (error) throw error;
  return true;
};

// Atualizar status de confirmação do voluntário
export const updateVoluntarioStatus = async (escalaId, membroId, status) => {
  const { data, error } = await supabase
    .from('escala_voluntarios')
    .update({ status_confirmacao: status })
    .eq('escala_id', escalaId)
    .eq('membro_id', membroId);

  if (error) throw error;
  return data;
};