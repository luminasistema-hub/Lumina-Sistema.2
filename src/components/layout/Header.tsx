import { useAuthStore, UserRole } from '../../stores/authStore'
import { useChurchStore } from '../../stores/churchStore' 
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  LogOut,
  Bell,
  Search,
  User,
  UserCheck,
  Crown,
  Shield,
  Settings,
  Moon,
  Sun,
  DollarSign,
  Users,
  Headphones,
  Heart,
  Building
} from 'lucide-react'
import { Input } from '../ui/input'
import { useState, useEffect } from 'react' 

interface HeaderProps {
  currentChurchId: string | null; 
}

const Header = ({ currentChurchId }: HeaderProps) => {
  const { user, logout } = useAuthStore()
  const { getChurchById, loadChurches } = useChurchStore() 
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentChurchName, setCurrentChurchName] = useState('Nenhuma Igreja Selecionada')

  useEffect(() => {
    loadChurches() 
  }, [loadChurches])

  useEffect(() => {
    if (currentChurchId) {
      const church = getChurchById(currentChurchId)
      setCurrentChurchName(church?.name || 'Igreja Desconhecida')
    } else if (user?.role === 'super_admin') {
      setCurrentChurchName('Painel Master')
    } else {
      setCurrentChurchName('Nenhuma Igreja Selecionada')
    }
  }, [currentChurchId, getChurchById, user?.role])

  if (!user) return null

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return <Shield className="w-3 h-3" />
      case 'admin': return <Shield className="w-3 h-3" />
      case 'pastor': return <Crown className="w-3 h-3" />
      case 'lider_ministerio': return <UserCheck className="w-3 h-3" />
      case 'financeiro': return <DollarSign className="w-3 h-3" />
      case 'voluntario': return <Users className="w-3 h-3" />
      case 'midia_tecnologia': return <Headphones className="w-3 h-3" />
      case 'integra': return <Heart className="w-3 h-3" />
      case 'membro': return <User className="w-3 h-3" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Administrador'
      case 'pastor': return 'Pastor'
      case 'lider_ministerio': return 'Líder de Ministério'
      case 'financeiro': return 'Financeiro'
      case 'voluntario': return 'Voluntário'
      case 'midia_tecnologia': return 'Mídia e Tecnologia'
      case 'integra': return 'Integração'
      case 'membro': return 'Membro'
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'pastor': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'lider_ministerio': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'financeiro': return 'bg-green-100 text-green-800 border-green-200'
      case 'voluntario': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'midia_tecnologia': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'integra': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'membro': return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xs md:max-w-md flex items-center gap-3">
          <Building className="w-5 h-5 text-gray-500" />
          <span className="font-semibold text-gray-800 truncate">{currentChurchName}</span>
          {user.role !== 'super_admin' && (
            <div className="relative flex-1 ml-4 hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar módulos, membros..."
                className="pl-10 bg-gray-50 border-0 focus:bg-white"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="sm" className="relative hidden sm:flex">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="hidden md:flex"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Settings className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-20 md:max-w-none">{user.name}</p>
              <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
                <span className="ml-1 hidden md:inline">{getRoleLabel(user.role)}</span>
              </Badge>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={logout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header