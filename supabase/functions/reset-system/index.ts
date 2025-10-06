import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    )

    // Verifica se o usuário é super admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Verifica se é super admin
    const { data: superAdmin, error: saError } = await supabaseClient
      .from('super_admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (saError || !superAdmin) {
      return new Response('Acesso negado: apenas Super Administradores podem resetar o sistema.', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    // Lista de tabelas para limpar (exceto planos_assinatura e super_admins)
    const tablesToTruncate = [
      'membros',
      'igrejas',
      'informacoes_pessoais',
      'criancas',
      'ministerios',
      'ministerio_funcoes',
      'ministerio_voluntarios',
      'eventos',
      'evento_participantes',
      'escalas_servico',
      'escala_voluntarios',
      'demandas_ministerios',
      'devocionais',
      'devocional_curtidas',
      'devocional_comentarios',
      'cursos',
      'cursos_modulos',
      'cursos_aulas',
      'cursos_inscricoes',
      'trilhas_crescimento',
      'etapas_trilha',
      'passos_etapa',
      'quiz_perguntas',
      'progresso_membros',
      'transac Let me fix the import issues and ensure the system uses only one database connection.

<dyad-write path="src/components/management/VoluntarioDetailsModal.tsx" description="Fixes the import path to use the unified Supabase client.">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Voluntario } from "./VoluntarioCard";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  voluntario: Voluntario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VoluntarioDetailsModal = ({ voluntario, open, onOpenChange }: Props) => {
  if (!voluntario) return null;

  async function removerVoluntario() {
    if (!voluntario.id) return;
    await supabase.from("ministerio_voluntarios").delete().eq("id", voluntario.id);
    onOpenChange(false);
  }

  async function tornarLider() {
    if (!voluntario.id) return;
    await supabase.from("ministerio_voluntarios").update({ papel: "lider" }).eq("id", voluntario.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar {voluntario.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Papel atual: {voluntario.papel}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={tornarLider}>
              Definir como Líder
            </Button>
            <Button variant="destructive" onClick={removerVoluntario}>
              Remover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};