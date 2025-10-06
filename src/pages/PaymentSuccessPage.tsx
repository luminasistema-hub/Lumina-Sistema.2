import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const churchId = searchParams.get('church_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!churchId) {
      setErrorMessage('ID da igreja não encontrado na URL. Não foi possível ativar a assinatura.');
      setStatus('error');
      return;
    }

    const activateSubscription = async () => {
      try {
        const { error } = await supabase.functions.invoke('activate-church-subscription', {
          body: { churchId },
        });

        if (error) {
          throw error;
        }

        toast.success('Pagamento confirmado e assinatura ativada!');
        setStatus('success');
      } catch (err: any) {
        console.error('Erro ao ativar assinatura:', err);
        setErrorMessage(err.message || 'Ocorreu uma falha ao tentar ativar sua assinatura. Por favor, entre em contato com o suporte.');
        setStatus('error');
        toast.error('Falha ao ativar assinatura.');
      }
    };

    activateSubscription();
  }, [churchId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Status do Pagamento</CardTitle>
          <CardDescription>Verificando seu pagamento e ativando sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-muted-foreground">Aguarde, estamos processando...</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h3 className="text-xl font-semibold">Pagamento Concluído!</h3>
              <p className="text-muted-foreground">Sua igreja foi ativada com sucesso. Agora você já pode acessar o sistema.</p>
              <Button asChild className="mt-4 w-full">
                <Link to="/login">Entrar na minha conta</Link>
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="w-16 h-16 text-red-500" />
              <h3 className="text-xl font-semibold">Ocorreu um Erro</h3>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/">Voltar para o Início</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;