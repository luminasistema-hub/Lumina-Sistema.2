import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/integrations/supabase/client'
import UserManagement from './UserManagement'
import UpgradePlanDialog from './UpgradePlanDialog'
import {
  Church,
  Users,
  Save,
  ArrowUpRight,
  Wallet,
  CalendarDays,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

type ChurchSettingsData = {
  nome: string
  endereco: string
  telefone: string
  email: string
  cnpj: string
  nome_responsavel: string
  site: string
  descricao: string
}

type PlanState = {
  plano_id: string | null
  plan_name: string
  limite_membros: number | null
  membros_atuais_db: number | null
  membros_count: number
  valor_mensal_assinatura: number | null
  data_proximo_pagamento: string | null
  ultimo_pagamento_status: string | null
  link_pagamento_assinatura?: string | null
}

const SystemSettings = () => {
  const { currentChurchId, user } = useAuthStore()

  const [churchSettings, setChurchSettings] = useState<ChurchSettingsData>({
    nome: '',
    endereco: '',
    telefone: '',
    email: '',
    cnpj: '',
    nome_responsavel: '',
    site: '',
    descricao: ''
  })

  const [plan, setPlan] = useState<PlanState>({
    plano_id: null,
    plan_name: 'N/A',
    limite_membros: null,
    membros_atuais_db: null,
    membros_count: 0,
    valor_mensal_assinatura: null,
    data_proximo_pagamento: null,
    ultimo_pagamento_status: 'N/A',
    link_pagamento_assinatura: null
  })

  const [loading, setLoading] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const canManage = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'super_admin'
  }, [user?.role])

  useEffect(() => {
    const load = async () => {
      if (!currentChurchId) return

      // Carrega dados da igreja com informações do plano
      const { data: church, error } = await supabase
        .from('igrejas')
        .select(`
          id, nome, endereco, telefone_contato, email, cnpj,
          nome_responsavel, site, descricao,
          plano_id, limite_membros, membros_atuais,
          valor_mensal_assinatura, data_proximo_pagamento,
          ultimo_pagamento_status, link_pagamento_assinatura,
          plano:planos_assinatura ( id, nome, limite_membros, preco_mensal )
        `)
        .eq('id', currentChurchId)
        .maybeSingle()

      if (error) {
        console.warn('SystemSettings: erro ao buscar igreja:', error.message)
        return
      }

      if (church) {
        setChurchSettings({
          nome: church.nome || '',
          endereco: church.endereco || '',
          telefone: church.telefone_contato || '',
          email: church.email || '',
          cnpj: church.cnpj || '',
          nome_responsavel: church.nome_responsavel || '',
          site: church.site || '',
          descricao: church.descricao || ''
        })

        // Conta real de membros
        const { count } = await supabase
          .from('membros')
          .select('id', { count: 'exact', head: true })
          .eq('id_igreja', currentChurchId)

        setPlan({
          plano_id: church.plano_id || null,
          plan_name: (Array.isArray(church.plano) ? church.plano[0]?.nome : church.plano?.nome) || 'N/A',
          limite_membros: church.limite_membros ?? (Array.isArray(church.plano) ? church.plano[0]?.limite_membros : church.plano?.limite_membros) ?? null,
          membros_atuais_db: church.membros_atuais ?? null,
          membros_count: count ?? 0,
          valor_mensal_assinatura: church.valor_mensal_assinatura ?? (Array.isArray(church.plano) ? church.plano[0]?.preco_mensal : church.plano?.preco_mensal) ?? null,
          data_proximo_pagamento: church.data_proximo_pagamento ?? null,
          ultimo_pagamento_status: church.ultimo_pagamento_status ?? 'N/A',
          link_pagamento_assinatura: church.link_pagamento_assinatura ?? null
        })
      }
    }

    load()
  }, [currentChurchId])

  const handleSaveChurchSettings = async () => {
    if (!currentChurchId) {
      toast.error('Nenhuma igreja selecionada.')
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('igrejas')
      .update({
        nome: churchSettings.nome,
        nome_responsavel: churchSettings.nome_responsavel,
        endereco: churchSettings.endereco,
        telefone_contato: churchSettings.telefone,
        cnpj: churchSettings.cnpj,
        email: churchSettings.email,
        site: churchSettings.site,
        descricao: churchSettings.descricao
      })
      .eq('id', currentChurchId)

    setLoading(false)

    if (error) {
      console.error('SystemSettings: erro ao salvar:', error.message)
      toast.error('Erro ao salvar configurações.')
      return
    }
    toast.success('Configurações salvas com sucesso!')
  }

  if (!currentChurchId && user?.role !== 'super_admin') {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar as configurações.
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-gradient-to-r from-gray-600 to-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Configurações do Sistema ⚙️</h1>
        <p className="text-gray-100 text-base md:text-lg">
          Gerencie os dados da igreja e o status do plano
        </p>
      </div>

      <Tabs defaultValue="church" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="church">Igreja</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="church" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="w-5 h-5 text-purple-500" />
                Informações da Igreja
              </CardTitle>
              <CardDescription>Campos sincronizados com a tabela igrejas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Igreja</Label>
                  <Input
                    id="nome"
                    value={churchSettings.nome}
                    onChange={(e) => setChurchSettings({ ...churchSettings, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável (Pastor)</Label>
                  <Input
                    id="responsavel"
                    value={churchSettings.nome_responsavel}
                    onChange={(e) => setChurchSettings({ ...churchSettings, nome_responsavel: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={churchSettings.endereco}
                  onChange={(e) => setChurchSettings({ ...churchSettings, endereco: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={churchSettings.telefone}
                    onChange={(e) => setChurchSettings({ ...churchSettings, telefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={churchSettings.email}
                    onChange={(e) => setChurchSettings({ ...churchSettings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={churchSettings.cnpj}
                    onChange={(e) => setChurchSettings({ ...churchSettings, cnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input
                  id="site"
                  value={churchSettings.site}
                  onChange={(e) => setChurchSettings({ ...churchSettings, site: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={churchSettings.descricao}
                  onChange={(e) => setChurchSettings({ ...churchSettings, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveChurchSettings} disabled={!canManage || loading} className="bg-purple-500 hover:bg-purple-600">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações da Igreja
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-500" />
                Status do Plano
              </CardTitle>
              <CardDescription>Detalhes da assinatura e limites contratados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Plano atual</div>
                  <div className="mt-1 text-lg font-semibold">{plan.plan_name}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Limite de membros (contratado)</div>
                  <div className="mt-1 text-lg font-semibold">
                    {plan.limite_membros ?? '—'}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Uso atual (membros)</div>
                  <div className="mt-1 text-lg font-semibold">{plan.membros_count}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Valor mensal</div>
                  <div className="mt-1 text-lg font-semibold">
                    {plan.valor_mensal_assinatura != null
                      ? `R$ ${plan.valor_mensal_assinatura.toFixed(2)}`
                      : '—'}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Próximo pagamento</div>
                  <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                    <CalendarDays className="w-4 h-4" />
                    {plan.data_proximo_pagamento
                      ? new Date(plan.data_proximo_pagamento).toLocaleDateString('pt-BR')
                      : '—'}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Status do último pagamento</div>
                  <div className="mt-1">
                    <Badge
                      variant={
                        plan.ultimo_pagamento_status === 'Pago'
                          ? 'secondary'
                          : plan.ultimo_pagamento_status === 'Atrasado'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {plan.ultimo_pagamento_status || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {canManage && (
                  <Button onClick={() => setUpgradeOpen(true)}>
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Upgrade de Plano
                  </Button>
                )}
                {plan.link_pagamento_assinatura && (
                  <a href={plan.link_pagamento_assinatura} target="_blank" rel="noreferrer">
                    <Button variant="outline">
                      Gerenciar Assinatura
                    </Button>
                  </a>
                )}
              </div>

              {plan.membros_count > (plan.limite_membros ?? Number.MAX_SAFE_INTEGER) && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  Você excedeu o limite contratado de membros. Considere um upgrade.
                </div>
              )}
            </CardContent>
          </Card>

          <UpgradePlanDialog
            open={upgradeOpen}
            onOpenChange={setUpgradeOpen}
            churchId={currentChurchId!}
            currentPlanId={plan.plano_id}
            onUpgraded={async () => {
              // Recarrega status do plano após upgrade
              if (!currentChurchId) return
              const { data: church } = await supabase
                .from('igrejas')
                .select(`
                  id, plano_id, limite_membros, valor_mensal_assinatura,
                  plano:planos_assinatura ( id, nome, limite_membros, preco_mensal )
                `)
                .eq('id', currentChurchId)
                .maybeSingle()

              if (church) {
                setPlan((prev) => ({
                  ...prev,
                  plano_id: church.plano_id || null,
                  plan_name: (Array.isArray(church.plano) ? church.plano[0]?.nome : church.plano?.nome) || prev.plan_name,
                  limite_membros: church.limite_membros ?? (Array.isArray(church.plano) ? church.plano[0]?.limite_membros : church.plano?.limite_membros) ?? prev.limite_membros,
                  valor_mensal_assinatura:
                    church.valor_mensal_assinatura ??
                    (Array.isArray(church.plano) ? church.plano[0]?.preco_mensal : church.plano?.preco_mensal) ??
                    prev.valor_mensal_assinatura,
                }))
                toast.success('Status do plano atualizado.')
              }
            }}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Gestão de Usuários
              </CardTitle>
              <CardDescription>Gerencie usuários e permissões da sua igreja</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SystemSettings