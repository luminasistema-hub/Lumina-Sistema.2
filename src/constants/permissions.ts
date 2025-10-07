export type PermissionId =
  | 'member-management'
  | 'ministries'
  | 'events-management'
  | 'devotionals-management'
  | 'order-of-service'
  | 'journey-config'
  | 'financial-panel'
  | 'kids-management'
  | 'notification-management'
  | 'system-settings';

export const AVAILABLE_PERMISSIONS: { id: PermissionId; label: string }[] = [
  { id: 'member-management', label: 'Gestão de Membros' },
  { id: 'ministries', label: 'Gestão de Ministério' },
  { id: 'events-management', label: 'Gestão de Eventos' },
  { id: 'devotionals-management', label: 'Gestão de Devocionais' },
  { id: 'order-of-service', label: 'Ordem de Culto/Eventos' },
  { id: 'journey-config', label: 'Configuração da Jornada' },
  { id: 'financial-panel', label: 'Painel Financeiro' },
  { id: 'kids-management', label: 'Gestão Kids' },
  { id: 'notification-management', label: 'Gestão de Notificações' },
  { id: 'system-settings', label: 'Configurações do Sistema' },
];