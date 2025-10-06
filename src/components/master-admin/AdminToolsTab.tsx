import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { useChurchStore } from '../../stores/churchStore';
import { Key, Mail, RefreshCw, Loader2, Users, Shield, AlertTriangle, Save, Server, Cpu, HardDrive, Wifi, Database, Trash2 } from 'lucide-react';
import PaymentIntegrationSettings from './PaymentIntegrationSettings';

interface AdminToolsTabProps {
  churches: Church[];
  onUpdateChurch: (churchId: string, updates: Partial<Church>) => Promise<void>;
}

const AdminToolsTab: React.FC<AdminToolsTabProps> = ({ churches, onUpdateChurch }) => {
  const { user } = useAuthStore();
  const [selectedChurchId, setSelectedChurchId] = useState<string>('');
  const [churchAdmins, setChurchAdmins] = useState<Array<{ id: string; email: string; name: string }>>([]);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState<string>('');
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { getChurchById } = useChurchStore();

  const [serverConfig, setServerConfig] = useState({
    server_memory_limit: '512 MB',
    server_execution_timeout: '30 segundos',
  });

  const [dbConfig, setDbConfig] = useState({
    db_connection_pool: '10 conexões',
    db_query_cache_mb: 128,
  });

  useEffect(() => {
    if (selectedChurchId) {
      fetchChurchAdmins(selectedChurchId);
      const church = getChurchById(selectedChurchId);
      if (church) {
        setServerConfig({
          server_memory_limit: church.server_memory_limit || '512 MB',
          server_execution_timeout: church.server_execution_timeout || '30 segundos',
        });
        setDbConfig({
          db_connection_pool: church.db_connection_pool || '10 conexões',
          db_query_cache_mb: church.db_query_cache_mb || 128,
        });
      }
    } else {
      setChurchAdmins([]);
      setSelectedAdminEmail('');
      setServerConfig({ server_memory_limit: '512 MB', server_execution_timeout: '30 segundos' });
      setDbConfig({ db_connection_pool: '10 conexões', db_query_cache_mb: 128 });
    }
  }, [selectedChurchId, churches, getChurchById]);

  const fetchChurchAdmins = async (churchId: string) => {
    setIsLoadingAdmins(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, email, nome_completo')
        .eq('id_igreja', churchId)
        .in('funcao', ['admin', 'pastor']);

      if (error) throw error;

      setChurchAdmins(data.map(m => ({
        id: m.id,
        email: m.email,
        name: m.nome_completo || m.email,
      })));
      setSelectedAdminEmail('');
    } catch (error: any) {
      console.error('Error fetching church admins:', error.message);
      toast.error('Erro ao carregar administradores da igreja: ' + error.message);
      setChurchAdmins([]);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!selectedAdminEmail) {
      toast.error('Selecione um administrador para enviar a redefinição de senha.');
      return;
    }

    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(selectedAdminEmail);

      if (error) throw error;

      toast.success(`Link de redefinição de senha enviado para ${selectedAdminEmail}!`);
    } catch (error: any) {
      console.error('Error sending password reset link:', error.message);
      toast.error('Erro ao enviar link de redefinição de senha: ' + error.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSaveAdvancedSettings = async () => {
    if (!selectedChurchId) {
      toast.error('Selecione uma igreja para salvar as configurações avançadas.');
      return;
    }

    try {
      await onUpdateChurch(selectedChurchId, {
        server_memory_limit: serverConfig.server_memory_limit,
        server_execution_timeout: serverConfig.server_execution_timeout,
        db_connection_pool: dbConfig.db_connection_pool,
        db_query_cache_mb: dbConfig.db_query_cache_mb,
      });
      toast.success('Configurações avançadas salvas com sucesso!');
    } catch (error) {
      console.error('Error saving advanced settings:', error);
      toast.error('Erro ao salvar configurações avançadas.');
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o cache do sistema? Isso removerá dados temporários e fará logout de todos os usuários.')) {
      return;
    }

    try {
      // Limpa cache do navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Limpa localStorage e sessionStorage (exceto auth)
      const preserveKeys = ['connect-vida-auth', 'connect-vida-churches'];
      Object.keys(localStorage).forEach(key => {
        if (!preserveKeys.some(preserveKey => key.includes(preserveKey))) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        sessionStorage.removeItem(key);
      });

      // Invalida queries do React Query
      if (window.queryClient) {
        window.queryClient.invalidateQueries();
      }

      toast.success('Cache limpo com sucesso!');
      
      // Recarrega a página para aplicar as mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Erro ao limpar cache.');
    }
  };

  const handleResetSystem = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso irá resetar TODO o sistema, removendo TODOS os dados de usuários, igrejas e configurações. Esta ação é IRREVERSÍVEL. Tem certeza absoluta?')) {
      return;
    }

    if (!confirm('⚠️ CONFIRMAÇÃO FINAL: Digite "RESETAR" para confirmar que você deseja apagar todos os dados do sistema:')) {
      return;
    }

    const confirmationText = prompt('Digite "RESETAR" para confirmar:');
    if (confirmationText !== 'RESETAR') {
      toast.error('Texto de confirmação incorreto. Operação cancelada.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Chama a função de reset do sistema
      const { error } = await supabase.functions.invoke('reset-system', {
        body: { confirm: true }
      });

      if (error) throw error;

      toast.success('Sistema resetado com sucesso! Redirecionando...');
      
      // Faz logout e redireciona
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      console.error('Error resetting system:', error);
      toast.error('Erro ao resetar sistema: ' + error.message);
    } finally {
      setIsLoading(false);
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
              <Select 
                value={selectedAdminEmail} 
                onValueChange={setSelectedAdminEmail} 
                disabled={isLoadingAdmins || churchAdmins.length === 0}
              >
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
                    <SelectItem value="no-admins" disabled>Nenhum administrador encontrado</SelectItem>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-500" />
            Configurações Avançadas da Igreja
          </CardTitle>
          <CardDescription>
            Ajuste configurações de servidor e banco de dados para a igreja selecionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="select-church-advanced">Selecione a Igreja</Label>
            <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
              <SelectTrigger id="select-church-advanced">
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
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Atenção</span>
                </div>
                <p className="text-sm text-yellow-800">
                  As configurações desta seção devem ser alteradas apenas por administradores experientes. 
                  Mudanças incorretas podem afetar o funcionamento do sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Configurações de Servidor</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Limite de Memória</Label>
                      <Select 
                        value={serverConfig.server_memory_limit} 
                        onValueChange={(value) => setServerConfig({...serverConfig, server_memory_limit: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="256 MB">256 MB</SelectItem>
                          <SelectItem value="512 MB">512 MB</SelectItem>
                          <SelectItem value="1 GB">1 GB</SelectItem>
                          <SelectItem value="2 GB">2 GB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Timeout de Execução</Label>
                      <Select 
                        value={serverConfig.server_execution_timeout} 
                        onValueChange={(value) => setServerConfig({...serverConfig, server_execution_timeout: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30 segundos">30 segundos</SelectItem>
                          <SelectItem value="60 segundos">60 segundos</SelectItem>
                          <SelectItem value="2 minutos">2 minutos</SelectItem>
                          <SelectItem value="5 minutos">5 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Configurações de Banco</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Pool de Conexões</Label>
                      <Select 
                        value={dbConfig.db_connection_pool} 
                        onValueChange={(value) => setDbConfig({...dbConfig, db_connection_pool: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5 conexões">5 conexões</SelectItem>
                          <SelectItem value="10 conexões">10 conexões</SelectItem>
                          <SelectItem value="20 conexões">20 conexões</SelectItem>
                          <SelectItem value="50 conexões">50 conexões</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Cache de Query (MB)</Label>
                      <Select 
                        value={dbConfig.db_query_cache_mb?.toString()} 
                        onValueChange={(value) => setDbConfig({...dbConfig, db_query_cache_mb: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="64">64 MB</SelectItem>
                          <SelectItem value="128">128 MB</SelectItem>
                          <SelectItem value="256">256 MB</SelectItem>
                          <SelectItem value="512">512 MB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Ações Críticas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="text-blue-600" onClick={handleClearCache}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpar Cache
                  </Button>
                  <Button variant="outline" className="text-orange-600">
                    <Database className="w-4 h-4 mr-2" />
                    Otimizar Banco
                  </Button>
                  <Button variant="outline" className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Cache
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveAdvancedSettings} disabled={!selectedChurchId}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações Avançadas
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <PaymentIntegrationSettings />

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

      {/* Nova seção de reset do sistema */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Reset do Sistema
          </CardTitle>
          <CardDescription className="text-red-700">
            ⚠️ AÇÃO PERIGOSA: Use apenas em casos extremos. Isso apagará TODOS os dados do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Esta ação irá remover permanentemente todos os usuários, igrejas, dados e configurações. 
              O sistema voltará ao estado inicial. Use com extrema cautela.
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleResetSystem}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetando...
              </div>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                RESETAR SISTEMA COMPLETO
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminToolsTab;