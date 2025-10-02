import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
}

// Função principal que será servida
serve(async (req) => {
  // Trata a requisição OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Cria um cliente Supabase com permissões de serviço para interagir com o DB
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extrai o ID da igreja e o email do pagador do corpo da requisição
    const { churchId, payerEmail } = await req.json();
    if (!churchId || !payerEmail) {
      throw new Error("ID da Igreja e email do pagador são obrigatórios.");
    }

    // Busca os detalhes da igreja no banco de dados
    const { data: church, error: churchError } = await supabaseAdmin
      .from('igrejas')
      .select('id, nome, valor_mensal_assinatura')
      .eq('id', churchId)
      .single();

    if (churchError) throw churchError;
    if (!church) throw new Error("Igreja não encontrada.");

    // Pega o Access Token do Mercado Pago dos segredos do Supabase
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não está configurado nos segredos da Edge Function.");
    }

    // Corpo da requisição para a API do Mercado Pago para criar uma assinatura
    const subscriptionPayload = {
      reason: `Assinatura Lumina - ${church.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: church.valor_mensal_assinatura,
        currency_id: 'BRL'
      },
      payer_email: payerEmail,
      back_url: Deno.env.get('SUPABASE_URL')?.replace('.co', '.app'), // URL de retorno
      external_reference: church.id, // Referência externa para identificar a igreja
    };

    // Faz a chamada para a API do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionPayload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro do Mercado Pago:', responseData);
      throw new Error(responseData.message || 'Falha ao criar assinatura no Mercado Pago.');
    }

    const paymentLink = responseData.init_point;
    const subscriptionId = responseData.id;

    // Atualiza a tabela de igrejas com o link de pagamento e o ID da assinatura do MP
    const { error: updateError } = await supabaseAdmin
      .from('igrejas')
      .update({ 
        link_pagamento_assinatura: paymentLink,
        subscription_id_ext: subscriptionId // Supondo que você tenha uma coluna para isso
      })
      .eq('id', church.id);

    if (updateError) throw updateError;

    // Retorna o link de pagamento para o frontend
    return new Response(JSON.stringify({ paymentLink }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});