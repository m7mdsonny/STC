/**
 * RBAC (Role-Based Access Control) E2E Tests
 * Tests that access controls are properly enforced
 */

const { test, expect } = require('@playwright/test');
const { 
  loginAsSuperAdmin, 
  loginAsOwner, 
  checkPageHealth, 
  navigateTo,
  CREDENTIALS,
  login 
} = require('../../helpers/auth');
const { checkLoadingState } = require('../../helpers/pageUtils');

test.describe('RBAC - Access Control Tests', () => {
  
  test.describe('Super Admin Access', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperAdmin(page);
    });
    
    test('Super Admin can access /admin dashboard', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Should see admin dashboard
      const adminTitle = page.locator('text=لوحة تحكم المشرف');
      await expect(adminTitle).toBeVisible({ timeout: 15000 });
    });
    
    test('Super Admin can access /admin/organizations', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      const title = page.locator('h1:has-text("المؤسسات")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
    
    test('Super Admin can access /admin/users', async ({ page }) => {
      await navigateTo(page, '/admin/users');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      const title = page.locator('h1:has-text("المستخدمين")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
    
    test('Super Admin can access /admin/licenses', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      const title = page.locator('h1:has-text("التراخيص")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
    
    test('Super Admin can access /admin/edge-servers', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Super Admin can access /admin/super-admins', async ({ page }) => {
      await navigateTo(page, '/admin/super-admins');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Super Admin can access /admin/backups', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Super Admin can access all admin pages', async ({ page }) => {
      const adminPages = [
        '/admin',
        '/admin/monitor',
        '/admin/organizations',
        '/admin/users',
        '/admin/licenses',
        '/admin/edge-servers',
        '/admin/resellers',
        '/admin/plans',
        '/admin/ai-modules',
        '/admin/model-training',
        '/admin/integrations',
        '/admin/sms',
        '/admin/landing',
        '/admin/notifications',
        '/admin/settings',
        '/admin/super-settings',
        '/admin/wordings',
        '/admin/updates',
        '/admin/system-updates',
        '/admin/backups',
        '/admin/free-trial-requests',
      ];
      
      const results = [];
      
      for (const path of adminPages) {
        await navigateTo(page, path);
        await checkLoadingState(page);
        
        const health = await checkPageHealth(page);
        results.push({
          path,
          healthy: health.healthy,
          errors: health.errors,
        });
      }
      
      // All pages should be accessible
      const failedPages = results.filter(r => !r.healthy);
      expect(failedPages.length).toBe(0);
    });
  });
  
  test.describe('Owner Access Restrictions', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsOwner(page);
    });
    
    test('Owner CANNOT access /admin dashboard', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      // Should be redirected to /dashboard or see unauthorized
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes('/admin') || currentUrl.includes('/dashboard');
      const hasUnauthorized = await page.locator('text=/غير مصرح|unauthorized|forbidden/i').isVisible().catch(() => false);
      
      expect(isRedirected || hasUnauthorized).toBe(true);
    });
    
    test('Owner CANNOT access /admin/organizations', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes('/admin/organizations');
      const hasUnauthorized = await page.locator('text=/غير مصرح|unauthorized|forbidden/i').isVisible().catch(() => false);
      
      expect(isRedirected || hasUnauthorized).toBe(true);
    });
    
    test('Owner CANNOT access /admin/users', async ({ page }) => {
      await navigateTo(page, '/admin/users');
      await checkLoadingState(page);
      
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes('/admin/users');
      const hasUnauthorized = await page.locator('text=/غير مصرح|unauthorized|forbidden/i').isVisible().catch(() => false);
      
      expect(isRedirected || hasUnauthorized).toBe(true);
    });
    
    test('Owner CANNOT access /admin/licenses', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await checkLoadingState(page);
      
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes('/admin/licenses');
      const hasUnauthorized = await page.locator('text=/غير مصرح|unauthorized|forbidden/i').isVisible().catch(() => false);
      
      expect(isRedirected || hasUnauthorized).toBe(true);
    });
    
    test('Owner CANNOT access /admin/super-admins', async ({ page }) => {
      await navigateTo(page, '/admin/super-admins');
      await checkLoadingState(page);
      
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes('/admin/super-admins');
      const hasUnauthorized = await page.locator('text=/غير مصرح|unauthorized|forbidden/i').isVisible().catch(() => false);
      
      expect(isRedirected || hasUnauthorized).toBe(true);
    });
    
    test('Owner CAN access /dashboard', async ({ page }) => {
      await navigateTo(page, '/dashboard');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      const title = page.locator('h1:has-text("لوحة التحكم")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
    
    test('Owner CAN access /cameras', async ({ page }) => {
      await navigateTo(page, '/cameras');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Owner CAN access /alerts', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Owner CAN access /analytics', async ({ page }) => {
      await navigateTo(page, '/analytics');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Owner CAN access /team', async ({ page }) => {
      await navigateTo(page, '/team');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Owner CAN access /settings', async ({ page }) => {
      await navigateTo(page, '/settings');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Owner can access all owner pages', async ({ page }) => {
      const ownerPages = [
        '/dashboard',
        '/live',
        '/cameras',
        '/alerts',
        '/analytics',
        '/people',
        '/vehicles',
        '/attendance',
        '/market',
        '/automation',
        '/team',
        '/guide',
        '/settings',
      ];
      
      const results = [];
      
      for (const path of ownerPages) {
        await navigateTo(page, path);
        await checkLoadingState(page);
        
        const health = await checkPageHealth(page);
        results.push({
          path,
          healthy: health.healthy,
          errors: health.errors,
        });
      }
      
      // All pages should be accessible
      const failedPages = results.filter(r => !r.healthy);
      expect(failedPages.length).toBe(0);
    });
  });
  
  test.describe('Unauthenticated Access', () => {
    test('Unauthenticated user is redirected from /admin', async ({ page }) => {
      await page.goto('/admin', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // Should be redirected to login
      const loginForm = page.locator('input[type="email"]');
      const loginLink = page.locator('text=تسجيل الدخول');
      const landingPage = page.locator('text=منصة تحليل الفيديو');
      
      const isOnLogin = await loginForm.isVisible().catch(() => false);
      const hasLoginLink = await loginLink.isVisible().catch(() => false);
      const isOnLanding = await landingPage.isVisible().catch(() => false);
      
      expect(isOnLogin || hasLoginLink || isOnLanding).toBe(true);
    });
    
    test('Unauthenticated user is redirected from /dashboard', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const loginForm = page.locator('input[type="email"]');
      const loginLink = page.locator('text=تسجيل الدخول');
      
      const isOnLogin = await loginForm.isVisible().catch(() => false);
      const hasLoginLink = await loginLink.isVisible().catch(() => false);
      
      expect(isOnLogin || hasLoginLink).toBe(true);
    });
    
    test('Unauthenticated user can access landing page', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Unauthenticated user can access login page', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Unauthenticated user can access request demo page', async ({ page }) => {
      await page.goto('/request-demo', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
  });
  
  test.describe('API RBAC Enforcement', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsOwner(page);
    });
    
    test('Owner API calls to admin endpoints should be rejected', async ({ page }) => {
      // Try to fetch organizations API (admin only)
      const response = await page.request.get('https://api.stcsolutions.online/api/v1/superadmin/organizations');
      
      // Should get 401 or 403
      expect([401, 403, 404]).toContain(response.status());
    });
  });
});
