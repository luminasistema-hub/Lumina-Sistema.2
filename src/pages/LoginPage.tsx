import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import { Church, Lock, Mail, Eye, EyeOff, User, ArrowLeft, Building } from 'lucide-react'
import { supabase } from '../integrations/supabase/client' // Importar o cliente Supabase

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [churchName, setChurchName] = useState('') // Novo estado para o nome da igreja
  const [showPassword, setShowPassword] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const { login, register, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', { email, isRegisterMode })
    
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

      // Usar o Supabase para registro
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            church_name: churchName, // Passar o nome da igreja como metadados
            initial_role: 'membro' // Role inicial para novos registros
          }
        }
      })
      
      if (error) {
        toast.error(error.message)
      } else if (data.user) {
        toast.success('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.')
        setIsRegisterMode(false)
        setName('')
        setEmail('')
        setPassword('')
        setChurchName('')
      } else {
        toast.error('Erro desconhecido no registro.')
      }

    } else {
      // Usar o Supabase para login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        // Se o login for bem-sucedido via Supabase, o useAuthStore.checkAuth() cuidará do resto
        toast.success('Login realizado com sucesso!')
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

              {isRegisterMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Após o cadastro, sua conta e a igreja ficarão pendentes de aprovação pelo administrador. 
                    Você receberá uma confirmação quando sua conta for ativada.
                  </p>
                </div>
              )}
              
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
                  setChurchName('')
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
            Todos os novos usuários iniciam como "Membro" e precisam de aprovação do administrador
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage