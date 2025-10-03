import { supabase } from "@/lib/supabaseClient"

// Buscar voluntários vinculados a uma escala
export async function getVoluntariosByEscala(escalaId: string) {
  const { data, error } = await supabase
    .from("escala_voluntarios")
    .select(`
      id,
      voluntario:membros(id, nome_completo, email)
    `)
    .eq("escala_id", escalaId)

  if (error) throw error
  return data || []
}

// Adicionar voluntário à escala
export async function addVoluntarioToEscala(escalaId: string, voluntarioId: string) {
  const { error } = await supabase
    .from("escala_voluntarios")
    .insert([{ escala_id: escalaId, voluntario_id: voluntarioId }])

  if (error) throw error
}

// Remover voluntário da escala
export async function removeVoluntarioFromEscala(id: string) {
  const { error } = await supabase
    .from("escala_voluntarios")
    .delete()
    .eq("id", id)

  if (error) throw error
}
