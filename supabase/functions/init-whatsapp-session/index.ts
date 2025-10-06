import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validar input do cliente
    const body = await req.json();
    const churchId = body.churchId;
    if (!churchId) {
      return new Response(JSON.stringify({ error: 'O ID da igreja (churchId) é obrigatório.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Bad Request
      });
    }

    // 2. Validar configuração do servidor (variáveis de ambiente)
    const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL');
    if (!WHATSAPP_API_URL) {
      console.error('A variável de ambiente WHATSAPP_API_URL não está configurada.');
      return new Response(JSON.stringify({ error: 'Serviço de WhatsApp não configurado no servidor.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // Internal Server Error
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Chamar a API externa do WhatsApp para obter o QR code
    const response = await fetch(`${WHATSAPP_API_URL}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: `church-${churchId}` }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Erro da API de WhatsApp:', errorBody);
      throw new Error(`Falha ao comunicar com a API de WhatsApp: ${response.statusText}`);
    }

    const { qr } = await response.json();
    if (!qr) {
      throw new Error('A API de WhatsApp não retornou um QR code válido.');
    }

    // 4. Salvar/Atualizar a sessão no Supabase com o novo QR code
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
      console.error('Erro ao salvar sessão no Supabase:', upsertError);
      throw upsertError;
    }

    return new Response(JSON.stringify({ session }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro inesperado na Edge Function init-whatsapp-session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Internal Server Error
    });
  }
})