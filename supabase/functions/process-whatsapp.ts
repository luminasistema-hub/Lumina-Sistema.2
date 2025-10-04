import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Autenticação manual
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  const token = authHeader.replace('Bearer ', '');

  // Cliente com token do usuário (RLS)
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  // Descobrir igreja atual do usuário
  const { data: member, error: memberError } = await userClient
    .from('membros')
    .select('id_igreja')
    .eq('id', (await userClient.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (memberError || !member?.id_igreja) {
    return new Response(JSON.stringify({ error: 'Church not found for user' }), { status: 400, headers: corsHeaders });
  }

  const churchId = member.id_igreja;

  // Cliente com service role para atualizar status
  const serverClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Buscar pendentes da igreja (limite simples)
  const { data: pending, error: pendErr } = await serverClient
    .from('whatsapp_messages')
    .select('*')
    .eq('church_id', churchId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(25);

  if (pendErr) {
    return new Response(JSON.stringify({ error: pendErr.message }), { status: 500, headers: corsHeaders });
  }

  // Simular envio e marcar como enviados
  const now = new Date().toISOString();
  const updates = (pending || []).map(msg => ({
    id: msg.id,
    status: 'sent' as const,
    sent_at: now,
    error: null
  }));

  // Atualização em lote
  for (const u of updates) {
    await serverClient
      .from('whatsapp_messages')
      .update({ status: u.status, sent_at: u.sent_at, error: u.error })
      .eq('id', u.id);
  }

  return new Response(JSON.stringify({ processed: updates.length }), { status: 200, headers: corsHeaders });
});