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

  let body
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

  // Identifica o autor da chamada
  const userRes = await service.auth.getUser(token)
  const user = userRes.data?.user
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Carrega dados da igreja filha
  const { data: church, error: churchErr } = await service
    .from("igrejas")
    .select("id, parent_church_id, nome, email, nome_responsavel, panel_password")
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
  if (!church.panel_password) {
    return new Response(JSON.stringify({ error: "panel_password is not set for this church" }), {
      status: 400,
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

  // Verifica se já existe um pastor registrado para a igreja
  const { data: pastorMember } = await service
    .from("membros")
    .select("id, email")
    .eq("id_igreja", church.id)
    .eq("funcao", "pastor")
    .limit(1)
    .maybeSingle()

  try {
    if (pastorMember?.id) {
      // Atualiza senha do usuário pastor existente
      const { error: updErr } = await service.auth.admin.updateUserById(pastorMember.id, {
        password: church.panel_password,
        email_confirm: true,
      })
      if (updErr) throw new Error(`updateUserById: ${updErr.message}`)

      // Garante status ativo
      const { error: statusErr } = await service
        .from("membros")
        .update({ status: "ativo" })
        .eq("id", pastorMember.id)
      if (statusErr) throw new Error(`membros.update: ${statusErr.message}`)

      return new Response(JSON.stringify({ ok: true, mode: "updated", userId: pastorMember.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } else {
      // Cria novo usuário pastor usando email da igreja e panel_password
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email: church.email,
        password: church.panel_password,
        email_confirm: true,
        user_metadata: {
          full_name: church.nome_responsavel,
          church_id: church.id,
          church_name: church.nome,
          initial_role: "pastor",
        },
      })
      if (createErr) throw new Error(`createUser: ${createErr.message}`)
      const newUserId = created.user?.id
      if (!newUserId) throw new Error("createUser: missing user id")

      // Insere como membro pastor ativo
      const { error: insertErr } = await service.from("membros").insert({
        id: newUserId,
        id_igreja: church.id,
        nome_completo: church.nome_responsavel,
        email: church.email,
        funcao: "pastor",
        status: "ativo",
        perfil_completo: false,
      })
      if (insertErr) throw new Error(`membros.insert: ${insertErr.message}`)

      return new Response(JSON.stringify({ ok: true, mode: "created", userId: newUserId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})