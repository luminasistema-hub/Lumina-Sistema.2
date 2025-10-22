import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente para identificar o usuário
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

  // Cliente autenticado com contexto do usuário (para RPC usar auth.uid())
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const body = await req.json().catch(() => ({}));
  const requestedChurchId: string | null = body?.church_id ?? null;
  const search: string | null = body?.search ?? null;
  const tipo: string | null = body?.type ?? null;

  // Descobre igreja alvo: se super_admin, usa a solicitada; senão, a do membro
  const { data: me } = await admin
    .from("membros")
    .select("id_igreja")
    .eq("id", userData.user.id)
    .maybeSingle();

  const { data: sa } = await admin
    .from("super_admins")
    .select("id")
    .eq("id", userData.user.id)
    .maybeSingle();

  const targetChurchId = sa ? (requestedChurchId ?? null) : (me?.id_igreja ?? null);
  if (!targetChurchId) {
    return new Response(JSON.stringify({ error: "No church context" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Usa a função SQL existente, garantindo is_registered correto via auth.uid()
  const { data: rawEvents, error: rpcErr } = await userClient.rpc(
    "get_eventos_para_igreja_com_participacao",
    { id_igreja_atual: targetChurchId }
  );

  if (rpcErr) {
    return new Response(JSON.stringify({ error: rpcErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let list = Array.isArray(rawEvents) ? rawEvents.slice() : [];

  // Filtros server-side (executados no Edge, não no cliente)
  const term = (search || "").trim().toLowerCase();
  if (term) {
    list = list.filter((e: any) =>
      String(e.nome || "").toLowerCase().includes(term) ||
      String(e.local || "").toLowerCase().includes(term)
    );
  }
  if (tipo && tipo !== "all") {
    list = list.filter((e: any) => String(e.tipo || "Outro") === tipo);
  }

  // Ordena por data/hora
  list.sort((a: any, b: any) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  // Mapeia para o formato esperado no app
  const events = list.map((e: any) => ({
    id: e.evento_id,
    id_igreja: e.id_igreja,
    nome: e.nome,
    data_hora: e.data_hora,
    local: e.local ?? "",
    descricao: e.descricao ?? "",
    tipo: e.tipo || "Outro",
    capacidade_maxima: e.capacidade_maxima ?? undefined,
    inscricoes_abertas: Boolean(e.inscricoes_abertas),
    valor_inscricao: e.valor_inscricao != null ? Number(e.valor_inscricao) : undefined,
    status: e.status || "Planejado",
    participantes_count: Number(e.participantes_count || 0),
    is_registered: Boolean(e.is_registered),
    link_externo: e.link_externo ?? undefined,
    compartilhar_com_filhas: e.compartilhar_com_filhas,
  }));

  return new Response(JSON.stringify({ events }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});