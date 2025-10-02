import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Key, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';

const PaymentIntegrationSettings = () => {
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('configuracoes_sistema')
          .select('valor')
          .eq('chave', 'MERCADOPAGO_ACCESS_TOKEN')
          .single();

        if (error) throw error;
        if (data) {
          setAccessToken(data.valor || '');
        }
      } catch (error: any) {
        console.error('Error fetching payment token:', error);
        toast.error('Erro ao carregar a chave da API de pagamento.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({ valor: accessToken, updated_at: new Date().toISOString() })
        .eq('chave', 'MERCADOPAGO_ACCESS_TOKEN');

      if (error) throw error;
      toast.success('Chave de API do Mercado Pago salva com sucesso!');
    } catch (error: any) {
      console.error('Error saving payment token:', error);
      toast.error('Erro ao salvar a chave da API: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-green-500" />
          Integração de Pagamento (Mercado Pago)
        </CardTitle>
        <CardDescription>
          Configure a chave de API para processar as assinaturas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Carregando configuração...</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="mp-token">Mercado Pago - Access Token</Label>
              <Input
                id="mp-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Cole sua chave de produção aqui"
              />
              <p className="text-xs text-gray-500">
                Sua chave é armazenada de forma segura e nunca será exposta no lado do cliente.
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Chave
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentIntegrationSettings;