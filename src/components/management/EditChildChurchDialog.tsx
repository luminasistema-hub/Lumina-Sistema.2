import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

type ChildItem = {
  id: string;
  nome: string;
  created_at: string;
  metrics?: {
    members: number;
    leaders: number;
    ministries: number;
  };
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ChildItem | null;
  onSaved: () => void;
}

const EditChildChurchDialog: React.FC<Props> = ({ open, onOpenChange, child, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [form, setForm] = useState({
    nome: child?.nome || '',
    nome_responsavel: '',
    email: '',
    telefone_contato: '',
    endereco: '',
    cnpj: '',
    panel_password: ''
  });

  React.useEffect(() => {
    // Carregar dados atuais da igreja (campos extras)
    const load = async () => {
      if (!child?.id || !open) return;
      const { data, error } = await supabase
        .from('igrejas')
        .select('nome, nome_responsavel, email, telefone_contato, endereco, cnpj, panel_password')
        .eq('id', child.id)
        .maybeSingle();
      if (error) {
        toast.error('Erro ao carregar dados da igreja.');
        return;
      }
      setForm({
        nome: data?.nome || '',
        nome_responsavel: data?.nome_responsavel || '',
        email: data?.email || '',
        telefone_contato: data?.telefone_contato || '',
        endereco: data?.endereco || '',
        cnpj: data?.cnpj || '',
        panel_password: data?.panel_password || ''
      });
    };
    load();
  }, [child?.id, open]);

  const handleSave = async () => {
    if (!child?.id) return;
    if (!form.nome || !form.nome_responsavel || !form.email) {
      return toast.error('Preencha ao menos nome, responsável e email.');
    }
    setSaving(true);

    const { data: sessionRes } = await supabase.auth.getSession();
    const token = sessionRes?.session?.access_token;

    const { data, error } = await supabase.functions.invoke('update-child-church', {
      body: {
        churchId: child.id,
        nome: form.nome,
        nome_responsavel: form.nome_responsavel,
        email: form.email,
        telefone_contato: form.telefone_contato,
        endereco: form.endereco,
        cnpj: form.cnpj,
        panel_password: form.panel_password,
      },
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    setSaving(false);

    if (error) {
      let serverMsg = error.message;
      const raw = (error as any)?.context?.body;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) serverMsg = parsed.error;
        } catch {
          serverMsg = raw;
        }
      }
      return toast.error('Erro ao salvar alterações: ' + serverMsg);
    }
    toast.success('Igreja atualizada com sucesso!');
    onOpenChange(false);
    onSaved();
  };

  const handleResetPastorAccess = async () => {
    if (!child?.id) return;
    setResetting(true);
    const { data: sessionRes } = await supabase.auth.getSession();
    const token = sessionRes?.session?.access_token;

    const { data, error } = await supabase.functions.invoke('reset-child-pastor-access', {
      body: { churchId: child.id },
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    setResetting(false);

    if (error) {
      let serverMsg = error.message;
      const raw = (error as any)?.context?.body;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) serverMsg = parsed.error;
        } catch {
          serverMsg = raw;
        }
      }
      toast.error('Falha ao resetar acesso do pastor: ' + serverMsg);
      return;
    }
    toast.success('Acesso do pastor resetado! Use o e-mail da igreja e a "Senha do Painel".');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-auto sm:max-w-lg md:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Igreja Filha</DialogTitle>
          <DialogDescription>
            Gerencie dados da igreja filha e o acesso do pastor. Preencha e salve antes de resetar o acesso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Campos responsivos */}
          <div className="space-y-2">
            <Label>Nome da Igreja</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Responsável (Pastor)</Label>
            <Input value={form.nome_responsavel} onChange={(e) => setForm({ ...form, nome_responsavel: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.telefone_contato} onChange={(e) => setForm({ ...form, telefone_contato: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Senha do Painel</Label>
            <Input value={form.panel_password} onChange={(e) => setForm({ ...form, panel_password: e.target.value })} />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="secondary" onClick={handleResetPastorAccess} disabled={resetting} className="w-full sm:w-auto">
              {resetting ? 'Resetando...' : 'Resetar acesso do Pastor'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditChildChurchDialog;