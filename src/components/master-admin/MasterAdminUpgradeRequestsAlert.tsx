import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Bell, Building2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Props = {
  onViewRequests?: () => void;
};

type PendingRequestUI = {
  id: string;
  churchId: string;
  churchName: string;
  planId: string | null;
  planName: string | null;
  note?: string | null;
  created_at: string;
};

const MasterAdminUpgradeRequestsAlert: React.FC<Props> = ({ onViewRequests }) => {
  const [pendingRequests, setPendingRequests] = useState<PendingRequestUI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPending = async () => {
      setLoading(true);

      // 1) Buscar solicitações pendentes
      const { data: requests, error } = await supabase
        .from('plan_change_requests')
        .select('id, church_id, requested_plan_id, note, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!isMounted) return;

      if (error) {
        console.error('Erro ao buscar solicitações de upgrade:', error.message);
        toast.error('Falha ao carregar solicitações de upgrade.');
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      if (!requests || requests.length === 0) {
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      // 2) Buscar nomes das igrejas
      const churchIds = Array.from(new Set(requests.map(r => r.church_id).filter(Boolean)));
      const { data: churches, error: churchErr } = await supabase
        .from('igrejas')
        .select('id, nome')
        .in('id', churchIds);

      if (churchErr) {
        console.error('Erro ao buscar igrejas:', churchErr.message);
        toast.error('Falha ao carregar dados das igrejas.');
      }

      const churchMap = new Map<string, string>(
        (churches || []).map(c => [c.id as string, (c as any).nome as string])
      );

      // 3) Buscar nomes dos planos solicitados (acesso público liberado)
      const planIds = Array.from(
        new Set((requests.map(r => r.requested_plan_id).filter(Boolean) as string[]))
      );
      let planMap = new Map<string, string>();
      if (planIds.length > 0) {
        const { data: plans, error: plansErr } = await supabase
          .from('planos_assinatura')
          .select('id, nome')
          .in('id', planIds);

        if (plansErr) {
          console.error('Erro ao buscar planos:', plansErr.message);
          toast.error('Falha ao carregar dados dos planos.');
        } else {
          planMap = new Map<string, string>(
            (plans || []).map(p => [p.id as string, (p as any).nome as string])
          );
        }
      }

      // 4) Montar lista final (mostrar as 3 mais recentes)
      const list: PendingRequestUI[] = (requests || []).slice(0, 3).map(r => ({
        id: r.id,
        churchId: r.church_id,
        churchName: churchMap.get(r.church_id) || 'Igreja desconhecida',
        planId: r.requested_plan_id ?? null,
        planName: r.requested_plan_id ? (planMap.get(r.requested_plan_id) || 'Plano desconhecido') : null,
        note: r.note ?? null,
        created_at: r.created_at,
      }));

      setPendingRequests(list);
      setLoading(false);
    };

    fetchPending();
    const interval = setInterval(fetchPending, 20000); // atualiza a cada 20s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || pendingRequests.length === 0) {
    return null;
  }

  const total = pendingRequests.length;

  return (
    <Alert className="border-orange-300 bg-orange-50">
      <AlertTitle className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-orange-600" />
        Solicitações de upgrade pendentes
      </AlertTitle>

      <AlertDescription className="mt-1 space-y-3">
        <p>Há {total} solicitação{total > 1 ? 's' : ''} aguardando aprovação do Super Admin.</p>

        <div className="space-y-2">
          {pendingRequests.map((req) => (
            <div key={req.id} className="flex items-start justify-between rounded-md border bg-white px-3 py-2">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 mt-1 text-gray-500" />
                <div>
                  <div className="font-medium">{req.churchName}</div>
                  <div className="text-sm text-gray-600">
                    Plano solicitado: {req.planName || '—'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}
                    {req.note ? ` • Nota: ${req.note}` : ''}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onViewRequests?.()} className="gap-1">
                Ver
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-1">
          <Button variant="outline" onClick={() => onViewRequests?.()}>
            Ver todos em Planos
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default MasterAdminUpgradeRequestsAlert;