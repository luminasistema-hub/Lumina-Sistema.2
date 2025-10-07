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
        {/* Abacate PAY */}
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
          <ul className="text-sm list-disc pl-6 space-y-1 text-muted-foreground">
            <li>ABACATEPAY_API_URL (opcional, padrão https://api.abacatepay.com/v1)</li>
            <li>ABACATEPAY_API_KEY</li>
            <li>ABACATEPAY_WEBHOOK_SECRET (opcional para validar assinatura)</li>
          </ul>
        </div>

        {/* ASAAS */}
        <div className="space-y-2 pt-4 border-t">
          <CardTitle className="text-base">Integração ASAAS (API Oficial)</CardTitle>
          <CardDescription>
            Para habilitar PIX via ASAAS, configure os segredos e, se desejar, use o ambiente de sandbox.
          </CardDescription>
          <ul className="text-sm list-disc pl-6 space-y-1 text-muted-foreground">
            <li>ASAAS_API_URL: 
              <span className="ml-1">https://api.asaas.com/v3 (produção) ou https://sandbox.asaas.com/api/v3 (sandbox)</span>
            </li>
            <li>ASAAS_API_TOKEN: sua token de acesso ASAAS</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Defina estes segredos em Supabase → Edge Functions → Manage Secrets. 
            O QRCode Pix será gerado via função create-asaas-pixqrcode.
          </p>
          <p className="text-xs text-muted-foreground">
            Observação: a ASAAS exige cliente vinculado ao pagamento. Informe nome, email, CPF/CNPJ e celular no diálogo ao gerar o PIX.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentIntegrationSettings;