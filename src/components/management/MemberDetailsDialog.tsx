import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, BookOpen, Shield } from 'lucide-react';

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

interface SchoolEnrollment {
  escolas: { nome: string } | null;
}

interface MinistryVolunteer {
  ministerios: { nome: string } | null;
}

interface Props {
  churchId: string;
  member: MemberRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberDetailsDialog: React.FC<Props> = ({ churchId, member, open, onOpenChange }) => {
  const [personal, setPersonal] = useState<PersonalInfo | null>(null);
  const [enrollments, setEnrollments] = useState<SchoolEnrollment[]>([]);
  const [ministries, setMinistries] = useState<MinistryVolunteer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !member?.id) return;
    const loadDetails = async () => {
      setLoading(true);
      try {
        const [personalData, enrollmentsData, ministriesData] = await Promise.all([
          supabase
            .from('informacoes_pessoais')
            .select('telefone, endereco, data_nascimento, estado_civil, profissao')
            .eq('membro_id', member.id)
            .eq('id_igreja', churchId)
            .maybeSingle(),
          supabase
            .from('escola_inscricoes')
            .select('escolas(nome)')
            .eq('membro_id', member.id),
          supabase
            .from('ministerio_voluntarios')
            .select('ministerios(nome)')
            .eq('membro_id', member.id)
        ]);

        if (personalData.error) throw personalData.error;
        setPersonal(personalData.data || null);

        if (enrollmentsData.error) throw enrollmentsData.error;
        setEnrollments(enrollmentsData.data || []);

        if (ministriesData.error) throw ministriesData.error;
        setMinistries(ministriesData.data || []);

      } catch (e: any) {
        console.warn('MemberDetailsDialog: erro ao carregar detalhes:', e?.message || e);
        setPersonal(null);
        setEnrollments([]);
        setMinistries([]);
        toast.error('Não foi possível carregar todos os detalhes do membro.');
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
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

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="ml-3 text-gray-600">Carregando detalhes...</span>
              </div>
            ) : (
              <>
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="font-medium">Informações Pessoais</div>
                    {personal ? (
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
                          <div className="font-medium">{personal.data_nascimento ? new Date(personal.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Estado Civil</div>
                          <div className="font-medium">{personal.estado_civil || '—'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Sem informações pessoais.</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="font-medium flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> Matrículas em Escolas</div>
                    {enrollments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {enrollments.map((e, i) => e.escolas?.nome && <Badge key={i} variant="outline">{e.escolas.nome}</Badge>)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Nenhuma matrícula ativa.</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Ministérios</div>
                    {ministries.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {ministries.map((m, i) => m.ministerios?.nome && <Badge key={i} variant="outline">{m.ministerios.nome}</Badge>)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Não participa de ministérios.</div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsDialog;