// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ===================================================================
// ⚙️ Configuração do Supabase
// ===================================================================
// As variáveis precisam estar definidas no arquivo .env
// Exemplo de .env na raiz do projeto:
//
// VITE_SUPABASE_URL=https://xxxxx.supabase.co
// VITE_SUPABASE_ANON_KEY=seuAnonKeyAqui
// ===================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// 🚨 Validação: garante que as variáveis foram configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("⚠️ Supabase URL ou Anon Key não definidos em .env");
}

// 🔗 Instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
