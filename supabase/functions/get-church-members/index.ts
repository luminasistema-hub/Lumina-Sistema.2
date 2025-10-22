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

  const body = await req.json().catch(() => ({}));
  const requestedChurchId: string | null = body?.church_id ?? null;

  const { data: me } = await admin
    .from("membros")
    .select("id, id_igreja, funcao")
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

  const allowedRoles = ["admin", "pastor", "integra", "lider_ministerio", "gestao_kids"];
  const canList = !!sa || (me && me.id_igreja === targetChurchId && allowedRoles.includes(me.funcao));

  if (!canList) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const search: string | null = body?.search ?? null;
  const role: string | null = body?.role ?? null;
  const status: string | null = body?.status ?? null;
  const ministry: string | null = body?.ministry ?? null;
  const birthdayMonth: boolean = !!body?.birthday_month;
  const weddingMonth: boolean = !!body?.wedding_month;

  // Calcula range do mês atual para data_nascimento/data_casamento
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  let query = admin
    .from("membros")
    .select(`
      id, id_igreja, funcao, perfil_completo, nome_completo, status, created_at, email, ultimo_teste_data, ministerio_recomendado, extra_permissoes,
      informacoes_pessoais:informacoes_pessoais!membro_id (
        telefone, endereco, data_nascimento, estado_civil, profissao, conjuge_id, data_casamento, pais_cristaos, tempo_igreja,
        batizado, data_batismo, participa_ministerio, ministerio_anterior, experiencia_anterior, data_conversao,
        dias_disponiveis, horarios_disponiveis
      )
    `)
    .eq("id_igreja", targetChurchId);

  if (role) {
    query = query.eq("funcao", role);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (ministry) {
    query = query.ilike("ministerio_recomendado", `%${ministry}%`);
  }
  if (birthdayMonth) {
    query = query
      .gte("informacoes_pessoais.data_nascimento", fmt(startOfMonth))
      .lte("informacoes_pessoais.data_nascimento", fmt(endOfMonth));
  }
  if (weddingMonth) {
    query = query
      .gte("informacoes_pessoais.data_casamento", fmt(startOfMonth))
      .lte("informacoes_pessoais.data_casamento", fmt(endOfMonth));
  }
  if (search) {
    const term = search.replace(/%/g, "").trim();
    if (term.length > 0) {
      // Busca em nome, email e telefone do relacionamento
      query = query.or(
        `nome_completo.ilike.%${term}%,email.ilike.%${term}%,informacoes_pessoais.telefone.ilike.%${term}%`
      );
    }
  }

  const { data: members, error: mErr } = await query.order("nome_completo", { ascending: true });

  if (mErr) {
    return new Response(JSON.stringify({ error: mErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ members }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});