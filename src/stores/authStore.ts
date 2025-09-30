import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../integrations/supabase/client'

export type UserRole = 'membro' | 'lider_ministerio' | 'pastor' | 'admin' | 'financeiro' | 'voluntario' | 'midia_tecnologia' | 'integra' | 'super_admin'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  churchId: string | null
  churchName?: string
  ministry?: string
  status: 'ativo' | 'pendente' | 'inativo'
  created_at: string
  perfil_completo: boolean; // Adicionado: indica se o perfil pessoal está completo
}

export type { User }

interface AuthState {
  user: User | null
  isLoading: boolean
  currentChurchId: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, churchName: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  checkAuth: () => void
  setCurrentChurchId: (churchId: string | null) => void
  initializeAuthListener: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      currentChurchId: null,

      login: async (email: string, password: string) => {
        console.log('AuthStore: Attempting login (this method should ideally not be called directly for Supabase auth).');
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            console.error('AuthStore: Supabase signInWithPassword error:', error.message);
            set({ user: null, isLoading: false, currentChurchId: null });
            return false;
          }
          if (data.user) {
            console.log('AuthStore: Supabase signInWithPassword successful, user:', data.user.id);
            await get().checkAuth(); // Force checkAuth after successful login
            return true;
          }
        } catch (err) {
          console.error('AuthStore: Unexpected error during login:', err);
        } finally {
          set({ isLoading: false });
        }
        return false;
      },

      register: async (name: string, email: string, password: string, churchName: string) => {
        console.log('AuthStore: Register method called (should be handled in LoginPage).');
        return { success: false, message: 'O registro é tratado diretamente pelo Supabase.' };
      },

      logout: async () => {
        console.log('AuthStore: Attempting logout.');
        set({ isLoading: true });
        const { error } = await supabase.auth.signOut();
        if (!error) {
          console.log('AuthStore: User logged out successfully.');
          set({ user: null, currentChurchId: null, isLoading: false });
        } else {
          console.error('AuthStore: Error during logout:', error);
          set({ isLoading: false });
        }
      },

      checkAuth: async () => {
        console.log('AuthStore: checkAuth initiated. Setting isLoading to true.');
        set({ isLoading: true });
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('AuthStore: getSession result - session:', session, 'error:', error);

          if (error) {
            console.error('AuthStore: Error getting session:', error.message);
            set({ user: null, isLoading: false, currentChurchId: null });
            return;
          }

          if (session && session.user) {
            console.log('AuthStore: Session found for user ID:', session.user.id);
            console.log('AuthStore: Attempting to fetch profile from "membros" table.');
            const { data: profile, error: profileError } = await supabase
              .from('membros') 
              .select('*, igrejas(id, nome)') 
              .eq('id', session.user.id)
              .maybeSingle(); 
            
            console.log('AuthStore: Profile fetch result - data:', profile, 'error:', profileError);

            if (profileError || !profile) { 
              console.error('AuthStore: Error fetching user profile or profile not found:', profileError?.message || 'Profile data is null/undefined. Setting user to null and isLoading to false.');
              set({ user: null, isLoading: false, currentChurchId: null });
              return;
            }

            console.log('AuthStore: Profile data successfully fetched. perfil_completo:', profile.perfil_completo);

            const userRole = profile.funcao as UserRole;
            const churchIdFromProfile = profile.id_igreja;
            const churchName = profile.igrejas ? profile.igrejas.nome : undefined;

            const authenticatedUser: User = {
              id: session.user.id,
              name: profile.nome_completo || session.user.user_metadata.full_name || session.user.email || 'Usuário', 
              email: session.user.email!,
              role: userRole,
              churchId: churchIdFromProfile,
              churchName: churchName,
              status: profile.status as User['status'],
              created_at: session.user.created_at,
              perfil_completo: profile.perfil_completo,
            };

            let newCurrentChurchId: string | null;
            if (userRole === 'super_admin') {
                newCurrentChurchId = get().currentChurchId;
                console.log('AuthStore: Super admin detected. Keeping currentCurrentChurchId from persisted state:', newCurrentChurchId);
            } else {
                newCurrentChurchId = churchIdFromProfile;
                console.log('AuthStore: Non-super admin detected. Setting newCurrentChurchId to profile church ID:', newCurrentChurchId);
            }

            set({ user: authenticatedUser, isLoading: false, currentChurchId: newCurrentChurchId });
            console.log('AuthStore: User authenticated and state updated. Final user:', authenticatedUser, 'Final currentChurchId:', newCurrentChurchId, 'isLoading set to false.');
          } else {
            console.log('AuthStore: No authenticated user found in session. Setting isLoading to false.');
            set({ user: null, isLoading: false, currentChurchId: null });
          }
        } catch (error) {
          console.error('AuthStore: Unexpected error during checkAuth:', error);
          set({ user: null, isLoading: false, currentChurchId: null }); 
        }
      },

      setCurrentChurchId: (churchId: string | null) => {
        set({ currentChurchId: churchId });
        console.log('AuthStore: Current church ID set to:', churchId);
      },

      initializeAuthListener: () => {
        if (!(get() as any)._authListenerInitialized) {
          console.log('AuthStore: Initializing Supabase auth state listener.');
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('AuthStore: Supabase Auth State Change Event:', event, session);
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                console.log('AuthStore: Auth event detected, calling checkAuth().');
                await get().checkAuth();
              } else if (event === 'SIGNED_OUT') {
                console.log('AuthStore: SIGNED_OUT event detected, clearing state.');
                set({ user: null, currentChurchId: null, isLoading: false });
              }
            }
          );
          (get() as any)._authListenerInitialized = true;
        }
      }
    }),
    {
      name: 'connect-vida-auth',
      partialize: (state) => ({ currentChurchId: state.currentChurchId }),
    }
  )
)