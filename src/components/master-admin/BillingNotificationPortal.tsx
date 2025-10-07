import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, Send, ChevronsUpDown, Check } from 'lucide-react'
import type { Church } from '@/stores/churchStore'

type Props = {
  churches: Church[]
}

type Member = { id: string; nome_completo: string; email: string }

const BillingNotificationPortal: React.FC<Props> = ({ churches }) => {
  const [selectedChurchId, setSelectedChurchId] = useState<string>('')
  const [admins, setAdmins] = useState<Member[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<Member[]>([])
  const [openCombobox, setOpenCombobox] = useState(false)
  const [type, setType] = useState<'BILLING' | 'PAYMENT_UPDATE'>('BILLING')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [sending, setSending] = useState(false)

  const selectedChurch = useMemo(() => churches.find(c => c.id === selectedChurchId), [churches, selectedChurchId])

  useEffect(() => {
    if (!selectedChurchId) {
      setAdmins([])
      setSelectedAdmins([])
      return
    }
    const loadAdmins = async () => {
      setLoadingAdmins(true)
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_completo, email')
        .eq('id_igreja', selectedChurchId)
        .eq('funcao', 'admin')
        .order('nome_completo')
      setLoadingAdmins(false)
      if (error) {
        console.error('BillingPortal: erro ao buscar admins:', error.message)
        toast.error('Falha ao carregar admins da igreja.')
        return
      }
      setAdmins((data || []).map(m => ({
        id: m.id,
        nome_completo: m.nome_completo || m.email,
        email: m.email
      })))
      setSelectedAdmins([])
    }
    loadAdmins()
  }, [selectedChurchId])

  const applyTemplate = (t: 'BILLING' | 'PAYMENT_UPDATE') => {
    setType(t)
    if (t === 'BILLING') {
      setTitle('Cobrança de Assinatura')
      setDescription('Olá! Identificamos uma pendência de pagamento na sua assinatura. Por favor, acesse o link para regularizar.')
    } else {
      setTitle('Atualização de Pagamento')
      setDescription('Seu pagamento foi atualizado com sucesso. Obrigado! Veja os detalhes no link abaixo.')
    }
  }

  const send = async () => {
    if (!selectedChurchId) {
      toast.error('Selecione uma igreja.')
      return
    }
    if (!title || !description) {
      toast.error('Título e descrição são obrigatórios.')
      return
    }
    setSending(true)
    const rows: any[] = []
    if (selectedAdmins.length > 0) {
      selectedAdmins.forEach(admin => {
        rows.push({
          id_igreja: selectedChurchId,
          user_id: admin.id,
          tipo: type,
          titulo: title,
          descricao: description,
          link: link || null
        })
      })
    } else {
      // Broadcast para admins será enviado como user_id nulo
      rows.push({
        id_igreja: selectedChurchId,
        user_id: null,
        tipo: type,
        titulo: title,
        descricao: description,
        link: link || null
      })
    }
    const { error } = await supabase.from('notificacoes').insert(rows)
    setSending(false)
    if (error) {
      console.error('BillingPortal: erro ao enviar:', error.message)
      toast.error('Falha ao enviar notificações.')
      return
    }
    toast.success(`Notificação enviada ${selectedAdmins.length > 0 ? `para ${selectedAdmins.length} admin(s)` : 'para a igreja'}.`)
    setTitle('')
    setDescription('')
    setLink('')
    setSelectedAdmins([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portal de Notificações (Cobrança e Pagamentos)</CardTitle>
        <CardDescription>Envie cobranças e atualizações de pagamento aos administradores das igrejas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Igreja</Label>
          <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a igreja" />
            </SelectTrigger>
            <SelectContent>
              {churches.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant={type === 'BILLING' ? 'default' : 'outline'} onClick={() => applyTemplate('BILLING')}>
            Cobrança
          </Button>
          <Button variant={type === 'PAYMENT_UPDATE' ? 'default' : 'outline'} onClick={() => applyTemplate('PAYMENT_UPDATE')}>
            Atualização de Pagamento
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Admins destinatários</Label>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between" disabled={!selectedChurchId || loadingAdmins}>
                {loadingAdmins ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Carregando...</span>
                ) : (selectedAdmins.length > 0 ? `${selectedAdmins.length} admin(s) selecionado(s)` : "Selecionar admin(s)...")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Buscar admin..." />
                <CommandList>
                  <CommandEmpty>Nenhum admin encontrado.</CommandEmpty>
                  <CommandGroup>
                    {admins.map(a => (
                      <CommandItem
                        key={a.id}
                        value={a.nome_completo}
                        onSelect={() => {
                          const isSelected = selectedAdmins.some(s => s.id === a.id)
                          setSelectedAdmins(prev => isSelected ? prev.filter(p => p.id !== a.id) : [...prev, a])
                          setOpenCombobox(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${selectedAdmins.some(s => s.id === a.id) ? "opacity-100" : "opacity-0"}`} />
                        {a.nome_completo} ({a.email})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">Deixe em branco para enviar para todos (broadcast).</p>
        </div>

        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Cobrança de Assinatura" />
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mensagem detalhada..." />
        </div>
        <div className="space-y-2">
          <Label>Link (opcional)</Label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Ex: /master-admin?tab=plans" />
        </div>

        <Button onClick={send} disabled={sending || !selectedChurchId || !title || !description}>
          {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {sending ? 'Enviando...' : 'Enviar Notificação'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default BillingNotificationPortal