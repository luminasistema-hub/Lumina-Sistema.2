import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Helper: localizar usuário pelo e-mail (varre páginas)
async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  // Tentativas de paginação (200 por página, até 5 páginas = 1000 usuários)
  const perPage = 200
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const found = data.users?.find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase())
    if (found) return found
    if (!data.users || data.users.length < perPage) break
  }
  return null
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

  const userRes = await service.auth.getUser(token)
  const user = userRes.data?.user
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

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

  const { data: pastorMember } = await service
    .from("membros")
    .select("id, email")
    .eq("id_igreja", church.id)
    .eq("funcao", "pastor")
    .limit(1)
    .maybeSingle()

  try {
    const targetEmail = church.email

    if (pastorMember?.id) {
      // Atualiza email se necessário (ignora erro se email já em uso por outro user)
      if (targetEmail && pastorMember.email !== targetEmail) {
        const { error: emailErr } = await service.auth.admin.updateUserById(pastorMember.id, {
          email: targetEmail,
          email_confirm: true,
          user_metadata: {
            full_name: church.nome_responsavel,
            church_id: church.id,
            church_name: church.nome,
            initial_role: "pastor",
          },
        })
        // Se o email já estiver em uso, seguimos apenas com a troca de senha
        if (emailErr && !/already|in use|registered/i.test(emailErr.message)) {
          throw new Error(`updateUserById(email): ${emailErr.message}`)
        }

        const { error: updMemberEmailErr } = await service
          .from("membros")
          .update({ email: targetEmail, nome_completo: church.nome_responsavel, funcao: "pastor" })
          .eq("id", pastorMember.id)
        if (updMemberEmailErr) throw new Error(`membros.update(email): ${updMemberEmailErr.message}`)
      }

      const { error: updErr } = await service.auth.admin.updateUserById(pastorMember.id, {
        password: church.panel_password,
        email_confirm: true,
      })
      if (updErr) throw new Error(`updateUserById(password): ${updErr.message}`)

      const { error: statusErr } = await service
        .from("membros")
        .update({ status: "ativo" })
        .eq("id", pastorMember.id)
      if (statusErr) throw new Error(`membros.update(status): ${statusErr.message}`)

      return new Response(JSON.stringify({ ok: true, mode: "updated", userId: pastorMember.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } else {
      // Tenta criar o usuário, ou reutiliza se e-mail já existir
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email: targetEmail,
        password: church.panel_password,
        email_confirm: true,
        user_metadata: {
          full_name: church.nome_responsavel,
          church_id: church.id,
          church_name: church.nome,
          initial_role: "pastor",
        },
      })

      let targetUserId = created?.user?.id || null

      if (createErr) {
        // Se o e-mail já estiver cadastrado, reutiliza o usuário existente
        if (/already|in use|registered/i.test(createErr.message)) {
          const existing = await findUserByEmail(service, targetEmail)
          if (!existing?.id) throw new Error(`createUser/email conflict: usuário com email ${targetEmail} já existe, mas não foi possível localizar o ID.`)

          targetUserId = existing.id

          // Ajusta senha e metadados para a igreja filha
          const { error: updExistingErr } = await service.auth.admin.updateUserById(targetUserId, {
            password: church.panel_password,
            email_confirm: true,
            user_metadata: {
              full_name: church.nome_responsavel,
              church_id: church.id,
              church_name: church.nome,
              initial_role: "pastor",
            },
          })
          if (updExistingErr) throw new Error(`updateUserById(existing): ${updExistingErr.message}`)
        } else {
          throw new Error(`createUser: ${createErr.message}`)
        }
      }

      if (!targetUserId) throw new Error("Falha ao obter userId do pastor.")

      // Upsert em membros como pastor da igreja filha
      const { error: upsertErr } = await service
        .from("membros")
        .upsert({
          id: targetUserId,
          id_igreja: church.id,
          nome_completo: church.nome_responsavel,
          email: targetEmail,
          funcao: "pastor",
          status: "ativo",
          perfil_completo: false,
        }, { onConflict: "id" })
      if (upsertErr) throw new Error(`membros.upsert: ${upsertErr.message}`)

      return new Response(JSON.stringify({ ok: true, mode: "created_or_reused", userId: targetUserId }), {
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