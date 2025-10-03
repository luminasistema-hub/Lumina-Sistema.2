// src/services/voluntariosService.ts
import { supabase } from "@/integrations/supabase/client"

// Buscar voluntários de um ministério
export const fetchVoluntarios = async (idMinisterio: string) => {
  const { data, error } = await supabase
    .from("ministerio_voluntarios")
    .select(`
      id,
      usuario:membros(id, nome_completo, email)
    `)
    .eq("id_ministerio", idMinisterio)

  if (error) {
    console.error("Erro ao buscar voluntários:", error)
    return []
  }

  return data || []
}

// Adicionar voluntário a um ministério
export const addVoluntario = async (idMinisterio: string, idMembro: string) => {
  const { error } = await supabase.from("ministerio_voluntarios").insert([
    {
      id_ministerio: idMinisterio,
      id_membro: idMembro,
    },
  ])

  if (error) throw error
}

// Remover voluntário do ministério
export const removeVoluntario = async (idVoluntario: string) => {
  const { error } = await supabase
    .from("ministerio_voluntarios")
    .delete()
    .eq("id", idVoluntario)

  if (error) throw error
}