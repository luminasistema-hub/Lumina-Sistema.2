import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Nome, email e senha são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let churchId: string;

    // 1. Ensure 'Super Admin Church' exists
    const { data: existingChurch, error: fetchChurchError } = await supabaseAdmin
      .from('igrejas')
      .select('id, admin_user_id')
      .eq('nome', 'Super Admin Church')
      .maybeSingle();

    if (fetchChurchError && fetchChurchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking Super Admin Church:', fetchChurchError);
      return new Response(JSON.stringify({ error: 'Erro ao verificar igreja de Super Admin.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let adminChurchRecord = existingChurch;

    if (!adminChurchRecord) {
      console.log('Super Admin Church not found, creating...');
      const { data: newChurch, error: createChurchError } = await supabaseAdmin
        .from('igrejas')
        .insert({
          nome: 'Super Admin Church',
          plano_id: '00000000-0000-0000-0000-000000000001', // Corrigido para o UUID do plano padrão
          limite_membros: -1, // -1 for unlimited
          membros_atuais: 0,
          status: 'active',
          admin_user_id: null, // Will be set after user creation
        })
        .select('id, admin_user_id')
        .single();

      if (createChurchError) {
        console.error('Error creating Super Admin Church:', createChurchError);
        return new Response(JSON.stringify({ error: 'Erro ao criar igreja de Super Admin.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      adminChurchRecord = newChurch;
      console.log('Super Admin Church created with ID:', adminChurchRecord.id);
    }
    churchId = adminChurchRecord.id;

    // 2. Create the user in auth.users
    const { data: userResponse, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email for admin users
      user_metadata: {
        full_name: name,
        church_name: 'Super Admin Church',
        initial_role: 'super_admin',
        church_id: churchId,
      },
    });

    if (createUserError) {
      console.error('Error creating Super Admin user:', createUserError);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = userResponse.user.id;
    console.log('Super Admin user created in auth.users:', newUserId);

    // 3. Insert the corresponding profile into public.membros
    const { error: insertMemberError } = await supabaseAdmin
      .from('membros')
      .insert({
        id: newUserId,
        id_igreja: churchId,
        nome_completo: name,
        email: email,
        funcao: 'super_admin',
        status: 'ativo',
        perfil_completo: true,
      });

    if (insertMemberError) {
      console.error('Error inserting member profile:', insertMemberError);
      // Attempt to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: 'Erro ao criar perfil do membro: ' + insertMemberError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Member profile created for Super Admin.');

    // 4. If Super Admin Church doesn't have an admin_user_id, set it
    if (!adminChurchRecord.admin_user_id) {
      const { error: updateChurchAdminError } = await supabaseAdmin
        .from('igrejas')
        .update({ admin_user_id: newUserId })
        .eq('id', churchId);

      if (updateChurchAdminError) {
        console.warn('Could not set admin_user_id for Super Admin Church:', updateChurchAdminError);
      } else {
        console.log('admin_user_id set for Super Admin Church.');
      }
    }

    return new Response(JSON.stringify({ message: 'Super Admin cadastrado com sucesso!' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Ocorreu um erro inesperado.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});