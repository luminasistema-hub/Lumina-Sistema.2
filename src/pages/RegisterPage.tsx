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
    <div className="p-6 max-w-md mx-auto">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>
            Cadastro de Membro {church ? `— ${church.nome}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!church && (
            <div className="text-sm text-red-600">
              Este cadastro requer um link único da igreja. Solicite ao administrador.
            </div>
          )}
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha (min. 8 caracteres)"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading || !church || !email || !password}>
              {loading ? 'Enviando...' : 'Cadastrar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;