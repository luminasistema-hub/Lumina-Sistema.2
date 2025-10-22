import { useState } from 'react'
import { useSchools, useUserEnrollments, useEnrollInSchool, useUnenrollFromSchool } from '@/hooks/useSchools'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { BookOpen, Users, Calendar, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const SchoolsPage = () => {
  const { user } = useAuthStore()
  const { data: schools, isLoading: schoolsLoading, error: schoolsError } = useSchools()
  const { data: enrollments, isLoading: enrollmentsLoading, error: enrollmentsError } = useUserEnrollments()
  const enrollMutation = useEnrollInSchool()
  const unenrollMutation = useUnenrollFromSchool()
  
  const [selectedSchool, setSelectedSchool] = useState<any>(null)
  
  const userEnrollmentsMap = enrollments?.reduce((acc, enrollment) => {
    acc[enrollment.escola_id] = enrollment
    return acc
  }, {} as Record<string, any>) || {}

  const handleEnroll = (schoolId: string) => {
    enrollMutation.mutate(schoolId)
  }

  const handleUnenroll = (enrollmentId: string) => {
    unenrollMutation.mutate(enrollmentId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Escolas 📚</h1>
        <p className="text-blue-100 text-lg">
          Aprenda e cresça espiritualmente através de nossos cursos especializados
        </p>
      </div>

      {(schoolsLoading || enrollmentsLoading) && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {schoolsError && (
        <div className="text-red-500 p-4 text-center">
          Erro ao carregar escolas: {schoolsError.message}
        </div>
      )}

      {enrollmentsError && (
        <div className="text-red-500 p-4 text-center">
          Erro ao carregar inscrições: {enrollmentsError.message}
        </div>
      )}

      {schools && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => {
            const enrollment = userEnrollmentsMap[school.id]
            
            return (
              <Card key={school.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{school.nome}</CardTitle>
                      <Badge className="bg-blue-100 text-blue-800">
                        {school.compartilhar_com_filhas ? 'Compartilhada' : 'Local'}
                      </Badge>
                    </div>
                    <BookOpen className="w-6 h-6 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {school.descricao || 'Nenhuma descrição fornecida'}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>
                      {school.professor_nome || 'Professor não definido'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedSchool(school)}
                        >
                          Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{school.nome}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <h3 className="font-medium mb-2">Descrição</h3>
                            <p className="text-gray-600">
                              {school.descricao || 'Nenhuma descrição fornecida'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4" />
                            <span>
                              Professor: {school.professor_nome || 'Não definido'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Criada em: {formatDate(school.created_at)}
                            </span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {enrollment ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleUnenroll(enrollment.id)}
                        disabled={unenrollMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Inscrito
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleEnroll(school.id)}
                        disabled={enrollMutation.isPending}
                      >
                        Inscrever-se
                      </Button>
                    )}
                    
                    {enrollment && (
                      <Button 
                        size="sm" 
                        onClick={() => window.location.href = `/escolas/${school.id}`}
                      >
                        Acessar Aulas
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {schools && schools.length === 0 && !schoolsLoading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma escola disponível</h3>
            <p className="text-gray-600">
              Não há escolas cadastradas no momento. Verifique novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SchoolsPage