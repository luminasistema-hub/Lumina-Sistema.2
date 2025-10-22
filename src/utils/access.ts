import { AVAILABLE_PERMISSIONS, type PermissionId } from '@/constants/permissions';
import type { UserRole } from '@/stores/authStore';

export function getRolePermissionPreset(role: UserRole): PermissionId[] {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return AVAILABLE_PERMISSIONS.map(p => p.id);
    case 'pastor':
      return [
        'member-management',
        'ministries',
        'events-management',
        'devotionals-management',
        'order-of-service',
        'journey-config',
        'financial-panel',
        'kids-management',
        'notification-management',
      ];
    case 'lider_ministerio':
      return [
        'ministries',
        'order-of-service',
        'events-management',
        'devotionals-management',
      ];
    case 'financeiro':
      return ['financial-panel'];
    case 'gestao_kids':
      return ['kids-management'];
    case 'integra':
      return ['member-management', 'journey-config'];
    case 'midia_tecnologia':
      return ['order-of-service'];
    case 'voluntario':
    case 'membro':
    case 'gc_membro':
    case 'gc_lider':
    default:
      return [];
  }
}