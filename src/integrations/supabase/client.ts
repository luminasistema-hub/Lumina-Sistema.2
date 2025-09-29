import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // Adicione um console.error aqui para depuração
      console.error('Erro: As variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidas.');
      throw new Error('As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem ser definidas.');
    }

    export const supabase = createClient(supabaseUrl, supabaseAnonKey);