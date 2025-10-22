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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Server misconfiguration: Missing Supabase credentials.");
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await admin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { member_id, church_id } = await req.json();
    if (!member_id || !church_id) {
      return new Response(JSON.stringify({ error: "member_id and church_id are required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: callerProfile, error: callerError } = await admin
      .from('membros')
      .select('funcao')
      .eq('id', caller.id)
      .eq('id_igreja', church_id)
      .single();

    if (callerError || !['admin', 'pastor', 'super_admin', 'integra'].includes(callerProfile.funcao)) {
       return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [
      personalRes,
      enrollmentsRes,
      ministriesRes,
      vocationalTestRes,
      journeyStructureRes,
      journeyProgressRes,
    ] = await Promise.all([
      admin.from('informacoes_pessoais').select('*').eq('membro_id', member_id).maybeSingle(),
      admin.from('escola_inscricoes').select('escolas(nome)').eq('membro_id', member_id),
      admin.from('ministerio_voluntarios').select('ministerios(nome)').eq('membro_id', member_id),
      admin.from('testes_vocacionais').select('ministerio_recomendado, data_teste').eq('membro_id', member_id).eq('is_ultimo', true).maybeSingle(),
      admin.rpc('get_jornada_para_igreja', { id_igreja_atual: church_id }),
      admin.from('progresso_membros').select('id_passo').eq('id_membro', member_id).eq('status', 'concluido'),
    ]);

    if (personalRes.error) throw personalRes.error;
    if (enrollmentsRes.error) throw enrollmentsRes.error;
    if (ministriesRes.error) throw ministriesRes.error;
    if (vocationalTestRes.error) throw vocationalTestRes.error;
    if (journeyStructureRes.error) throw journeyStructureRes.error;
    if (journeyProgressRes.error) throw journeyProgressRes.error;

    let personal = personalRes.data;
    if (personal?.conjuge_id) {
      const { data: spouse } = await admin.from('membros').select('nome_completo').eq('id', personal.conjuge_id).single();
      if (spouse) {
        personal.conjuge_nome = spouse.nome_completo;
      }
    }

    const responsibleIds = [member_id];
    if (personal?.conjuge_id) {
      responsibleIds.push(personal.conjuge_id);
    }
    const { data: kids, error: kidsError } = await admin.from('criancas').select('id, nome_crianca, data_nascimento').in('responsavel_id', responsibleIds);
    if (kidsError) throw kidsError;

    let journey = null;
    const totalSteps = journeyStructureRes.data?.length || 0;
    if (totalSteps > 0) {
      const completedSteps = journeyProgressRes.data?.length || 0;
      const completedStageIds = new Set(
        journeyStructureRes.data
          .filter(s => journeyProgressRes.data.some(p => p.id_passo === s.passo_id))
          .map(s => s.etapa_id)
      );
      journey = {
        completedSteps,
        totalSteps,
        percentage: (completedSteps / totalSteps) * 100,
        completedStages: completedStageIds.size,
      };
    }

    const responsePayload = {
      personal,
      enrollments: enrollmentsRes.data,
      ministries: ministriesRes.data,
      kids: kids,
      journey,
      vocationalTest: vocationalTestRes.data,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in get-member-details:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});