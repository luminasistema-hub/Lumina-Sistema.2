import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;

  const { data: profile, error: pErr } = await admin
    .from("membros")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (pErr) {
    return new Response(JSON.stringify({ error: pErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Se não for membro, devolve explicitamente null para o cliente fazer fallback
  if (!profile) {
    return new Response(JSON.stringify({ profile: null, church: null, personal: null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let church: any = null;
  if (profile.id_igreja) {
    const { data: churchRow } = await admin
      .from("igrejas")
      .select("nome, valor_mensal_assinatura, ultimo_pagamento_status, link_pagamento_assinatura")
      .eq("id", profile.id_igreja)
      .maybeSingle();
    church = churchRow || null;
  }

  const { data: personal } = await admin
    .from("informacoes_pessoais")
    .select("*")
    .eq("membro_id", userId)
    .maybeSingle();

  return new Response(JSON.stringify({ profile, church, personal }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});