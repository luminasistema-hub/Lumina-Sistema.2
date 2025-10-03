import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AddEscalaDialog from './AddEscalaDialog';

// Interfaces
interface Escala {
  id: string;
  data_servico: string;
  observacoes: string;
  status: string;
  ministerio: { nome: string };
  evento: { nome: string };
  voluntarios: any[];
}

const ListaEscalas = () => {
  const { user, currentChurchId } = useAuthStore();
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const loadEscalas = async () => {
    if (!currentChurchId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('escalas_servico')
        .select(`
          *,
          ministerio:ministerios(nome),
          evento:eventos(nome),
          escala_voluntarios!inner(*)
        `)
        .eq('id_igreja', currentChurchId)
        .order('data_servico', { ascending: true });

      if (error) throw error;
      setEscalas(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar escalas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscalas();
  }, [currentChurchId]);

  const handleDeleteEscala = async (escalaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta escala?')) return;

    try {
      // Primeiro remove os voluntários da escala
      const { error: deleteVoluntariosError } = await supabase
        .from('escala_voluntarios')
        .delete()
        .eq('escala_id', escalaId);

      if (deleteVoluntariosError) throw deleteVoluntariosError;

      // Depois remove a escala
      const { error: deleteEscalaError } = await supabase
        .from('escalas_servico')
        .delete()
        .eq('id', escalaId);

      if (deleteEscalaError) throw deleteEscalaError;

      toast.success('Escala excluída com sucesso!');
      loadEscalas();
    } catch (error: any) {
      toast.error('Erro ao excluir escala: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Escalas de Serviço</h1>
        {(user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio') && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Escala
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {escalas.map((escala) => (
          <Card key={escala.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{escala.ministerio?.nome}</CardTitle>
                  <p className="text-sm text-gray-600">{escala.evento?.nome}</p>
                </div>
                <Badge variant={escala.status === 'Confirmado' ? 'default' : 'secondary'}>
                  {escala.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(escala.data_servico), 'PPP', { locale: ptBR })}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {escala.voluntarios?.length || 0} voluntários
                </div>

                {escala.observacoes && (
                  <p className="text-sm text-gray-600 italic">{escala.observacoes}</p>
                )}

                {(user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio') && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => handleDeleteEscala(escala.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {escalas.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma escala encontrada</h3>
              <p className="text-gray-600">
                {user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio' 
                  ? 'Crie sua primeira escala de serviço' 
                  : 'Nenhuma escala disponível no momento'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddEscalaDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        onEscalaAdded={loadEscalas}
      />
    </div>
  );
};

export default ListaEscalas;