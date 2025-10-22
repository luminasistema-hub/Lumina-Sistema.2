import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Church } from '@/stores/churchStore'
import ReceiptGenerator from './ReceiptGenerator'
import { X, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface FinancialTransaction {
  id: string
  tipo: 'Entrada' | 'Saída'
  categoria: string
  valor: number
  data_transacao: string
  descricao: string
  metodo_pagamento: string
  membro_nome?: string
  numero_documento?: string
  recibo_emitido?: boolean
}

interface UnifiedReceiptDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  transaction: FinancialTransaction | null
  church: Church | null
  onMarkAsIssued?: (transactionId: string) => void
  canManage: boolean
  churchId?: string
}

export const UnifiedReceiptDialog = ({
  isOpen,
  onOpenChange,
  transaction,
  church,
  onMarkAsIssued,
  canManage,
  churchId,
}: UnifiedReceiptDialogProps) => {
  if (!transaction) return null

  const [resolvedChurch, setResolvedChurch] = useState<Church | null>(church || null)

  useEffect(() => {
    let isMounted = true
    // Se não veio a igreja pelo store, tenta buscar direto no Supabase
    const fetchChurch = async () => {
      if (resolvedChurch || !churchId) return
      const { data, error } = await supabase
        .from('igrejas')
        .select(`
          id, nome, endereco, telefone_contato, email, cnpj, plano_id,
          limite_membros, membros_atuais, status, created_at, updated_at,
          valor_mensal_assinatura, data_proximo_pagamento, ultimo_pagamento_status,
          link_pagamento_assinatura, subscription_id_ext, server_memory_limit,
          server_execution_timeout, db_connection_pool, db_query_cache_mb,
          nome_responsavel, site, descricao, share_devocionais_to_children,
          share_eventos_to_children, share_trilha_to_children,
          compartilha_escolas_da_mae, compartilha_eventos_da_mae,
          compartilha_jornada_da_mae, compartilha_devocionais_da_mae
        `)
        .eq('id', churchId)
        .maybeSingle()
      if (!error && data && isMounted) {
        const mapped: Church = {
          id: data.id,
          name: data.nome,
          address: data.endereco ?? undefined,
          contactEmail: data.email ?? undefined,
          contactPhone: data.telefone_contato ?? undefined,
          subscriptionPlanName: 'N/A',
          plano_id: data.plano_id ?? null,
          memberLimit: data.limite_membros ?? 0,
          currentMembers: data.membros_atuais ?? 0,
          status: (data.status as any) ?? 'active',
          created_at: data.created_at ?? new Date().toISOString(),
          updated_at: data.updated_at ?? undefined,
          valor_mensal_assinatura: data.valor_mensal_assinatura ?? 0,
          data_proximo_pagamento: data.data_proximo_pagamento ?? undefined,
          ultimo_pagamento_status: (data.ultimo_pagamento_status as any) ?? 'N/A',
          historico_pagamentos: [],
          link_pagamento_assinatura: data.link_pagamento_assinatura ?? undefined,
          subscription_id_ext: data.subscription_id_ext ?? undefined,
          server_memory_limit: data.server_memory_limit ?? undefined,
          server_execution_timeout: data.server_execution_timeout ?? undefined,
          db_connection_pool: data.db_connection_pool ?? undefined,
          db_query_cache_mb: data.db_query_cache_mb ?? undefined,
          cnpj: data.cnpj ?? undefined,
          nome_responsavel: data.nome_responsavel ?? undefined,
          site: data.site ?? undefined,
          descricao: data.descricao ?? undefined,
          share_devocionais_to_children: data.share_devocionais_to_children ?? false,
          share_eventos_to_children: data.share_eventos_to_children ?? false,
          share_trilha_to_children: data.share_trilha_to_children ?? false,
          compartilha_escolas_da_mae: data.compartilha_escolas_da_mae ?? true,
          compartilha_eventos_da_mae: data.compartilha_eventos_da_mae ?? true,
          compartilha_jornada_da_mae: data.compartilha_jornada_da_mae ?? true,
          compartilha_devocionais_da_mae: data.compartilha_devocionais_da_mae ?? true,
        }
        setResolvedChurch(mapped)
      }
    }
    fetchChurch()
    return () => { isMounted = false }
  }, [resolvedChurch, churchId])

  const handleDownloadPdf = () => {
    window.print()
  }

  const receiptData = {
    numero: transaction.numero_documento || transaction.id.substring(0, 8).toUpperCase(),
    data_emissao: new Date().toLocaleDateString('pt-BR'),
    valor: transaction.valor,
    descricao: transaction.descricao,
    categoria: transaction.categoria,
    metodo_pagamento: transaction.metodo_pagamento,
    igreja: {
      nome: resolvedChurch?.name ?? 'Igreja não identificada',
      endereco: resolvedChurch?.address ?? 'Endereço não informado',
      cnpj: resolvedChurch?.cnpj ?? 'CNPJ não informado',
      telefone: resolvedChurch?.contactPhone ?? 'Telefone não informado',
    },
    doador: transaction.membro_nome || 'Doador não identificado',
  }

  const handleMarkAsIssued = () => {
    if (onMarkAsIssued) {
      onMarkAsIssued(transaction.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Recibo de Doação
            {transaction.recibo_emitido && (
              <span className="inline-flex items-center gap-1 text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                <CheckCircle className="w-4 h-4" />
                Emitido
              </span>
            )}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            {transaction.recibo_emitido 
              ? 'Este recibo já foi emitido anteriormente. Você pode visualizar e imprimir novamente.'
              : 'Visualize, imprima e marque a emissão do recibo.'
            }
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <ReceiptGenerator data={receiptData} onDownload={handleDownloadPdf} />
        </div>
        
        <DialogFooter className="bg-slate-50 p-4 border-t print:hidden flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" /> Fechar
            </Button>
            {canManage && !transaction.recibo_emitido && onMarkAsIssued && (
              <Button
                onClick={handleMarkAsIssued}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Emitido
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}