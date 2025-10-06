import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, Cake, Gift } from 'lucide-react';

const getIcon = (type: string) => {
  if (type.includes('ANIVERSARIO_CASAMENTO')) return <Gift className="w-8 h-8 text-red-500" />;
  if (type.includes('ANIVERSARIO')) return <Cake className="w-8 h-8 text-pink-500" />;
  return <BellRing className="w-8 h-8 text-blue-500" />;
};

export const SpecialNotificationDialog = ({ isOpen, onClose, notification }) => {
  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            {getIcon(notification.tipo)}
            <DialogTitle className="text-xl">{notification.titulo}</DialogTitle>
          </div>
          <DialogDescription>{notification.descricao}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};