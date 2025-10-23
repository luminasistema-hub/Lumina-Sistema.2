import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSchools } from '@/hooks/useSchools';
import { useMembers } from '@/hooks/useMembers';
import { useSchoolsManagement, School } from '@/hooks/useSchoolsManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Loader2, BookOpen, User, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';

const SchoolsManagementPage = () => {
  const { user, currentChurchId } = useAuthStore();
  const navigate = useNavigate();
  const { data: schools, isLoading: isLoadingSchools } = useSchools();
  const { members, isLoading: isLoadingMembers } = useMembers();
  const { createSchool, updateSchool, deleteSchool } = useSchoolsManagement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [form, setForm] = useState<Partial<School>>({});

  const canManage = user?.role === 'admin' || user?.role === 'pastor';

  const openDialog = (school: School | null = null) => {
    setEditingSchool(school);
    setForm(school ? { ...school } : {
      nome: '',
      descricao: '',
      professor_id: null,
      compartilhar_com_filhas: false,
      data_inicio: null,
      data_fim: null,
      status: 'aberta',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome) return;

    const mutation = editingSchool ? updateSchool : createSchool;
    mutation.mutate(form as any, {
      onSuccess: () => setIsDialogOpen(false),
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta escola?')) {
      deleteSchool.mutate(id);
    }
  };

  if (isLoadingSchools || isLoadingMembers) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campus Ministeriais</h1>
        {canManage && (
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" /> Nova Escola
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools?.map((school) => (
          <Card key={school.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{school.nome}</CardTitle>
                <Badge variant={school.status === 'aberta' ? 'default' : 'secondary'}>{school.status}</Badge>
              </div>
              <CardDescription className="line-clamp-2 h-10">{school.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Professor: {school.professor_nome}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{school.inscricoes_count} inscritos</span>
              </div>
            </CardContent>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => navigate(`/escolas/${school.id}`)}>
                <BookOpen className="w-4 h-4 mr-2" /> Ver Escola
              </Button>
              {canManage && (
                <>
                  <Button variant="secondary" size="icon" onClick={() => openDialog(school)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(school.id)}><Trash2 className="w-4 h-4" /></Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchool ? 'Editar Escola' : 'Nova Escola'}</DialogTitle>
            <DialogDescription>Preencha os detalhes da escola ministerial.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Escola</Label>
              <Input id="nome" value={form.nome || ''} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professor">Professor Responsável</Label>
              <Select value={form.professor_id || ''} onValueChange={(value) => setForm({ ...form, professor_id: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione um professor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {members?.map(member => <SelectItem key={member.id} value={member.id}>{member.nome_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início</Label>
                <Input id="data_inicio" type="date" value={form.data_inicio?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_fim">Data de Fim</Label>
                <Input id="data_fim" type="date" value={form.data_fim?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status || 'aberta'} onValueChange={(value) => setForm({ ...form, status: value as School['status'] })}>
                <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberta">Aberta para Inscrições</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="fechada">Fechada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="compartilhar" checked={form.compartilhar_com_filhas} onCheckedChange={(checked) => setForm({ ...form, compartilhar_com_filhas: checked })} />
              <Label htmlFor="compartilhar">Compartilhar com igrejas filhas</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createSchool.isPending || updateSchool.isPending}>
                {createSchool.isPending || updateSchool.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolsManagementPage;