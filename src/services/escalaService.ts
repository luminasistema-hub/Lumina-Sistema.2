import { supabase } from "@/lib/supabaseClient"

// Listar todas escalas
export async function getEscalas() {
  const { data, error } = await supabase
    .from("escala_servicos")
    .select("*")
    .order("data_servico", { ascending: true })

  if (error) {
    console.error("Erro ao buscar escalas:", error)
    return []
  }
  return data
}

// Buscar voluntários vinculados à escala
export async function getVoluntariosByEscala(escalaId: string) {
  const { data, error } = await supabase
    .from("escala_voluntarios")
    .select("*, voluntario:membros(id, nome_completo, email)")
    .eq("escala_id", escalaId)

  if (error) {
    console.error("Erro ao buscar voluntários da escala:", error)
    return []
  }
  return data
}
