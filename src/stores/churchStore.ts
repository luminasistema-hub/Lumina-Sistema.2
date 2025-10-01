import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../integrations/supabase/client' 

export type SubscriptionPlan = '0-100 membros' | '101-300 membros' | '301-500 membros' | 'ilimitado'

export interface PaymentRecord {
  id: string;
  data: string;
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado';
  metodo: string;
  referencia?: string;
  registrado_por: string;
}

export interface Church {
  id: string
  name: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  subscriptionPlan: SubscriptionPlan
  memberLimit: number
  currentMembers: number
  status: 'active' | 'inactive' | 'pending' | 'trial' | 'blocked'
  created_at: string
  adminUserId: string | null 
  updated_at?: string 
  valor_mensal_assinatura: number; // Novo campo
  data_proximo_pagamento?: string; // Novo campo
  ultimo_pagamento_status: 'Pago' | 'Pendente' | 'Atrasado' | 'N/A'; // Novo campo
  historico_pagamentos: PaymentRecord[]; // Novo campo
  // Novas configurações avançadas
  server_memory_limit?: string;
  server_execution_timeout?: string;
  db_connection_pool?: string;
  db_query_cache_mb?: number;
  // Campos adicionados para as configurações da igreja
  cnpj?: string;
  nome_responsavel?: string;
  site?: string;
  descricao?: string;
}

interface ChurchState {
  churches: Church[]
  updateChurch: (churchId: string, updates: Partial<Church>) => Promise<Church | null>
  getChurchById: (churchId: string) => Church | undefined
  loadChurches: () => Promise<void>
  getSubscriptionPlans: () => { label: string; value: SubscriptionPlan; memberLimit: number; monthlyValue: number }[]
  getPlanDetails: (planId: SubscriptionPlan) => { label: string; value: SubscriptionPlan; memberLimit: number; monthlyValue: number }
}

