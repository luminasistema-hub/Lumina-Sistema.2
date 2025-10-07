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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { churchId, payerEmail } = await req.json()
    if (!churchId || !payerEmail) {
      return new Response(JSON.stringify({ error: "churchId e payerEmail são obrigatórios." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { data: church, error: churchError } = await supabaseAdmin
      .from('igrejas')
      .select('id, nome, valor_mensal_assinatura')
      .eq('id', churchId)
      .single()

    if (churchError) throw churchError
    if (!church) throw new Error("Igreja não encontrada.")

    const apiUrl = Deno.env.get('ABACATEPAY_API_URL')
    const apiKey = Deno.env.get('ABACATEPAY_API_KEY')
    if (!apiUrl || !apiKey) {
      throw new Error("Configure os segredos ABACATEPAY_API_URL e ABACATEPAY_API_KEY nas Edge Functions.")
    }

    const callbackBase = Deno.env.get('SUPABASE_URL')?.replace('.co', '.app') ?? 'https://example.app'
    const payload = {
      amount: church.valor_mensal_assinatura,
      currency: 'BRL',
      description: `Assinatura Connect Vida - ${church.nome}`,
      customer_email: payerEmail,
      success_url: `${callbackBase}/payment-success?church_id=${church.id}`,
      cancel_url: `${callbackBase}/payment-cancel`,
      external_reference: church.id,
      recurrence: { interval: 1, interval_type: 'month' }
    }

    const response = await fetch(`${apiUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Abacate PAY error:', responseData)
      throw new Error(responseData.message || 'Falha ao criar checkout na Abacate PAY.')
    }

    const checkoutUrl = responseData.checkout_url || responseData.url || responseData.init_point
    const sessionId = responseData.id || responseData.session_id

    if (!checkoutUrl) {
      throw new Error('Resposta da Abacate PAY não contém o link de checkout.')
    }

    const { error: updateError } = await supabaseAdmin
      .from('igrejas')
      .update({
        link_pagamento_assinatura: checkoutUrl,
        subscription_id_ext: sessionId ?? null
      })
      .eq('id', church.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na Edge Function (Abacate PAY):', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})