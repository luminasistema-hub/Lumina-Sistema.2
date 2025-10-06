import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    )

    // Verifica se o usuário é super admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Verifica se é super admin
    const { data: superAdmin, error: saError } = await supabaseClient
      .from('super_admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (saError || !superAdmin) {
      return new Response('Acesso negado: apenas Super Administradores podem resetar o sistema.', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    // Lista de tabelas para limpar (exceto planos_assinatura e super_admins)
    const tablesToTruncate = [
      'membros',
      'igrejas',
      'informacoes_pessoais',
      'criancas',
      'ministerios',
      'ministerio_funcoes',
      'ministerio_voluntarios',
      'eventos',
      'evento_participantes',
      'escalas_servico',
      'escala_voluntarios',
      'demandas_ministerios',
      'devocionais',
      'devocional_curtidas',
      'devocional_comentarios',
      'cursos',
      'cursos_modulos',
      'cursos_aulas',
      'cursos_inscricoes',
      'trilhas_crescimento',
      'etapas_trilha',
      'passos_etapa',
      'quiz_perguntas',
      'progresso_membros',
      'transacoes_financeiras',
      'orcamentos',
      'metas_financeiras',
      'notificacoes',
      'whatsapp_messages',
      'pastor_area_items',
      'kids_checkin'
    ]

    // Desabilita RLS temporariamente
    for (const table of tablesToTruncate) {
      await supabaseClient.rpc('exec_sql', {
        sql: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`
      })
    }

    // Limpa as tabelas
    for (const table of tablesToTruncate) {
      await supabaseClient.rpc('exec_sql', {
        sql: `TRUNCATE TABLE public.${table} CASCADE;`
      })
    }

    // Remove usuários de autenticação (exceto super admins)
    await supabaseClient.rpc('exec_sql', {
      sql: `DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM public.super_admins);`
    })

    // Limpa sessões e tokens
    await supabaseClient.rpc('exec_sql', {
      sql: `DELETE FROM auth.sessions;`
    })

    await supabaseClient.rpc('exec_sql', {
      sql: `DELETE FROM auth.refresh_tokens;`
    })

    await supabaseClient.rpc('exec_sql', {
      sql: `DELETE FROM auth.identities;`
    })

    // Reabilita RLS
    for (const table of tablesToTruncate) {
      await supabaseClient.rpc('exec_sql', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      })
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Sistema resetado com sucesso!' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error resetting system:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})