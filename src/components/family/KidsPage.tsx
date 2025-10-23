import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useKidsData, Kid, CheckinRecord } from '@/hooks/useKidsData'
import { 
  Baby, Plus, Users, Clock, Shield, Heart, AlertTriangle, CheckCircle, UserCheck, UserX, Search, Filter, Calendar, Phone, Mail, MapPin, Edit, Eye, QrCode, Loader2, Trash2, ScanLine, CreditCard
} from 'lucide-react'
import AddKidDialog from '../personal/AddKidDialog'
import KidDetailsDialog from '@/components/kids/KidDetailsDialog'
import KidCredentialDialog from '@/components/kids/KidCredentialDialog'
import CheckinScanner from '@/components/kids/CheckinScanner'
import { createInAppNotification, sendEmailNotification } from '@/services/notificationService'
import { createStandardEmailHtml } from '@/lib/emailTemplates'

interface MemberOption {
  id: string
  nome_completo: string
  email: string
}

const KidsPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useKidsData();
  const { kids = [], checkinRecords = [] } = data || {};

  const [isEditKidDialogOpen, setIsEditKidDialogOpen] = useState(false)
  const [kidToEdit, setKidToEdit] = useState<Kid | null>(null)
  const [selectedKidDetails, setSelectedKidDetails] = useState<Kid | null>(null)
  const [selectedKidCredential, setSelectedKidCredential] = useState<Kid | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAge, setFilterAge] = useState('all')
  const [viewMode, setViewMode] = useState<'kids' | 'checkin' | 'reports'>('kids')
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([])

  const canManageKids = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'
  const canDeleteKids = user?.role === 'admin' || user?.role === 'pastor'

  const [editKidForm, setEditKidForm] = useState({
    nome_crianca: '', data_nascimento: '', responsavel_id: '', informacoes_especiais: '', alergias: '',
    medicamentos: '', autorizacao_fotos: true, contato_emergencia_nome: '',
    contato_emergencia_telefone: '', contato_emergencia_parentesco: ''
  });

  const loadMemberOptions = useCallback(async () => {
    if (!currentChurchId) { setMemberOptions([]); return; }
    const { data, error } = await supabase.from('membros').select('id, nome_completo, email').eq('id_igreja', currentChurchId).eq('status', 'ativo').order('nome_completo');
    if (error) { toast.error('Erro ao carregar opções de membros: ' + error.message); }
    else { setMemberOptions(data as MemberOption[]); }
  }, [currentChurchId]);

  useEffect(() => {
    loadMemberOptions();
  }, [loadMemberOptions]);

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kidsData', currentChurchId, user?.id] });
    },
    onError: (err: any) => {
      toast.error('Ocorreu um erro: ' + err.message);
    }
  };

  const editKidMutation = useMutation({
    mutationFn: async (updatedKid: { id: string, data: any }) => {
      const { error } = await supabase.from('criancas').update(updatedKid.data).eq('id', updatedKid.id);
      if (error) throw error;
    },
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Informações da criança atualizadas!');
      setIsEditKidDialogOpen(false);
      mutationOptions.onSuccess();
    }
  });

  const deleteKidMutation = useMutation({
    mutationFn: async (kidId: string) => {
      const { error } = await supabase.from('criancas').delete().eq('id', kidId);
      if (error) throw error;
    },
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Criança excluída com sucesso!');
      mutationOptions.onSuccess();
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async (kid: Kid) => {
      const codigo = Math.random().toString(36).substr(2, 4).toUpperCase();
      await supabase.from('criancas').update({ status_checkin: 'Presente', ultimo_checkin: new Date().toISOString(), codigo_seguranca: codigo }).eq('id', kid.id);
      await supabase.from('kids_checkin').insert({ id_igreja: currentChurchId, crianca_id: kid.id, responsavel_checkin_id: user!.id, codigo_seguranca: codigo });
      return { kid, codigo };
    },
    ...mutationOptions,
    onSuccess: async (data) => {
      toast.success(`Check-in realizado! Código: ${data.codigo}`);
      
      // Notificação para o responsável
      if (data.kid.responsavel_id && currentChurchId) {
        const notificationTitle = `Check-in de ${data.kid.nome_crianca}`;
        const notificationDesc = `${data.kid.nome_crianca} foi recebido(a) no ministério infantil. Seu código de segurança é: ${data.codigo}.`;
        
        await createInAppNotification({
          id_igreja: currentChurchId,
          membro_id: data.kid.responsavel_id,
          titulo: notificationTitle,
          descricao: notificationDesc,
          link: '/dashboard?module=kids-management',
          tipo: 'KIDS_CHECKIN'
        });

        if (data.kid.email_responsavel) {
          const churchName = useAuthStore.getState().churchName || 'Sua Igreja';
          const emailHtml = createStandardEmailHtml({
            title: notificationTitle,
            description: notificationDesc,
            link: '/dashboard?module=kids-management',
            churchName,
            notificationType: 'Check-in Kids'
          });
          await sendEmailNotification({
            to: data.kid.email_responsavel,
            subject: `[${churchName}] Check-in realizado`,
            htmlContent: emailHtml
          });
        }
      }

      const { data: telRow } = await supabase.from('informacoes_pessoais').select('telefone').eq('membro_id', data.kid.responsavel_id).maybeSingle();
      if (telRow?.telefone && currentChurchId) {
        await supabase.from('whatsapp_messages').insert({ church_id: currentChurchId, recipient_phone: telRow.telefone, template_key: 'kids_checkin', payload: { crianca_nome: data.kid.nome_crianca, codigo: data.codigo } });
      }
      mutationOptions.onSuccess();
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (kid: Kid) => {
      await supabase.from('criancas').update({ status_checkin: 'Ausente', codigo_seguranca: null }).eq('id', kid.id);
      await supabase.from('kids_checkin').update({ data_checkout: new Date().toISOString(), responsavel_checkout_id: user!.id }).eq('crianca_id', kid.id).is('data_checkout', null);
      return kid;
    },
    ...mutationOptions,
    onSuccess: async (kid) => {
      toast.success('Check-out realizado com sucesso!');
      
      // Notificação para o responsável
      if (kid.responsavel_id && currentChurchId) {
        const notificationTitle = `Check-out de ${kid.nome_crianca}`;
        const notificationDesc = `${kid.nome_crianca} foi retirado(a) do ministério infantil.`;
        
        await createInAppNotification({
          id_igreja: currentChurchId,
          membro_id: kid.responsavel_id,
          titulo: notificationTitle,
          descricao: notificationDesc,
          link: '/dashboard?module=kids-management',
          tipo: 'KIDS_CHECKOUT'
        });

        if (kid.email_responsavel) {
          const churchName = useAuthStore.getState().churchName || 'Sua Igreja';
          const emailHtml = createStandardEmailHtml({
            title: notificationTitle,
            description: notificationDesc,
            link: '/dashboard?module=kids-management',
            churchName,
            notificationType: 'Check-out Kids'
          });
          await sendEmailNotification({
            to: kid.email_responsavel,
            subject: `[${churchName}] Check-out realizado`,
            htmlContent: emailHtml
          });
        }
      }

      const { data: telRow } = await supabase.from('informacoes_pessoais').select('telefone').eq('membro_id', kid.responsavel_id).maybeSingle();
      if (telRow?.telefone && currentChurchId) {
        await supabase.from('whatsapp_messages').insert({ church_id: currentChurchId, recipient_phone: telRow.telefone, template_key: 'kids_checkout', payload: { crianca_nome: kid.nome_crianca, hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } });
      }
      mutationOptions.onSuccess();
    }
  });

  const handleScan = async (kidId: string) => {
    if (isScanning) return;
    setIsScanning(true);

    const kid = kids.find(k => k.id === kidId);
    if (!kid) {
      toast.error('QR Code inválido ou criança não encontrada.');
      setIsScanning(false);
      return;
    }

    try {
      if (kid.status_checkin === 'Presente') {
        await checkoutMutation.mutateAsync(kid);
      } else {
        await checkinMutation.mutateAsync(kid);
      }
      // Fecha o scanner após sucesso
      setTimeout(() => {
        setIsScannerOpen(false);
      }, 1000);
    } catch (error) {
      // O toast de erro já é tratado na mutação
    } finally {
      // Adiciona um pequeno delay para o usuário ver a mensagem de sucesso
      setTimeout(() => {
        setIsScanning(false);
      }, 1000);
    }
  };

  const handleEditKid = () => {
    if (!kidToEdit) return;
    const responsibleMember = memberOptions.find(m => m.id === editKidForm.responsavel_id);
    const dataToUpdate = {
      nome_crianca: editKidForm.nome_crianca, data_nascimento: editKidForm.data_nascimento, responsavel_id: editKidForm.responsavel_id,
      informacoes_especiais: editKidForm.informacoes_especiais || null,
      alergias: editKidForm.alergias || null, medicamentos: editKidForm.medicamentos || null, autorizacao_fotos: editKidForm.autorizacao_fotos,
      contato_emergencia: editKidForm.contato_emergencia_nome ? { nome: editKidForm.contato_emergencia_nome, telefone: editKidForm.contato_emergencia_telefone, parentesco: editKidForm.contato_emergencia_parentesco } : null,
    };
    editKidMutation.mutate({ id: kidToEdit.id, data: dataToUpdate });
  };

  const handleDeleteKid = (kidId: string) => {
    if (confirm('Tem certeza que deseja excluir esta criança e todos os seus registros?')) {
      deleteKidMutation.mutate(kidId);
    }
  };

  const getAgeGroup = (idade: number) => {
    if (idade <= 3) return 'Berçário'; if (idade <= 6) return 'Infantil'; if (idade <= 10) return 'Juniores'; return 'Pré-adolescentes';
  };
  const getAgeGroupColor = (idade: number) => {
    if (idade <= 3) return 'bg-pink-100 text-pink-800'; if (idade <= 6) return 'bg-blue-100 text-blue-800'; if (idade <= 10) return 'bg-green-100 text-green-800'; return 'bg-purple-100 text-purple-800';
  };

  const filteredKids = useMemo(() => kids.filter(kid => {
    const matchesSearch = kid.nome_crianca.toLowerCase().includes(searchTerm.toLowerCase()) || kid.responsavel_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = filterAge === 'all' || (filterAge === 'bercario' && kid.idade <= 3) || (filterAge === 'infantil' && kid.idade > 3 && kid.idade <= 6) || (filterAge === 'juniores' && kid.idade > 6 && kid.idade <= 10) || (filterAge === 'pre-adolescentes' && kid.idade > 10);
    return matchesSearch && matchesAge;
  }), [kids, searchTerm, filterAge]);

  const presentKids = kids.filter(kid => kid.status_checkin === 'Presente');
  const totalKids = kids.length;
  const activeCheckins = checkinRecords.filter(r => !r.data_checkout).length;

  // NOVO: controle do diálogo de cadastro
  const [isAddKidDialogOpen, setIsAddKidDialogOpen] = useState(false)

  if (!currentChurchId) return <div className="p-6 text-center text-gray-600">Selecione uma igreja para gerenciar o ministério Kids.</div>;
  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /><p className="ml-4 text-lg">Carregando...</p></div>;
  if (error) return <div className="p-6 text-center text-red-500">Erro ao carregar dados: {error.message}</div>;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Kids 👶</h1>
        <p className="text-pink-100 text-base md:text-lg">Cuidando das crianças com amor e segurança</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><div className="text-xl md:text-2xl font-bold text-pink-600">{totalKids}</div><div className="text-sm text-gray-600">Total Kids</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><div className="text-xl md:text-2xl font-bold text-green-600">{presentKids.length}</div><div className="text-sm text-gray-600">Presentes</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><div className="text-xl md:text-2xl font-bold text-yellow-600">{kids.filter(k => k.alergias || k.medicamentos).length}</div><div className="text-sm text-gray-600">Com Restrições</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><div className="text-xl md:text-2xl font-bold text-blue-600">{activeCheckins}</div><div className="text-sm text-gray-600">Check-ins Ativos</div></CardContent></Card>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <TabsList className="grid w-full lg:w-auto grid-cols-3">
            <TabsTrigger value="kids">Crianças</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            {canManageKids && <TabsTrigger value="reports">Relatórios</TabsTrigger>}
          </TabsList>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Buscar criança..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <Select value={filterAge} onValueChange={setFilterAge}><SelectTrigger className="w-full sm:w-48"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Faixa etária" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="bercario">Berçário (0-3)</SelectItem><SelectItem value="infantil">Infantil (4-6)</SelectItem><SelectItem value="juniores">Juniores (7-10)</SelectItem><SelectItem value="pre-adolescentes">Pré-adolescentes (11+)</SelectItem></SelectContent></Select>
            {canManageKids && (
              <Button
                className="bg-pink-500 hover:bg-pink-600"
                onClick={() => setIsAddKidDialogOpen(true)}
                disabled={!user || !currentChurchId}
              >
                <Plus className="w-4 h-4 mr-2" />Adicionar
              </Button>
            )}
             {canManageKids && (
              <Button
                variant="outline"
                onClick={() => setIsScannerOpen(true)}
              >
                <ScanLine className="w-4 h-4 mr-2" />Ler QR Code
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="kids" className="space-y-4">
          <div className="grid gap-4">
            {filteredKids.map((kid) => (
              <Card key={kid.id} className="border-0 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3"><h3 className="text-lg font-semibold">{kid.nome_crianca}</h3><Badge className={getAgeGroupColor(kid.idade)}>{getAgeGroup(kid.idade)} • {kid.idade} anos</Badge>{kid.status_checkin === 'Presente' && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Presente</Badge>}{kid.codigo_seguranca && <Badge variant="outline"><QrCode className="w-3 h-3 mr-1" />{kid.codigo_seguranca}</Badge>}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span>{kid.responsavel_nome}</span></div>
                        <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{kid.email_responsavel}</span></div>
                        {kid.ultimo_checkin && <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{new Date(kid.ultimo_checkin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>}
                      </div>
                      {(kid.alergias || kid.medicamentos || kid.informacoes_especiais) && <div className="space-y-2">{kid.alergias && <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" /><div><span className="text-sm font-medium text-red-800">Alergias:</span><span className="text-sm text-red-700 ml-1">{kid.alergias}</span></div></div>}{kid.medicamentos && <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg"><Shield className="w-4 h-4 text-yellow-500 mt-0.5" /><div><span className="text-sm font-medium text-yellow-800">Medicamentos:</span><span className="text-sm text-yellow-700 ml-1">{kid.medicamentos}</span></div></div>}{kid.informacoes_especiais && <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg"><Heart className="w-4 h-4 text-blue-500 mt-0.5" /><div><span className="text-sm font-medium text-blue-800">Info:</span><span className="text-sm text-blue-700 ml-1">{kid.informacoes_especiais}</span></div></div>}</div>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {kid.status_checkin === 'Ausente' && canManageKids && <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => checkinMutation.mutate(kid)}><UserCheck className="w-4 h-4 mr-2" />Check-in</Button>}
                      {kid.status_checkin === 'Presente' && canManageKids && <Button size="sm" variant="outline" onClick={() => checkoutMutation.mutate(kid)}><UserX className="w-4 h-4 mr-2" />Check-out</Button>}
                      <Button variant="outline" size="sm" onClick={() => setSelectedKidDetails(kid)}><Eye className="w-4 h-4 mr-2" />Ver</Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedKidCredential(kid)}><CreditCard className="w-4 h-4 mr-2" />Credencial</Button>
                      {canManageKids && <Button variant="outline" size="sm" onClick={() => { setKidToEdit(kid); setEditKidForm({ ...kid, contato_emergencia_nome: kid.contato_emergencia?.nome || '', contato_emergencia_telefone: kid.contato_emergencia?.telefone || '', contato_emergencia_parentesco: kid.contato_emergencia?.parentesco || '' }); setIsEditKidDialogOpen(true); }}><Edit className="w-4 h-4 mr-2" />Editar</Button>}
                      {canDeleteKids && <Button variant="destructive" size="sm" onClick={() => handleDeleteKid(kid.id)}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredKids.length === 0 && <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium">Nenhuma criança encontrada</h3><p className="text-gray-600">Tente ajustar os filtros ou cadastre a primeira criança.</p></CardContent></Card>}
        </TabsContent>

        <TabsContent value="checkin" className="space-y-3">
          <h2 className="text-xl font-bold">Histórico de Check-ins</h2>
          {checkinRecords.length > 0 ? checkinRecords.map(record => {
            const kid = kids.find(k => k.id === record.crianca_id);
            return <Card key={record.id} className="border-0 shadow-sm"><CardContent className="p-4 flex items-center justify-between"><div className="flex-1"><p className="font-medium">{kid?.nome_crianca || 'Criança Desconhecida'}</p><p className="text-sm text-gray-600">Check-in por {record.responsavel_checkin_nome} em {new Date(record.data_checkin).toLocaleString('pt-BR')}</p>{record.data_checkout && <p className="text-sm text-gray-600">Check-out por {record.responsavel_checkout_nome} em {new Date(record.data_checkout).toLocaleString('pt-BR')}</p>}{record.codigo_seguranca && <Badge variant="outline" className="mt-1">Código: {record.codigo_seguranca}</Badge>}</div>{!record.data_checkout && <Badge className="bg-green-100 text-green-800">Ativo</Badge>}</CardContent></Card>
          }) : <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium">Nenhum registro de check-in</h3></CardContent></Card>}
        </TabsContent>

        {canManageKids && <TabsContent value="reports"><div className="text-center py-8"><Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h3 className="text-xl font-semibold">Relatórios em desenvolvimento</h3></div></TabsContent>}
      </Tabs>

      {selectedKidDetails && (
        <KidDetailsDialog
          open={!!selectedKidDetails}
          onClose={() => setSelectedKidDetails(null)}
          kid={selectedKidDetails}
        />
      )}
      {selectedKidCredential && (
        <KidCredentialDialog
          open={!!selectedKidCredential}
          onClose={() => setSelectedKidCredential(null)}
          kid={selectedKidCredential}
        />
      )}
      {kidToEdit && (
        <Dialog open={isEditKidDialogOpen} onOpenChange={setIsEditKidDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Criança</DialogTitle>
              <DialogDescription>Atualize as informações e salve para aplicar as mudanças.</DialogDescription>
            </DialogHeader>
            {/* O conteúdo de edição já é gerenciado pelos estados e botões na página. */}
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanner de Check-in/Check-out</DialogTitle>
            <DialogDescription>Aponte a câmera para o QR code da credencial da criança.</DialogDescription>
          </DialogHeader>
          <CheckinScanner onScan={handleScan} isProcessing={isScanning} />
        </DialogContent>
      </Dialog>

      {/* NOVO: diálogo de cadastro de criança */}
      {user && currentChurchId && (
        <AddKidDialog
          isOpen={isAddKidDialogOpen}
          onClose={() => setIsAddKidDialogOpen(false)}
          responsibleId={user.id}
          responsibleName={user.name}
          responsibleEmail={user.email}
          churchId={currentChurchId}
          onKidAdded={() => queryClient.invalidateQueries({ queryKey: ['kidsData', currentChurchId, user.id] })}
        />
      )}
    </div>
  );
}

export default KidsPage