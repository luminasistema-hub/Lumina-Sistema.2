import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import UserManagement from './UserManagement'
import { 
  Settings, 
  Church, 
  Shield, 
  Bell, 
  Mail, 
  Database,
  Globe,
  Users,
  Lock,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Server,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react'

const SystemSettings = () => {
  const [churchSettings, setChurchSettings] = useState({
    nome: 'Igreja Connect Vida',
    endereco: 'Rua da Igreja, 123 - Centro - São Paulo/SP',
    telefone: '(11) 99999-9999',
    email: 'contato@conectvida.com',
    cnpj: '12.345.678/0001-90',
    pastor_principal: 'Pastor João Silva',
    site: 'https://www.conectvida.com',
    descricao: 'Uma igreja comprometida com o crescimento espiritual e a comunhão cristã.'
  })

  const [systemConfig, setSystemConfig] = useState({
    backup_automatico: true,
    notificacoes_email: true,
    logs_detalhados: true,
    manutencao_programada: false,
    ssl_habilitado: true,
    cache_habilitado: true,
    compressao_dados: true,
    monitoramento_ativo: true
  })

  const [securitySettings, setSecuritySettings] = useState({
    autenticacao_dois_fatores: false,
    senha_forte_obrigatoria: true,
    sessao_timeout: '60',
    tentativas_login: '5',
    bloqueio_temporario: '15',
    log_acessos: true
  })

  const [showApiKey, setShowApiKey] = useState(false)

  const handleSaveChurchSettings = () => {
    console.log('Salvando configurações da igreja:', churchSettings)
    toast.success('Configurações da igreja salvas com sucesso!')
  }

  const handleSaveSystemConfig = () => {
    console.log('Salvando configurações do sistema:', systemConfig)
    toast.success('Configurações do sistema atualizadas!')
  }

  const handleSaveSecurity = () => {
    console.log('Salvando configurações de segurança:', securitySettings)
    toast.success('Configurações de segurança atualizadas!')
  }

  const handleBackup = () => {
    toast.info('Iniciando backup do sistema...')
    setTimeout(() => {
      toast.success('Backup concluído com sucesso!')
    }, 3000)
  }

  const handleRestore = () => {
    toast.warning('Função de restauração será implementada na versão final')
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 to-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Configurações do Sistema ⚙️</h1>
        <p className="text-gray-100 text-base md:text-lg">
          Configurações avançadas e administração do Connect Vida
        </p>
      </div>

      <Tabs defaultValue="church" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="church">Igreja</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="church" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="w-5 h-5 text-purple-500" />
                Informações da Igreja
              </CardTitle>
              <CardDescription>
                Configure as informações básicas da sua igreja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Igreja</Label>
                  <Input
                    id="nome"
                    value={churchSettings.nome}
                    onChange={(e) => setChurchSettings({...churchSettings, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pastor">Pastor Principal</Label>
                  <Input
                    id="pastor"
                    value={churchSettings.pastor_principal}
                    onChange={(e) => setChurchSettings({...churchSettings, pastor_principal: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input
                  id="endereco"
                  value={churchSettings.endereco}
                  onChange={(e) => setChurchSettings({...churchSettings, endereco: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={churchSettings.telefone}
                    onChange={(e) => setChurchSettings({...churchSettings, telefone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={churchSettings.email}
                    onChange={(e) => setChurchSettings({...churchSettings, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={churchSettings.cnpj}
                    onChange={(e) => setChurchSettings({...churchSettings, cnpj: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site da Igreja</Label>
                <Input
                  id="site"
                  value={churchSettings.site}
                  onChange={(e) => setChurchSettings({...churchSettings, site: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={churchSettings.descricao}
                  onChange={(e) => setChurchSettings({...churchSettings, descricao: e.target.value})}
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveChurchSettings} className="bg-purple-500 hover:bg-purple-600">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações da Igreja
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configurações técnicas e funcionais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Funcionalidades</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Backup Automático</Label>
                      <p className="text-sm text-gray-600">Backup diário às 3:00</p>
                    </div>
                    <Switch
                      checked={systemConfig.backup_automatico}
                      onCheckedChange={(checked) => setSystemConfig({...systemConfig, backup_automatico: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-gray-600">Alertas do sistema</p>
                    </div>
                    <Switch
                      checked={systemConfig.notificacoes_email}
                      onCheckedChange={(checked) => setSystemConfig({...systemConfig, notificacoes_email: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Logs Detalhados</Label>
                      <p className="text-sm text-gray-600">Registro completo de ações</p>
                    </div>
                    <Switch
                      checked={systemConfig.logs_detalhados}
                      onCheckedChange={(checked) => setSystemConfig({...systemConfig, logs_detalhados: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Modo Manutenção</Label>
                      <p className="text-sm text-gray-600">Sistema temporariamente offline</p>
                    </div>
                    <Switch
                      checked={systemConfig.manutencao_programada}
                      onCheckedChange={(checked) => setSystemConfig({...systemConfig, manutencao_programada: checked})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Performance</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SSL Habilitado</Label>
                      <p className="text-sm text-gray-600">Conexão segura HTTPS</p>
                    </div>
                    <Switch
                      checked={systemConfig.ssl_habilitado}
                      onCheckedChange={(checked) => setSystemConfig({...systemConfig, ssl_habilitado: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cache Habilitado</Label>
                      <p className="text-sm text-gray-600">Melhora performance</p>
                    </div>
                    <Switch
                      checked={systemConfig.cache_habilitado}
                      onCheckedChange={(checked) => setSystemConfig({...systemConfig, cache_habilitado: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compressão de Dados</Label>
                      <p className="text-sm text-gray-600">Reduz tráfego de rede</p>
                    </div>
                    <Switch
                      checked={systemConfig.compressao_dados}
                      onCheckedChange={(checked) => setSystemConfig({...systemConfig, compressao_dados: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Monitoramento Ativo</Label>
                      <p className="text-sm text-gray-600">Acompanhamento em tempo real</p>
                    </div>
                    <Switch
                      checked={systemConfig.monitoramento_ativo}
                      onCheckedChange={(checked) => setSystemConfig({...systemConfig, monitoramento_ativo: checked})}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSystemConfig} className="bg-blue-500 hover:bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações do Sistema
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Configurações de segurança e controle de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Autenticação</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Autenticação Dois Fatores</Label>
                      <p className="text-sm text-gray-600">Segurança adicional</p>
                    </div>
                    <Switch
                      checked={securitySettings.autenticacao_dois_fatores}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, autenticacao_dois_fatores: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Senha Forte Obrigatória</Label>
                      <p className="text-sm text-gray-600">Mínimo 8 caracteres</p>
                    </div>
                    <Switch
                      checked={securitySettings.senha_forte_obrigatoria}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, senha_forte_obrigatoria: checked})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Timeout de Sessão (minutos)</Label>
                    <Select value={securitySettings.sessao_timeout} onValueChange={(value) => setSecuritySettings({...securitySettings, sessao_timeout: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="240">4 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Controle de Acesso</h4>
                  
                  <div className="space-y-2">
                    <Label>Tentativas de Login</Label>
                    <Select value={securitySettings.tentativas_login} onValueChange={(value) => setSecuritySettings({...securitySettings, tentativas_login: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 tentativas</SelectItem>
                        <SelectItem value="5">5 tentativas</SelectItem>
                        <SelectItem value="10">10 tentativas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bloqueio Temporário (minutos)</Label>
                    <Select value={securitySettings.bloqueio_temporario} onValueChange={(value) => setSecuritySettings({...securitySettings, bloqueio_temporario: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutos</SelectItem>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Log de Acessos</Label>
                      <p className="text-sm text-gray-600">Registrar tentativas de login</p>
                    </div>
                    <Switch
                      checked={securitySettings.log_acessos}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, log_acessos: checked})}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSecurity} className="bg-red-500 hover:bg-red-600">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações de Segurança
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-500" />
                Backup e Restauração
              </CardTitle>
              <CardDescription>
                Gerencie backups do sistema e restauração de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Backup Automático</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">Status: Ativo</span>
                    </div>
                    <p className="text-sm text-green-800 mb-3">
                      Último backup: 24/09/2025 às 03:00:00
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs text-green-700">
                        • Backup diário automático às 03:00
                      </div>
                      <div className="text-xs text-green-700">
                        • Retenção de 30 dias
                      </div>
                      <div className="text-xs text-green-700">
                        • Compressão automática
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Backup Manual</h4>
                  <div className="space-y-3">
                    <Button onClick={handleBackup} className="w-full bg-green-500 hover:bg-green-600">
                      <Download className="w-4 h-4 mr-2" />
                      Criar Backup Agora
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Backup
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-blue-600 hover:text-blue-700"
                      onClick={handleRestore}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Restaurar Sistema
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Gestão de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie todos os usuários do sistema, aprovar novos cadastros e definir permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-500" />
                Configurações Avançadas
              </CardTitle>
              <CardDescription>
                Configurações técnicas para administradores experientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      <Select defaultValue="512">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="256">256 MB</SelectItem>
                          <SelectItem value="512">512 MB</SelectItem>
                          <SelectItem value="1024">1 GB</SelectItem>
                          <SelectItem value="2048">2 GB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Timeout de Execução</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 segundos</SelectItem>
                          <SelectItem value="60">60 segundos</SelectItem>
                          <SelectItem value="120">2 minutos</SelectItem>
                          <SelectItem value="300">5 minutos</SelectItem>
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
                      <Select defaultValue="10">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 conexões</SelectItem>
                          <SelectItem value="10">10 conexões</SelectItem>
                          <SelectItem value="20">20 conexões</SelectItem>
                          <SelectItem value="50">50 conexões</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Cache de Query (MB)</Label>
                      <Select defaultValue="128">
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
                  <Button variant="outline" className="text-blue-600">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reiniciar Sistema
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SystemSettings