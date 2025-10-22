import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v4 as uuidv4 } from 'https://deno.land/std@0.168.0/uuid/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    console.log('Webhook ASAAS recebido:', JSON.stringify(payload, null, 2));

    // Processar apenas eventos de pagamento confirmado
    if (payload.event !== 'PAYMENT_CONFIRMED') {
      return new Response(JSON.stringify({ message: 'Evento não processado.' }), { status: 200 });
    }

    const payment = payload.payment;
    const churchId = payment.externalReference; // Usamos a referência externa para achar a igreja

    if (!churchId) {
      throw new Error('ID da Igreja (externalReference) não encontrado no webhook.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar dados da igreja
    const { data: churchData, error: churchError } = await supabaseAdmin
      .from('igrejas')
      .select('id, historico_pagamentos')
      .eq('id', churchId)
      .single();

    if (churchError) throw churchError;

    // 2. Preparar novo registro de pagamento
    const newPaymentRecord = {
      id: uuidv4(),
      data: payment.paymentDate || new Date().toISOString().split('T')[0],
      valor: payment.value,
      status: 'Pago',
      metodo: `ASAAS (${payment.billingType})`,
      referencia: payment.id, // ID do pagamento na ASAAS
      registrado_por: 'Webhook ASAAS',
    };

    const updatedHistory = [...(churchData.historico_pagamentos || []), newPaymentRecord]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    // 3. Calcular próxima data de pagamento
    const nextDueDate = payment.nextDueDate ? new Date(payment.nextDueDate) : new Date(newPaymentRecord.data);
    if (!payment.nextDueDate) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    // 4. Atualizar a igreja no banco de dados
    const { error: updateError } = await supabaseAdmin
      .from('igrejas')
      .update({
        status: 'active',
        ultimo_pagamento_status: 'Pago',
        data_proximo_pagamento: nextDueDate.toISOString().split('T')[0],
        historico_pagamentos: updatedHistory,
        subscription_id_ext: payment.subscription, // Salva o ID da assinatura ASAAS
      })
      .eq('id', churchId);

    if (updateError) throw updateError;

    console.log(`Igreja ${churchId} atualizada com sucesso via webhook.`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro no webhook da ASAAS:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});