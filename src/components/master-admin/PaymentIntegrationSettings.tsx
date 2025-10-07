import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Copy, Link as LinkIcon } from 'lucide-react';
import copy from 'copy-to-clipboard';

const WEBHOOK_URL = 'https://qsynfgjwjxmswwcpajxz.supabase.co/functions/v1/abacatepay-webhook';

const PaymentIntegrationSettings = () => {
  const handleCopy = () => {
    copy(WEBHOOK_URL);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-green-500" />
          Integração de Pagamento (Abacate PAY)
        </CardTitle>
        <CardDescription>
          Configure o webhook da Abacate PAY para receber confirmações de pagamento e atualizar a assinatura automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>URL do Webhook</Label>
          <div className="flex items-center gap-2">
            <Input value={WEBHOOK_URL} readOnly className="bg-gray-100" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole esta URL no painel da Abacate PAY como destino de webhooks (eventos de pagamento/assinatura).
          </p>
        </div>

        <div className="space-y-2">
          <Label>Segredos da Abacate PAY</Label>
          <p className="text-sm text-muted-foreground">
            Defina os segredos nas Edge Functions:
          </p>
          <ul className="text-sm list-disc pl-6 space-y-1 text-muted-foreground">
            <li>ABACATEPAY_API_URL</li>
            <li>ABACATEPAY_API_KEY</li>
            <li>ABACATEPAY_WEBHOOK_SECRET (opcional para validar assinatura)</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Vá em Supabase → Edge Functions → Manage Secrets e adicione as chaves.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentIntegrationSettings;