export interface Participant {
  id: string;
  evento_id: string;
  membro_id: string;
  membro_nome?: string;
  presente: boolean;
}

export interface Event {
  id: string;
  id_igreja: string;
  nome: string;
  data_hora: string;
  local: string | null;
  descricao: string | null;
  tipo: string;
  imagem_capa: string | null;
  link_externo: string | null;
  valor: number;
  vagas: number | null;
  created_at: string;
  participantes: Participant[];
}

export type NewEvent = Omit<Event, 'id' | 'created_at' | 'participantes' | 'id_igreja'>;