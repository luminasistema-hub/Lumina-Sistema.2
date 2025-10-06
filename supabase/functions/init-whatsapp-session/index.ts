import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Esta é uma URL de placeholder para o serviço de WhatsApp.
// Em um projeto real, isso seria uma variável de ambiente.
const WHATSAPP_API_URL = 'http://localhost:3001/sessions/start';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { churchId } = await req.json();
    if (!churchId) {
      throw new Error('churchId é obrigatório.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Chamar a API externa do WhatsApp para obter o QR code
    // Em um cenário real, a API de WhatsApp pode precisar de autenticação.
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: `church-${churchId}` }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Erro da API de WhatsApp:', errorBody);
      throw new Error(`Falha ao iniciar sessão do WhatsApp: ${response.statusText}`);
    }

    const { qr } = await response.json();
    if (!qr) {
      throw new Error('A API de WhatsApp não retornou um QR code.');
    }

    // 2. Salvar/Atualizar a sessão no Supabase com o novo QR code
    const { data: session, error: upsertError } = await supabaseAdmin
      .from('whatsapp_sessions')
      .upsert(
        {
          church_id: churchId,
          status: 'awaiting_qr',
          qr_code: qr,
          last_heartbeat: new Date().toISOString(),
        },
        { onConflict: 'church_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    return new Response(JSON.stringify({ session }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})