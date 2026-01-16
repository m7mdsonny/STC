/**
 * Super Admin Dashboard E2E Tests
 * Tests all admin dashboard functionality
 */

const { test, expect } = require('@playwright/test');
const { loginAsSuperAdmin, checkPageHealth, navigateTo } = require('../../helpers/auth');
const { testDataTable, testAllButtons, checkLoadingState } = require('../../helpers/pageUtils');

test.describe('Super Admin Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });
  
  test.describe('Main Dashboard Page', () => {
    test('should load admin dashboard correctly', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      // Check page health
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Verify dashboard title - use specific h1 selector
      const title = page.locator('h1').filter({ hasText: 'لوحة تحكم المشرف' }).first();
      await expect(title).toBeVisible({ timeout: 20000 });
    });
    
    test('should display stat cards', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      // Check for stat cards
      const statCards = page.locator('[class*="card"], [class*="stat"]');
      const count = await statCards.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('should display organizations count', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      // Look for organizations stat
      const orgStat = page.locator('text=/المؤسسات|organizations/i').first();
      await expect(orgStat).toBeVisible({ timeout: 15000 });
    });
    
    test('should display revenue information', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      // Look for revenue section
      const revenueStat = page.locator('text=/الايرادات|revenue/i').first();
      await expect(revenueStat).toBeVisible({ timeout: 15000 });
    });
    
    test('should have working refresh/retry button on error', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      // Look for retry button (shown on error)
      const retryButton = page.locator('button:has-text("إعادة المحاولة")');
      // This might not be visible if no error occurred - that's okay
      const isVisible = await retryButton.isVisible().catch(() => false);
      
      if (isVisible) {
        await retryButton.click();
        await page.waitForTimeout(2000);
        // Page should handle gracefully
        const health = await checkPageHealth(page);
        expect(health.errors).not.toContain('500 - Server error');
      }
    });
  });
  
  test.describe('Organizations Page', () => {
    test('should load organizations page', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Verify page title
      const title = page.locator('h1:has-text("المؤسسات")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
    
    test('should have add organization button', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const addButton = page.locator('button:has-text("اضافة مؤسسة")');
      await expect(addButton).toBeVisible({ timeout: 15000 });
    });
    
    test('should open add organization modal', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const addButton = page.locator('button:has-text("اضافة مؤسسة")');
      await expect(addButton).toBeVisible({ timeout: 15000 });
      await addButton.click();
      await page.waitForTimeout(2000); // Wait for modal animation
      
      // Modal should open with form - try multiple selectors
      const modalSelectors = [
        '[role="dialog"]',
        '[class*="modal"]',
        '[class*="Modal"]',
        'div[class*="fixed"][class*="inset"]',
      ];
      
      let modalVisible = false;
      for (const selector of modalSelectors) {
        const modal = page.locator(selector).first();
        if (await modal.isVisible().catch(() => false)) {
          modalVisible = true;
          break;
        }
      }
      
      // Check for form fields as alternative verification
      const formFields = page.locator('input[type="text"], input[type="email"]');
      const fieldCount = await formFields.count();
      
      expect(modalVisible || fieldCount > 2).toBe(true);
      
      // Close modal
      const cancelButton = page.locator('button:has-text("الغاء")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(500);
      }
    });
    
    test('should have search functionality', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      // Try multiple search input selectors
      const searchSelectors = [
        'input[placeholder*="بحث"]',
        'input[type="search"]',
        'input[type="text"]',
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        const input = page.locator(selector).first();
        if (await input.isVisible().catch(() => false)) {
          searchInput = input;
          break;
        }
      }
      
      // Page should have at least some input
      const anyInput = page.locator('input').first();
      expect(await anyInput.isVisible().catch(() => false)).toBe(true);
      
      // If search input found, test it
      if (searchInput) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
      }
      
      // Should not crash
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('should display organizations table', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const tableResults = await testDataTable(page);
      // Table should exist (even if empty)
      const hasTable = tableResults.found || 
        await page.locator('text=/لا توجد مؤسسات|no organizations/i').isVisible().catch(() => false);
      expect(hasTable).toBe(true);
    });
  });
  
  test.describe('Users Page', () => {
    test('should load users page', async ({ page }) => {
      await navigateTo(page, '/admin/users');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      const title = page.locator('h1:has-text("المستخدمين")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
    
    test('should have user management controls', async ({ page }) => {
      await navigateTo(page, '/admin/users');
      await checkLoadingState(page);
      
      // Check for add user button or user list
      const addButton = page.locator('button:has-text("اضافة"), button:has-text("مستخدم جديد")').first();
      const userTable = page.locator('table');
      
      const hasAddButton = await addButton.isVisible().catch(() => false);
      const hasTable = await userTable.isVisible().catch(() => false);
      
      expect(hasAddButton || hasTable).toBe(true);
    });
  });
  
  test.describe('Licenses Page', () => {
    test('should load licenses page', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      const title = page.locator('h1:has-text("التراخيص")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
    
    test('should display licenses list or empty state', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await checkLoadingState(page);
      
      // Either have table or empty message
      const table = page.locator('table');
      const emptyState = page.locator('text=/لا توجد|no licenses/i');
      
      const hasTable = await table.isVisible().catch(() => false);
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(hasTable || hasEmpty).toBe(true);
    });
  });
  
  test.describe('Edge Servers Page', () => {
    test('should load edge servers page', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      const title = page.locator('h1:has-text("سيرفرات"), h1:has-text("Edge")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
  });
  
  test.describe('Plans Page', () => {
    test('should load plans page', async ({ page }) => {
      await navigateTo(page, '/admin/plans');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      const title = page.locator('h1:has-text("الباقات")');
      await expect(title).toBeVisible({ timeout: 15000 });
    });
  });
  
  test.describe('AI Modules Page', () => {
    test('should load AI modules page', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Actual title is "إدارة موديولات الذكاء الاصطناعي" in AIModulesAdmin.tsx
      const title = page.locator('h1:has-text("موديولات الذكاء الاصطناعي"), h1:has-text("موديولات"), h1:has-text("AI")').first();
      await expect(title).toBeVisible({ timeout: 20000 });
    });
  });
  
  test.describe('Settings Page', () => {
    test('should load admin settings page', async ({ page }) => {
      await navigateTo(page, '/admin/settings');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Actual title is "اعدادات النظام" in AdminSettings.tsx
      const title = page.locator('h1:has-text("اعدادات النظام"), h1:has-text("الاعدادات")').first();
      await expect(title).toBeVisible({ timeout: 20000 });
    });
  });
  
  test.describe('Notifications Page', () => {
    test('should load notifications page', async ({ page }) => {
      await navigateTo(page, '/admin/notifications');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Actual title is "أولوية الاشعارات" in AdminNotifications.tsx
      const title = page.locator('h1:has-text("أولوية الاشعارات"), h1:has-text("الاشعارات")').first();
      await expect(title).toBeVisible({ timeout: 20000 });
    });
  });
  
  test.describe('System Monitor Page', () => {
    test('should load system monitor page', async ({ page }) => {
      await navigateTo(page, '/admin/monitor');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
  });
  
  test.describe('Backups Page', () => {
    test('should load backups page', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Actual title is "النسخ الاحتياطي" in AdminBackups.tsx
      const title = page.locator('h1:has-text("النسخ الاحتياطي"), h1:has-text("النسخ الاحتياطية"), h1:has-text("backups")').first();
      await expect(title).toBeVisible({ timeout: 20000 });
    });
  });
  
  test.describe('Free Trial Requests Page', () => {
    test('should load free trial requests page', async ({ page }) => {
      await navigateTo(page, '/admin/free-trial-requests');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
  });
  
  test.describe('Super Admin Management Page', () => {
    test('should load super admin management page', async ({ page }) => {
      await navigateTo(page, '/admin/super-admins');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
  });
  
  test.describe('Resellers Page', () => {
    test('should load resellers page', async ({ page }) => {
      await navigateTo(page, '/admin/resellers');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
  });
  
  test.describe('Landing Settings Page', () => {
    test('should load landing settings page', async ({ page }) => {
      await navigateTo(page, '/admin/landing');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
  });
  
  test.describe('Platform Wordings Page', () => {
    test('should load platform wordings page', async ({ page }) => {
      await navigateTo(page, '/admin/wordings');
      await checkLoadingState(page);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
  });
});
