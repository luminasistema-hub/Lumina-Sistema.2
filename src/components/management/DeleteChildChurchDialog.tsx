import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string | null;
  churchName?: string;
  onDeleted: () => void;
}

const DeleteChildChurchDialog: React.FC<Props> = ({ open, onOpenChange, churchId, churchName, onDeleted }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!churchId) return;
    if (confirmText !== 'DELETAR') {
      return toast.error('Digite DELETAR para confirmar.');
    }
    setLoading(true);

    const { data: sessionRes } = await supabase.auth.getSession();
    const token = sessionRes?.session?.access_token;

    const { data, error } = await supabase.functions.invoke('delete-church', {
      body: { churchId },
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    setLoading(false);

    if (error) {
      return toast.error('Falha ao excluir igreja: ' + error.message);
    }

    toast.success('Igreja e dados relacionados excluídos com sucesso.');
    setConfirmText('');
    onOpenChange(false);
    onDeleted();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Igreja Filha</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Esta ação é permanente e removerá TODOS os dados relacionados à igreja
            <span className="font-semibold"> {churchName}</span> (membros, ministérios, eventos, devocionais, crianças, notificações, etc.).
          </p>
          <p className="text-red-600 font-medium">
            Para confirmar, digite DELETAR no campo abaixo.
          </p>
          <input
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="DELETAR"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir definitivamente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteChildChurchDialog;