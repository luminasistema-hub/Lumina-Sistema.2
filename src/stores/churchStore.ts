import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../integrations/supabase/client' // Importar o cliente Supabase

export type SubscriptionPlan = '0-100 membros' | '101-300 membros' | '301-500 membros' | 'ilimitado'

export interface Church {
  id: string
  name: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  subscriptionPlan: SubscriptionPlan
  memberLimit: number
  currentMembers: number
  status: 'active' | 'inactive' | 'pending' | 'trial'
  created_at: string
  adminUserId: string | null // ID do usuário admin que criou/gerencia a igreja
  updated_at?: string // Adicionado para corresponder à tabela do Supabase
}

interface ChurchState {
  churches: Church[]
  addChurch: (church: Omit<Church, 'id' | 'created_at' | 'updated_at' | 'currentMembers'>) => Promise<Church | null>
  updateChurch: (churchId: string, updates: Partial<Church>) => Promise<Church | null>
  getChurchById: (churchId: string) => Church | undefined
  loadChurches: () => Promise<void>
  getSubscriptionPlans: () => { label: string; value: SubscriptionPlan; memberLimit: number }[]
}

export const useChurchStore = create<ChurchState>()(
  persist(
    (set, get) => ({
      churches: [],

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
        set({ churches: data as Church[] });
      },

      addChurch: async (newChurchData) => {
        console.log('churchStore: Adding new church to Supabase:', newChurchData);
        const selectedPlan = get().getSubscriptionPlans().find(p => p.value === newChurchData.subscriptionPlan);
        const memberLimit = selectedPlan ? selectedPlan.memberLimit : 100; // Default if plan not found

        const { data, error } = await supabase
          .from('igrejas')
          .insert({
            nome: newChurchData.name,
            plano_id: newChurchData.subscriptionPlan,
            limite_membros: memberLimit,
            membros_atuais: 0,
            status: newChurchData.status,
            admin_user_id: newChurchData.adminUserId,
            address: newChurchData.address, // Adicionado
            contactEmail: newChurchData.contactEmail, // Adicionado
            contactPhone: newChurchData.contactPhone, // Adicionado
          })
          .select()
          .single();

        if (error) {
          console.error('churchStore: Error adding church to Supabase:', error);
          return null;
        }

        const addedChurch: Church = {
          id: data.id,
          name: data.nome,
          subscriptionPlan: data.plano_id,
          memberLimit: data.limite_membros,
          currentMembers: data.membros_atuais,
          status: data.status,
          created_at: data.created_at,
          adminUserId: data.admin_user_id,
          address: data.address,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          updated_at: data.updated_at,
        };

        set((state) => ({
          churches: [...state.churches, addedChurch],
        }));
        return addedChurch;
      },

      updateChurch: async (churchId, updates) => {
        console.log('churchStore: Updating church in Supabase:', churchId, updates);
        const updatePayload: any = { ...updates };

        // Handle subscriptionPlan and memberLimit update
        if (updates.subscriptionPlan) {
          const selectedPlan = get().getSubscriptionPlans().find(p => p.value === updates.subscriptionPlan);
          if (selectedPlan) {
            updatePayload.plano_id = updates.subscriptionPlan;
            updatePayload.limite_membros = selectedPlan.memberLimit;
          }
        }
        if (updates.name) updatePayload.nome = updates.name;
        if (updates.currentMembers !== undefined) updatePayload.membros_atuais = updates.currentMembers;
        if (updates.status) updatePayload.status = updates.status;
        if (updates.adminUserId) updatePayload.admin_user_id = updates.adminUserId;
        if (updates.address) updatePayload.address = updates.address;
        if (updates.contactEmail) updatePayload.contactEmail = updates.contactEmail;
        if (updates.contactPhone) updatePayload.contactPhone = updates.contactPhone;


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
          created_at: data.created_at,
          adminUserId: data.admin_user_id,
          address: data.address,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          updated_at: data.updated_at,
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

      getSubscriptionPlans: () => [
        { label: '0 a 100 Membros', value: '0-100 membros', memberLimit: 100 },
        { label: '101 a 300 Membros', value: '101-300 membros', memberLimit: 300 },
        { label: '301 a 500 Membros', value: '301-500 membros', memberLimit: 500 },
        { label: 'Ilimitado', value: 'ilimitado', memberLimit: Infinity },
      ],
    }),
    {
      name: 'connect-vida-churches',
      // Não persistir 'churches' no localStorage, pois agora vem do Supabase
      // Apenas persistir o estado para re-hidratar se necessário, mas 'churches' será carregado do Supabase
      partialize: (state) => ({}), // Não persistir 'churches'
      onRehydrateStorage: () => (state) => {
        // Ao re-hidratar, garantir que loadChurches seja chamado
        if (state) {
          get().loadChurches();
        }
      },
    }
  )
)