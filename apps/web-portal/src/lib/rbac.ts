/**
 * RBAC (Role-Based Access Control) utilities for frontend
 * Standardized role system matching backend
 */

export type UserRole = 'super_admin' | 'owner' | 'admin' | 'editor' | 'viewer';

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 5,
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Map old roles to new standardized roles (for migration)
 */
export const ROLE_MIGRATION_MAP: Record<string, UserRole> = {
  org_owner: 'owner',
  org_admin: 'admin',
  org_operator: 'editor',
  org_viewer: 'viewer',
};

/**
 * Normalize a role value to the standard format
 */
export function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) return 'viewer';
  
  const normalized = role.toLowerCase().trim();
  
  // If already a valid role, return as-is
  if (normalized in ROLE_HIERARCHY) {
    return normalized as UserRole;
  }

  // Check migration map
  if (normalized in ROLE_MIGRATION_MAP) {
    return ROLE_MIGRATION_MAP[normalized];
  }

  // Default to viewer for unknown roles
  return 'viewer';
}

/**
 * Check if a role has at least the permissions of another role
 */
export function hasPermissionLevel(userRole: string | null | undefined, requiredRole: UserRole): boolean {
  const normalized = normalizeRole(userRole);
  const userLevel = ROLE_HIERARCHY[normalized] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(role: string | null | undefined, isSuperAdminFlag?: boolean): boolean {
  if (isSuperAdminFlag === true) return true;
  return normalizeRole(role) === 'super_admin';
}

/**
 * Check if user can manage organization (owner or admin)
 */
export function canManageOrganization(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return ['super_admin', 'owner', 'admin'].includes(normalized);
}

/**
 * Check if user can edit (owner, admin, or editor)
 */
export function canEdit(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return ['super_admin', 'owner', 'admin', 'editor'].includes(normalized);
}

/**
 * Check if user can view (all roles)
 */
export function canView(role: string | null | undefined): boolean {
  return normalizeRole(role) in ROLE_HIERARCHY;
}

/**
 * Get role display label (Arabic)
 */
export function getRoleLabel(role: string | null | undefined): string {
  const normalized = normalizeRole(role);
  
  const labels: Record<UserRole, string> = {
    super_admin: 'مشرف عام',
    owner: 'مالك',
    admin: 'مدير',
    editor: 'محرر',
    viewer: 'مشاهد',
  };
  
  return labels[normalized] || 'مستخدم';
}

/**
 * Get role display label (English)
 */
export function getRoleLabelEn(role: string | null | undefined): string {
  const normalized = normalizeRole(role);
  
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  };
  
  return labels[normalized] || 'User';
}

/**
 * Get role badge color class
 */
export function getRoleBadgeClass(role: string | null | undefined): string {
  const normalized = normalizeRole(role);
  
  const classes: Record<UserRole, string> = {
    super_admin: 'bg-red-500/20 text-red-400',
    owner: 'bg-stc-gold/20 text-stc-gold',
    admin: 'bg-blue-500/20 text-blue-400',
    editor: 'bg-emerald-500/20 text-emerald-400',
    viewer: 'bg-gray-500/20 text-gray-400',
  };
  
  return classes[normalized] || 'bg-gray-500/20 text-gray-400';
}



