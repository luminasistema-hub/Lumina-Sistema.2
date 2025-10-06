import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
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
  | 'gestao_kids'
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

// Controle para evitar chamadas duplicadas
let isCheckingAuth = false

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      currentChurchId: null,

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

      logout: async () => {
        set({ isLoading: true })
        await supabase.auth.signOut()
        set({ user: null, currentChurchId: null, isLoading: false })
      },

      checkAuth: async () => {
        if (isCheckingAuth) return
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
            // 1) Buscar perfil via Edge Function (service role) para evitar recursão nas policies
            const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('get-member-profile', {
              body: {},
            });

            if (edgeErr) {
              console.warn('AuthStore: erro via edge get-member-profile:', edgeErr.message);
            }

            const profile = (edgeRes as any)?.profile;
            const churchRow = (edgeRes as any)?.church;
            const personalRecord = (edgeRes as any)?.personal;

            if (profile) {
              // Nome da igreja calculado com segurança
              let resolvedChurchName: string | undefined = undefined;

              // Verifica status de pagamento da igreja quando aplicável
              if (profile.id_igreja) {
                const mensalidade = Number(churchRow?.valor_mensal_assinatura ?? 0);
                const pagamentoOk = churchRow?.ultimo_pagamento_status === 'Confirmado';

                // Para plano pago, exige pagamento confirmado para acessar
                if (mensalidade > 0 && !pagamentoOk) {
                  toast.error('Pagamento pendente: finalize o checkout para acessar.');
                  await supabase.auth.signOut();
                  set({ user: null, currentChurchId: null, isLoading: false });
                  isCheckingAuth = false;
                  return;
                }

                // Captura o nome da igreja (se existir)
                if (churchRow && typeof churchRow.nome === 'string' && churchRow.nome) {
                  resolvedChurchName = churchRow.nome;
                }
              }

              // Montar personalInfo
              const personalInfo = personalRecord
                ? {
                    data_nascimento: personalRecord.data_nascimento ?? null,
                    estado_civil: personalRecord.estado_civil ?? null,
                    profissao: personalRecord.profissao ?? null,
                    telefone: personalRecord.telefone ?? null,
                    endereco: personalRecord.endereco ?? null,
                  }
                : null;

              set({
                user: {
                  id: session.user.id,
                  name: profile.nome_completo,
                  email: session.user.email!,
                  role: profile.funcao as UserRole,
                  churchId: profile.id_igreja,
                  churchName: resolvedChurchName ?? 'Igreja',
                  status: profile.status as any,
                  created_at: profile.created_at,
                  perfil_completo: profile.perfil_completo,
                  permissions: {},
                  personalInfo,
                },
                currentChurchId: profile.id_igreja,
              });
            } else {
              // 2) Fallback: verifica se é Super Admin
              const { data: sa, error: saError } = await supabase
                .from('super_admins')
                .select('id, nome_completo, email, created_at')
                .eq('id', session.user.id)
                .maybeSingle();

              if (saError) {
                console.warn('AuthStore: erro ao buscar super_admins:', saError.message);
              }

              if (sa) {
                set({
                  user: {
                    id: sa.id,
                    name: sa.nome_completo || session.user.email || 'Super Admin',
                    email: sa.email || session.user.email!,
                    role: 'super_admin',
                    churchId: null,
                    churchName: 'Painel Master',
                    status: 'ativo',
                    created_at: sa.created_at || new Date().toISOString(),
                    perfil_completo: true,
                    permissions: {},
                    personalInfo: null,
                  },
                  currentChurchId: null,
                });
              } else {
                // Não é membro nem super_admin
                set({ user: null, currentChurchId: null });
              }
            }
          } else {
            set({ user: null, currentChurchId: null })
          }
        } catch (error) {
          console.error('AuthStore: Erro no checkAuth:', error)
          set({ user: null, currentChurchId: null })
        } finally {
          isCheckingAuth = false
          set({ isLoading: false })
        }
      },

      setCurrentChurchId: (churchId: string | null) => {
        set({ currentChurchId: churchId })
      },

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