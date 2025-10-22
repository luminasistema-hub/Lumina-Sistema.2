import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
}

/**
 * Envia um e-mail transacional usando a Edge Function 'send-email'.
 * @param payload - O objeto contendo o destinatário, assunto e conteúdo HTML do e-mail.
 * @returns true se o e-mail foi enviado com sucesso, false caso contrário.
 */
export const sendEmailNotification = async (payload: EmailPayload): Promise<boolean> => {
  const { to, subject, htmlContent } = payload;

  if (!to || !subject || !htmlContent) {
    console.error('Dados insuficientes para enviar o e-mail.');
    toast.error('Falha ao preparar notificação por e-mail.');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, htmlContent },
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('E-mail enviado com sucesso:', data);
    return true;
  } catch (err: any) {
    console.error('Erro ao invocar a Edge Function de e-mail:', err);
    toast.error(`Falha ao enviar e-mail para ${to}.`);
    return false;
  }
};

/**
 * Cria um registro de notificação no banco de dados.
 * @param notificationData - Dados da notificação a ser salva.
 */
export const createInAppNotification = async (notificationData: {
  id_igreja: string;
  membro_id: string;
  titulo: string;
  descricao: string;
  link?: string;
  tipo?: string;
}) => {
  try {
    const { error } = await supabase.from('notificacoes').insert(notificationData);
    if (error) throw error;
  } catch (err) {
    console.error('Erro ao criar notificação no app:', err);
    // Não notificar o usuário sobre isso para não poluir a interface
  }
};