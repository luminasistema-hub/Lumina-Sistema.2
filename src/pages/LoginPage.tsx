import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import { Church, Lock, Mail, Eye, EyeOff, User, ArrowLeft, Building } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { useSearchParams } from 'react-router-dom' // Importar useSearchParams

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [churchName, setChurchName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const { login, isLoading } = useAuthStore()
  const [searchParams] = useSearchParams() // Hook para ler parâmetros da URL

  const churchIdFromUrl = searchParams.get('churchId')
  const churchNameFromUrl = searchParams.get('churchName')
  const initialRoleFromUrl = searchParams.get('initialRole') || 'membro' // Default to 'membro'

  useEffect(() => {
    if (churchIdFromUrl && churchNameFromUrl) {
      setIsRegisterMode(true)
      setChurchName(churchNameFromUrl)
    }
  }, [churchIdFromUrl, churchNameFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('LoginPage: Form submitted:', { email, isRegisterMode })
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    if (isRegisterMode) {
      if (!name || !churchName) {
        toast.error('Por favor, preencha seu nome completo e o nome da igreja')
        return
      }

      if (password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres')
        return
      }

      console.log('LoginPage: Attempting Supabase signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            church_name: churchName,
            initial_role: initialRoleFromUrl, // Usar papel do URL ou padrão
            church_id: churchIdFromUrl // Passar churchId se vier do URL
          }
        }
      })
      
      if (error) {
        console.error('LoginPage: Supabase signUp error:', error.message);
        toast.error(error.message)
      } else if (data.user) {
        console.log('LoginPage: Supabase signUp successful, user:', data.user.id);
        toast.success('Cadastro realizado com sucesso! Você já pode fazer login.')
        setIsRegisterMode(false)
        setName('')
        setEmail('')
        setPassword('')
        // Não limpar churchName se veio da URL para manter o contexto
        if (!churchIdFromUrl) {
          setChurchName('')
        }
      } else {
        console.error('LoginPage: Unknown error during signUp.');
        toast.error('Erro desconhecido no registro.')
      }

    } else {
      console.log('LoginPage: Attempting login via useAuthStore.login().');
      const success = await login(email, password);
      if (!success) {
        console.error('LoginPage: Login failed via useAuthStore.login().');
      } else {
        console.log('LoginPage: Login successful via useAuthStore.login().');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <Church className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sistema Connect Vida
            </CardTitle>
            <CardDescription className="text-base">
              {isRegisterMode ? 'Criar nova conta' : 'Entre em sua conta'}
            </CardDescription>
            <Badge className="bg-green-100 text-green-800 mx-auto">
              Sistema em Produção
            </Badge>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegisterMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="churchName">Nome da Igreja</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="churchName"
                        type="text"
                        placeholder="Nome da sua igreja"
                        value={churchName}
                        onChange={(e) => setChurchName(e.target.value)}
                        className="pl-10 h-12"
                        disabled={!!churchIdFromUrl} // Desabilitar se veio da URL
                        required
                      />
                    </div>
                  </div>
                </>
              )}

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
                    placeholder={isRegisterMode ? 'Mínimo 6 caracteres' : 'Sua senha'}
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
                    {isRegisterMode ? 'Cadastrando...' : 'Entrando...'}
                  </div>
                ) : (
                  isRegisterMode ? 'Criar Conta' : 'Entrar no Sistema'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode)
                  setName('')
                  setEmail('')
                  setPassword('')
                  // Não limpar churchName se veio da URL para manter o contexto
                  if (!churchIdFromUrl) {
                    setChurchName('')
                  }
                }}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 mx-auto"
              >
                {isRegisterMode ? (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    Já tenho conta - Fazer Login
                  </>
                ) : (
                  'Não tenho conta - Cadastrar-se'
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 mt-6 bg-white/80 p-4 rounded-lg">
          <p className="flex items-center justify-center gap-2 mb-2">
            <Church className="w-4 h-4" />
            Sistema Connect Vida - Produção
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