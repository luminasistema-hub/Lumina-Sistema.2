export interface Lesson {
  id: string;
  id_modulo: string;
  titulo: string;
  tipo: 'Video' | 'Texto' | 'PDF' | 'Quiz';
  conteudo?: string;
  duracao_minutos?: number;
  obrigatoria: boolean;
  ordem: number;
}

export interface CourseModule {
  id: string;
  id_curso: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  aulas: Lesson[];
}

export interface StudentInscription {
  id: string;
  id_curso: string;
  id_membro: string;
  data_inscricao: string;
  status: string;
  progresso: number;
  membro: {
    id: string;
    nome_completo: string;
    email: string;
  };
}

export interface Course {
  id: string;
  id_igreja: string;
  nome: string;
  descricao?: string;
  tipo: 'Presencial' | 'Online' | 'Híbrido';
  categoria?: 'Discipulado' | 'Liderança' | 'Teologia' | 'Ministério' | 'Evangelismo';
  nivel?: 'Básico' | 'Intermediário' | 'Avançado';
  professor?: {
    id: string;
    nome_completo: string;
  };
  duracao_horas?: number;
  status: 'Rascunho' | 'Ativo' | 'Pausado' | 'Finalizado';
  data_inicio?: string;
  data_fim?: string;
  modulos: CourseModule[];
  alunos_inscritos: StudentInscription[];
  certificado_disponivel: boolean;
  nota_minima_aprovacao?: number;
  valor?: number;
}

export type NewCourse = Omit<Course, 'id' | 'id_igreja' | 'modulos' | 'alunos_inscritos' | 'status' | 'professor'> & {
  professor_id?: string;
};