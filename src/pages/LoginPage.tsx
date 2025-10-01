import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import { Church, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom' // Importar Link e useSearchParams

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const [searchParams] = useSearchParams() // Hook para ler parâmetros da URL

  // Limpar parâmetros de registro se existirem na URL de login
  useEffect(() => {
    if (searchParams.get('churchId') || searchParams.get('churchName')) {
      // Opcional: redirecionar para /login sem os parâmetros se não for desejado
      // navigate('/login', { replace: true });
      // Ou apenas ignorar os parâmetros aqui
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('LoginPage: Form submitted for login:', { email })
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    console.log('LoginPage: Attempting login via useAuthStore.login().');
    const success = await login(email, password);
    if (!success) {
      console.error('LoginPage: Login failed via useAuthStore.login().');
    } else {
      console.log('LoginPage: Login successful via useAuthStore.login().');
    }
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
              Lumina
            </CardTitle>
            <CardDescription className="text-base">
              Entre em sua conta
            </CardDescription>
            <Badge className="bg-green-100 text-green-800 mx-auto">
              Sistema em Produção
            </Badge>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 mx-auto"
              >
                Não tenho conta - Cadastrar-se
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 mt-6 bg-white/80 p-4 rounded-lg">
          <p className="flex items-center justify-center gap-2 mb-2">
            <img src="/favicon.ico" alt="Lumina Icon" className="w-4 h-4" />
            Lumina - Sistema de Gestão Eclesiástica
          </p>
          <p className="text-xs">
            Todos os novos usuários iniciam como "Membro".
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage