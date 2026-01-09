import { describe, it, expect } from 'vitest';
import {
  normalizeRole,
  isSuperAdmin,
  canManageOrganization,
  canEdit,
  canView,
  hasPermissionLevel,
  getRoleLabel,
  ROLE_HIERARCHY,
} from '../../lib/rbac';

describe('RBAC Utilities', () => {
  describe('normalizeRole', () => {
    it('normalizes valid roles', () => {
      expect(normalizeRole('super_admin')).toBe('super_admin');
      expect(normalizeRole('owner')).toBe('owner');
      expect(normalizeRole('admin')).toBe('admin');
      expect(normalizeRole('editor')).toBe('editor');
      expect(normalizeRole('viewer')).toBe('viewer');
    });

    it('handles migration map roles', () => {
      expect(normalizeRole('org_owner')).toBe('owner');
      expect(normalizeRole('org_admin')).toBe('admin');
      expect(normalizeRole('org_operator')).toBe('editor');
      expect(normalizeRole('org_viewer')).toBe('viewer');
    });

    it('defaults to viewer for unknown roles', () => {
      expect(normalizeRole('unknown')).toBe('viewer');
      expect(normalizeRole(null)).toBe('viewer');
      expect(normalizeRole(undefined)).toBe('viewer');
    });
  });

  describe('isSuperAdmin', () => {
    it('identifies super admin by role', () => {
      expect(isSuperAdmin('super_admin')).toBe(true);
      expect(isSuperAdmin('admin')).toBe(false);
    });

    it('identifies super admin by flag', () => {
      expect(isSuperAdmin('admin', true)).toBe(true);
      expect(isSuperAdmin('viewer', true)).toBe(true);
    });
  });

  describe('canManageOrganization', () => {
    it('allows super_admin, owner, and admin', () => {
      expect(canManageOrganization('super_admin')).toBe(true);
      expect(canManageOrganization('owner')).toBe(true);
      expect(canManageOrganization('admin')).toBe(true);
    });

    it('denies editor and viewer', () => {
      expect(canManageOrganization('editor')).toBe(false);
      expect(canManageOrganization('viewer')).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('allows super_admin, owner, admin, and editor', () => {
      expect(canEdit('super_admin')).toBe(true);
      expect(canEdit('owner')).toBe(true);
      expect(canEdit('admin')).toBe(true);
      expect(canEdit('editor')).toBe(true);
    });

    it('denies viewer', () => {
      expect(canEdit('viewer')).toBe(false);
    });
  });

  describe('canView', () => {
    it('allows all valid roles', () => {
      expect(canView('super_admin')).toBe(true);
      expect(canView('owner')).toBe(true);
      expect(canView('admin')).toBe(true);
      expect(canView('editor')).toBe(true);
      expect(canView('viewer')).toBe(true);
    });
  });

  describe('hasPermissionLevel', () => {
    it('checks role hierarchy correctly', () => {
      expect(hasPermissionLevel('super_admin', 'viewer')).toBe(true);
      expect(hasPermissionLevel('admin', 'editor')).toBe(true);
      expect(hasPermissionLevel('viewer', 'admin')).toBe(false);
      expect(hasPermissionLevel('editor', 'owner')).toBe(false);
    });
  });

  describe('getRoleLabel', () => {
    it('returns Arabic labels', () => {
      expect(getRoleLabel('super_admin')).toBe('مشرف عام');
      expect(getRoleLabel('owner')).toBe('مالك');
      expect(getRoleLabel('admin')).toBe('مدير');
      expect(getRoleLabel('editor')).toBe('محرر');
      expect(getRoleLabel('viewer')).toBe('مشاهد');
    });
  });

  describe('Role Hierarchy', () => {
    it('has correct hierarchy values', () => {
      expect(ROLE_HIERARCHY.super_admin).toBe(5);
      expect(ROLE_HIERARCHY.owner).toBe(4);
      expect(ROLE_HIERARCHY.admin).toBe(3);
      expect(ROLE_HIERARCHY.editor).toBe(2);
      expect(ROLE_HIERARCHY.viewer).toBe(1);
    });
  });
});
