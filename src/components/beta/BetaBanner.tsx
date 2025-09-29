import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { 
  Sparkles, 
  TestTube, 
  CheckCircle, 
  Clock, 
  Users,
  Zap,
  Shield,
  Heart,
  X
} from 'lucide-react'
import { useState } from 'react'

const BetaBanner = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  if (!isVisible) return null

  const features = [
    { icon: <Users className="w-4 h-4" />, title: "Gestão de Membros", status: "Completo" },
    { icon: <Heart className="w-4 h-4" />, title: "Área Pessoal", status: "Completo" },
    { icon: <TestTube className="w-4 h-4" />, title: "Teste Vocacional", status: "Completo" },
    { icon: <Zap className="w-4 h-4" />, title: "Crescimento Espiritual", status: "Completo" },
    { icon: <Shield className="w-4 h-4" />, title: "Sistema Financeiro", status: "Completo" },
    { icon: <Clock className="w-4 h-4" />, title: "Gestão de Eventos", status: "Completo" }
  ]

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-white/20 text-white border-white/30">
              <Sparkles className="w-3 h-3 mr-1" />
              BETA
            </Badge>
            <span className="text-sm font-medium">
              🎉 Sistema Connect Vida em modo demonstração - Todas as funcionalidades disponíveis!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
                  Ver Recursos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Sistema Connect Vida - Versão Beta
                  </DialogTitle>
                  <DialogDescription>
                    Explore todas as funcionalidades do sistema de gestão eclesiástica mais completo do Brasil
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-green-600">
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{feature.title}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-700">{feature.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🚀 Recursos Demonstrados:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 8 tipos diferentes de usuário com permissões específicas</li>
                      <li>• Teste vocacional com 40 perguntas para 8 ministérios</li>
                      <li>• Jornada completa do membro desde conversão até liderança</li>
                      <li>• Sistema financeiro com orçamentos, metas e relatórios</li>
                      <li>• Plataforma EAD com cursos, avaliações e certificados</li>
                      <li>• Blog de devocionais com sistema de comentários</li>
                      <li>• Gestão completa de eventos e inscrições</li>
                      <li>• Módulo Kids com check-in/check-out seguro</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">🎯 Como Testar:</h4>
                    <p className="text-sm text-purple-800">
                      Use as credenciais da tela de login para testar diferentes níveis de acesso. 
                      Cada tipo de usuário tem funcionalidades específicas baseadas na hierarquia eclesiástica.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
              className="text-white hover:bg-white/10 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Spacer para compensar o banner fixo */}
      <div className="h-16"></div>
    </>
  )
}

export default BetaBanner