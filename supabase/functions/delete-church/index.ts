import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  const token = authHeader.replace("Bearer ", "").trim()

  const url = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  const service = createClient(url, serviceKey)

  let payload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const churchId: string | undefined = payload?.churchId
  if (!churchId) {
    return new Response(JSON.stringify({ error: "churchId is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Obter usuário pelo token
  const userRes = await service.auth.getUser(token)
  const user = userRes.data?.user
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Carregar igreja alvo
  const { data: target, error: targetErr } = await service
    .from("igrejas")
    .select("id, parent_church_id")
    .eq("id", churchId)
    .maybeSingle()

  if (targetErr) {
    return new Response(JSON.stringify({ error: targetErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  if (!target) {
    return new Response(JSON.stringify({ error: "Church not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Checar permissões (super_admin ou admin/pastor da igreja mãe ou da própria filha)
  const { data: sa } = await service
    .from("super_admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  const { data: member } = await service
    .from("membros")
    .select("id_igreja, funcao")
    .eq("id", user.id)
    .maybeSingle()

  const isAllowed =
    !!sa ||
    (!!member &&
      (member.funcao === "admin" || member.funcao === "pastor") &&
      (member.id_igreja === target.parent_church_id || member.id_igreja === target.id))

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const counts: Record<string, number> = {}

  async function del(table: string, filter: Record<string, any>) {
    const { error, count } = await service.from(table).delete({ count: "exact" }).match(filter)
    if (error) throw new Error(`${table}: ${error.message}`)
    counts[table] = count ?? 0
  }

  try {
    // Dependências primeiro
    await del("devocional_curtidas", { id_igreja: churchId })
    await del("devocional_comentarios", { id_igreja: churchId })
    await del("programacoes_evento", { id_igreja: churchId })
    await del("evento_participantes", { id_igreja: churchId })
    await del("escala_voluntarios", { id_igreja: churchId })
    await del("ministerio_voluntarios", { id_igreja: churchId })
    await del("ministerio_funcoes", { id_igreja: churchId })
    await del("gc_group_members", { id_igreja: churchId })
    await del("gc_group_leaders", { id_igreja: churchId })
    await del("kids_checkin", { id_igreja: churchId })
    await del("notificacoes", { id_igreja: churchId })
    await del("notification_templates", { id_igreja: churchId })
    await del("passos_etapa", { id_igreja: churchId })
    await del("etapas_trilha", { id_igreja: churchId })
    await del("trilhas_crescimento", { id_igreja: churchId })

    // Tabelas principais com id_igreja
    await del("devocionais", { id_igreja: churchId })
    await del("escalas_servico", { id_igreja: churchId })
    await del("eventos", { id_igreja: churchId })
    await del("ministerios", { id_igreja: churchId })
    await del("criancas", { id_igreja: churchId })
    await del("informacoes_pessoais", { id_igreja: churchId })
    await del("testes_vocacionais", { id_igreja: churchId })
    await del("progresso_membros", { id_igreja: churchId })
    await del("pastor_area_items", { id_igreja: churchId })
    await del("whatsapp_messages", { church_id: churchId })
    await del("metas_financeiras", { id_igreja: churchId })
    await del("transacoes_financeiras", { id_igreja: churchId })
    await del("orcamentos", { id_igreja: churchId })
    await del("gc_groups", { id_igreja: churchId })

    // Membros dessa igreja
    await del("membros", { id_igreja: churchId })

    // Finalmente a igreja
    await del("igrejas", { id: churchId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg, counts }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ ok: true, counts }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})