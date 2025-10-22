import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MemberRow = {
  id: string;
  nome_completo: string | null;
  email: string | null;
  funcao: string;
  status: string;
  created_at: string;
};

type PersonalInfo = {
  telefone?: string | null;
  endereco?: string | null;
  data_nascimento?: string | null;
  estado_civil?: string | null;
  profissao?: string | null;
};

interface Props {
  churchId: string;
  member: MemberRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberDetailsDialog: React.FC<Props> = ({ churchId, member, open, onOpenChange }) => {
  const [personal, setPersonal] = useState<PersonalInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !member?.id) return;
    const loadPersonal = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('informacoes_pessoais')
          .select('telefone, endereco, data_nascimento, estado_civil, profissao')
          .eq('membro_id', member.id)
          .eq('id_igreja', churchId)
          .maybeSingle();
        if (error) throw error;
        setPersonal(data || null);
      } catch (e: any) {
        console.warn('MemberDetailsDialog: erro ao carregar info pessoal:', e?.message || e);
        setPersonal(null);
        toast.error('Não foi possível carregar as informações pessoais.');
      } finally {
        setLoading(false);
      }
    };
    loadPersonal();
  }, [open, member?.id, churchId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Membro</DialogTitle>
        </DialogHeader>
        {!member ? (
          <div className="text-sm text-muted-foreground">Selecione um membro para visualizar.</div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="text-lg font-semibold">{member.nome_completo || '—'}</div>
                <div className="text-sm text-muted-foreground">{member.email || '—'}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Função: {member.funcao}</Badge>
                  <Badge variant="outline">Status: {member.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Cadastrado em: {new Date(member.created_at).toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="font-medium">Informações Pessoais</div>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : personal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Telefone</div>
                      <div className="font-medium">{personal.telefone || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Profissão</div>
                      <div className="font-medium">{personal.profissao || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-muted-foreground">Endereço</div>
                      <div className="font-medium">{personal.endereco || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Nascimento</div>
                      <div className="font-medium">{personal.data_nascimento || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Estado Civil</div>
                      <div className="font-medium">{personal.estado_civil || '—'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Sem informações adicionais.</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsDialog;