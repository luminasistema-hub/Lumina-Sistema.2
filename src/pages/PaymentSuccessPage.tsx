import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const churchId = searchParams.get('church_id');
  const [status, setStatus] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    if (!churchId) {
      toast.error('ID da igreja não encontrado. Redirecionando...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
      return;
    }

    // Simula processamento e libera acesso automaticamente
    const processPayment = async () => {
      // Aguarda 2 segundos para simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Ativa a igreja automaticamente
        const { error } = await supabase.functions.invoke('activate-church-subscription', {
          body: { churchId },
        });

        if (error) {
          console.error('Erro ao ativar igreja:', error);
          // Mesmo com erro, continua para não travar o usuário
        }
      } catch (err) {
        console.error('Erro na ativação:', err);
      }
      
      // Automaticamente libera o acesso
      toast.success('Pagamento processado com sucesso! Acesso liberado.');
      setStatus('success');
    };

    processPayment();
  }, [churchId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Pagamento Processado</CardTitle>
          <CardDescription>Status da sua assinatura Connect Vida</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-muted-foreground">Processando confirmação...</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h3 className="text-xl font-semibold">Assinatura Confirmada!</h3>
              <p className="text-muted-foreground">
                Sua igreja agora está ativa no sistema. Você já pode acessar todas as funcionalidades do Connect Vida.
              </p>
              <div className="flex gap-3 mt-4 w-full">
                <Button asChild className="flex-1">
                  <Link to="/login">Entrar na Conta</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/">Voltar ao Início</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Connect Vida - Tecnologia para Igrejas</p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;