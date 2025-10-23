import { useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { toast } from '@/components/ui/sonner'
import { Lock, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const NewPasswordPage = () => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirm) {
      toast.error('Preencha todos os campos')
      return
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('As senhas não conferem')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Atualizando sua senha...')

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      toast.error('Não foi possível atualizar a senha: ' + error.message, { id: toastId })
      return
    }

    toast.success('Senha atualizada com sucesso! Faça login novamente.', { id: toastId })
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <img src="/favicon.ico" alt="Lumina Logo" className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Definir nova senha
            </CardTitle>
            <CardDescription className="text-base">
              Digite e confirme a nova senha para sua conta.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSetNewPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Confirme a nova senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  'Salvar nova senha'
                )}
              </Button>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Voltar para o Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NewPasswordPage