import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, BookOpen, Shield, Users, Target, CheckCircle, Baby } from 'lucide-react';
import { Progress } from '../ui/progress';
import { format, differenceInYears } from 'date-fns';

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
  conjuge_id?: string | null;
  conjuge_nome?: string | null;
};

interface SchoolEnrollment {
  escolas: { nome: string } | null;
}

interface MinistryVolunteer {
  ministerios: { nome: string } | null;
}

interface Kid {
  id: string;
  nome_crianca: string;
  data_nascimento: string;
}

interface JourneyProgress {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  completedStages: number;
}

interface VocationalTest {
  ministerio_recomendado: string;
  data_teste: string;
}

interface Props {
  churchId: string;
  member: MemberRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberDetailsDialog: React.FC<Props> = ({ churchId, member, open, onOpenChange }) => {
  const [details, setDetails] = useState<{
    personal: PersonalInfo | null;
    enrollments: SchoolEnrollment[];
    ministries: MinistryVolunteer[];
    kids: Kid[];
    journey: JourneyProgress | null;
    vocationalTest: VocationalTest | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !member?.id) {
      setDetails(null);
      return;
    }
    
    const loadDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-member-details', {
          body: { member_id: member.id, church_id: churchId }
        });

        if (error) throw error;
        setDetails(data);

      } catch (e: any) {
        console.error('MemberDetailsDialog: erro ao carregar detalhes:', e?.message || e);
        toast.error('Não foi possível carregar os detalhes do membro.');
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [open, member?.id, churchId]);

  const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{value || '—'}</div>
    </div>
  );

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    return differenceInYears(new Date(), new Date(dob));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{member?.nome_completo || '—'}</DialogTitle>
          <DialogDescription>
            Membro desde {member?.created_at ? format(new Date(member.created_at), 'dd/MM/yyyy') : '—'}
          </DialogDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary">Função: {member?.funcao}</Badge>
            <Badge variant={member?.status === 'ativo' ? 'default' : 'outline'}>
              Status: {member?.status}
            </Badge>
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="ml-4 text-gray-600">Carregando detalhes...</span>
          </div>
        ) : !details ? (
          <div className="text-sm text-muted-foreground p-8 text-center">Não foi possível carregar os detalhes.</div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Informações Pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Email" value={member?.email} />
              <InfoItem label="Telefone" value={details.personal?.telefone} />
              <InfoItem label="Data de Nascimento" value={details.personal?.data_nascimento ? `${format(new Date(details.personal.data_nascimento), 'dd/MM/yyyy')} (${calculateAge(details.personal.data_nascimento)} anos)` : '—'} />
              <InfoItem label="Estado Civil" value={details.personal?.estado_civil} />
              <InfoItem label="Profissão" value={details.personal?.profissao} />
              {details.personal?.estado_civil === 'casado' && <InfoItem label="Cônjuge" value={details.personal?.conjuge_nome} />}
              <div className="md:col-span-2">
                <InfoItem label="Endereço" value={details.personal?.endereco} />
              </div>
            </div>

            {/* Jornada */}
            {details.journey && (
              <Card>
                <CardContent className="pt-6">
                  <div className="font-medium flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-green-500" /> Jornada</div>
                  <Progress value={details.journey.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {details.journey.completedSteps} de {details.journey.totalSteps} passos concluídos • {details.journey.percentage.toFixed(0)}% • {details.journey.completedStages} etapa(s) concluída(s)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Teste Vocacional */}
            {details.vocationalTest && (
              <Card>
                <CardContent className="pt-6">
                  <div className="font-medium flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-purple-500" /> Teste Vocacional</div>
                  <p>Ministério recomendado: <span className="font-bold">{details.vocationalTest.ministerio_recomendado}</span></p>
                  <p className="text-xs text-muted-foreground">Teste de {format(new Date(details.vocationalTest.data_teste), 'dd/MM/yyyy')}</p>
                </CardContent>
              </Card>
            )}

            {/* Filhos */}
            <Card>
              <CardContent className="pt-6">
                <div className="font-medium flex items-center gap-2 mb-2"><Baby className="w-5 h-5 text-pink-500" /> Filhos</div>
                {details.kids.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {details.kids.map(kid => (
                      <li key={kid.id}>{kid.nome_crianca} — {calculateAge(kid.data_nascimento)} anos</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum filho cadastrado.</p>
                )}
              </CardContent>
            </Card>

            {/* Matrículas e Ministérios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="font-medium flex items-center gap-2 mb-3"><BookOpen className="w-5 h-5 text-blue-500" /> Matrículas em Escolas</div>
                  {details.enrollments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {details.enrollments.map((e, i) => e.escolas?.nome && <Badge key={i} variant="outline">{e.escolas.nome}</Badge>)}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma matrícula ativa.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="font-medium flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-green-500" /> Ministérios</div>
                  {details.ministries.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {details.ministries.map((m, i) => m.ministerios?.nome && <Badge key={i} variant="outline">{m.ministerios.nome}</Badge>)}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Não participa de ministérios.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsDialog;