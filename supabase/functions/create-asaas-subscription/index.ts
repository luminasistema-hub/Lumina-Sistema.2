import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper para remover caracteres não numéricos
const sanitizeTaxId = (taxId: string) => taxId.replace(/\D/g, '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { churchId, planId } = await req.json()
    if (!churchId || !planId) {
      throw new Error('churchId e planId são obrigatórios.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') ?? 'https://api.asaas.com/v3';
    const ASAAS_API_TOKEN = Deno.env.get('ASAAS_API_TOKEN') ?? '';

    if (!ASAAS_API_TOKEN) {
        throw new Error('A chave da API da ASAAS não está configurada.');
    }

    // 1. Buscar dados da igreja e do plano
    const { data: churchData, error: churchError } = await supabaseAdmin
      .from('igrejas')
      .select('id, nome, email, cnpj, asaas_customer_id')
      .eq('id', churchId)
      .single()

    if (churchError) throw churchError

    const { data: planData, error: planError } = await supabaseAdmin
      .from('planos_assinatura')
      .select('nome, preco_mensal')
      .eq('id', planId)
      .single()

    if (planError) throw planError

    let asaasCustomerId = churchData.asaas_customer_id;

    // 2. Criar cliente na ASAAS se não existir
    if (!asaasCustomerId) {
      const customerPayload = {
        name: churchData.nome,
        email: churchData.email,
        cpfCnpj: churchData.cnpj ? sanitizeTaxId(churchData.cnpj) : undefined,
        externalReference: churchData.id, // Vincula o cliente ASAAS ao ID da igreja
      };

      const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_TOKEN,
        },
        body: JSON.stringify(customerPayload),
      });

      const customerResult = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(`Erro ao criar cliente na ASAAS: ${JSON.stringify(customerResult.errors)}`);
      }
      
      asaasCustomerId = customerResult.id;

      // Atualizar a igreja com o ID do cliente ASAAS
      await supabaseAdmin
        .from('igrejas')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', churchId);
    }

    // 3. Criar a assinatura na ASAAS
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 5); // Vencimento em 5 dias

    const subscriptionPayload = {
      customer: asaasCustomerId,
      billingType: 'UNDEFINED', // Permite ao cliente escolher (Boleto, PIX, Cartão)
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      value: planData.preco_mensal,
      cycle: 'MONTHLY',
      description: `Assinatura Plano ${planData.nome} - Connect Vida`,
      externalReference: churchId, // Vincula a assinatura ao ID da igreja
    };

    const subscriptionResponse = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_TOKEN,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const subscriptionResult = await subscriptionResponse.json();
    if (!subscriptionResponse.ok) {
      throw new Error(`Erro ao criar assinatura na ASAAS: ${JSON.stringify(subscriptionResult.errors)}`);
    }

    // 4. Retornar o link de pagamento
    return new Response(JSON.stringify({ paymentLink: subscriptionResult.paymentLink }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro em create-asaas-subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})