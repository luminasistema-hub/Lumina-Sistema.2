import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { 
  User, 
  MapPin, 
  Heart, 
  Users, 
  Church, 
  Calendar,
  Phone,
  Mail,
  Save,
  Edit,
  CheckCircle
} from 'lucide-react'

interface PersonalInfoData {
  // Dados Pessoais
  nomeCompleto: string
  dataNascimento: string
  estadoCivil: string
  profissao: string
  telefone: string
  email: string
  
  // Endereço
  endereco: string
  cidade: string
  estado: string
  cep: string
  
  // Informações Familiares
  conjuge: string
  filhos: Array<{nome: string, idade: string}>
  paisCristaos: string
  familiarNaIgreja: string
  
  // Informações Ministeriais
  tempoIgreja: string
  batizado: boolean
  dataBatismo: string
  participaMinisterio: boolean
  ministerioAtual: string
  experienciaAnterior: string
  
  // Informações Espirituais
  decisaoCristo: string
  dataConversao: string
  testemunho: string
  
  // Disponibilidade
  diasDisponiveis: string[]
  horariosDisponiveis: string
  interesseMinisterio: string[]
}

const PersonalInfo = () => {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isFirstAccess, setIsFirstAccess] = useState(true)
  const [formData, setFormData] = useState<PersonalInfoData>({
    nomeCompleto: user?.name || '',
    dataNascimento: '',
    estadoCivil: '',
    profissao: '',
    telefone: '',
    email: user?.email || '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    conjuge: '',
    filhos: [],
    paisCristaos: '',
    familiarNaIgreja: '',
    tempoIgreja: '',
    batizado: false,
    dataBatismo: '',
    participaMinisterio: false,
    ministerioAtual: '',
    experienciaAnterior: '',
    decisaoCristo: '',
    dataConversao: '',
    testemunho: '',
    diasDisponiveis: [],
    horariosDisponiveis: '',
    interesseMinisterio: []
  })

  useEffect(() => {
    console.log('PersonalInfo component mounted for user:', user?.name)
    // Simular verificação se é primeiro acesso
    const hasCompletedProfile = localStorage.getItem(`profile-${user?.id}`)
    if (hasCompletedProfile) {
      setIsFirstAccess(false)
      setFormData(JSON.parse(hasCompletedProfile))
    } else {
      setIsEditing(true)
    }
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addFilho = () => {
    setFormData(prev => ({
      ...prev,
      filhos: [...prev.filhos, { nome: '', idade: '' }]
    }))
  }

  const removeFilho = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filhos: prev.filhos.filter((_, i) => i !== index)
    }))
  }

  const handleFilhoChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      filhos: prev.filhos.map((filho, i) => 
        i === index ? { ...filho, [field]: value } : filho
      )
    }))
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof PersonalInfoData] as string[]), value]
        : (prev[field as keyof PersonalInfoData] as string[]).filter(item => item !== value)
    }))
  }

  const handleSave = () => {
    console.log('Saving personal info:', formData)
    
    // Validação básica
    if (!formData.nomeCompleto || !formData.telefone || !formData.endereco) {
      toast.error('Por favor, preencha os campos obrigatórios')
      return
    }

    // Salvar dados
    localStorage.setItem(`profile-${user?.id}`, JSON.stringify(formData))
    setIsFirstAccess(false)
    setIsEditing(false)
    toast.success('Informações salvas com sucesso!')
  }

  const estadosBrasil = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  const ministerios = [
    'Louvor e Adoração', 'Mídia e Tecnologia', 'Diaconato', 'Integração',
    'Ensino e Discipulado', 'Kids', 'Organização', 'Ação Social'
  ]

  const diasSemana = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 
    'Sexta-feira', 'Sábado', 'Domingo'
  ]

  if (isFirstAccess && isEditing) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo(a), {user?.name}! 🙏</h1>
          <p className="text-blue-100 text-lg">
            Para começarmos, precisamos conhecer você melhor. Preencha suas informações pessoais.
          </p>
        </div>

        <form className="space-y-8">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Informações básicas sobre você</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estadoCivil">Estado Civil</Label>
                <Select value={formData.estadoCivil} onValueChange={(value) => handleInputChange('estadoCivil', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissao">Profissão</Label>
                <Input
                  id="profissao"
                  value={formData.profissao}
                  onChange={(e) => handleInputChange('profissao', e.target.value)}
                  placeholder="Sua profissão"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </CardTitle>
              <CardDescription>Onde você mora</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  placeholder="Sua cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosBrasil.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações Familiares */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Informações Familiares
              </CardTitle>
              <CardDescription>Sobre sua família</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.estadoCivil === 'casado' && (
                <div className="space-y-2">
                  <Label htmlFor="conjuge">Nome do Cônjuge</Label>
                  <Input
                    id="conjuge"
                    value={formData.conjuge}
                    onChange={(e) => handleInputChange('conjuge', e.target.value)}
                    placeholder="Nome do seu cônjuge"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Filhos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFilho}>
                    Adicionar Filho
                  </Button>
                </div>
                {formData.filhos.map((filho, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome do filho"
                      value={filho.nome}
                      onChange={(e) => handleFilhoChange(index, 'nome', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Idade"
                        value={filho.idade}
                        onChange={(e) => handleFilhoChange(index, 'idade', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFilho(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paisCristaos">Seus pais são cristãos?</Label>
                  <Select value={formData.paisCristaos} onValueChange={(value) => handleInputChange('paisCristaos', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim, ambos</SelectItem>
                      <SelectItem value="um">Apenas um</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="nao-sei">Não sei</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="familiarNaIgreja">Tem familiares na igreja?</Label>
                  <Input
                    id="familiarNaIgreja"
                    value={formData.familiarNaIgreja}
                    onChange={(e) => handleInputChange('familiarNaIgreja', e.target.value)}
                    placeholder="Quem trouxe você ou quem conhece"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Ministeriais e Espirituais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="w-5 h-5" />
                Vida Espiritual e Ministerial
              </CardTitle>
              <CardDescription>Sua jornada com Cristo e na igreja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="decisaoCristo">Como conheceu Jesus?</Label>
                  <Select value={formData.decisaoCristo} onValueChange={(value) => handleInputChange('decisaoCristo', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="familia">Através da família</SelectItem>
                      <SelectItem value="amigos">Através de amigos</SelectItem>
                      <SelectItem value="igreja">Em um culto/igreja</SelectItem>
                      <SelectItem value="evento">Em um evento evangelístico</SelectItem>
                      <SelectItem value="midia">Através de mídia (TV, internet)</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataConversao">Data da Conversão</Label>
                  <Input
                    id="dataConversao"
                    type="date"
                    value={formData.dataConversao}
                    onChange={(e) => handleInputChange('dataConversao', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testemunho">Testemunho (Opcional)</Label>
                <Textarea
                  id="testemunho"
                  value={formData.testemunho}
                  onChange={(e) => handleInputChange('testemunho', e.target.value)}
                  placeholder="Conte brevemente sua história com Jesus..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempoIgreja">Há quanto tempo frequenta a igreja?</Label>
                  <Select value={formData.tempoIgreja} onValueChange={(value) => handleInputChange('tempoIgreja', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primeiro-dia">É meu primeiro dia</SelectItem>
                      <SelectItem value="menos-1-mes">Menos de 1 mês</SelectItem>
                      <SelectItem value="1-3-meses">1 a 3 meses</SelectItem>
                      <SelectItem value="3-6-meses">3 a 6 meses</SelectItem>
                      <SelectItem value="6-12-meses">6 meses a 1 ano</SelectItem>
                      <SelectItem value="1-2-anos">1 a 2 anos</SelectItem>
                      <SelectItem value="mais-2-anos">Mais de 2 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="batizado"
                      checked={formData.batizado}
                      onCheckedChange={(checked) => handleInputChange('batizado', checked)}
                    />
                    <Label htmlFor="batizado">Sou batizado</Label>
                  </div>
                  {formData.batizado && (
                    <Input
                      type="date"
                      value={formData.dataBatismo}
                      onChange={(e) => handleInputChange('dataBatismo', e.target.value)}
                      placeholder="Data do batismo"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="participaMinisterio"
                    checked={formData.participaMinisterio}
                    onCheckedChange={(checked) => handleInputChange('participaMinisterio', checked)}
                  />
                  <Label htmlFor="participaMinisterio">Participo ou participei de algum ministério</Label>
                </div>

                {formData.participaMinisterio && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ministerioAtual">Ministério Atual/Anterior</Label>
                      <Input
                        id="ministerioAtual"
                        value={formData.ministerioAtual}
                        onChange={(e) => handleInputChange('ministerioAtual', e.target.value)}
                        placeholder="Nome do ministério"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experienciaAnterior">Experiência</Label>
                      <Textarea
                        id="experienciaAnterior"
                        value={formData.experienciaAnterior}
                        onChange={(e) => handleInputChange('experienciaAnterior', e.target.value)}
                        placeholder="Descreva sua experiência..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disponibilidade e Interesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Disponibilidade e Interesses
              </CardTitle>
              <CardDescription>Quando você pode servir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Dias da semana disponíveis:</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {diasSemana.map(dia => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox
                        id={dia}
                        checked={formData.diasDisponiveis.includes(dia)}
                        onCheckedChange={(checked) => handleCheckboxChange('diasDisponiveis', dia, checked as boolean)}
                      />
                      <Label htmlFor={dia} className="text-sm">{dia}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horariosDisponiveis">Horários Disponíveis</Label>
                <Select value={formData.horariosDisponiveis} onValueChange={(value) => handleInputChange('horariosDisponiveis', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã (6h às 12h)</SelectItem>
                    <SelectItem value="tarde">Tarde (12h às 18h)</SelectItem>
                    <SelectItem value="noite">Noite (18h às 23h)</SelectItem>
                    <SelectItem value="manha-tarde">Manhã e Tarde</SelectItem>
                    <SelectItem value="tarde-noite">Tarde e Noite</SelectItem>
                    <SelectItem value="qualquer">Qualquer horário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Ministérios de interesse:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ministerios.map(ministerio => (
                    <div key={ministerio} className="flex items-center space-x-2">
                      <Checkbox
                        id={ministerio}
                        checked={formData.interesseMinisterio.includes(ministerio)}
                        onCheckedChange={(checked) => handleCheckboxChange('interesseMinisterio', ministerio, checked as boolean)}
                      />
                      <Label htmlFor={ministerio} className="text-sm">{ministerio}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
              <Save className="w-4 h-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informações Pessoais</h1>
          <p className="text-gray-600">Seus dados pessoais e ministeriais</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Perfil Completo
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Resumo das Informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{formData.nomeCompleto}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado Civil</p>
              <p className="font-medium">{formData.estadoCivil || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Profissão</p>
              <p className="font-medium">{formData.profissao || 'Não informado'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Church className="w-5 h-5" />
              Vida Espiritual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Tempo na Igreja</p>
              <p className="font-medium">{formData.tempoIgreja || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Batizado</p>
              <p className="font-medium">{formData.batizado ? 'Sim' : 'Não'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Participa de Ministério</p>
              <p className="font-medium">{formData.participaMinisterio ? 'Sim' : 'Não'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5" />
              Interesses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Ministérios de Interesse</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.interesseMinisterio.length > 0 ? (
                  formData.interesseMinisterio.slice(0, 2).map(ministerio => (
                    <Badge key={ministerio} variant="outline" className="text-xs">
                      {ministerio}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Nenhum informado</p>
                )}
                {formData.interesseMinisterio.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{formData.interesseMinisterio.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditing && (
        <div className="space-y-6">
          {/* Formulário de edição aqui... */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalInfo