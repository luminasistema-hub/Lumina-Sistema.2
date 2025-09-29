import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import { 
  Baby, 
  Plus, 
  Users, 
  Clock, 
  Shield,
  Heart,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  UserX,
  Search,
  Filter,
  Calendar,
  Phone,
  MapPin,
  Edit,
  Eye,
  QrCode
} from 'lucide-react'

interface Kid {
  id: string
  churchId: string // Adicionado para multi-igrejas
  nome_crianca: string
  idade: number
  data_nascimento: string
  responsavel: {
    id: string
    nome: string
    telefone: string
    email?: string
  }
  informacoes_especiais?: string
  alergias?: string
  medicamentos?: string
  autorizacao_fotos: boolean
  contato_emergencia?: {
    nome: string
    telefone: string
    parentesco: string
  }
  status_checkin?: 'Presente' | 'Ausente'
  ultimo_checkin?: string
  codigo_seguranca?: string
}

interface CheckinRecord {
  id: string
  churchId: string // Adicionado para multi-igrejas
  crianca_id: string
  data_checkin: string
  data_checkout?: string
  responsavel_checkin: string
  responsavel_checkout?: string
  codigo_seguranca: string
  observacoes?: string
}

const KidsPage = () => {
  const { user, currentChurchId } = useAuthStore() // Obter user e currentChurchId
  const [kids, setKids] = useState<Kid[]>([])
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
  const [isAddKidDialogOpen, setIsAddKidDialogOpen] = useState(false)
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAge, setFilterAge] = useState('all')
  const [viewMode, setViewMode] = useState<'kids' | 'checkin' | 'reports'>('kids')

  const canManageKids = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'

  const [newKid, setNewKid] = useState({
    nome_crianca: '',
    idade: 0,
    data_nascimento: '',
    responsavel_nome: '',
    responsavel_telefone: '',
    responsavel_email: '',
    informacoes_especiais: '',
    alergias: '',
    medicamentos: '',
    autorizacao_fotos: true,
    contato_emergencia_nome: '',
    contato_emergencia_telefone: '',
    contato_emergencia_parentesco: ''
  })

  // Mock data
  useEffect(() => {
    if (currentChurchId) {
      const storedKids = localStorage.getItem(`kids-${currentChurchId}`)
      const storedCheckinRecords = localStorage.getItem(`checkinRecords-${currentChurchId}`)
      if (storedKids) {
        setKids(JSON.parse(storedKids))
      } else {
        const mockKids: Kid[] = [
          {
            id: '1',
            churchId: currentChurchId,
            nome_crianca: 'Ana Sofia',
            idade: 7,
            data_nascimento: '2018-05-15',
            responsavel: {
              id: '1',
              nome: 'Maria Santos',
              telefone: '(11) 99999-9999',
              email: 'maria@email.com'
            },
            alergias: 'Alergia a amendoim',
            informacoes_especiais: 'Criança muito tímida, precisa de atenção especial',
            autorizacao_fotos: true,
            status_checkin: 'Presente',
            ultimo_checkin: '2025-09-11T09:00:00',
            codigo_seguranca: 'AS123'
          },
          {
            id: '2',
            churchId: currentChurchId,
            nome_crianca: 'Pedro Lucas',
            idade: 5,
            data_nascimento: '2020-03-20',
            responsavel: {
              id: '2',
              nome: 'Carlos Silva',
              telefone: '(11) 88888-8888'
            },
            medicamentos: 'Bronchodilator - usar em caso de crise asmática',
            autorizacao_fotos: false,
            status_checkin: 'Ausente'
          }
        ]
        setKids(mockKids)
        localStorage.setItem(`kids-${currentChurchId}`, JSON.stringify(mockKids))
      }
      if (storedCheckinRecords) {
        setCheckinRecords(JSON.parse(storedCheckinRecords))
      }
    } else {
      setKids([])
      setCheckinRecords([])
    }
  }, [currentChurchId, user])

  const handleAddKid = () => {
    if (!newKid.nome_crianca || !newKid.responsavel_nome || !newKid.responsavel_telefone) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.')
      return
    }

    const kid: Kid = {
      id: Date.now().toString(),
      churchId: currentChurchId,
      nome_crianca: newKid.nome_crianca,
      idade: newKid.idade,
      data_nascimento: newKid.data_nascimento,
      responsavel: {
        id: user?.id || '',
        nome: newKid.responsavel_nome,
        telefone: newKid.responsavel_telefone,
        email: newKid.responsavel_email
      },
      informacoes_especiais: newKid.informacoes_especiais,
      alergias: newKid.alergias,
      medicamentos: newKid.medicamentos,
      autorizacao_fotos: newKid.autorizacao_fotos,
      contato_emergencia: newKid.contato_emergencia_nome ? {
        nome: newKid.contato_emergencia_nome,
        telefone: newKid.contato_emergencia_telefone,
        parentesco: newKid.contato_emergencia_parentesco
      } : undefined,
      status_checkin: 'Ausente'
    }

    const updatedKids = [...kids, kid]
    setKids(updatedKids)
    localStorage.setItem(`kids-${currentChurchId}`, JSON.stringify(updatedKids))

    setIsAddKidDialogOpen(false)
    // Reset form
    setNewKid({
      nome_crianca: '',
      idade: 0,
      data_nascimento: '',
      responsavel_nome: '',
      responsavel_telefone: '',
      responsavel_email: '',
      informacoes_especiais: '',
      alergias: '',
      medicamentos: '',
      autorizacao_fotos: true,
      contato_emergencia_nome: '',
      contato_emergencia_telefone: '',
      contato_emergencia_parentesco: ''
    })
    toast.success('Criança cadastrada com sucesso!')
  }

  const handleCheckin = (kidId: string) => {
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.')
      return
    }
    const codigo = Math.random().toString(36).substr(2, 6).toUpperCase()
    
    const updatedKids = kids.map(kid => 
      kid.id === kidId 
        ? { 
            ...kid, 
            status_checkin: 'Presente' as const,
            ultimo_checkin: new Date().toISOString(),
            codigo_seguranca: codigo
          }
        : kid
    )
    setKids(updatedKids)
    localStorage.setItem(`kids-${currentChurchId}`, JSON.stringify(updatedKids))

    const checkinRecord: CheckinRecord = {
      id: Date.now().toString(),
      churchId: currentChurchId,
      crianca_id: kidId,
      data_checkin: new Date().toISOString(),
      responsavel_checkin: user?.name || '',
      codigo_seguranca: codigo
    }

    const updatedCheckinRecords = [...checkinRecords, checkinRecord]
    setCheckinRecords(updatedCheckinRecords)
    localStorage.setItem(`checkinRecords-${currentChurchId}`, JSON.stringify(updatedCheckinRecords))

    toast.success(`Check-in realizado! Código: ${codigo}`)
  }

  const handleCheckout = (kidId: string) => {
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.')
      return
    }
    const updatedKids = kids.map(kid => 
      kid.id === kidId 
        ? { ...kid, status_checkin: 'Ausente' as const }
        : kid
    )
    setKids(updatedKids)
    localStorage.setItem(`kids-${currentChurchId}`, JSON.stringify(updatedKids))

    const updatedCheckinRecords = checkinRecords.map(record => 
      record.crianca_id === kidId && !record.data_checkout
        ? { 
            ...record, 
            data_checkout: new Date().toISOString(),
            responsavel_checkout: user?.name || ''
          }
        : record
    )
    setCheckinRecords(updatedCheckinRecords)
    localStorage.setItem(`checkinRecords-${currentChurchId}`, JSON.stringify(updatedCheckinRecords))

    toast.success('Check-out realizado com sucesso!')
  }

  const getAgeGroup = (idade: number) => {
    if (idade <= 3) return 'Berçário'
    if (idade <= 6) return 'Infantil'
    if (idade <= 10) return 'Juniores'
    return 'Pré-adolescentes'
  }

  const getAgeGroupColor = (idade: number) => {
    if (idade <= 3) return 'bg-pink-100 text-pink-800'
    if (idade <= 6) return 'bg-blue-100 text-blue-800'
    if (idade <= 10) return 'bg-green-100 text-green-800'
    return 'bg-purple-100 text-purple-800'
  }

  const filteredKids = kids.filter(kid => {
    const matchesSearch = kid.nome_crianca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kid.responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAge = filterAge === 'all' || 
                      (filterAge === 'bercario' && kid.idade <= 3) ||
                      (filterAge === 'infantil' && kid.idade > 3 && kid.idade <= 6) ||
                      (filterAge === 'juniores' && kid.idade > 6 && kid.idade <= 10) ||
                      (filterAge === 'pre-adolescentes' && kid.idade > 10)

    return matchesSearch && matchesAge
  })

  const presentKids = kids.filter(kid => kid.status_checkin === 'Presente')
  const totalKids = kids.length

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar o ministério Kids.
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Kids 👶</h1>
        <p className="text-pink-100 text-base md:text-lg">
          Cuidando das crianças com amor e segurança
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-pink-600">{totalKids}</div>
              <div className="text-sm text-gray-600">Total Kids</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{presentKids.length}</div>
              <div className="text-sm text-gray-600">Presentes</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">
                {kids.filter(k => k.alergias || k.medicamentos).length}
              </div>
              <div className="text-sm text-gray-600">Com Restrições</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                {checkinRecords.filter(r => !r.data_checkout).length}
              </div>
              <div className="text-sm text-gray-600">Check-ins Ativos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <TabsList className="grid w-full lg:w-auto grid-cols-3">
            <TabsTrigger value="kids">Crianças</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            {canManageKids && <TabsTrigger value="reports">Relatórios</TabsTrigger>}
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar criança..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterAge} onValueChange={setFilterAge}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Faixa etária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as idades</SelectItem>
                <SelectItem value="bercario">Berçário (0-3)</SelectItem>
                <SelectItem value="infantil">Infantil (4-6)</SelectItem>
                <SelectItem value="juniores">Juniores (7-10)</SelectItem>
                <SelectItem value="pre-adolescentes">Pré-adolescentes (11+)</SelectItem>
              </SelectContent>
            </Select>

            {canManageKids && (
              <Dialog open={isAddKidDialogOpen} onOpenChange={setIsAddKidDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-500 hover:bg-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Adicionar Kid</span>
                    <span className="sm:hidden">Adicionar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Criança</DialogTitle>
                    <DialogDescription>
                      Preencha as informações da criança
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome_crianca">Nome da Criança *</Label>
                        <Input
                          id="nome_crianca"
                          value={newKid.nome_crianca}
                          onChange={(e) => setNewKid({...newKid, nome_crianca: e.target.value})}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                        <Input
                          id="data_nascimento"
                          type="date"
                          value={newKid.data_nascimento}
                          onChange={(e) => {
                            const birthDate = new Date(e.target.value)
                            const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                            setNewKid({...newKid, data_nascimento: e.target.value, idade: age})
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="responsavel_nome">Nome do Responsável *</Label>
                        <Input
                          id="responsavel_nome"
                          value={newKid.responsavel_nome}
                          onChange={(e) => setNewKid({...newKid, responsavel_nome: e.target.value})}
                          placeholder="Nome do pai/mãe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responsavel_telefone">Telefone *</Label>
                        <Input
                          id="responsavel_telefone"
                          value={newKid.responsavel_telefone}
                          onChange={(e) => setNewKid({...newKid, responsavel_telefone: e.target.value})}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alergias">Alergias</Label>
                      <Textarea
                        id="alergias"
                        value={newKid.alergias}
                        onChange={(e) => setNewKid({...newKid, alergias: e.target.value})}
                        placeholder="Descreva alergias alimentares ou medicamentosas"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medicamentos">Medicamentos</Label>
                      <Textarea
                        id="medicamentos"
                        value={newKid.medicamentos}
                        onChange={(e) => setNewKid({...newKid, medicamentos: e.target.value})}
                        placeholder="Medicamentos de uso contínuo ou de emergência"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="informacoes_especiais">Informações Especiais</Label>
                      <Textarea
                        id="informacoes_especiais"
                        value={newKid.informacoes_especiais}
                        onChange={(e) => setNewKid({...newKid, informacoes_especiais: e.target.value})}
                        placeholder="Comportamento, necessidades especiais, etc."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autorizacao_fotos"
                        checked={newKid.autorizacao_fotos}
                        onCheckedChange={(checked) => setNewKid({...newKid, autorizacao_fotos: checked as boolean})}
                      />
                      <Label htmlFor="autorizacao_fotos">Autorizo fotos e vídeos para divulgação</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddKidDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddKid}>
                        Cadastrar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent value="kids" className="space-y-4">
          <div className="grid gap-4">
            {filteredKids.map((kid) => (
              <Card key={kid.id} className="border-0 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{kid.nome_crianca}</h3>
                        <div className="flex gap-2">
                          <Badge className={getAgeGroupColor(kid.idade)}>
                            {getAgeGroup(kid.idade)} • {kid.idade} anos
                          </Badge>
                          {kid.status_checkin === 'Presente' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Presente
                            </Badge>
                          )}
                          {kid.codigo_seguranca && (
                            <Badge variant="outline">
                              <QrCode className="w-3 h-3 mr-1" />
                              {kid.codigo_seguranca}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{kid.responsavel.nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{kid.responsavel.telefone}</span>
                        </div>
                        {kid.ultimo_checkin && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(kid.ultimo_checkin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>

                      {(kid.alergias || kid.medicamentos || kid.informacoes_especiais) && (
                        <div className="space-y-2">
                          {kid.alergias && (
                            <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-red-800">Alergias:</span>
                                <span className="text-sm text-red-700 ml-1">{kid.alergias}</span>
                              </div>
                            </div>
                          )}
                          {kid.medicamentos && (
                            <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                              <Shield className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-yellow-800">Medicamentos:</span>
                                <span className="text-sm text-yellow-700 ml-1">{kid.medicamentos}</span>
                              </div>
                            </div>
                          )}
                          {kid.informacoes_especiais && (
                            <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                              <Heart className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-blue-800">Informações:</span>
                                <span className="text-sm text-blue-700 ml-1">{kid.informacoes_especiais}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {kid.status_checkin === 'Ausente' && canManageKids && (
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleCheckin(kid.id)}
                        >
                          <UserCheck className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Check-in</span>
                        </Button>
                      )}
                      {kid.status_checkin === 'Presente' && canManageKids && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCheckout(kid.id)}
                        >
                          <UserX className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Check-out</span>
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                      {canManageKids && (
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredKids.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 md:p-12 text-center">
                <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma criança encontrada</h3>
                <p className="text-gray-600">
                  {searchTerm || filterAge !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Cadastre a primeira criança do ministério kids'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="checkin" className="space-y-4">
          <div className="text-center py-8">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sistema de Check-in</h3>
            <p className="text-gray-600">
              Funcionalidade de check-in em desenvolvimento
            </p>
          </div>
        </TabsContent>

        {canManageKids && (
          <TabsContent value="reports" className="space-y-4">
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Relatórios Kids</h3>
              <p className="text-gray-600">
                Relatórios e estatísticas em desenvolvimento
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default KidsPage