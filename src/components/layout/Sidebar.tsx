import { useState, useEffect } from 'react'
import { useAuthStore, UserRole } from '../../stores/authStore'
import { useChurchStore } from '../../stores/churchStore' 
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select' 
import { Label } from '../ui/label' 
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Settings, 
  Church, 
  BookOpen, 
  Heart,
  Mic,
  Baby,
  GraduationCap,
  User,
  UserCheck,
  Crown,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  Globe,
  Headphones,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  ClipboardList 
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useNavigate } from 'react-router-dom' 

interface ModuleItem {
  id: string
  title: string
  icon: React.ReactNode
  roles: UserRole[]
  status: 'complete' | 'development' | 'basic'
  active?: boolean
}

interface ModuleCategory {
  id: string
  title: string
  icon: React.ReactNode
  modules: ModuleItem[]
  defaultOpen?: boolean
}

const moduleCategories: ModuleCategory[] = [
  {
    id: 'personal',
    title: 'Área Pessoal',
    icon: <User className="w-5 h-5" />,
    defaultOpen: true,
    modules: [
      {
        id: 'personal-info',
        title: 'Informações Pessoais',
        icon: <User className="w-4 h-4" />,
        roles: ['membro', 'lider_ministerio', 'pastor', 'admin', 'financeiro', 'voluntario', 'midia_tecnologia', 'integra'],
        status: 'complete'
      },
      {
        id: 'member-journey',
        title: 'Jornada do Membro',
        icon: <GraduationCap className="w-4 h-4" />,
        roles: ['membro', 'lider_ministerio', 'pastor', 'admin', 'financeiro', 'voluntario', 'midia_tecnologia', 'integra'],
        status: 'complete'
      },
      {
        id: 'vocational-test',
        title: 'Teste Vocacional',
        icon: <Heart className="w-4 h-4" />,
        roles: ['membro', 'lider_ministerio', 'pastor', 'admin', 'financeiro', 'voluntario', 'midia_tecnologia', 'integra'],
        status: 'complete'
      }
    ]
  },
  {
    id: 'spiritual',
    title: 'Crescimento Espiritual',
    icon: <BookOpen className="w-5 h-5" />,
    modules: [
      {
        id: 'events',
        title: 'Eventos',
        icon: <Calendar className="w-4 h-4" />,
        roles: ['membro', 'lider_ministerio', 'pastor', 'admin', 'financeiro', 'voluntario', 'midia_tecnologia', 'integra'],
        status: 'complete'
      },
      {
        id: 'courses',
        title: 'Cursos EAD',
        icon: <BookOpen className="w-4 h-4" />,
        roles: ['membro', 'lider_ministerio', 'pastor', 'admin', 'financeiro', 'voluntario', 'midia_tecnologia', 'integra'],
        status: 'complete'
      },
      {
        id: 'devotionals',
        title: 'Devocionais',
        icon: <BookOpen className="w-4 h-4" />,
        roles: ['membro', 'lider_ministerio', 'pastor', 'admin', 'financeiro', 'voluntario', 'midia_tecnologia', 'integra'],
        status: 'complete'
      }
    ]
  },
  {
    id: 'contributions',
    title: 'Contribuições',
    icon: <DollarSign className="w-5 h-5" />,
    modules: [
      {
        id: 'offerings',
        title: 'Ofertas e Doações',
        icon: <DollarSign className="w-4 h-4" />,
        roles: ['membro', 'lider_ministerio', 'pastor', 'admin', 'financeiro', 'voluntario', 'midia_tecnologia', 'integra'],
        status: 'complete'
      }
    ]
  },
  {
    id: 'management',
    title: 'Gestão',
    icon: <Users className="w-5 h-5" />,
    modules: [
      {
        id: 'member-management',
        title: 'Gestão de Membros',
        icon: <Users className="w-4 h-4" />,
        roles: ['lider_ministerio', 'pastor', 'admin', 'integra'],
        status: 'complete'
      },
      {
        id: 'ministries',
        title: 'Ministérios',
        icon: <Church className="w-4 h-4" />,
        roles: ['lider_ministerio', 'pastor', 'admin'],
        status: 'complete'
      },
      {
        id: 'financial-panel',
        title: 'Painel Financeiro',
        icon: <DollarSign className="w-4 h-4" />,
        roles: ['pastor', 'admin', 'financeiro'],
        status: 'complete'
      },
      { 
        id: 'journey-config',
        title: 'Configuração da Jornada',
        icon: <ClipboardList className="w-4 h-4" />,
        roles: ['admin', 'pastor'], 
        status: 'complete'
      },
      { 
        id: 'kids-management',
        title: 'Gestão Kids',
        icon: <Baby className="w-4 h-4" />,
        roles: ['admin', 'pastor', 'lider_ministerio', 'membro'], 
        status: 'complete'
      }
    ]
  },
  {
    id: 'media',
    title: 'Mídia e Transmissão',
    icon: <Mic className="w-5 h-5" />,
    modules: [
      {
        id: 'live-streaming',
        title: 'Transmissão ao Vivo',
        icon: <Mic className="w-4 h-4" />,
        roles: [], // desabilitado: não aparece para nenhum perfil
        status: 'development'
      }
    ]
  },
  {
    id: 'administration',
    title: 'Administração',
    icon: <Settings className="w-5 h-5" />,
    modules: [
      {
        id: 'site-management',
        title: 'Gestão de Site',
        icon: <Globe className="w-4 h-4" />,
        roles: [], // desabilitado: não aparece para nenhum perfil
        status: 'development'
      },
      {
        id: 'system-settings',
        title: 'Configurações',
        icon: <Settings className="w-4 h-4" />,
        roles: ['admin'],
        status: 'basic'
      }
    ]
  },
  {
    id: 'system',
    title: 'Sistema',
    icon: <Activity className="w-5 h-5" />,
    modules: [
      {
        id: 'system-status',
        title: 'Status do Sistema',
        icon: <Activity className="w-4 h-4" />,
        roles: ['admin'],
        status: 'complete'
      }
    ]
  }
]

