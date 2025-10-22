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

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const churchId: string | undefined = body?.churchId
  if (!churchId) {
    return new Response(JSON.stringify({ error: "churchId is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const userRes = await service.auth.getUser(token)
  const user = userRes.data?.user
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Carrega igreja alvo para checar permissão
  const { data: church, error: churchErr } = await service
    .from("igrejas")
    .select("id, parent_church_id, nome")
    .eq("id", churchId)
    .maybeSingle()

  if (churchErr) {
    return new Response(JSON.stringify({ error: churchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  if (!church) {
    return new Response(JSON.stringify({ error: "Church not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Permissões: super_admin ou admin/pastor da igreja mãe ou da própria filha
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
      (member.id_igreja === church.parent_church_id || member.id_igreja === church.id))

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Sanitiza campos
  const payload: any = {}
  if (typeof body.nome === "string") payload.nome = body.nome
  if (typeof body.nome_responsavel === "string") payload.nome_responsavel = body.nome_responsavel
  if (typeof body.email === "string") payload.email = body.email
  if (typeof body.telefone_contato === "string") payload.telefone_contato = String(body.telefone_contato).replace(/[^\d]+/g, "")
  if (typeof body.endereco === "string") payload.endereco = body.endereco
  if (typeof body.cnpj === "string") payload.cnpj = String(body.cnpj).replace(/[^\d]+/g, "")
  if (typeof body.panel_password === "string") payload.panel_password = body.panel_password

  if (!payload.nome || !payload.nome_responsavel || !payload.email) {
    return new Response(JSON.stringify({ error: "Preencha nome, responsável e email." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const { error: updErr } = await service
    .from("igrejas")
    .update(payload)
    .eq("id", churchId)

  if (updErr) {
    return new Response(JSON.stringify({ error: updErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})