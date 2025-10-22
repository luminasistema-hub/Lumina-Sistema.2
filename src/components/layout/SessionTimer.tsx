import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Clock, RefreshCw } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'

const SESSION_DURATION = 60 * 60 * 1000 // 1 hora em ms
const WARNING_TIME = 5 * 60 * 1000 // Avisar 5 minutos antes

export const SessionTimer = () => {
  const { logout } = useAuthStore()
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_DURATION)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Inicializar timer
    const startTime = Date.now()
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = SESSION_DURATION - elapsed

      if (remaining <= 0) {
        clearInterval(interval)
        toast.error('Sessão expirada. Faça login novamente.')
        logout()
        return
      }

      setTimeLeft(remaining)
      
      if (remaining <= WARNING_TIME && !showWarning) {
        setShowWarning(true)
        toast.warning('Sua sessão expirará em breve. Clique em "Renovar Sessão" para continuar.')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [logout, showWarning])

  const handleRenewSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) throw error
      
      // Resetar timer
      setTimeLeft(SESSION_DURATION)
      setShowWarning(false)
      toast.success('Sessão renovada com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao renovar sessão: ' + error.message)
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const isWarning = timeLeft <= WARNING_TIME

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 text-sm ${isWarning ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
        <Clock className="w-4 h-4" />
        <span>{formatTime(timeLeft)}</span>
      </div>
      {isWarning && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRenewSession}
          className="h-8 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Renovar
        </Button>
      )}
    </div>
  )
}