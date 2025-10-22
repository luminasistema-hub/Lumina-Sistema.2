import { useQuery } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'

const fetchPersonalInfo = async (userId: string, churchId: string) => {
  if (!userId || !churchId) return null

  // 1. Fetch personal info
  const { data: personalInfo, error: personalInfoError } = await supabase
    .from('informacoes_pessoais')
    .select('*')
    .eq('membro_id', userId)
    .single()

  if (personalInfoError && personalInfoError.code !== 'PGRST116') { // Ignore 'not found'
    throw new Error(`Erro ao carregar informações pessoais: ${personalInfoError.message}`)
  }

  // 2. Fetch spouse name if exists
  let conjugeNome: string | undefined
  if (personalInfo?.conjuge_id) {
    const { data: spouse } = await supabase
      .from('membros')
      .select('nome_completo')
      .eq('id', personalInfo.conjuge_id)
      .single()
    conjugeNome = spouse?.nome_completo
  }

  // 3. Fetch ministries
  const { data: ministriesData, error: ministriesError } = await supabase
    .from('ministerio_voluntarios')
    .select('ministerios(id, nome)')
    .eq('membro_id', userId)
  if (ministriesError) throw new Error(`Erro ao carregar ministérios: ${ministriesError.message}`)

  // 4. Fetch vocational test
  const { data: tests, error: testsError } = await supabase
    .from('testes_vocacionais')
    .select('id, data_teste, ministerio_recomendado, is_ultimo')
    .eq('membro_id', userId)
    .order('data_teste', { ascending: false })
  if (testsError) throw new Error(`Erro ao carregar teste vocacional: ${testsError.message}`)
  const latestVocationalTest = tests?.find(t => t.is_ultimo) || tests?.[0] || null

  // 5. Fetch member options for spouse selection
  const { data: members, error: membersError } = await supabase
    .from('membros')
    .select('id, nome_completo, email')
    .eq('id_igreja', churchId)
    .eq('status', 'ativo')
    .neq('id', userId)
    .order('nome_completo')
  if (membersError) throw new Error(`Erro ao carregar membros: ${membersError.message}`)

  return {
    personalInfo,
    conjugeNome,
    myMinistries: ministriesData || [],
    latestVocationalTest,
    memberOptions: members || [],
  }
}

export const usePersonalInfo = () => {
  const { user, currentChurchId } = useAuthStore()

  return useQuery({
    queryKey: ['personalInfo', user?.id],
    queryFn: () => fetchPersonalInfo(user!.id, currentChurchId!),
    enabled: !!user?.id && !!currentChurchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}