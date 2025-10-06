import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { churchId } = await req.json()

    if (!churchId) {
      throw new Error('O ID da Igreja (churchId) é obrigatório.')
    }

    // Crie um cliente Supabase com a chave de serviço para ter permissões de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Atualize o status da igreja para 'active'
    const { data, error } = await supabaseAdmin
      .from('igrejas')
      .update({ 
        status: 'active',
        ultimo_pagamento_status: 'Confirmado',
        data_proximo_pagamento: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
      })
      .eq('id', churchId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ message: 'Assinatura ativada com sucesso!', church: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})