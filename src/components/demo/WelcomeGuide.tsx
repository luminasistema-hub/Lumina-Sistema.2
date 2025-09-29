import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Users, 
  Heart, 
  TestTube, 
  BookOpen, 
  DollarSign, 
  Calendar, 
  Baby, 
  Church,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react'

const WelcomeGuide = () => {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Mostrar guia apenas uma vez por sessão
    const hasShownGuide = sessionStorage.getItem(`guide-shown-${user?.id}`)
    if (user && !hasShownGuide) {
      setTimeout(() => {
        setIsOpen(true)
        sessionStorage.setItem(`guide-shown-${user?.id}`, 'true')
      }, 2000)
    }
  }, [user])

  const steps = [
    {
      title: 'Bem-vindo ao Sistema Connect Vida!',
      description: 'Este é um sistema completo de gestão eclesiástica em modo demonstração.',
      icon: <Sparkles className="w-8 h-8 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Você está logado como <strong>{user?.name}</strong> com perfil de <strong>{user?.role}</strong>.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🎯 O que você pode fazer:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Explore todas as funcionalidades disponíveis para seu perfil</li>
              <li>• Teste o sistema com dados fictícios pré-carregados</li>
              <li>• Navegue entre os módulos usando o menu lateral</li>
              <li>• Experimente diferentes tipos de usuário fazendo logout</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Módulos Principais',
      description: 'Conheça os principais módulos do sistema baseados no seu perfil.',
      icon: <Church className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Heart className="w-4 h-4" />, name: 'Área Pessoal', desc: 'Informações e jornada' },
            { icon: <TestTube className="w-4 h-4" />, name: 'Teste Vocacional', desc: '40 perguntas, 8 ministérios' },
            { icon: <BookOpen className="w-4 h-4" />, name: 'Crescimento', desc: 'Cursos, eventos, devocionais' },
            { icon: <DollarSign className="w-4 h-4" />, name: 'Financeiro', desc: 'Ofertas e gestão completa' },
            { icon: <Calendar className="w-4 h-4" />, name: 'Eventos', desc: 'Criação e inscrições' },
            { icon: <Baby className="w-4 h-4" />, name: 'Kids', desc: 'Gestão de crianças' }
          ].map((module, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-blue-600">{module.icon}</div>
                <span className="font-medium text-sm">{module.name}</span>
              </div>
              <p className="text-xs text-gray-600">{module.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Começar Exploração',
      description: 'Pronto para começar? Vamos começar pela área pessoal!',
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">🚀 Próximos Passos:</h4>
            <ol className="text-sm text-green-800 space-y-2">
              <li>1. Comece preenchendo suas informações pessoais</li>
              <li>2. Faça o teste vocacional para descobrir seu ministério</li>
              <li>3. Explore os cursos e devocionais disponíveis</li>
              <li>4. Experimente fazer contribuições</li>
              <li>5. Teste diferentes tipos de usuário (logout e login com outras credenciais)</li>
            </ol>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Este guia não aparecerá novamente nesta sessão.
            </p>
            <Button className="bg-green-500 hover:bg-green-600">
              Começar Exploração
            </Button>
          </div>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsOpen(false)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            {currentStepData.icon}
            <div>
              <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
              <DialogDescription className="text-base">
                {currentStepData.description}
              </DialogDescription>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          {currentStepData.content}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>
          
          <Badge className="bg-purple-100 text-purple-800">
            {currentStep + 1} de {steps.length}
          </Badge>
          
          <Button onClick={nextStep}>
            {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WelcomeGuide