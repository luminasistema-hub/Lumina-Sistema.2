import { supabase } from "@/lib/supabaseClient";

// Buscar voluntários de um ministério
export async function getMinisterioVoluntarios(idMinisterio: string) {
  const { data, error } = await supabase
    .from("ministerio_voluntarios")
    .select(`
      id,
      usuario:membros(id, nome_completo, email)
    `)
    .eq("id_ministerio", idMinisterio);

  if (error) {
    console.error("Erro ao buscar voluntários:", error.message);
    throw error;
  }

  return data || [];
}

// Remover voluntário de um ministério
export async function removeMinisterioVoluntario(idVoluntario: string) {
  const { error } = await supabase
    .from("ministerio_voluntarios")
    .delete()
    .eq("id", idVoluntario);

  if (error) {
    console.error("Erro ao remover voluntário:", error.message);
    throw error;
  }

  return true;
}
