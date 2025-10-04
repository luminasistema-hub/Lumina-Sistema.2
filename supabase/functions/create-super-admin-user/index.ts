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

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: "Nome, email e senha são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Tenta criar o usuário diretamente
    let authUserId: string | null = null;
    const createRes = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        initial_role: "super_admin",
      },
    });

    if (createRes.error) {
      // Se já existir, tenta localizar e atualizar
      // Observação: listUsers é paginada; para projetos menores, perPage 200 geralmente é suficiente
      const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (list.error) {
        console.error("Erro ao listar usuários:", list.error);
        return new Response(JSON.stringify({ error: "Falha ao localizar usuário existente." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const existing = (list.data?.users ?? []).find((u: any) => u.email?.toLowerCase() === String(email).toLowerCase());
      if (!existing) {
        console.error("Usuário não encontrado após erro de criação:", createRes.error?.message);
        return new Response(JSON.stringify({ error: "Usuário não encontrado e não foi possível criar." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      authUserId = existing.id;

      // Atualiza senha e metadados para garantir acesso
      const upd = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password,
        user_metadata: {
          full_name: name,
          initial_role: "super_admin",
        },
      });
      if (upd.error) {
        console.error("Erro ao atualizar usuário existente:", upd.error);
        return new Response(JSON.stringify({ error: "Falha ao atualizar credenciais do usuário." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      authUserId = createRes.data.user.id;
    }

    if (!authUserId) {
      return new Response(JSON.stringify({ error: "Falha ao obter ID do usuário." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remove registros conflitantes (mesmo email com id diferente)
    const { data: adminsByEmail, error: adminsQueryErr } = await supabaseAdmin
      .from("super_admins")
      .select("id, email")
      .eq("email", email);

    if (!adminsQueryErr && (adminsByEmail ?? []).length > 0) {
      const conflicts = (adminsByEmail ?? []).filter((row: any) => row.id !== authUserId);
      if (conflicts.length > 0) {
        const conflictIds = conflicts.map((c: any) => c.id);
        await supabaseAdmin.from("super_admins").delete().in("id", conflictIds);
      }
    }

    // Garante o registro na tabela com o mesmo id do auth.users
    const upsertRes = await supabaseAdmin
      .from("super_admins")
      .upsert({ id: authUserId, nome_completo: name, email }, { onConflict: "id" });

    if (upsertRes.error) {
      console.error("Erro ao upsert em super_admins:", upsertRes.error);
      return new Response(JSON.stringify({ error: "Erro ao registrar Super Admin no banco." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Super Admin pronto para login." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro inesperado:", error);
    const msg = (error as any)?.message || "Erro inesperado.";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});