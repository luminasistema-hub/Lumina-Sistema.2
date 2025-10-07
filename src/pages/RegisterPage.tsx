import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { churchId: routeChurchId } = useParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [church, setChurch] = useState<{ id: string; nome: string } | null>(null);

  // Buscar igreja pela rota; bloquear sem churchId
  useEffect(() => {
    const loadChurch = async () => {
      if (!routeChurchId) {
        toast.error('Este link de cadastro é inválido. Solicite ao administrador o link correto da sua igreja.');
        return;
      }

      // Primeiro: usar invoke com o NOME da função (forma suportada pelo cliente)
      const { data, error } = await supabase.functions.invoke('get-church-public', {
        body: { churchId: routeChurchId }
      });

      // Fallback com fetch manual caso o invoke falhe por algum motivo de CORS/infra
      let churchPayload = data as any;
      if (error || !churchPayload?.id) {
        try {
          const resp = await fetch('https://qsynfgjwjxmswwcpajxz.supabase.co/functions/v1/get-church-public', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Passa credenciais públicas para Supabase Functions
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
            },
            body: JSON.stringify({ churchId: routeChurchId })
          });
          if (resp.ok) {
            churchPayload = await resp.json();
          }
        } catch {}
      }

      if (churchPayload?.id && churchPayload?.nome) {
        setChurch({ id: churchPayload.id as string, nome: churchPayload.nome as string });
      } else {
        toast.error('Igreja não encontrada. Verifique o link com o administrador.');
      }
    };
    loadChurch();
  }, [routeChurchId]);

  const handleSubmit = async () => {
    if (!church) {
      toast.error('Não foi possível identificar a igreja deste cadastro.');
      return;
    }
    if (!name || !email || !password) {
      toast.error('Preencha nome, email e senha.');
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (password.length < 8 || !hasLetter || !hasNumber) {
      toast.error('A senha deve ter pelo menos 8 caracteres, com letras e números.');
      return;
    }
    setLoading(true);
    // Realiza o signup já com associação à igreja
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          church_name: church.nome,
          initial_role: 'membro',
          church_id: church.id,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Cadastro iniciado! Verifique seu e-mail para confirmar.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <img src="/favicon.ico" alt="Lumina Logo" className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lumina
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastro de Membro {church ? `— ${church.nome}` : ''}
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {!church && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                Este cadastro requer um link único da igreja. Solicite ao administrador.
              </div>
            )}

            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crie uma senha (min. 8 caracteres)"
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity"
                disabled={loading || !church || !email || !password}
              >
                {loading ? 'Enviando...' : 'Cadastrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;