import { useState } from 'react'
import { useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool } from '@/hooks/useSchools'
import { useMembers } from '@/hooks/useMembers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const SchoolsManagementPage = () => {
  const { user } = useAuthStore()
  const { data: schools, isLoading, error } = useSchools()
  const { data: members } = useMembers()
  const createSchoolMutation = useCreateSchool()
  const updateSchoolMutation = useUpdateSchool()
  const deleteSchoolMutation = useDeleteSchool()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<any>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    professor_id: '',
    compartilhar_com_filhas: false
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      professor_id: '',
      compartilhar_com_filhas: false
    })
    setEditingSchool(null)
  }

  const handleOpenDialog = (school?: any) => {
    if (school) {
      setEditingSchool(school)
      setFormData({
        nome: school.nome || '',
        descricao: school.descricao || '',
        professor_id: school.professor_id || '',
        compartilhar_com_filhas: school.compartilhar_com_filhas || false
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      toast.error('O nome da escola é obrigatório')
      return
    }
    
    if (editingSchool) {
      updateSchoolMutation.mutate({
        id: editingSchool.id,
        ...formData
      })
    } else {
      createSchoolMutation.mutate(formData)
    }
    
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (schoolId: string) => {
    if (confirm('Tem certeza que deseja remover esta escola?')) {
      deleteSchoolMutation.mutate(schoolId)
    }
  }

  // Filtrar membros que podem ser professores (pastores, admins, líderes de ministério)
  const potentialTeachers = members?.filter(member => 
    member.funcao === 'pastor' || 
    member.funcao === 'admin' || 
    member.funcao === 'lider_ministerio'
  ) || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Escolas</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Escola
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchool ? 'Editar Escola' : 'Nova Escola'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Escola *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Escola de Liderança"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descreva o propósito e objetivos da escola"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="professor">Professor</Label>
                <Select 
                  value={formData.professor_id} 
                  onValueChange={(value) => setFormData({...formData, professor_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialTeachers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="space-y-1">
                  <Label>Compartilhar com igrejas filhas</Label>
                  <p className="text-sm text-gray-500">
                    Se ativado, esta escola ficará visível para igrejas filhas
                  </p>
                </div>
                <Switch
                  checked={formData.compartilhar_com_filhas}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, compartilhar_com_filhas: checked})
                  }
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSchool ? 'Atualizar' : 'Criar'} Escola
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escolas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 p-4 text-center">
              Erro ao carregar escolas: {(error as Error).message}
            </div>
          )}
          
          {schools && schools.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Compartilhada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.nome}</TableCell>
                    <TableCell>
                      {school.professor_nome || (
                        <span className="text-gray-500">Não definido</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {school.compartilhar_com_filhas ? (
                        <Badge variant="default">Sim</Badge>
                      ) : (
                        <Badge variant="secondary">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenDialog(school)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(school.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.location.href = `/escolas/${school.id}`}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma escola cadastrada ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SchoolsManagementPage