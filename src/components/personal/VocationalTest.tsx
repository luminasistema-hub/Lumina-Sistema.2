import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { toast } from 'sonner' // Importar toast
import { supabase } from '../../integrations/supabase/client' // Importar supabase client
import { 
  Brain, 
  Heart, 
  Target, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Info,
  Star,
  Award,
  Users,
  Mic,
  HandHeart,
  BookOpen,
  Baby,
  Calendar,
  Headphones,
  DollarSign
} from 'lucide-react'

interface Question {
  id: number
  text: string
  ministry: string
}

interface MinistryResult {
  name: string
  score: number
  percentage: number
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  characteristics: string[]
  activities: string[]
}

const VocationalTest = () => {
  const { user, currentChurchId } = useAuthStore() // Obter user e currentChurchId
  const [currentStep, setCurrentStep] = useState<'intro' | 'test' | 'results'>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [results, setResults] = useState<MinistryResult[]>([])
  const [topMinistry, setTopMinistry] = useState<MinistryResult | null>(null)
  const [hasPreviousTest, setHasPreviousTest] = useState(false)
  const [isLoadingResults, setIsLoadingResults] = useState(true)

  // Perguntas do teste (5 para cada ministério)
  const questions: Question[] = [
    // Mídia e Tecnologia (1-5)
    { id: 1, text: "Tenho facilidade com equipamentos eletrônicos e tecnologia", ministry: "midia" },
    { id: 2, text: "Gosto de trabalhar com câmeras, som e iluminação", ministry: "midia" },
    { id: 3, text: "Me sinto confortável operando sistemas durante os cultos", ministry: "midia" },
    { id: 4, text: "Tenho interesse em produzir conteúdo digital para a igreja", ministry: "midia" },
    { id: 5, text: "Consigo solucionar problemas técnicos com facilidade", ministry: "midia" },

    // Louvor e Adoração (6-10)
    { id: 6, text: "Tenho dom musical (canto ou instrumento)", ministry: "louvor" },
    { id: 7, text: "Me sinto à vontade adorando publicamente", ministry: "louvor" },
    { id: 8, text: "Consigo conduzir outros em momentos de adoração", ministry: "louvor" },
    { id: 9, text: "Tenho facilidade para aprender música rapidamente", ministry: "louvor" },
    { id: 10, text: "A música é uma forma natural de expressar minha fé", ministry: "louvor" },

    // Diaconato (11-15)
    { id: 11, text: "Gosto de servir e ajudar pessoas em necessidade", ministry: "diaconato" },
    { id: 12, text: "Tenho facilidade para identificar quem precisa de ajuda", ministry: "diaconato" },
    { id: 13, text: "Me disponho a tarefas práticas de apoio na igreja", ministry: "diaconato" },
    { id: 14, text: "Consigo organizar e coordenar ações de ajuda", ministry: "diaconato" },
    { id: 15, text: "Sinto alegria em suprir necessidades dos outros", ministry: "diaconato" },

    // Integração (16-20)
    { id: 16, text: "Gosto de receber e conhecer pessoas novas", ministry: "integracao" },
    { id: 17, text: "Tenho facilidade para fazer novos membros se sentirem bem-vindos", ministry: "integracao" },
    { id: 18, text: "Consigo identificar visitantes e me aproximar deles", ministry: "integracao" },
    { id: 19, text: "Me sinto confortável apresentando a igreja para outros", ministry: "integracao" },
    { id: 20, text: "Tenho dom para criar ambiente acolhedor", ministry: "integracao" },

    // Ensino e Discipulado (21-25)
    { id: 21, text: "Gosto de estudar e ensinar a Palavra de Deus", ministry: "ensino" },
    { id: 22, text: "Tenho facilidade para explicar conceitos bíblicos", ministry: "ensino" },
    { id: 23, text: "Consigo adaptar o ensino para diferentes idades", ministry: "ensino" },
    { id: 24, text: "Me sinto chamado a discipular outras pessoas", ministry: "ensino" },
    { id: 25, text: "Tenho paciência para acompanhar o crescimento espiritual dos outros", ministry: "ensino" },

    // Kids (26-30)
    { id: 26, text: "Gosto de trabalhar com crianças", ministry: "kids" },
    { id: 27, text: "Tenho paciência e criatividade para ensinar crianças", ministry: "kids" },
    { id: 28, text: "Consigo manter a atenção das crianças durante as atividades", ministry: "kids" },
    { id: 29, text: "Me sinto confortável cuidando de grupos de crianças", ministry: "kids" },
    { id: 30, text: "Tenho facilidade para criar atividades lúdicas e educativas", ministry: "kids" },

    // Organização e Administração (31-35)
    { id: 31, text: "Gosto de organizar eventos e atividades", ministry: "organizacao" },
    { id: 32, text: "Tenho facilidade para planejar e coordenar projetos", ministry: "organizacao" },
    { id: 33, text: "Consigo gerenciar recursos e logística", ministry: "organizacao" },
    { id: 34, text: "Me sinto bem liderando equipes de trabalho", ministry: "organizacao" },
    { id: 35, text: "Tenho atenção aos detalhes e gosto de ver tudo funcionando bem", ministry: "organizacao" },

    // Ação Social (36-40)
    { id: 36, text: "Tenho coração para ajudar pessoas em situação de vulnerabilidade", ministry: "acao_social" },
    { id: 37, text: "Gosto de participar de projetos sociais e comunitários", ministry: "acao_social" },
    { id: 38, text: "Tenho facilidade para mobilizar recursos para causas sociais", ministry: "acao_social" },
    { id: 39, text: "Me sinto chamado a levar esperança para comunidades carentes", ministry: "acao_social" },
    { id: 40, text: "Consigo ver as necessidades sociais ao meu redor", ministry: "acao_social" }
  ]

  const ministryData = {
    midia: {
      name: 'Mídia e Tecnologia',
      description: 'Você tem o perfil para trabalhar com equipamentos, tecnologia e produção de conteúdo para amplificar a mensagem do Reino.',
      icon: <Headphones className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      characteristics: [
        'Facilidade com tecnologia',
        'Atenção aos detalhes técnicos',
        'Criatividade digital',
        'Capacidade de trabalhar sob pressão'
      ],
      activities: [
        'Operação de som e vídeo',
        'Produção de conteúdo digital',
        'Transmissão ao vivo',
        'Manutenção de equipamentos'
      ]
    },
    louvor: {
      name: 'Louvor e Adoração',
      description: 'Você tem o dom musical e a capacidade de conduzir outros à presença de Deus através da música e adoração.',
      icon: <Mic className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      characteristics: [
        'Dom musical',
        'Coração adorador',
        'Capacidade de liderança musical',
        'Sensibilidade espiritual'
      ],
      activities: [
        'Ministração em cultos',
        'Ensaios e preparação musical',
        'Ministração em eventos especiais',
        'Mentoria de novos músicos'
      ]
    },    diaconato: {
      name: 'Diaconato',
      description: 'Você tem o coração servo e a capacidade de identificar e suprir necessidades práticas das pessoas.',
      icon: <HandHeart className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      characteristics: [
        'Coração servo',
        'Sensibilidade às necessidades',
        'Organização prática',
        'Disponibilidade para servir'
      ],
      activities: [
        'Apoio em eventos',
        'Assistência a necessitados',
        'Organização de campanhas',
        'Suporte logístico'
      ]
    },
    integracao: {
      name: 'Integração',
      description: 'Você tem o dom da hospitalidade e a capacidade de fazer novos membros se sentirem acolhidos na família da fé.',
      icon: <Users className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      characteristics: [
        'Dom da hospitalidade',
        'Facilidade de relacionamento',
        'Empatia natural',
        'Capacidade de acolhimento'
      ],
      activities: [
        'Recepção de visitantes',
        'Acompanhamento de novos membros',
        'Organização de eventos de integração',
        'Criação de vínculos comunitários'
      ]
    },
    ensino: {
      name: 'Ensino e Discipulado',
      description: 'Você tem o dom do ensino e a capacidade de transmitir conhecimento bíblico de forma clara e transformadora.',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
      characteristics: [
        'Dom do ensino',
        'Conhecimento bíblico',
        'Paciência pedagógica',
        'Capacidade de comunicação'
      ],
      activities: [
        'Ensino em grupos pequenos',
        'Discipulado individual',
        'Preparação de materiais didáticos',
        'Coordenação de cursos'
      ]
    },
    kids: {
      name: 'Kids',
      description: 'Você tem o coração voltado para as crianças e a capacidade de impactar a próxima geração para Cristo.',
      icon: <Baby className="w-6 h-6" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 border-pink-200',
      characteristics: [
        'Amor genuíno por crianças',
        'Criatividade pedagógica',
        'Paciência especial',
        'Energia e dinamismo'
      ],
      activities: [
        'Ensino para crianças',
        'Organização de atividades lúdicas',
        'Desenvolvimento de materiais infantis',
        'Eventos especiais kids'
      ]
    },
    organizacao: {
      name: 'Organização e Administração',
      description: 'Você tem o dom administrativo e a capacidade de planejar, organizar e coordenar projetos e eventos.',
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 border-slate-200',
      characteristics: [
        'Dom administrativo',
        'Capacidade de planejamento',
        'Liderança organizacional',
        'Visão estratégica'
      ],
      activities: [
        'Planejamento de eventos',
        'Coordenação de projetos',
        'Gestão de recursos',
        'Desenvolvimento de processos'
      ]
    },
    acao_social: {
      name: 'Ação Social',
      description: 'Você tem o coração voltado para a justiça social e a capacidade de levar esperança às comunidades necessitadas.',
      icon: <Heart className="w-6 h-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      characteristics: [
        'Sensibilidade social',
        'Compaixão pelos necessitados',
        'Capacidade mobilizadora',
        'Visão transformacional'
      ],
      activities: [
        'Projetos comunitários',
        'Campanhas de arrecadação',
        'Visitação e assistência',
        'Parcerias sociais'
      ]
    }
  }

  useEffect(() => {
    const loadPreviousTest = async () => {
      if (!user?.id) {
        setIsLoadingResults(false);
        return;
      }

      console.log('VocationalTest: Loading previous test results for user:', user.id);
      const { data, error } = await supabase
        .from('testes_vocacionais')
        .select('*')
        .eq('membro_id', user.id)
        .eq('is_ultimo', true)
        .maybeSingle(); // Alterado para .maybeSingle()

      if (error) {
        console.error('VocationalTest: Error loading previous test:', error);
        toast.error('Erro ao carregar teste vocacional anterior.');
        setIsLoadingResults(false);
        return;
      }

      if (data) {
        console.log('VocationalTest: Previous test found:', data);
        setHasPreviousTest(true);
        
        const ministryScores: Record<string, number> = {
          midia: data.soma_midia || 0,
          louvor: data.soma_louvor || 0,
          diaconato: data.soma_diaconato || 0,
          integracao: data.soma_integra || 0,
          ensino: data.soma_ensino || 0,
          kids: data.soma_kids || 0,
          organizacao: data.soma_organizacao || 0,
          acao_social: data.soma_acao_social || 0
        };

        const calculatedResults: MinistryResult[] = Object.keys(ministryScores).map(ministryKey => {
          const score = ministryScores[ministryKey];
          const maxScore = 25; // 5 perguntas x 5 pontos max
          const percentage = (score / maxScore) * 100;
          
          return {
            ...ministryData[ministryKey as keyof typeof ministryData],
            score,
            percentage: Math.round(percentage)
          };
        });

        calculatedResults.sort((a, b) => b.score - a.score);
        setResults(calculatedResults);
        setTopMinistry(calculatedResults[0]);
        setCurrentStep('results');
      } else {
        console.log('VocationalTest: No previous test found.');
        setHasPreviousTest(false);
      }
      setIsLoadingResults(false);
    };

    if (user?.id) {
      loadPreviousTest();
    } else {
      setIsLoadingResults(false);
    }
  }, [user?.id]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: parseInt(value) }))
  }

  const calculateAndSaveResults = async () => {
    if (!user || !currentChurchId) {
      toast.error('Erro: Usuário ou igreja não identificados.')
      return
    }

    console.log('Calculating vocational test results and saving to Supabase...');
    
    const ministryScores: Record<string, number> = {
      midia: 0,
      louvor: 0,
      diaconato: 0,
      integracao: 0,
      ensino: 0,
      kids: 0,
      organizacao: 0,
      acao_social: 0
    }

    // Calcular pontuação por ministério
    questions.forEach(question => {
      const answer = answers[question.id] || 0
      ministryScores[question.ministry] += answer
    })

    // Converter para resultados
    const calculatedResults: MinistryResult[] = Object.keys(ministryScores).map(ministryKey => {
      const score = ministryScores[ministryKey]
      const maxScore = 25 // 5 perguntas x 5 pontos max
      const percentage = (score / maxScore) * 100
      
      return {
        ...ministryData[ministryKey as keyof typeof ministryData],
        score,
        percentage: Math.round(percentage)
      }
    })

    // Ordenar por pontuação
    calculatedResults.sort((a, b) => b.score - a.score)
    
    setResults(calculatedResults)
    setTopMinistry(calculatedResults[0])

    // Preparar dados para inserção no Supabase
    const testDataToSave: any = {
      membro_id: user.id,
      data_teste: new Date().toISOString().split('T')[0],
      soma_midia: ministryScores.midia,
      soma_louvor: ministryScores.louvor,
      soma_diaconato: ministryScores.diaconato,
      soma_integra: ministryScores.integracao,
      soma_ensino: ministryScores.ensino,
      soma_kids: ministryScores.kids,
      soma_organizacao: ministryScores.organizacao,
      soma_acao_social: ministryScores.acao_social,
      ministerio_recomendado: calculatedResults[0].name,
      is_ultimo: true, // Será ajustado pelo trigger
    };

    // Adicionar respostas individuais
    questions.forEach(q => {
      testDataToSave[`q${q.id}`] = answers[q.id] || 0;
    });

    const { data, error } = await supabase
      .from('testes_vocacionais')
      .insert([testDataToSave])
      .select()
      .single();

    if (error) {
      console.error('VocationalTest: Error saving test results to Supabase:', error);
      toast.error('Erro ao salvar os resultados do teste.');
      return;
    }

    console.log('VocationalTest: Test results saved to Supabase:', data);
    setHasPreviousTest(true);
    setCurrentStep('results');
    toast.success('Teste vocacional concluído e resultados salvos!');
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      calculateAndSaveResults()
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const restartTest = () => {
    setCurrentStep('intro')
    setCurrentQuestion(0)
    setAnswers({})
    setResults([])
    setTopMinistry(null)
    setHasPreviousTest(false)
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para realizar o teste vocacional.
      </div>
    )
  }

  if (isLoadingResults) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-lg text-gray-600">Carregando resultados anteriores...</p>
      </div>
    );
  }

  // Intro Screen
  if (currentStep === 'intro') {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Teste Vocacional 🎯</h1>
          <p className="text-purple-100 text-lg">
            Descubra qual ministério combina com seus dons e talentos
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Brain className="w-6 h-6" />
              Como Funciona o Teste
            </CardTitle>
            <CardDescription className="text-base">
              Um questionário científico para identificar sua vocação ministerial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Sobre o Teste
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <span>40 perguntas cuidadosamente elaboradas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <span>5 perguntas específicas para cada ministério</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <span>Resultado automático e personalizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <span>Orientações para seu próximo passo</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Ministérios Avaliados
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(ministryData).map((ministry, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className={`${ministry.color}`}>
                        {ministry.icon}
                      </div>
                      <span className="font-medium text-sm">{ministry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Como Responder</h4>
              <p className="text-blue-800 text-sm mb-3">
                Para cada afirmação, avalie o quanto ela se aplica a você usando a escala de 1 a 5:
              </p>
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="text-center p-2 bg-red-100 text-red-800 rounded">
                  <div className="font-bold">1</div>
                  <div>Discordo totalmente</div>
                </div>
                <div className="text-center p-2 bg-orange-100 text-orange-800 rounded">
                  <div className="font-bold">2</div>
                  <div>Discordo parcialmente</div>
                </div>
                <div className="text-center p-2 bg-yellow-100 text-yellow-800 rounded">
                  <div className="font-bold">3</div>
                  <div>Neutro</div>
                </div>
                <div className="text-center p-2 bg-blue-100 text-blue-800 rounded">
                  <div className="font-bold">4</div>
                  <div>Concordo parcialmente</div>
                </div>
                <div className="text-center p-2 bg-green-100 text-green-800 rounded">
                  <div className="font-bold">5</div>
                  <div>Concordo totalmente</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={() => setCurrentStep('test')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 text-lg px-8 py-3"
              >
                Começar Teste
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Test Screen
  if (currentStep === 'test') {
    const currentQ = questions[currentQuestion]
    const isLastQuestion = currentQuestion === questions.length - 1
    const canProceed = answers[currentQ.id] !== undefined

    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teste Vocacional</h1>
              <p className="text-gray-600">Pergunta {currentQuestion + 1} de {questions.length}</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
              {Math.round(progress)}% concluído
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {currentQ.text}
              </h2>
              <p className="text-gray-600">
                O quanto esta afirmação se aplica a você?
              </p>
            </div>

            <RadioGroup
              value={answers[currentQ.id]?.toString() || ""}
              onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
              className="space-y-4"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value={value.toString()} id={`option-${value}`} />
                  <Label htmlFor={`option-${value}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {value === 1 && 'Discordo totalmente'}
                        {value === 2 && 'Discordo parcialmente'}
                        {value === 3 && 'Neutro'}
                        {value === 4 && 'Concordo parcialmente'}
                        {value === 5 && 'Concordo totalmente'}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              
              <Button
                onClick={nextQuestion}
                disabled={!canProceed}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isLastQuestion ? 'Ver Resultados' : 'Próxima'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Results Screen
  if (currentStep === 'results') {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Seus Resultados 🏆</h1>
          <p className="text-green-100 text-lg">
            Descobrimos qual ministério combina mais com você!
          </p>
        </div>

        {/* Top Result */}
        {topMinistry && (
          <Card className={`border-2 ${topMinistry.bgColor} shadow-lg`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${topMinistry.bgColor} rounded-full flex items-center justify-center ${topMinistry.color}`}>
                    {topMinistry.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Seu Ministério Recomendado</CardTitle>
                    <CardDescription className="text-lg font-semibold">
                      {topMinistry.name}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                  <Award className="w-4 h-4 mr-1" />
                  {topMinistry.percentage}% compatível
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                {topMinistry.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Suas Características:</h4>
                  <ul className="space-y-2">
                    {topMinistry.characteristics.map((char, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Atividades do Ministério:</h4>
                  <ul className="space-y-2">
                    {topMinistry.activities.map((activity, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  Próximos Passos:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    Falar com Líder do Ministério
                  </Button>
                  <Button variant="outline">
                    Ver Cronograma de Treinamento
                  </Button>
                  <Button variant="outline">
                    Participar como Voluntário
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Todos os Resultados
            </CardTitle>
            <CardDescription>
              Sua compatibilidade com todos os ministérios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 ${result.bgColor} rounded-full flex items-center justify-center ${result.color}`}>
                  {result.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{result.name}</h3>
                    <span className="text-sm font-semibold">{result.percentage}%</span>
                  </div>
                  <Progress value={result.percentage} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={restartTest} variant="outline">
            Fazer Teste Novamente
          </Button>
          <Button className="bg-green-500 hover:bg-green-600">
            Salvar e Continuar Jornada
          </Button>
        </div>
      </div>
    )
  }

  return null
}

export default VocationalTest