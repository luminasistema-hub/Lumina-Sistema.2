import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

type Role = { id: string; nome: string; descricao?: string | null };

interface Props {
  ministryId: string;
  churchId: string;
  onRolesChanged?: (roles: Role[]) => void;
}

const MinistryRolesManager = ({ ministryId, churchId, onRolesChanged }: Props) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRoles = useCallback(async () => {
    if (!ministryId) return;
    const { data, error } = await supabase
      .from('ministerio_funcoes')
      .select('id, nome, descricao')
      .eq('ministerio_id', ministryId)
      .order('nome');
    if (error) {
      console.error(error);
      toast.error('Erro ao carregar funções do ministério.');
      return;
    }
    const list = (data || []) as Role[];
    setRoles(list);
    onRolesChanged?.(list);
  }, [ministryId, onRolesChanged]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe um nome para a função.');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('ministerio_funcoes')
      .insert({
        nome: name.trim(),
        descricao: desc.trim() || null,
        ministerio_id: ministryId,
        id_igreja: churchId,
      });
    setLoading(false);
    if (error) {
      console.error(error);
      toast.error('Não foi possível criar a função.');
      return;
    }
    toast.success('Função criada com sucesso!');
    setName('');
    setDesc('');
    loadRoles();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funções do Ministério</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            placeholder="Nome da função (ex: Fotógrafo, Projeção, Transmissão)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Descrição (opcional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" /> Criar Função
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {roles.length > 0 ? (
            roles.map((r) => (
              <Badge key={r.id} variant="outline" className="truncate max-w-xs">
                {r.nome}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-gray-500">Nenhuma função criada ainda.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MinistryRolesManager;