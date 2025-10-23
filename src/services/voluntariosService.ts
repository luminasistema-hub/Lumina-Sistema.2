// src/services/voluntariosService.ts
import { supabase } from "@/integrations/supabase/client"

// Buscar voluntários de um ministério
export const getVoluntarios = async (ministerioId: string) => {
  const { data, error } = await supabase
    .from("ministerio_voluntarios")
    .select(`
      id,
      membro_id,
      usuario:membros(id, nome_completo, email)
    `)
    .eq("ministerio_id", ministerioId)

  if (error) {
    console.error("Erro ao buscar voluntários:", error)
    throw error;
  }

  return data || []
}

// Adicionar voluntário a um ministério
export const addVoluntario = async (payload: { ministerio_id: string; membro_id: string; id_igreja: string }) => {
  const { data, error } = await supabase
    .from("ministerio_voluntarios")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Remover voluntário do ministério
export const removeVoluntario = async (idVoluntario: string) => {
  const { error } = await supabase
    .from("ministerio_voluntarios")
    .delete()
    .eq("id", idVoluntario)

  if (error) throw error
}