import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
// ===================================================================
// ESTA É A LINHA CORRIGIDA PARA O CAMINHO CERTO
import { supabase } from '../lib/supabase'
// ===================================================================
import { supabase } from '@/integrations/supabase/client'

// --- Interfaces (Tipos de Dados) ---
export type UserRole =
  | 'membro'
  | 'lider_ministerio'
  | 'pastor'
  | 'admin'
  | 'financeiro'
  | 'voluntario'
  | 'midia_tecnologia'
  | 'integra'
  | 'super_admin'

export interface PersonalInfo {
  data_nascimento?: string | null
  estado_civil?: string | null
  profissao?: string | null
  telefone?: string | null
  endereco?: string | null
}

interface User {
  permissions: any
  id: string
  name: string
  email: string
  role: UserRole
  churchId: string | null
  churchName?: string
  ministry?: string
  status: 'ativo' | 'pendente' | 'inativo'
  created_at: string
  perfil_completo: boolean
  personalInfo?: PersonalInfo | null
}

export type { User }

interface AuthState {
  user: User | null
  isLoading: boolean
  currentChurchId: string | null

  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => void
  setCurrentChurchId: (churchId: string | null) => void
  initializeAuthListener: () => void
  updateUserProfile: (personalInfo: Partial<PersonalInfo>) => void
}

// ===================================================================
// Controle de checagem para evitar chamadas duplicadas
// ===================================================================
let isCheckingAuth = false

// ===================================================================
// Store de Autenticação
// ===================================================================
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      currentChurchId: null,

      // ------------------------
      // LOGIN
      // ------------------------
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error

          if (data.user) {
            await get().checkAuth()
            return true
          }
        } catch (err) {
          console.error('AuthStore: Error during login:', err)
          toast.error('Email ou senha inválidos.')
        } finally {
          set({ isLoading: false })
        }
        return false
      },

      // ------------------------
      // LOGOUT
      // ------------------------
      logout: async () => {
        set({ isLoading: true })
        await supabase.auth.signOut()
        set({ user: null, currentChurchId: null, isLoading: false })
      },

      // ------------------------
      // CHECK AUTH
      // ------------------------
      checkAuth: async () => {
        if (isCheckingAuth) return

        // Apenas define o carregamento se não houver usuário (carregamento inicial)
        if (!get().user) {
          set({ isLoading: true })
        }
        isCheckingAuth = true

        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (error) throw error

          if (session?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('membros')
              .select(`*, igrejas(id, nome), informacoes_pessoais(*)`)
              .eq('id', session.user.id)
              .maybeSingle()

            if (profileError) throw profileError
            if (!profile)
              throw new Error('Perfil de membro não encontrado para o ID da sessão.')

            const info = Array.isArray(profile.informacoes_pessoais)
              ? profile.informacoes_pessoais[0]
              : profile.informacoes_pessoais

            set({
              user: {
                id: session.user.id,
                name: profile.nome_completo,
                email: session.user.email!,
                role: profile.funcao as UserRole,
                churchId: profile.id_igreja,
                churchName: profile.igrejas?.nome || 'Igreja',
                status: profile.status as any,
                created_at: profile.created_at,
                perfil_completo: profile.perfil_completo,
                permissions: {},
                personalInfo: info || null,
              },
              currentChurchId: profile.id_igreja,
            })
          } else {
            set({ user: null, currentChurchId: null })
          }
        } catch (error) {
          console.error('AuthStore: Erro no checkAuth:', error)
          set({ user: null, currentChurchId: null })
        } finally {
          isCheckingAuth = false
          set({ isLoading: false }) // Sempre finaliza o carregamento
        }
      },

      // ------------------------
      // SET CHURCH ID
      // ------------------------
      setCurrentChurchId: (churchId: string | null) => {
        set({ currentChurchId: churchId })
      },

      // ------------------------
      // LISTENER
      // ------------------------
      initializeAuthListener: () => {
        const { _authListenerInitialized } = get() as any
        if (_authListenerInitialized) return

        supabase.auth.onAuthStateChange(async (event) => {
          if (
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'USER_UPDATED'
          ) {
            await get().checkAuth()
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, currentChurchId: null, isLoading: false })
          }
        })

        set({ _authListenerInitialized: true } as Partial<AuthState>)
      },

      // ------------------------
      // UPDATE PROFILE (LOCAL)
      // ------------------------
      updateUserProfile: (personalInfo: Partial<PersonalInfo>) => {
        set((state) => {
          if (state.user) {
            return {
              user: {
                ...state.user,
                personalInfo: {
                  ...state.user.personalInfo,
                  ...personalInfo,
                },
                perfil_completo: true,
              },
            }
          }
          return state
        })
      },
    }),
    {
      name: 'connect-vida-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentChurchId: state.currentChurchId,
      }),
    }
  )
)