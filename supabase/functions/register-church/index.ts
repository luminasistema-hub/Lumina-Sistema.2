import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      adminName,
      adminEmail,
      adminPassword,
      churchName,
      cnpj,
      fullAddress,
      telefoneContato,
      selectedPlan,
      planDetails,
    } = await req.json()

    // Validação básica dos dados recebidos
    if (!adminName || !adminEmail || !adminPassword || !churchName || !selectedPlan || !planDetails) {
      return new Response(JSON.stringify({ error: 'Dados incompletos fornecidos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Criar a igreja
    const { data: churchData, error: churchError } = await supabaseAdmin
      .from('igrejas')
      .insert({
        nome: churchName,
        cnpj: cnpj.replace(/[^\d]+/g, ''),
        endereco: fullAddress,
        telefone_contato: telefoneContato.replace(/[^\d]+/g, ''),
        email: adminEmail,
        nome_responsavel: adminName,
        plano_id: selectedPlan,
        status: 'active',
        valor_mensal_assinatura: planDetails.monthlyValue,
        limite_membros: planDetails.memberLimit,
        ultimo_pagamento_status: planDetails.monthlyValue === 0 ? 'Confirmado' : 'Pendente',
      })
      .select('id, nome')
      .single()

    if (churchError) {
      // Verifica se o erro é de CNPJ duplicado
      if (churchError.message.includes('duplicate key value') && churchError.message.includes('cnpj')) {
        return new Response(JSON.stringify({ error: 'O CNPJ informado já está em uso.' }), {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw churchError
    }

    const newChurchId = churchData.id

    // 2. Criar o usuário administrador
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Confirma o email automaticamente para admins
      user_metadata: {
        full_name: adminName,
        church_id: newChurchId,
        church_name: churchData.nome,
        initial_role: 'admin',
      },
    })

    if (authError) {
      // Se a criação do usuário falhar, remove a igreja que foi criada para evitar dados órfãos
      await supabaseAdmin.from('igrejas').delete().eq('id', newChurchId)
      
      if (authError.message.includes('User already registered')) {
        return new Response(JSON.stringify({ error: 'Este e-mail já está cadastrado.' }), {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw authError
    }

    // 3. Não precisa mais atualizar o status, pois já entra como ativo
    // Removido: atualização de status do membro

    return new Response(JSON.stringify({ churchId: newChurchId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro na função register-church:', error)
    return new Response(JSON.stringify({ error: error.message || 'Ocorreu um erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})