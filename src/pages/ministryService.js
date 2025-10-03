import { supabase } from "@/lib/supabaseClient";

// Lista todos os ministérios
export async function getMinisterios() {
  const { data, error } = await supabase
    .from("ministerios")
    .select("id, nome, descricao")
    .order("nome");
  if (error) throw error;
  return data;
}

// Lista voluntários de um ministério
export async function getVoluntarios(ministryId) {
  const { data, error } = await supabase
    .from("ministerio_voluntarios")
    .select("id, role, user:auth.users(email)")
    .eq("ministry_id", ministryId);
  if (error) throw error;
  return data;
}

// Lista demandas de um ministério
export async function getDemandas(ministryId) {
  const { data, error } = await supabase
    .from("demandas_ministerios")
    .select(`
      id, task, status, priority,
      evento:eventos(nome),
      voluntario:ministerio_voluntarios(user:auth.users(email))
    `)
    .eq("ministry_id", ministryId);
  if (error) throw error;
  return data;
}
