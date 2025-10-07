import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { userId } = await req.json().catch(() => ({}))
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // Client para identificar o chamador (valida JWT)
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: meData } = await supabase.auth.getUser()
    const me = meData?.user
    if (!me?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Não permitir apagar a si mesmo
    if (me.id === userId) {
      return new Response(JSON.stringify({ error: "Você não pode excluir a si mesmo." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Verificar se chamador é super_admin
    const { data: sa } = await supabase
      .from("super_admins")
      .select("id")
      .eq("id", me.id)
      .maybeSingle()

    let authorized = false
    if (sa) {
      authorized = true
    } else {
      // Se não for super_admin, permitir admin/pastor da mesma igreja
      const { data: meMember } = await supabase
        .from("membros")
        .select("id_igreja, funcao")
        .eq("id", me.id)
        .maybeSingle()

      if (!meMember) {
        authorized = false
      } else {
        const isAdminPastor = ["admin", "pastor"].includes(String(meMember.funcao))
        if (isAdminPastor) {
          // Buscar igreja do alvo
          const { data: targetMember } = await supabase
            .from("membros")
            .select("id_igreja, funcao")
            .eq("id", userId)
            .maybeSingle()

          if (targetMember && targetMember.id_igreja === meMember.id_igreja) {
            // Não permitir apagar super_admin
            const { data: tSa } = await supabase
              .from("super_admins")
              .select("id")
              .eq("id", userId)
              .maybeSingle()
            if (!tSa) {
              authorized = true
            }
          }
        }
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Admin client para operações privilegiadas
    const supabaseAdmin = createClient(supabaseUrl, serviceRole)

    // Remover dependências públicas primeiro (caso existam FKs)
    // Ignoramos erros aqui — se não existir, prossegue
    await supabaseAdmin.from("informacoes_pessoais").delete().eq("membro_id", userId)
    await supabaseAdmin.from("ministerio_voluntarios").delete().eq("membro_id", userId)
    await supabaseAdmin.from("evento_participantes").delete().eq("membro_id", userId)
    await supabaseAdmin.from("progresso_membros").delete().eq("id_membro", userId)
    await supabaseAdmin.from("devocional_curtidas").delete().eq("membro_id", userId)
    await supabaseAdmin.from("devocional_comentarios").delete().eq("autor_id", userId)
    await supabaseAdmin.from("cursos_inscricoes").delete().eq("id_membro", userId)
    await supabaseAdmin.from("pastor_area_items").delete().eq("pastor_id", userId)
    await supabaseAdmin.from("transacoes_financeiras").update({ membro_id: null, membro_nome: null }).eq("membro_id", userId)
    await supabaseAdmin.from("membros").delete().eq("id", userId)

    // Apagar usuário no Auth
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})