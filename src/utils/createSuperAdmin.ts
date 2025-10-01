import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

export const createSuperAdminUser = async (email: string, password: string, fullName: string) => {
  try {
    // 1. Primeiro, verificar se uma igreja chamada 'Super Admin Church' existe, ou criá-la.
    let churchId = null;
    const { data: existingChurch, error: fetchChurchError } = await supabase
      .from('igrejas')
      .select('id')
      .eq('nome', 'Super Admin Church')
      .single();

    if (fetchChurchError && fetchChurchError.code !== 'PGRST116') { // PGRST116 significa 'no rows found'
      console.error('Erro ao verificar a Igreja de Super Admin:', fetchChurchError);
      toast.error('Erro ao verificar igreja de Super Admin.');
      return;
    }

    if (existingChurch) {
      churchId = existingChurch.id;
      console.log('Igreja "Super Admin Church" encontrada com ID:', churchId);
    } else {
      console.log('Igreja "Super Admin Church" não encontrada, criando...');
      const { data: newChurch, error: createChurchError } = await supabase
        .from('igrejas')
        .insert({
          nome: 'Super Admin Church',
          plano_id: 'ilimitado', // Plano ilimitado para o admin master
          limite_membros: -1, // -1 pode indicar ilimitado ou um número muito alto
          membros_atuais: 0,
          status: 'active',
          admin_user_id: null, // Será atualizado pelo trigger se este usuário for o primeiro admin
        })
        .select('id')
        .single();

      if (createChurchError) {
        console.error('Erro ao criar a Igreja de Super Admin:', createChurchError);
        toast.error('Erro ao criar igreja de Super Admin.');
        return;
      }
      churchId = newChurch.id;
      console.log('Igreja "Super Admin Church" criada com ID:', churchId);
    }

    // 2. Registrar o usuário com o papel de super_admin e o ID da igreja
    console.log('Tentando cadastrar Super Admin:', email);
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          church_name: 'Super Admin Church', // Usado pelo trigger
          initial_role: 'super_admin', // Define o papel inicial
          church_id: churchId, // Passa o ID da igreja para o trigger
        },
      },
    });

    if (signUpError) {
      console.error('Erro no cadastro do Super Admin:', signUpError.message);
      toast.error('Erro ao cadastrar Super Admin: ' + signUpError.message);
      return;
    }

    if (authData.user) {
      console.log('Usuário Super Admin criado em auth.users:', authData.user.id);

      // 3. Verificar e garantir que o perfil do membro foi criado
      const { data: memberProfile, error: fetchMemberError } = await supabase
        .from('membros')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (fetchMemberError && fetchMemberError.code !== 'PGRST116') { // PGRST116 significa 'no rows found'
        console.error('Erro ao verificar perfil do membro:', fetchMemberError);
        toast.error('Erro ao verificar perfil do membro.');
        return;
      }

      if (!memberProfile) {
        console.log('Perfil do membro não encontrado, inserindo manualmente...');
        const { error: insertMemberError } = await supabase
          .from('membros')
          .insert({
            id: authData.user.id,
            id_igreja: churchId,
            nome_completo: fullName,
            email: email,
            funcao: 'super_admin',
            status: 'ativo',
            perfil_completo: true, // Super admin já começa com perfil completo
          });

        if (insertMemberError) {
          console.error('Erro ao inserir perfil do membro manualmente:', insertMemberError);
          toast.error('Erro ao inserir perfil do membro manualmente: ' + insertMemberError.message);
          return;
        }
        console.log('Perfil do membro inserido manualmente.');
      } else {
        console.log('Perfil do membro já existe.');
      }

      toast.success('Super Admin cadastrado com sucesso! Você já pode fazer login.');
    } else {
      toast.error('Erro desconhecido no registro do Super Admin.');
    }
  } catch (err) {
    console.error('Erro inesperado em createSuperAdminUser:', err);
    toast.error('Ocorreu um erro inesperado ao cadastrar Super Admin.');
  }
};