import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import PersonalInfo from '../personal/PersonalInfo'
import MemberJourney from '../personal/MemberJourney'
import VocationalTest from '../personal/VocationalTest'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  User, 
  GraduationCap, 
  Heart,
  ArrowLeft
} from 'lucide-react'

interface PersonalAreaPageProps {
  activeModule: string
  onBack: () => void
}

const PersonalAreaPage = ({ activeModule, onBack }: PersonalAreaPageProps) => {
  const { user } = useAuthStore()

  const modules = [
    {
      id: 'personal-info',
      title: 'Informações Pessoais',
      description: 'Dados pessoais, familiares e ministeriais',
      icon: <User className="w-5 h-5" />,
      component: PersonalInfo
    },
    {
      id: 'member-journey',
      title: 'Jornada do Membro',
      description: 'Acompanhe seu crescimento espiritual',
      icon: <GraduationCap className="w-5 h-5" />,
      component: MemberJourney
    },
    {
      id: 'vocational-test',
      title: 'Teste Vocacional',
      description: 'Descubra seu chamado ministerial',
      icon: <Heart className="w-5 h-5" />,
      component: VocationalTest
    }
  ]

  const currentModule = modules.find(m => m.id === activeModule)

  if (currentModule) {
    const Component = currentModule.component
    return <Component />
  }

  // Module selection screen (fallback)
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Área Pessoal 👤</h1>
        <p className="text-blue-100 text-lg">
          Gerencie suas informações pessoais e acompanhe sua jornada espiritual
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module) => (
          <div
            key={module.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                {module.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                <Badge variant="outline" className="text-xs">
                  Disponível
                </Badge>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">{module.description}</p>
            <Button size="sm" className="w-full">
              Acessar
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PersonalAreaPage