export const useChurchStore = create<ChurchState>()(
  persist(
    (set, get) => ({
      churches: [],

      getSubscriptionPlans: () => [
        { label: '0 a 100 Membros', value: '0-100 membros', memberLimit: 100, monthlyValue: 99.00 },
        { label: '101 a 300 Membros', value: '101-300 membros', memberLimit: 300, monthlyValue: 199.00 },
        { label: '301 a 500 Membros', value: '301-500 membros', memberLimit: 500, monthlyValue: 299.00 },
        { label: 'Ilimitado', value: 'ilimitado', memberLimit: Infinity, monthlyValue: 499.00 },
      ],

      getPlanDetails: (planId: SubscriptionPlan) => {
        return get().getSubscriptionPlans().find(p => p.value === planId) || { label: 'Desconhecido', value: planId, memberLimit: 0, monthlyValue: 0 };
      },

      loadChurches: async () => {
        console.log('churchStore: Loading churches from Supabase...');
        const { data, error } = await supabase
          .from('igrejas')
          .select('*');

        if (error) {
          console.error('churchStore: Error loading churches from Supabase:', error);
          return;
        }
        console.log('churchStore: Churches loaded from Supabase:', data);
        set({ churches: data.map(c => ({
          id: c.id,
          name: c.nome,
          address: c.address,
          contactEmail: c.contactEmail,
          contactPhone: c.contactPhone,
          subscriptionPlan: c.plano_id,
          memberLimit: c.limite_membros,
          currentMembers: c.membros_atuais,
          status: c.status,
          created_at: c.criado_em,
          adminUserId: c.admin_user_id,
          updated_at: c.updated_at,
          valor_mensal_assinatura: c.valor_mensal_assinatura || 0,
          data_proximo_pagamento: c.data_proximo_pagamento,
          ultimo_pagamento_status: c.ultimo_pagamento_status || 'N/A',
          historico_pagamentos: c.historico_pagamentos || [],
          server_memory_limit: c.server_memory_limit,
          server_execution_timeout: c.server_execution_timeout,
          db_connection_pool: c.db_connection_pool,
          db_query_cache_mb: c.db_query_cache_mb,
          // Campos adicionados para as configurações da igreja
          cnpj: c.cnpj,
          nome_responsavel: c.nome_responsavel,
          site: c.site,
          descricao: c.descricao,
        })) as Church[] });
      },

      updateChurch: async (churchId, updates) => {
        console.log('churchStore: Updating church in Supabase:', churchId, updates);
        const updatePayload: any = {};

        if (updates.subscriptionPlan) {
          const planDetails = get().getPlanDetails(updates.subscriptionPlan);
          updatePayload.plano_id = updates.subscriptionPlan;
          updatePayload.limite_membros = planDetails.memberLimit;
          updatePayload.valor_mensal_assinatura = planDetails.monthlyValue;
        }
        if (updates.name) updatePayload.nome = updates.name;
        if (updates.currentMembers !== undefined) updatePayload.membros_atuais = updates.currentMembers;
        if (updates.status) updatePayload.status = updates.status;
        if (updates.adminUserId) updatePayload.admin_user_id = updates.adminUserId;
        if (updates.address) updatePayload.address = updates.address;
        if (updates.contactEmail) updatePayload.contactEmail = updates.contactEmail;
        if (updates.contactPhone) updatePayload.contactPhone = updates.contactPhone;
        if (updates.data_proximo_pagamento) updatePayload.data_proximo_pagamento = updates.data_proximo_pagamento;
        if (updates.ultimo_pagamento_status) updatePayload.ultimo_pagamento_status = updates.ultimo_pagamento_status;
        if (updates.historico_pagamentos) updatePayload.historico_pagamentos = updates.historico_pagamentos;
        // Novas configurações avançadas
        if (updates.server_memory_limit) updatePayload.server_memory_limit = updates.server_memory_limit;
        if (updates.server_execution_timeout) updatePayload.server_execution_timeout = updates.server_execution_timeout;
        if (updates.db_connection_pool) updatePayload.db_connection_pool = updates.db_connection_pool;
        if (updates.db_query_cache_mb !== undefined) updatePayload.db_query_cache_mb = updates.db_query_cache_mb;
        // Campos adicionados para as configurações da igreja
        if (updates.cnpj) updatePayload.cnpj = updates.cnpj;
        if (updates.nome_responsavel) updatePayload.nome_responsavel = updates.nome_responsavel;
        if (updates.site) updatePayload.site = updates.site;
        if (updates.descricao) updatePayload.descricao = updates.descricao;


        const { data, error } = await supabase
          .from('igrejas')
          .update(updatePayload)
          .eq('id', churchId)
          .select()
          .single();

        if (error) {
          console.error('churchStore: Error updating church in Supabase:', error);
          return null;
        }

        const updatedChurch: Church = {
          id: data.id,
          name: data.nome,
          subscriptionPlan: data.plano_id,
          memberLimit: data.limite_membros,
          currentMembers: data.membros_atuais,
          status: data.status,
          created_at: data.criado_em,
          adminUserId: data.admin_user_id,
          address: data.address,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          updated_at: data.updated_at,
          valor_mensal_assinatura: data.valor_mensal_assinatura,
          data_proximo_pagamento: data.data_proximo_pagamento,
          ultimo_pagamento_status: data.ultimo_pagamento_status,
          historico_pagamentos: data.historico_pagamentos,
          server_memory_limit: data.server_memory_limit,
          server_execution_timeout: data.server_execution_timeout,
          db_connection_pool: data.db_connection_pool,
          db_query_cache_mb: data.db_query_cache_mb,
          // Campos adicionados para as configurações da igreja
          cnpj: data.cnpj,
          nome_responsavel: data.nome_responsavel,
          site: data.site,
          descricao: data.descricao,
        };

        set((state) => ({
          churches: state.churches.map((c) =>
            c.id === churchId ? updatedChurch : c
          ),
        }));
        return updatedChurch;
      },

      getChurchById: (churchId: string) => {
        return get().churches.find((c) => c.id === churchId);
      },
    }),
    {
      name: 'connect-vida-churches',
      partialize: (state) => ({}), 
      onRehydrateStorage: () => (state) => {
        if (state) {
          get().loadChurches();
        }
      },
    }
  )
)