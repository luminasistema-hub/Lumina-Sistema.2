// src/services/eventoVoluntariosService.ts
import { supabase } from "@/lib/supabaseClient"

// Buscar voluntários já atribuídos a um evento
export async function getEventoVoluntarios(idEvento: string) {
  const { data, error } = await supabase
    .from("evento_voluntarios")
    .select(`
      id,
      voluntario:usuarios(id, nome_completo, email)
    `)
    .eq("id_evento", idEvento)

  if (error) throw error
  return data || []
}

// Atribuir voluntário a um evento
export async function addEventoVoluntario(idEvento: string, idVoluntario: string) {
  const { error } = await supabase
    .from("evento_voluntarios")
    .insert([{ id_evento: idEvento, id_voluntario: idVoluntario }])

  if (error) throw error
}

// Remover voluntário da escala
export async function removeEventoVoluntario(id: string) {
  const { error } = await supabase
    .from("evento_voluntarios")
    .delete()
    .eq("id", id)

  if (error) throw error
}
