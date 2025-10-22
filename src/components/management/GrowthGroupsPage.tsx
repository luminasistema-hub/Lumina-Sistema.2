import React, { useMemo, useState } from 'react'
import { useChurchGrowthGroups, useCreateGrowthGroup, useUpdateGrowthGroup, useAddLeaderToGroup, useAddMemberToGroup } from '@/hooks/useGrowthGroups'
import { useMembers } from '@/hooks/useMembers'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, Phone, PlusCircle, Users, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import GroupLeadersList from './GroupLeadersList'
import GroupMembersList from './GroupMembersList'

const weekdays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

const GrowthGroupsPage: React.FC = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const canManageGroups = user?.role === 'admin' || user?.role === 'pastor'
  const { data: groups } = useChurchGrowthGroups()
  const { data: membersList } = useMembers()
  const createGroup = useCreateGrowthGroup()
  const updateGroup = useUpdateGrowthGroup()
  const addLeader = useAddLeaderToGroup()
  const addMember = useAddMemberToGroup()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [leaderDialog, setLeaderDialog] = useState<string | null>(null)
  const [memberDialog, setMemberDialog] = useState<string | null>(null)
  const [leaderListDialog, setLeaderListDialog] = useState<string | null>(null)
  const [memberListDialog, setMemberListDialog] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    meeting_day: '',
    meeting_time: '',
    meeting_location: '',
    contact_phone: '',
  })

  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const memberOptions = useMemo(() => {
    return (membersList || []).map(m => ({ id: m.id, name: m.nome_completo || m.email }))
  }, [membersList])

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['gc-groups'] })
    toast.info('Atualizando grupos...')
  }

  const handleCreate = () => {
    createGroup.mutate(
      {
        nome: form.nome,
        descricao: form.descricao,
        meeting_day: form.meeting_day,
        meeting_time: form.meeting_time,
        meeting_location: form.meeting_location,
        contact_phone: form.contact_phone,
      } as any,
      {
        onSuccess: () => {
          setForm({ nome: '', descricao: '', meeting_day: '', meeting_time: '', meeting_location: '', contact_phone: '' })
          setCreateOpen(false)
        }
      }
    )
  }

  const handleUpdate = (id: string) => {
    updateGroup.mutate(
      {
        id,
        updates: {
          nome: form.nome,
          descricao: form.descricao,
          meeting_day: form.meeting_day,
          meeting_time: form.meeting_time,
          meeting_location: form.meeting_location,
          contact_phone: form.contact_phone,
        }
      },
      { onSuccess: () => setEditOpen(null) }
    )
  }

  const startEdit = (id: string) => {
    const g = (groups || []).find(x => x.id === id)
    if (!g) return
    setForm({
      nome: g.nome || '',
      descricao: g.descricao || '',
      meeting_day: g.meeting_day || '',
      meeting_time: g.meeting_time || '',
      meeting_location: g.meeting_location || '',
      contact_phone: g.contact_phone || '',
    })
    setEditOpen(id)
  }

  const submitAddLeader = (groupId: string) => {
    if (!selectedUserId) return
    addLeader.mutate({ groupId, membroId: selectedUserId }, { onSuccess: () => { setLeaderDialog(null); setSelectedUserId('') } })
  }

  const submitAddMember = (groupId: string) => {
    if (!selectedUserId) return
    addMember.mutate({ groupId, membroId: selectedUserId }, { onSuccess: () => { setMemberDialog(null); setSelectedUserId('') } })
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Grupos de Crescimento (GC)</h1>
          <p className="text-sm text-muted-foreground">Crie grupos, defina líderes e gerencie participantes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          {canManageGroups && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><PlusCircle className="w-4 h-4" /> Novo Grupo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Grupo de Crescimento</DialogTitle>
                  <DialogDescription>Informe os dados principais do grupo.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Nome</Label>
                    <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Dia da reunião</Label>
                      <Select value={form.meeting_day} onValueChange={v => setForm(f => ({ ...f, meeting_day: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {weekdays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Horário</Label>
                      <Input placeholder="19:30" value={form.meeting_time} onChange={e => setForm(f => ({ ...f, meeting_time: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Local</Label>
                    <Input value={form.meeting_location} onChange={e => setForm(f => ({ ...f, meeting_location: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Telefone de contato</Label>
                    <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={createGroup.isPending}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Grupos</CardTitle>
          <CardDescription>Gerencie os grupos existentes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Reunião</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(groups || []).map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.nome}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {g.meeting_day || '—'}
                        <Clock className="w-4 h-4 ml-3" /> {g.meeting_time || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {g.meeting_location || '—'}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {g.contact_phone || '—'}</div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {(canManageGroups) && (
                        <Button variant="outline" size="sm" onClick={() => startEdit(g.id)}>Editar</Button>
                      )}
                      {(canManageGroups) && (
                        <Button variant="outline" size="sm" onClick={() => setLeaderDialog(g.id)}>Adicionar Líder</Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => setMemberDialog(g.id)}>Adicionar Membro</Button>
                      <Button variant="ghost" size="sm" onClick={() => setLeaderListDialog(g.id)}>Ver líderes</Button>
                      <Button variant="ghost" size="sm" onClick={() => setMemberListDialog(g.id)}>Ver membros</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(groups || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      Nenhum grupo cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Editar Grupo */}
      <Dialog open={!!editOpen} onOpenChange={(v) => !v && setEditOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Dia da reunião</Label>
                <Select value={form.meeting_day} onValueChange={v => setForm(f => ({ ...f, meeting_day: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {weekdays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Horário</Label>
                <Input placeholder="19:30" value={form.meeting_time} onChange={e => setForm(f => ({ ...f, meeting_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Local</Label>
              <Input value={form.meeting_location} onChange={e => setForm(f => ({ ...f, meeting_location: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone de contato</Label>
              <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEditOpen(null)}>Cancelar</Button>
            <Button onClick={() => editOpen && handleUpdate(editOpen)} disabled={updateGroup.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adicionar Líder */}
      <Dialog open={!!leaderDialog} onOpenChange={(v) => !v && setLeaderDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Líder</DialogTitle>
            <DialogDescription>Selecione um membro para definir como líder do grupo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label>Membro</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
              <SelectContent>
                {memberOptions.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setLeaderDialog(null)}>Cancelar</Button>
            <Button onClick={() => leaderDialog && submitAddLeader(leaderDialog)} disabled={!selectedUserId || addLeader.isPending}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adicionar Membro */}
      <Dialog open={!!memberDialog} onOpenChange={(v) => !v && setMemberDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Grupo</DialogTitle>
            <DialogDescription>Selecione um membro para participar do grupo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label>Membro</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
              <SelectContent>
                {memberOptions.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setMemberDialog(null)}>Cancelar</Button>
            <Button onClick={() => memberDialog && submitAddMember(memberDialog)} disabled={!selectedUserId || addMember.isPending}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ver líderes do grupo */}
      <Dialog open={!!leaderListDialog} onOpenChange={(v) => !v && setLeaderListDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Líderes do grupo</DialogTitle>
            <DialogDescription>Lista de líderes vinculados a este grupo.</DialogDescription>
          </DialogHeader>
          {leaderListDialog && (
            <GroupLeadersList groupId={leaderListDialog} />
          )}
        </DialogContent>
      </Dialog>

      {/* Ver membros do grupo */}
      <Dialog open={!!memberListDialog} onOpenChange={(v) => !v && setMemberListDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Membros do grupo</DialogTitle>
            <DialogDescription>Lista de participantes vinculados a este grupo.</DialogDescription>
          </DialogHeader>
          {memberListDialog && (
            <GroupMembersList groupId={memberListDialog} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GrowthGroupsPage