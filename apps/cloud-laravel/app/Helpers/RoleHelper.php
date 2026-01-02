<?php

namespace App\Helpers;

class RoleHelper
{
    /**
     * Standard roles supported by the platform
     */
    public const SUPER_ADMIN = 'super_admin';
    public const OWNER = 'owner';
    public const ADMIN = 'admin';
    public const EDITOR = 'editor';
    public const VIEWER = 'viewer';

    /**
     * All valid roles
     */
    public const VALID_ROLES = [
        self::SUPER_ADMIN,
        self::OWNER,
        self::ADMIN,
        self::EDITOR,
        self::VIEWER,
    ];

    /**
     * Role hierarchy (higher number = more permissions)
     */
    public const ROLE_HIERARCHY = [
        self::SUPER_ADMIN => 5,
        self::OWNER => 4,
        self::ADMIN => 3,
        self::EDITOR => 2,
        self::VIEWER => 1,
    ];

    /**
     * Map old roles to new standardized roles
     * This allows backward compatibility during migration
     */
    public const ROLE_MIGRATION_MAP = [
        'org_owner' => self::OWNER,
        'org_admin' => self::ADMIN,
        'org_operator' => self::EDITOR,
        'org_viewer' => self::VIEWER,
        'user' => self::VIEWER,
    ];

    /**
     * Normalize a role value to the standard format
     * Handles migration from old role names
     */
    public static function normalize(string $role): string
    {
        $role = strtolower(trim($role));
        
        // If already a valid role, return as-is
        if (in_array($role, self::VALID_ROLES)) {
            return $role;
        }

        // Check migration map
        if (isset(self::ROLE_MIGRATION_MAP[$role])) {
            return self::ROLE_MIGRATION_MAP[$role];
        }

        // Default to viewer for unknown roles
        return self::VIEWER;
    }

    /**
     * Check if a role has at least the permissions of another role
     */
    public static function hasPermissionLevel(string $userRole, string $requiredRole): bool
    {
        $userLevel = self::ROLE_HIERARCHY[self::normalize($userRole)] ?? 0;
        $requiredLevel = self::ROLE_HIERARCHY[self::normalize($requiredRole)] ?? 0;
        
        return $userLevel >= $requiredLevel;
    }

    /**
     * Check if user is super admin
     */
    public static function isSuperAdmin(?string $role, ?bool $isSuperAdminFlag = null): bool
    {
        if ($isSuperAdminFlag === true) {
            return true;
        }
        
        return self::normalize($role ?? '') === self::SUPER_ADMIN;
    }

    /**
     * Check if user can manage organization (owner or admin)
     */
    public static function canManageOrganization(?string $role): bool
    {
        $normalized = self::normalize($role ?? '');
        return in_array($normalized, [self::SUPER_ADMIN, self::OWNER, self::ADMIN]);
    }

    /**
     * Check if user can edit (owner, admin, or editor)
     */
    public static function canEdit(?string $role): bool
    {
        $normalized = self::normalize($role ?? '');
        return in_array($normalized, [self::SUPER_ADMIN, self::OWNER, self::ADMIN, self::EDITOR]);
    }

    /**
     * Check if user can view (all roles)
     */
    public static function canView(?string $role): bool
    {
        return in_array(self::normalize($role ?? ''), self::VALID_ROLES);
    }

    /**
     * Get role display label (Arabic)
     */
    public static function getLabel(string $role): string
    {
        $normalized = self::normalize($role);
        
        return match ($normalized) {
            self::SUPER_ADMIN => 'مشرف عام',
            self::OWNER => 'مالك',
            self::ADMIN => 'مدير',
            self::EDITOR => 'محرر',
            self::VIEWER => 'مشاهد',
            default => 'مستخدم',
        };
    }

    /**
     * Get role display label (English)
     */
    public static function getLabelEn(string $role): string
    {
        $normalized = self::normalize($role);
        
        return match ($normalized) {
            self::SUPER_ADMIN => 'Super Admin',
            self::OWNER => 'Owner',
            self::ADMIN => 'Admin',
            self::EDITOR => 'Editor',
            self::VIEWER => 'Viewer',
            default => 'User',
        };
    }

    /**
     * Validate if a role is valid
     */
    public static function isValid(string $role): bool
    {
        return in_array(self::normalize($role), self::VALID_ROLES);
    }
}



