import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  register: (name: string, email: string, password: string, churchName: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  checkAuth: () => void
  setCurrentChurchId: (churchId: string | null) => void // Novo método para definir a igreja ativa
}

// Sistema de usuários em produção
const getUsersFromStorage = (): Record<string, { password: string; user: User }> => {
  const stored = localStorage.getItem('connect-vida-users')
  if (stored) {
    return JSON.parse(stored)
  }
  
  // Usuário master inicial (super_admin)
  const initialUsers = {
    'diogoalbuquerque38@gmail.com': {
      password: '123456789',
      user: {
        id: 'superadmin-001',
        name: 'Diogo Albuquerque',
        email: 'diogoalbuquerque38@gmail.com',
        role: 'super_admin' as UserRole, // Novo papel
        churchId: null, // Super admin não está ligado a uma igreja específica inicialmente
        status: 'ativo' as const,
        created_at: new Date().toISOString()
      }
    }
  }
  
  localStorage.setItem('connect-vida-users', JSON.stringify(initialUsers))
  return initialUsers
}

const saveUsersToStorage = (users: Record<string, { password: string; user: User }>) => {
  localStorage.setItem('connect-vida-users', JSON.stringify(users))
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      currentChurchId: null, // Inicialmente sem igreja selecionada

      login: async (email: string, password: string) => {
        console.log('Production login attempt for:', email)
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const users = getUsersFromStorage()
          const userData = users[email]
          
          if (userData && userData.password === password) {
            if (userData.user.status === 'pendente') {
              console.log('Login blocked: User pending approval')
              set({ isLoading: false })
              return false
            }
            
            if (userData.user.status === 'inativo') {
              console.log('Login blocked: User inactive')
              set({ isLoading: false })
              return false
            }
            
            console.log('Login successful for user:', userData.user.name)
            set({ user: userData.user, isLoading: false, currentChurchId: userData.user.churchId })
            return true
          } else {
            console.log('Login failed: Invalid credentials')
            set({ isLoading: false })
            return false
          }
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          return false
        }
      },

      register: async (name: string, email: string, password: string, churchName: string) => {
        console.log('Registration attempt for:', email, 'for church:', churchName)
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const users = getUsersFromStorage()
          
          if (users[email]) {
            return { success: false, message: 'Este email já está cadastrado no sistema' }
          }

          // Simular criação de igreja e associação
          // Em um sistema real, isso envolveria a criação de uma nova igreja no banco de dados
          // e a obtenção de um churchId real. Por enquanto, vamos gerar um ID simples.
          const newChurchId = `church-${Date.now()}`
          
          const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: 'membro',
            churchId: newChurchId, // Associar ao novo ID da igreja
            churchName: churchName,
            status: 'pendente',
            created_at: new Date().toISOString()
          }
          
          users[email] = {
            password,
            user: newUser
          }
          
          saveUsersToStorage(users)
          
          console.log('User registered successfully:', newUser.name, 'for church:', churchName)
          return { 
            success: true, 
            message: `Cadastro realizado com sucesso para a igreja ${churchName}! Aguarde a aprovação do administrador para acessar o sistema.` 
          }
        } catch (error) {
          console.error('Registration error:', error)
          return { success: false, message: 'Erro interno do sistema. Tente novamente.' }
        }
      },

      logout: () => {
        console.log('User logged out')
        set({ user: null, currentChurchId: null })
      },

      checkAuth: () => {
        console.log('Checking authentication state...')
        const currentUser = get().user
        if (currentUser) {
          console.log('User is authenticated:', currentUser.name)
          set({ currentChurchId: currentUser.churchId })
        } else {
          console.log('No authenticated user found')
        }
      },

      setCurrentChurchId: (churchId: string | null) => {
        set({ currentChurchId: churchId })
        console.log('Current church ID set to:', churchId)
      }
    }),
    {
      name: 'connect-vida-auth',
    }
  )
)