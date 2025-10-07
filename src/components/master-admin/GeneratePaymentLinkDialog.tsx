import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, QrCode, Link as LinkIcon } from 'lucide-react';
import copy from 'copy-to-clipboard';
import { supabase } from '@/integrations/supabase/client';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  church: { id: string; nome?: string } | null;
  onLinkGenerated: (churchId: string, url: string) => void;
};

const GeneratePaymentLinkDialog: React.FC<Props> = ({ open, onOpenChange, church, onLinkGenerated }) => {
  const [payerEmail, setPayerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Checkout link (já existente)
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  // Pix QRCode
  const [pixAmount, setPixAmount] = useState<string>(''); // em reais
  const [pixDescription, setPixDescription] = useState<string>('');
  const [pixImageBase64, setPixImageBase64] = useState<string | null>(null);
  const [pixBrCode, setPixBrCode] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    if (!church || !payerEmail) {
      toast.error('Informe o email do pagador.');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-abacatepay-checkout', {
        body: { churchId: church.id, payerEmail },
      });

      if (error) throw error;

      setPaymentLink((data as any).checkoutUrl);
      onLinkGenerated(church.id, (data as any).checkoutUrl);
      toast.success('Link de checkout gerado!');
    } catch (error: any) {
      console.error('Error generating payment link:', error);
      toast.error('Falha ao gerar o link de checkout.', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePix = async () => {
    if (!pixAmount) {
      toast.error('Informe o valor do PIX.');
      return;
    }

    const amountNumber = Number(pixAmount.replace(',', '.'));
    if (!isFinite(amountNumber) || amountNumber <= 0) {
      toast.error('Valor inválido.');
      return;
    }

    setIsLoading(true);
    try {
      const metadata = { externalId: church?.id ?? 'sem-igreja' };
      const { data, error } = await supabase.functions.invoke('create-abacatepay-pixqrcode', {
        body: {
          amount: amountNumber,
          description: pixDescription || `Assinatura Connect Vida - ${church?.nome || 'Igreja'}`,
          expiresIn: 3600, // 1 hora
          metadata,
        },
      });

      if (error) throw error;

      const res = data as any;
      const qrData = res?.data;
      if (!qrData) {
        throw new Error('Resposta inesperada do provedor de pagamentos.');
      }

      setPixImageBase64(qrData.brCodeBase64 || null);
      setPixBrCode(qrData.brCode || null);
      toast.success('QRCode Pix gerado!');
    } catch (err: any) {
      console.error('Erro ao gerar QRCode Pix:', err);
      toast.error('Falha ao gerar QRCode Pix.', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBrCode = () => {
    if (pixBrCode) {
      copy(pixBrCode);
      toast.success('Código PIX copiado!');
    }
  };

  const copyLink = () => {
    if (paymentLink) {
      copy(paymentLink);
      toast.success('Link copiado!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Pagamentos (Abacate PAY)</DialogTitle>
          <DialogDescription>
            Gere um Link de Checkout ou um QRCode Pix para receber a assinatura.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="payerEmail">Email do Pagador (Checkout)</Label>
            <div className="flex gap-2">
              <Input
                id="payerEmail"
                placeholder="cliente@exemplo.com"
                value={payerEmail}
                onChange={(e) => setPayerEmail(e.target.value)}
              />
              <Button onClick={handleGenerateLink} disabled={isLoading}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Gerar Link
              </Button>
            </div>
            {paymentLink && (
              <div className="mt-2 space-y-2">
                <Input readOnly value={paymentLink} />
                <Button variant="outline" size="sm" onClick={copyLink}>
                  Copiar Link
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>QRCode Pix</Label>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pixAmount">Valor (R$)</Label>
                <Input
                  id="pixAmount"
                  placeholder="Ex.: 99,90"
                  value={pixAmount}
                  onChange={(e) => setPixAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pixDescription">Descrição (opcional)</Label>
                <Textarea
                  id="pixDescription"
                  placeholder="Mensagem que aparecerá no pagamento (até 140 caracteres)"
                  value={pixDescription}
                  onChange={(e) => setPixDescription(e.target.value)}
                  maxLength={140}
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleGeneratePix} disabled={isLoading} className="w-full">
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar QRCode Pix
                </Button>
              </div>
            </div>

            {(pixImageBase64 || pixBrCode) && (
              <div className="mt-4 grid gap-3">
                {pixImageBase64 && (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={pixImageBase64}
                      alt="QRCode Pix"
                      className="w-56 h-56 object-contain border rounded-md"
                    />
                    <span className="text-xs text-muted-foreground">Escaneie com o app do seu banco</span>
                  </div>
                )}
                {pixBrCode && (
                  <div className="space-y-2">
                    <Label>Código copia-e-cola</Label>
                    <Textarea readOnly value={pixBrCode} className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={copyBrCode}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar código
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratePaymentLinkDialog;