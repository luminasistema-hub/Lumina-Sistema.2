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
            let { data: profile, error: profileError } = await supabase
              .from('membros') 
              .select(`
                id,
                nome_completo,
                email,
                funcao,
                id_igreja,
                status,
                created_at,
                perfil_completo,
                ministerio_recomendado,
                igrejas(id, nome)
              `)
              .eq('id', session.user.id)
              .maybeSingle(); 
            
            console.log('AuthStore: Profile fetch result - data:', profile, 'error:', profileError);

            if (profileError || !profile) { 
              console.error('AuthStore: Error fetching user profile or profile not found:', profileError?.message || 'Profile data is null/undefined.');

              // Special handling for super_admin if profile is missing
              if (session.user.user_metadata.initial_role === 'super_admin') {
                  console.warn('AuthStore: Super Admin user found in auth.users but missing profile in public.membros. Attempting to create profile...');

                  // Fetch Super Admin Church ID
                  const { data: superAdminChurch, error: churchError } = await supabase
                      .from('igrejas')
                      .select('id')
                      .eq('nome', 'Super Admin Church')
                      .maybeSingle();

                  if (churchError) {
                      console.error('AuthStore: Error fetching "Super Admin Church":', churchError?.message);
                      set({ user: null, isLoading: false, currentChurchId: null });
                      return;
                  }

                  if (!superAdminChurch) {
                      console.warn('AuthStore: "Super Admin Church" not found. This should ideally be pre-created. Attempting to create it now.');
                      // Attempt to create the Super Admin Church if it doesn't exist
                      const { data: newChurch, error: createChurchError } = await supabase
                          .from('igrejas')
                          .insert({
                              id: '00000000-0000-0000-0000-000000000002', // Fixed UUID for Super Admin Church
                              plano_id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for Super Admin Default Plan
                              nome: 'Super Admin Church',
                              admin_user_id: session.user.id, // Assign current super admin as admin
                              nome_responsavel: 'Super Admin',
                              status: 'active',
                              limite_membros: 999999
                          })
                          .select('id')
                          .single();

                      if (createChurchError || !newChurch) {
                          console.error('AuthStore: Error creating "Super Admin Church":', createChurchError?.message);
                          set({ user: null, isLoading: false, currentChurchId: null });
                          return;
                      }
                      superAdminChurch.id = newChurch.id; // Use the newly created church's ID
                      console.log('AuthStore: Successfully created "Super Admin Church" with ID:', superAdminChurch.id);
                  }

                  const superAdminChurchId = superAdminChurch.id;

                  // Attempt to insert profile for super_admin
                  const { data: newProfile, error: insertError } = await supabase
                      .from('membros')
                      .insert({
                          id: session.user.id,
                          id_igreja: superAdminChurchId,
                          nome_completo: session.user.user_metadata.full_name || session.user.email,
                          email: session.user.email!,
                          funcao: 'super_admin',
                          status: 'ativo',
                          perfil_completo: true,
                      })
                      .select(`
                        id,
                        nome_completo,
                        email,
                        funcao,
                        id_igreja,
                        status,
                        created_at,
                        perfil_completo,
                        ministerio_recomendado,
                        igrejas(id, nome)
                      `) // Select all fields again to match the original profile structure
                      .single();

                  if (insertError) {
                      console.error('AuthStore: Error creating missing profile for super_admin:', insertError.message);
                      set({ user: null, isLoading: false, currentChurchId: null });
                      return;
                  }

                  console.log('AuthStore: Successfully created missing profile for super_admin.');
                  // Now use the newly created profile
                  profile = newProfile;
              }
            }
            
            // Re-check if profile is still null/undefined after all attempts
            if (!profile) {
                console.error('AuthStore: Profile data is still null/undefined after all attempts. Cannot proceed.');
                set({ user: null, isLoading: false, currentChurchId: null });
                return;
            }

            console.log('AuthStore: Profile data successfully fetched. perfil_completo:', profile.perfil_completo);

            const churchIdForUser = profile.funcao === 'super_admin' ? null : profile.id_igreja;

            set({
              user: {
                id: session.user.id,
                email: session.user.email!,
                role: profile.funcao,
                churchId: churchIdForUser,
                churchName: profile.igrejas?.nome || 'N/A',
                isProfileComplete: profile.perfil_completo,
              },
              isLoading: false,
              currentChurchId: churchIdForUser,
            });
            console.log('AuthStore: User set:', {
              id: session.user.id,
              email: session.user.email!,
              role: profile.funcao,
              churchId: churchIdForUser,
              churchName: profile.igrejas?.nome || 'N/A',
              isProfileComplete: profile.perfil_completo,
            });
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