interface SidebarProps {
  activeModule?: string
  onModuleSelect?: (moduleId: string) => void
}

const Sidebar = ({ activeModule = 'dashboard', onModuleSelect }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['personal', 'management'])
  const { user, setCurrentChurchId, currentChurchId } = useAuthStore()
  const { churches, loadChurches } = useChurchStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadChurches()
  }, [loadChurches])

  if (!user) return null

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleModuleClick = (moduleId: string) => {
    if (moduleId === 'master-admin') {
      navigate('/master-admin')
    } else {
      onModuleSelect?.(moduleId)
    }
  }

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

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-700 border-red-200'
      case 'admin': return 'bg-red-100 text-red-700 border-red-200'
      case 'pastor': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'lider_ministerio': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'financeiro': return 'bg-green-100 text-green-700 border-green-200'
      case 'voluntario': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'midia_tecnologia': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'integra': return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'membro': return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'pastor': return 'Pastor'
      case 'lider_ministerio': return 'Líder'
      case 'financeiro': return 'Financeiro'
      case 'voluntario': return 'Voluntário'
      case 'midia_tecnologia': return 'Mídia'
      case 'integra': return 'Integração'
      case 'membro': return 'Membro'
    }
  }

  const getStatusIcon = (status: ModuleItem['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'development': return <Clock className="w-3 h-3 text-yellow-500" />
      case 'basic': return <AlertCircle className="w-3 h-3 text-blue-500" />
    }
  }

  const getUserModules = (modules: ModuleItem[]) => {
    return modules.filter(module => module.roles.includes(user.role))
  }

  const getUserCategories = () => {
    return moduleCategories.filter(category => 
      getUserModules(category.modules).length > 0
    )
  }

  const handleChurchSelect = (churchId: string) => {
    setCurrentChurchId(churchId)
    // No need to navigate to /dashboard here, as the App.tsx router handles it
  }

  const currentChurch = currentChurchId ? churches.find(c => c.id === currentChurchId) : null

  return (
    <div className={cn(
      "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Church className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Connect Vida</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">Sistema Multi-Igrejas</p>
                <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                  SaaS
                </Badge>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.name || 'Usuário'}</p>
              <Badge className={cn("text-xs", getRoleColor(user?.role))}>
                {getRoleIcon(user?.role)}
                <span className="ml-1">{getRoleLabel(user?.role)}</span>
              </Badge>
            </div>
          </div>
          {user?.churchName && user?.role !== 'super_admin' && (
            <p className="text-xs text-gray-500 mt-2 truncate">📍 {user?.churchName}</p>
          )}
          {user?.role === 'super_admin' && (
            <p className="text-xs text-gray-500 mt-2 truncate">👑 Painel Master</p>
          )}
        </div>
      )}

      {/* Church Selector for Non-Super Admin */}
      {user?.role !== 'super_admin' && !isCollapsed && (
        <div className="p-4 border-b border-gray-100">
          <Label htmlFor="church-selector" className="text-xs font-medium text-gray-600 mb-1 block">
            Igreja Ativa
          </Label>
          <Select value={currentChurchId || ''} onValueChange={handleChurchSelect}>
            <SelectTrigger id="church-selector" className="w-full">
              <SelectValue placeholder="Selecione uma igreja" />
            </SelectTrigger>
            <SelectContent>
              {churches.map(church => (
                <SelectItem key={church.id} value={church.id}>
                  {church.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Dashboard Home */}
        <div className="px-4 mb-4">
          <Button
            variant={activeModule === 'dashboard' ? 'default' : 'ghost'}
            className={cn(
              "w-full justify-start",
              isCollapsed ? "px-2" : "px-3",
              activeModule === 'dashboard' && "bg-blue-50 text-blue-700 hover:bg-blue-100"
            )}
            onClick={() => handleModuleClick('dashboard')}
          >
            <Home className="w-4 h-4" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </Button>
        </div>

        {/* Master Admin Link */}
        {user?.role === 'super_admin' && (
          <div className="px-4 mb-4">
            <Button
              variant={activeModule === 'master-admin' ? 'default' : 'ghost'}
              className={cn(
                "w-full justify-start",
                isCollapsed ? "px-2" : "px-3",
                activeModule === 'master-admin' && "bg-red-50 text-red-700 hover:bg-red-100"
              )}
              onClick={() => handleModuleClick('master-admin')}
            >
              <Shield className="w-4 h-4" />
              {!isCollapsed && <span className="ml-3">Painel Master</span>}
            </Button>
          </div>
        )}

        {/* Link para Registro de Super Admin (visível se não houver super admin logado) */}
        {!user && (
          <div className="px-4 mb-4">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isCollapsed ? "px-2" : "px-3",
                "text-orange-600 hover:text-orange-800 hover:bg-orange-50"
              )}
              onClick={() => navigate('/super-admin-register')}
            >
              <Shield className="w-4 h-4" />
              {!isCollapsed && <span className="ml-3">Registrar Super Admin</span>}
            </Button>
          </div>
        )}

        {/* Module Categories */}
        <div className="space-y-2">
          {getUserCategories().map((category) => {
            const userModules = getUserModules(category.modules)
            const isExpanded = expandedCategories.includes(category.id)

            return (
              <div key={category.id}>
                {/* Category Header */}
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4 py-2 h-auto text-left font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <span>{category.title}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}

                {/* Category Modules */}
                {(isCollapsed || isExpanded) && (
                  <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-4 ml-4")}>
                    {userModules.map((module) => (
                      <Button
                        key={module.id}
                        variant={activeModule === module.id ? 'default' : 'ghost'}
                        className={cn(
                          "w-full justify-start text-sm",
                          isCollapsed ? "px-2 py-2" : "px-3 py-2",
                          activeModule === module.id 
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-l-2 border-blue-500" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        )}
                        onClick={() => handleModuleClick(module.id)}
                        title={isCollapsed ? module.title : undefined}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {module.icon}
                          {!isCollapsed && (
                            <>
                              <span className="ml-1 flex-1">{module.title}</span>
                              {getStatusIcon(module.status)}
                            </>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Connect Vida v2.0 SaaS
            </p>
            <p className="text-xs text-gray-400 mt-1">
              © 2025 Igreja Connect
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Sistema Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar