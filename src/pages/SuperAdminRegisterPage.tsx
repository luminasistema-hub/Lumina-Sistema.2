import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { Shield, Lock, Mail, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';

const SuperAdminRegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name || !email || !password) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      // Invoca a Edge Function usando APENAS o nome (o client já sabe o SUPABASE_URL)
      const { data, error } = await supabase.functions.invoke('create-super-admin-user', {
        body: { name, email, password },
      });

      if (error) {
        console.error('Erro da Edge Function:', error);
        toast.error((error as any)?.message || 'Erro ao cadastrar Super Admin.');
        setIsLoading(false);
        return;
      }

      toast.success((data as any)?.message || 'Super Admin cadastrado com sucesso! Você já pode fazer login.');
      navigate('/master-admin-login');
    } catch (err: any) {
      console.error('Erro inesperado ao chamar a Edge Function:', err);
      toast.error('Ocorreu um erro inesperado ao cadastrar Super Admin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-600 to-orange-700 rounded-full flex items-center justify-center mb-4">
              <img src="/favicon.ico" alt="Lumina Logo" className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-700 bg-clip-text text-transparent">
              Lumina - Registro Master
            </CardTitle>
            <CardDescription className="text-base">
              Crie sua conta de Super Administrador
            </CardDescription>
            <Badge className="bg-red-100 text-red-800 mx-auto">
              Acesso Restrito
            </Badge>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="Mínimo 6 caracteres"
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
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-red-600 to-orange-700 hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cadastrando...
                  </div>
                ) : (
                  'Criar Conta Super Admin'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/master-admin-login"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Já tenho conta - Fazer Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 mt-6 bg-white/80 p-4 rounded-lg">
          <p className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4" />
            Lumina - Acesso Administrativo
          </p>
          <p className="text-xs">
            Este portal é destinado apenas a Super Administradores do sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminRegisterPage;