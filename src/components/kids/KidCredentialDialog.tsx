import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QRCodeCanvas } from 'qrcode.react';
import { Baby, User, Printer, Mail } from 'lucide-react';
import type { Kid } from '@/hooks/useKidsData';
import { toast } from '@/components/ui/sonner';
import { sendEmailNotification } from '@/services/notificationService';
import { toPng } from 'html-to-image';

interface KidCredentialDialogProps {
  open: boolean;
  onClose: () => void;
  kid: Kid;
}

const KidCredentialDialog: React.FC<KidCredentialDialogProps> = ({ open, onClose, kid }) => {
  const credentialRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSendEmail = async () => {
    if (!kid.email_responsavel) {
      toast.error("O responsável não possui um e-mail cadastrado.");
      return;
    }

    if (!credentialRef.current) {
      toast.error("Não foi possível gerar a imagem da credencial.");
      return;
    }

    setIsSending(true);
    
    try {
      const dataUrl = await toPng(credentialRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const imageBase64 = dataUrl.split(',')[1];

      const emailHtmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h1 style="color: #333; font-size: 24px;">Credencial de Acesso - Ministério Infantil</h1>
          <p style="font-size: 16px; color: #555;">Olá ${kid.responsavel_nome || 'Responsável'},</p>
          <p style="font-size: 16px; color: #555;">A credencial de acesso para <strong>${kid.nome_crianca}</strong> está em anexo neste e-mail. Apresente o QR Code na imagem para realizar o check-in e o check-out de forma rápida e segura.</p>
          <p style="font-size: 16px; color: #555;">Guarde este e-mail em um local de fácil acesso para os dias de culto.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.9em; color: #777; text-align: center;">Este é um e-mail automático. Por favor, não responda.</p>
        </div>
      `;

      const promise = sendEmailNotification({
        to: kid.email_responsavel,
        subject: `Credencial de Acesso Kids - ${kid.nome_crianca}`,
        htmlContent: emailHtmlContent,
        attachments: [
          {
            filename: `credencial-${kid.nome_crianca.toLowerCase().replace(/ /g, '-')}.png`,
            content: imageBase64,
          },
        ],
      });

      toast.promise(promise, {
        loading: 'Gerando e enviando credencial por e-mail...',
        success: (success) => {
          setIsSending(false);
          if (success) {
            return 'Credencial enviada com sucesso!';
          } else {
            throw new Error('Falha ao enviar a credencial.');
          }
        },
        error: () => {
          setIsSending(false);
          return 'Falha ao enviar a credencial.';
        },
      });
    } catch (error) {
      console.error("Erro ao gerar imagem da credencial:", error);
      toast.error("Ocorreu um erro ao gerar a imagem da credencial.");
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <div className="printable-area">
          <DialogHeader>
            <DialogTitle>Credencial de Acesso</DialogTitle>
            <DialogDescription>Apresente este QR code para check-in e check-out.</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <Card ref={credentialRef} className="w-64 text-center p-4 border-2 border-dashed bg-white">
              <CardContent className="flex flex-col items-center gap-4">
                <div className="mt-4">
                  <QRCodeCanvas value={kid.id} size={160} />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold flex items-center justify-center gap-2">
                    <Baby className="w-5 h-5 text-pink-500" />
                    {kid.nome_crianca}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                    <User className="w-3 h-3" />
                    {kid.responsavel_nome}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter className="no-print sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button onClick={handleSendEmail} disabled={isSending || !kid.email_responsavel}>
              <Mail className="w-4 h-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar por E-mail'}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KidCredentialDialog;