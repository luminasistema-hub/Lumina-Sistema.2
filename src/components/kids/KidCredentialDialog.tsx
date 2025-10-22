import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { default as QRCode } from 'qrcode.react';
import { Baby, User, Printer } from 'lucide-react';
import type { Kid } from '@/hooks/useKidsData';

interface KidCredentialDialogProps {
  open: boolean;
  onClose: () => void;
  kid: Kid;
}

const KidCredentialDialog: React.FC<KidCredentialDialogProps> = ({ open, onClose, kid }) => {
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
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
            <Card className="w-64 text-center p-4 border-2 border-dashed">
              <CardContent className="flex flex-col items-center gap-4">
                <div className="mt-4">
                  <QRCode value={kid.id} size={160} />
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
        <DialogFooter className="no-print">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KidCredentialDialog;