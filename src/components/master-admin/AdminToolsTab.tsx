import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { useChurchStore, Church } from '../../stores/churchStore';
import { Key, Mail, RefreshCw, Loader2, Users, Shield, AlertTriangle } from 'lucide-react';

interface AdminToolsTabProps {
  churches: Church[];
}

const AdminToolsTab: React.FC<AdminToolsTabProps> = ({ churches }) => {
  const [selectedChurchId, setSelectedChurchId] = useState<string>('');
  const [churchAdmins, setChurchAdmins] = useState<Array<{ id: string; email: string; name: string }>>([]);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState<string>('');
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const fetchChurchAdmins = async (churchId: string) => {
    setIsLoadingAdmins(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, email, nome_completo')
        .eq('id_igreja', churchId)
        .in('funcao', ['admin', 'pastor']); // Admins e Pastores podem ser considerados administradores da igreja

      if (error) throw error;

      setChurchAdmins(data.map(m => ({
        id: m.id,
        email: m.email,
        name: m.nome_completo || m.email,
      })));
      setSelectedAdminEmail(''); // Reset selected admin
    } catch (error: any) {
      console.error('Error fetching church admins:', error.message);
      toast.error('Erro ao carregar administradores da igreja: ' + error.message);
      setChurchAdmins([]);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (selectedChurchId) {
      fetchChurchAdmins(selectedChurchId);
    } else {
      setChurchAdmins([]);
    }
  }, [selectedChurchId]);

  const handleSendPasswordReset = async () => {
    if (!selectedAdminEmail) {
      toast.error('Selecione um administrador para enviar a redefinição de senha.');
      return;
    }

    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.admin.generatePasswordResetLink(selectedAdminEmail);

      if (error) throw error;

      toast.success(`Link de redefinição de senha enviado para ${selectedAdminEmail}!`);
    } catch (error: any) {
      console.error('Error sending password reset link:', error.message);
      toast.error('Erro ao enviar link de redefinição de senha: ' + error.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Ferramentas de Administração 🛠️</h1>
        <p className="opacity-90 mt-1">Utilitários para gerenciar igrejas e usuários.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-red-500" />
            Redefinição de Senha de Administrador
          </CardTitle>
          <CardDescription>
            Envie um link de redefinição de senha para os administradores de uma igreja específica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="select-church">Selecione a Igreja</Label>
            <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
              <SelectTrigger id="select-church">
                <SelectValue placeholder="Selecione uma igreja" />
              </SelectTrigger>
              <SelectContent>
                {churches.map(church => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedChurchId && (
            <div className="space-y-2">
              <Label htmlFor="select-admin">Selecione o Administrador</Label>
              <Select value={selectedAdminEmail} onValueChange={setSelectedAdminEmail} disabled={isLoadingAdmins}>
                <SelectTrigger id="select-admin">
                  {isLoadingAdmins ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando...
                    </div>
                  ) : (
                    <SelectValue placeholder="Selecione um administrador" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {churchAdmins.length === 0 ? (
                    <SelectItem value="" disabled>Nenhum administrador encontrado</SelectItem>
                  ) : (
                    churchAdmins.map(admin => (
                      <SelectItem key={admin.id} value={admin.email}>
                        {admin.name} ({admin.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {churchAdmins.length === 0 && !isLoadingAdmins && selectedChurchId && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Nenhum administrador ou pastor encontrado para esta igreja.
                </p>
              )}
            </div>
          )}

          <Button 
            onClick={handleSendPasswordReset} 
            disabled={!selectedAdminEmail || isSendingReset}
            className="bg-red-500 hover:bg-red-600"
          >
            {isSendingReset ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </div>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Link de Redefinição
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Outras ferramentas de administração podem ser adicionadas aqui */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Gerenciamento de Usuários (Global)
          </CardTitle>
          <CardDescription>
            Ferramentas para gerenciar usuários em todas as igrejas (em desenvolvimento).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Funcionalidades como desativar usuários globalmente, alterar roles entre igrejas, etc., serão adicionadas aqui.
          </p>
          <Button variant="outline" className="mt-4" disabled>
            <Shield className="w-4 h-4 mr-2" />
            Acessar Ferramentas Globais
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminToolsTab;