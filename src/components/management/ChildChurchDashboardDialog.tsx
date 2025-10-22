import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Crown, Baby, Church, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import MemberDetailsDialog from './MemberDetailsDialog';

type MemberRow = {
  id: string;
  nome_completo: string | null;
  email: string | null;
  funcao: string;
  status: string;
  created_at: string;
};

interface Props {
  churchId: string;
  churchName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChildChurchDashboardDialog: React.FC<Props> = ({ churchId, churchName, open, onOpenChange }) => {
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ members: 0, leaders: 0, kids: 0, ministries: 0 });
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  useEffect(() => {
    if (!open || !churchId) return;
    const load = async () => {
      setLoading(true);
      try {
        // Contagem de membros
        const { count: membersCount, error: mErr } = await supabase
          .from('membros')
          .select('id', { count: 'exact', head: true })
          .eq('id_igreja', churchId);
        if (mErr) throw mErr;

        // Contagem de líderes
        const { count: leadersCount, error: lErr } = await supabase
          .from('membros')
          .select('id', { count: 'exact', head: true })
          .eq('id_igreja', churchId)
          .in('funcao', ['admin', 'pastor', 'lider_ministerio']);
        if (lErr) throw lErr;

        // Contagem de crianças
        const { count: kidsCount, error: kErr } = await supabase
          .from('criancas')
          .select('id', { count: 'exact', head: true })
          .eq('id_igreja', churchId);
        if (kErr) throw kErr;

        // Contagem de ministérios
        const { count: ministriesCount, error: minErr } = await supabase
          .from('ministerios')
          .select('id', { count: 'exact', head: true })
          .eq('id_igreja', churchId);
        if (minErr) throw minErr;

        setCounts({
          members: membersCount || 0,
          leaders: leadersCount || 0,
          kids: kidsCount || 0,
          ministries: ministriesCount || 0,
        });

        // Lista de membros
        const { data: membersRows, error: listErr } = await supabase
          .from('membros')
          .select('id, nome_completo, email, funcao, status, created_at')
          .eq('id_igreja', churchId)
          .order('nome_completo', { ascending: true });
        if (listErr) throw listErr;
        setMembers((membersRows || []) as MemberRow[]);
      } catch (e: any) {
        console.error('ChildChurchDashboardDialog load error:', e?.message || e);
        toast.error('Falha ao carregar dados da igreja filha.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, churchId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Church className="w-5 h-5 text-indigo-600" />
            Painel da Igreja Filha — {churchName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2 text-gray-600">Carregando dados...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" /> Membros
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{counts.members}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Crown className="w-4 h-4" /> Líderes
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{counts.leaders}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Baby className="w-4 h-4" /> Crianças
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{counts.kids}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Church className="w-4 h-4" /> Ministérios
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{counts.ministries}</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de membros */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Membros desta igreja</h3>
                  <Badge variant="outline">Total: {counts.members}</Badge>
                </div>
                <div className="relative w-full overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                            Nenhum membro encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        members.map((m) => (
                          <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>{m.nome_completo || '—'}</TableCell>
                            <TableCell>{m.email || '—'}</TableCell>
                            <TableCell>{m.funcao}</TableCell>
                            <TableCell>{m.status}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedMember(m);
                                  setDetailsOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" /> Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de detalhes do membro */}
        <MemberDetailsDialog
          churchId={churchId}
          member={selectedMember}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChildChurchDashboardDialog;