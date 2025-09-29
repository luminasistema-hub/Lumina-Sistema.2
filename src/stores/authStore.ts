import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../integrations/supabase/client' // Importar o cliente Supabase

export type UserRole = 'membro' | 'lider_ministerio' | 'pastor' | 'admin' | 'financeiro' | 'voluntario' | 'midia_tecnologia' | 'integra' | 'super_admin'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  churchId: string | null // Adicionado para associar o usuário a uma igreja
  churchName?: string // Nome da igreja para exibição
  ministry?: string
  status: 'ativo' | 'pendente' | 'inativo'
  created_at: string
  approved_by?: string
  approved_at?: string
}

export type { User } // Exportação explícita da interface como um tipo

interface AuthState {
  user: User | null
  isLoading: boolean
  currentChurchId: string | null // ID da igreja atualmente selecionada
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, churchName: string) => Promise<{ success: boolean; message: string }> // Este método não será mais usado diretamente para registro via Supabase
  logout: () => void
  checkAuth: () => void
  setCurrentChurchId: (churchId: string | null) => void // Novo método para definir a igreja ativa
  initializeAuthListener: () => void; // Novo método para inicializar o listener
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true, // Iniciar como true para indicar que a autenticação está sendo verificada
      currentChurchId: null, // Inicialmente sem igreja selecionada

      login: async (email: string, password: string) => {
        // O login agora é tratado diretamente no LoginPage via supabase.auth.signInWithPassword
        // Este método aqui será apenas um placeholder ou pode ser removido se não houver lógica adicional
        // para o Zustand após o login do Supabase.
        // Para manter a compatibilidade com o LoginPage atual, vamos simular o sucesso.
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
        if (supabaseUser && !error) {
          // Fetch user profile from 'perfis' table
          const { data: profile, error: profileError } = await supabase
            .from('perfis')
            .select('*, igrejas(id, nome)')
            .eq('id', supabaseUser.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            set({ user: null, isLoading: false, currentChurchId: null });
            return false;
          }

          const userRole = profile.funcao as UserRole;
          const churchId = profile.id_igreja;
          const churchName = profile.igrejas ? profile.igrejas.nome : undefined;

          const authenticatedUser: User = {
            id: supabaseUser.id,
            name: profile.full_name || supabaseUser.email || 'Usuário',
            email: supabaseUser.email!,
            role: userRole,
            churchId: churchId,
            churchName: churchName,
            status: 'ativo', // Assumimos ativo se o perfil foi encontrado
            created_at: supabaseUser.created_at,
          };
          set({ user: authenticatedUser, isLoading: false, currentChurchId: churchId });
          return true;
        }
        set({ isLoading: false });
        return false;
      },

      register: async (name: string, email: string, password: string, churchName: string) => {
        // O registro agora é tratado diretamente no LoginPage via supabase.auth.signUp
        // Este método aqui não será mais usado diretamente.
        return { success: false, message: 'O registro é tratado diretamente pelo Supabase.' };
      },

      logout: async () => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signOut();
        if (!error) {
          set({ user: null, currentChurchId: null, isLoading: false });
          console.log('User logged out successfully');
        } else {
          console.error('Error during logout:', error);
          set({ isLoading: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session:', error);
            set({ user: null, isLoading: false, currentChurchId: null });
            return;
          }

          if (session && session.user) {
            // Fetch user profile from 'perfis' table
            const { data: profile, error: profileError } = await supabase
              .from('perfis')
              .select('*, igrejas(id, nome)')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching user profile:', profileError);
              set({ user: null, isLoading: false, currentChurchId: null });
              return;
            }

            const userRole = profile.funcao as UserRole;
            const churchId = profile.id_igreja;
            const churchName = profile.igrejas ? profile.igrejas.nome : undefined;

            const authenticatedUser: User = {
              id: session.user.id,
              name: profile.full_name || session.user.user_metadata.full_name || session.user.email || 'Usuário',
              email: session.user.email!,
              role: userRole,
              churchId: churchId,
              churchName: churchName,
              status: profile.status as User['status'], // Usar status do perfil
              created_at: session.user.created_at,
            };
            set({ user: authenticatedUser, isLoading: false, currentChurchId: churchId });
            console.log('User is authenticated:', authenticatedUser.name, 'Church ID:', churchId);
          } else {
            set({ user: null, isLoading: false, currentChurchId: null });
            console.log('No authenticated user found');
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({ user: null, isLoading: false, currentChurchId: null });
        }
      },

      setCurrentChurchId: (churchId: string | null) => {
        set({ currentChurchId: churchId });
        console.log('Current church ID set to:', churchId);
      },

      // Novo método para inicializar o listener de autenticação
      initializeAuthListener: () => {
        // Usar uma flag para garantir que o listener seja inicializado apenas uma vez
        if (!(get() as any)._authListenerInitialized) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('Supabase Auth State Change Event:', event, session);
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                // Quando o usuário faz login, o token é atualizado ou o usuário é atualizado,
                // re-verifique a autenticação para atualizar o estado do store.
                get().checkAuth();
              } else if (event === 'SIGNED_OUT') {
                // Se o usuário sair, limpe o estado.
                set({ user: null, currentChurchId: null, isLoading: false });
              }
            }
          );
          // Marcar o listener como inicializado
          (get() as any)._authListenerInitialized = true;
          // Opcional: armazenar a subscription para poder desinscrever em um cleanup, se necessário.
          // (get() as any)._authSubscription = subscription;
        }
      }
    }),
    {
      name: 'connect-vida-auth',
      // Manter partialize para persistir currentChurchId, o user será sempre re-derivado via checkAuth
      partialize: (state) => ({ currentChurchId: state.currentChurchId }),
    }
  )
)