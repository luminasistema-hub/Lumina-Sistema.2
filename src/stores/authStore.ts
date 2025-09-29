import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'membro' | 'lider_ministerio' | 'pastor' | 'admin' | 'financeiro' | 'voluntario' | 'midia_tecnologia' | 'integra'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  church?: string
  ministry?: string
  status: 'ativo' | 'pendente' | 'inativo'
  created_at: string
  approved_by?: string
  approved_at?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  checkAuth: () => void
}

// Sistema de usuários em produção
const getUsersFromStorage = (): Record<string, { password: string; user: User }> => {
  const stored = localStorage.getItem('connect-vida-users')
  if (stored) {
    return JSON.parse(stored)
  }
  
  // Usuário master inicial
  const initialUsers = {
    'diogoalbuquerque38@gmail.com': {
      password: '123456789',
      user: {
        id: 'master-001',
        name: 'Diogo Albuquerque',
        email: 'diogoalbuquerque38@gmail.com',
        role: 'admin' as UserRole,
        church: 'Igreja Connect Vida',
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
            set({ user: userData.user, isLoading: false })
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

      register: async (name: string, email: string, password: string) => {
        console.log('Registration attempt for:', email)
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const users = getUsersFromStorage()
          
          if (users[email]) {
            return { success: false, message: 'Este email já está cadastrado no sistema' }
          }
          
          const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: 'membro',
            church: 'Igreja Connect Vida',
            status: 'pendente',
            created_at: new Date().toISOString()
          }
          
          users[email] = {
            password,
            user: newUser
          }
          
          saveUsersToStorage(users)
          
          console.log('User registered successfully:', newUser.name)
          return { 
            success: true, 
            message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o sistema.' 
          }
        } catch (error) {
          console.error('Registration error:', error)
          return { success: false, message: 'Erro interno do sistema. Tente novamente.' }
        }
      },

      logout: () => {
        console.log('User logged out')
        set({ user: null })
      },

      checkAuth: () => {
        console.log('Checking authentication state...')
        const currentUser = get().user
        if (currentUser) {
          console.log('User is authenticated:', currentUser.name)
        } else {
          console.log('No authenticated user found')
        }
      }
    }),
    {
      name: 'connect-vida-auth',
    }
  )
)