import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link as LinkIcon, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Notification } from "@/hooks/useNotifications";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
  onMarkRead?: (id: string) => void;
};

const NotificationDialog: React.FC<Props> = ({ open, onOpenChange, notification, onMarkRead }) => {
  const navigate = useNavigate();

  if (!notification) return null;

  const createdText = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR });

  const isExternalLink = !!notification.link && /^https?:\/\//i.test(notification.link);
  const hasLink = !!notification.link;

  const handleOpenLink = () => {
    if (!notification.link) return;
    if (isExternalLink) {
      const win = window.open(notification.link, "_blank", "noopener,noreferrer");
      if (win) win.opener = null;
    } else {
      navigate(notification.link);
    }
    onOpenChange(false);
  };

  const canMarkRead = !!notification.membro_id && !notification.lida;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{notification.titulo}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">Recebida {createdText}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[40vh] pr-2">
          <p className="text-sm leading-relaxed">{notification.descricao || "Sem descrição."}</p>
        </ScrollArea>
        <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
          {hasLink && (
            <Button variant="secondary" onClick={handleOpenLink} aria-label="Abrir link da notificação">
              <LinkIcon className="mr-2 h-4 w-4" />
              Abrir link
            </Button>
          )}
          {canMarkRead && onMarkRead && (
            <Button onClick={() => onMarkRead(notification.id)} aria-label="Marcar notificação como lida">
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar como lida
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDialog;