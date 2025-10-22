import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Copy, Link as LinkIcon } from 'lucide-react';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';

const ASAAS_WEBHOOK_URL = 'https://qsynfgjwjxmswwcpajxz.supabase.co/functions/v1/asaas-webhook-handler';

const PaymentIntegrationSettings = () => {
  const handleCopy = (url: string) => {
    copy(url);
    toast.success('URL do Webhook copiada!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-green-500" />
          Integração de Pagamento (ASAAS)
        </CardTitle>
        <CardDescription>
          Configure o webhook da ASAAS para receber confirmações de pagamento e atualizar a assinatura automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ASAAS */}
        <div className="space-y-2">
          <Label className="font-semibold text-base">ASAAS (API Oficial)</Label>
          <div className="flex items-center gap-2">
            <Input value={ASAAS_WEBHOOK_URL} readOnly className="bg-gray-100" />
            <Button variant="outline" size="icon" onClick={() => handleCopy(ASAAS_WEBHOOK_URL)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole esta URL no painel da ASAAS em Integrações → Webhooks. Evento recomendado: "Cobrança Recebida".
          </p>
          <CardDescription className="pt-2">
            Para habilitar a integração, configure os segredos e, se desejar, use o ambiente de sandbox.
          </CardDescription>
          <ul className="text-sm list-disc pl-6 space-y-1 text-muted-foreground">
            <li>ASAAS_API_URL: 
              <span className="ml-1">https://api.asaas.com/v3 (produção) ou https://sandbox.asaas.com/api/v3 (sandbox)</span>
            </li>
            <li>ASAAS_API_TOKEN: sua token de acesso ASAAS</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Defina estes segredos em Supabase → Edge Functions → Manage Secrets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentIntegrationSettings;