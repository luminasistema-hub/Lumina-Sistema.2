import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  adminUserId: string // ID do usuário admin que criou/gerencia a igreja
}

interface ChurchState {
  churches: Church[]
  addChurch: (church: Church) => void
  updateChurch: (churchId: string, updates: Partial<Church>) => void
  getChurchById: (churchId: string) => Church | undefined
  loadChurches: () => void
  getSubscriptionPlans: () => { label: string; value: SubscriptionPlan; memberLimit: number }[]
}

const getChurchesFromStorage = (): Church[] => {
  const stored = localStorage.getItem('connect-vida-churches')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // Ensure parsed data is an array, otherwise return empty array
      if (Array.isArray(parsed)) {
        return parsed
      } else {
        console.warn("churchStore: Persisted 'churches' data is not an array, returning empty array.");
        return []
      }
    } catch (e) {
      console.error("churchStore: Error parsing persisted 'churches' data, returning empty array:", e);
      return []
    }
  }
  return []
}

const saveChurchesToStorage = (churches: Church[]) => {
  localStorage.setItem('connect-vida-churches', JSON.stringify(churches))
}

export const useChurchStore = create<ChurchState>()(
  persist(
    (set, get) => ({
      churches: [],

      loadChurches: () => {
        const loadedChurches = getChurchesFromStorage()
        console.log('churchStore: Loaded churches from storage:', loadedChurches); // Added log
        set({ churches: loadedChurches })
      },

      addChurch: (church: Church) => {
        set((state) => {
          const newChurches = [...state.churches, church]
          saveChurchesToStorage(newChurches)
          return { churches: newChurches }
        })
      },

      updateChurch: (churchId: string, updates: Partial<Church>) => {
        set((state) => {
          const updatedChurches = state.churches.map((c) =>
            c.id === churchId ? { ...c, ...updates } : c
          )
          saveChurchesToStorage(updatedChurches)
          return { churches: updatedChurches }
        })
      },

      getChurchById: (churchId: string) => {
        const state = get();
        // Defensive check: ensure churches is an array before calling find
        if (!Array.isArray(state.churches)) {
          console.error("churchStore: 'churches' is not an array in state, attempting to re-initialize.");
          // This might indicate a deeper issue, but for now, prevent crash
          // and try to load from storage again or reset.
          get().loadChurches(); // Try to reload from storage
          const reloadedState = get();
          if (Array.isArray(reloadedState.churches)) {
            return reloadedState.churches.find((c) => c.id === churchId);
          }
          return undefined;
        }
        return state.churches.find((c) => c.id === churchId);
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
    }
  )
)