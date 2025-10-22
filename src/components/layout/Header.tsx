import { useAuthStore, UserRole } from '../../stores/authStore'
import { useIsMobile } from '../../hooks/use-mobile'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  LogOut,
  Bell,
  User,
  UserCheck,
  Crown,
  Shield,
  DollarSign,
  Users,
  Headphones,
  Heart,
  Menu,
  Loader2,
  CheckCheck,
} from 'lucide-react'
import { useState } from 'react' 
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import NotificationDialog from '@/components/notifications/NotificationDialog'
import { SessionTimer } from './SessionTimer'

type HeaderProps = {
  onOpenMobileMenu?: () => void;
}

const NotificationItem = ({ notification, onClick }: { notification: any, onClick: () => void }) => {
  return (
    <div onClick={onClick} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
      <p className="font-semibold text-sm text-gray-800">{notification.titulo}</p>
      <p className="text-xs text-gray-500">{notification.descricao}</p>
      <p className="text-xs text-gray-400 mt-1">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
      </p>
    </div>
  )
}

const Header = ({ onOpenMobileMenu }: HeaderProps) => {
  const { user, logout } = useAuthStore()
  // removido modo escuro
  const { notifications, unreadCount, markAllAsRead, markOneAsRead, isLoading } = useNotifications();
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const isMobile = useIsMobile();

  const unreadNotifications = notifications.filter(n => !n.lido);

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification);
    setDialogOpen(true);
    setPopoverOpen(false);
  }

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
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

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xs md:max-w-md flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileMenu}
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <SessionTimer />
          
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative flex" aria-label="Notificações">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-3 border-b flex justify-between items-center">
                <h4 className="font-medium text-md">Notificações</h4>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-auto py-1 px-2">
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Marcar como lidas
                  </Button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                ) : unreadNotifications.length > 0 ? (
                  unreadNotifications.map(n => <NotificationItem key={n.id} notification={n} onClick={() => handleNotificationClick(n)} />)
                ) : (
                  <p className="text-center text-sm text-gray-500 p-8">Nenhuma notificação nova.</p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* botão de modo escuro removido */}

          {/* botão de configurações (engrenagem) removido */}

          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-20 md:max-w-none">{user?.name || 'Usuário'}</p>
              <Badge className={`text-xs ${getRoleColor(user?.role)}`}>
                {getRoleIcon(user?.role)}
                <span className="ml-1 hidden md:inline">{getRoleLabel(user?.role)}</span>
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