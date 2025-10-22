import { useQuery } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'

// Função para buscar uma única escola por ID
const fetchSchoolById = async (schoolId: string) => {
  const { data: school, error } = await supabase
    .from('escolas')
    .select('*')
    .eq('id', schoolId)
    .single()

  if (error) {
    // Retorna null se a escola não for encontrada (código para 'zero rows'), em vez de lançar um erro
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }
  if (!school) return null

  let professor_nome = 'Professor não definido'
  if (school.professor_id) {
    const { data: professor } = await supabase
      .from('membros')
      .select('nome_completo')
      .eq('id', school.professor_id)
      .single()
    if (professor) {
      professor_nome = professor.nome_completo
    }
  }

  return {
    ...school,
    professor_nome,
  }
}

export const useSchoolById = (schoolId: string | null) => {
  return useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => fetchSchoolById(schoolId!),
    enabled: !!schoolId,
  })
}