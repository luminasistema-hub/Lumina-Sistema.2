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

    // 1. Create the user in auth.users
    const { data: userResponse, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email for admin users
      user_metadata: {
        full_name: name,
        initial_role: 'super_admin',
        church_id: null, // Super Admin is explicitly NOT tied to a specific church
      },
    });

    if (createUserError) {
      console.error('Error creating Super Admin user in auth.users:', createUserError);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = userResponse.user.id;
    console.log('Super Admin user created in auth.users with ID:', newUserId);

    // 2. Insert the corresponding profile into public.membros
    // For Super Admin, id_igreja must be NULL
    const { error: insertMemberError } = await supabaseAdmin
      .from('membros')
      .insert({
        id: newUserId,
        id_igreja: null, // Super Admin is explicitly NOT tied to a specific church
        nome_completo: name,
        email: email,
        funcao: 'super_admin',
        status: 'ativo',
        perfil_completo: true,
      });

    if (insertMemberError) {
      console.error('Error inserting member profile into public.membros:', insertMemberError);
      // Attempt to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: 'Erro ao criar perfil do membro: ' + insertMemberError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Member profile created for Super Admin with ID:', newUserId);

    return new Response(JSON.stringify({ message: 'Super Admin cadastrado com sucesso!' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Ocorreu um erro inesperado: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});