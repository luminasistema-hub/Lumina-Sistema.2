import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Badge } from '../ui/badge'
import { useAuthStore } from '@/stores/authStore'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  churchId: string
  currentPlanId: string | null
  onUpgraded?: () => void
}

export default function UpgradePlanDialog({
  open,
  onOpenChange,
  churchId,
  currentPlanId,
  onUpgraded,
}: Props) {
  const { plans, isLoading } = useSubscriptionPlans()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(currentPlanId)
  const { user } = useAuthStore()

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId]
  )

  const handleConfirm = async () => {
    if (!selectedPlanId) {
      toast.error('Selecione um plano para continuar.')
      return
    }
    const chosen = plans.find((p) => p.id === selectedPlanId)
    if (!chosen) {
      toast.error('Plano selecionado inválido.')
      return
    }

    // Cria uma solicitação de mudança de plano para aprovação do Super Admin
    const { error } = await supabase
      .from('plan_change_requests')
      .insert({
        church_id: churchId,
        requested_plan_id: chosen.id,
        requested_by: user?.id,
        status: 'pending',
        note: null,
      })

    if (error) {
      console.error('UpgradePlanDialog: erro ao atualizar plano:', error.message)
      toast.error('Falha ao enviar a solicitação de upgrade.')
      return
    }

    toast.success('Solicitação de upgrade enviada! Aguarde confirmação do Super Admin.')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar upgrade de plano</DialogTitle>
          <DialogDescription>Selecione um novo plano e envie para aprovação do Super Admin.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Selecionar plano</Label>
            <Select
              value={selectedPlanId ?? undefined}
              onValueChange={(v) => setSelectedPlanId(v)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Carregando planos...' : 'Escolha um plano'} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} — R$ {p.preco_mensal.toFixed(2)}{' '}
                    <Badge variant="secondary" className="ml-2">
                      até {p.limite_membros} membros
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan && (
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{selectedPlan.nome}</div>
              <div className="text-muted-foreground">
                Limite: {selectedPlan.limite_membros} membros • Armazenamento: {selectedPlan.limite_armazenamento_mb} MB
              </div>
              {selectedPlan.descricao && (
                <div className="mt-2 text-muted-foreground">{selectedPlan.descricao}</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPlanId}>
            Enviar solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}