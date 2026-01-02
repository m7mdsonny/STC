-- ============================================
-- Create Organization Owner User
-- ============================================
-- This script creates an organization owner user
-- Password: Owner@12345
-- ============================================

-- Check if user already exists
SET @email = 'owner@org1.local';
SET @exists = (SELECT COUNT(*) FROM `users` WHERE `email` = @email);

-- Only insert if user doesn't exist
INSERT INTO `users` (
    `organization_id`, 
    `name`, 
    `email`, 
    `password`, 
    `role`, 
    `is_active`, 
    `is_super_admin`,
    `phone`,
    `email_verified_at`,
    `created_at`, 
    `updated_at`
) 
SELECT 
    1,
    'صاحب المؤسسة',
    'owner@org1.local',
    '$2y$12$jX9.JiiNxIzibIXlwwM3Quq7/wQzDTr8tbllpOOY9V.wzwtg9424y', -- Owner@12345
    'owner',
    true,
    false,
    '+966 50 000 0005',
    NOW(),
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM `users` WHERE `email` = 'owner@org1.local'
);

-- Verify creation
SELECT 
    id,
    name,
    email,
    role,
    organization_id,
    is_active,
    'User created successfully' as status
FROM `users` 
WHERE `email` = 'owner@org1.local';

