import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const {
      motherChurchId,
      child,
    } = await req.json()

    if (!motherChurchId || !child?.nome || !child?.nome_responsavel || !child?.email || !child?.panel_password) {
      return new Response(JSON.stringify({ error: "Dados incompletos fornecidos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Buscar informações da igreja mãe para herdar plano/limites/status de pagamento
    const { data: mother, error: motherErr } = await supabaseAdmin
      .from("igrejas")
      .select("id, plano_id, limite_membros, valor_mensal_assinatura, ultimo_pagamento_status")
      .eq("id", motherChurchId)
      .maybeSingle()

    if (motherErr || !mother) {
      return new Response(JSON.stringify({ error: "Igreja mãe não encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 1) Criar a igreja filha
    const cnpjSanitized = child.cnpj ? String(child.cnpj).replace(/[^\d]+/g, "") : null
    const telefoneSanitized = child.telefone_contato ? String(child.telefone_contato).replace(/[^\d]+/g, "") : null

    const { data: createdChurch, error: churchErr } = await supabaseAdmin
      .from("igrejas")
      .insert({
        nome: child.nome,
        cnpj: cnpjSanitized,
        endereco: child.endereco || null,
        telefone_contato: telefoneSanitized,
        email: child.email,
        nome_responsavel: child.nome_responsavel,
        plano_id: mother.plano_id,
        limite_membros: mother.limite_membros,
        valor_mensal_assinatura: mother.valor_mensal_assinatura,
        ultimo_pagamento_status: mother.ultimo_pagamento_status, // espelha status de pagamento da mãe
        status: "active",
        parent_church_id: motherChurchId,
        panel_password: child.panel_password || null,
      })
      .select("id, nome")
      .single()

    if (churchErr) {
      // Erros como CNPJ duplicado etc.
      return new Response(JSON.stringify({ error: churchErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const childChurchId = createdChurch.id

    // 2) Criar usuário pastor com acesso confirmado
    const { data: authCreated, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: child.email,
      password: child.panel_password,
      email_confirm: true,
      user_metadata: {
        full_name: child.nome_responsavel,
        church_id: childChurchId,
        church_name: createdChurch.nome,
        initial_role: "pastor",
      },
    })

    if (authErr) {
      // Rollback da igreja se falhar a criação de usuário
      await supabaseAdmin.from("igrejas").delete().eq("id", childChurchId)
      if (authErr.message.includes("User already registered")) {
        return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const pastorUserId = authCreated.user?.id
    if (!pastorUserId) {
      // Segurança: se por algum motivo não houver id, desfaz
      await supabaseAdmin.from("igrejas").delete().eq("id", childChurchId)
      return new Response(JSON.stringify({ error: "Falha ao criar usuário pastor." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 3) Garantir registro no membros como 'pastor' e 'ativo'
    const { error: memberErr } = await supabaseAdmin
      .from("membros")
      .insert({
        id: pastorUserId,
        id_igreja: childChurchId,
        nome_completo: child.nome_responsavel,
        email: child.email,
        funcao: "pastor",
        status: "ativo",
        perfil_completo: false,
      })

    if (memberErr) {
      // Se falhar, remover usuário e igreja para evitar dados órfãos
      await supabaseAdmin.auth.admin.deleteUser(pastorUserId)
      await supabaseAdmin.from("igrejas").delete().eq("id", childChurchId)
      return new Response(JSON.stringify({ error: memberErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ churchId: childChurchId, pastorId: pastorUserId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    const msg = (error as any)?.message || "Ocorreu um erro interno."
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})