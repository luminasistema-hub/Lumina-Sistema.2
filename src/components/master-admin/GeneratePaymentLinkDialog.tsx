import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Church } from '../../stores/churchStore';
import { supabase } from '../../integrations/supabase/client';
import { Loader2, Copy, Check, Link as LinkIcon } from 'lucide-react';
import copy from 'copy-to-clipboard';

interface GeneratePaymentLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  church: Church | null;
  onLinkGenerated: (churchId: string, paymentLink: string) => void;
}

const GeneratePaymentLinkDialog: React.FC<GeneratePaymentLinkDialogProps> = ({ isOpen, onClose, church, onLinkGenerated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  React.useEffect(() => {
    if (church) {
      setPayerEmail(church.contactEmail || '');
      setPaymentLink(church.link_pagamento_assinatura || '');
    }
  }, [church]);

  const handleGenerateLink = async () => {
    if (!church || !payerEmail) {
      toast.error('O email do pagador é obrigatório.');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mercadopago-subscription', {
        body: { churchId: church.id, payerEmail },
      });

      if (error) throw error;

      setPaymentLink(data.paymentLink);
      onLinkGenerated(church.id, data.paymentLink);
      toast.success('Link de assinatura gerado com sucesso!');
    } catch (error: any) {
      console.error('Error generating payment link:', error);
      toast.error('Falha ao gerar o link de pagamento.', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    copy(paymentLink);
    setIsCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Link de Assinatura (Mercado Pago)</DialogTitle>
          <DialogDescription>
            Gere um link de pagamento recorrente para a igreja "{church?.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!paymentLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="payerEmail">Email do Responsável Financeiro</Label>
                <Input
                  id="payerEmail"
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <Button onClick={handleGenerateLink} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Link de Pagamento'
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Link de Pagamento Gerado</Label>
              <div className="flex items-center gap-2">
                <Input value={paymentLink} readOnly className="bg-gray-100" />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button asChild variant="secondary" className="w-full">
                <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Abrir Link de Pagamento
                </a>
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratePaymentLinkDialog;