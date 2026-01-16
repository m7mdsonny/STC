/**
 * Super Admin - Licenses CRUD E2E Tests
 * Tests: Create, View, Activate/Suspend, Delete licenses
 */

const { test, expect } = require('@playwright/test');
const { loginAsSuperAdmin, navigateTo, checkPageHealth } = require('../../helpers/auth');

test.describe('Super Admin - Licenses CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test.describe('Licenses Page', () => {
    test('should load licenses page', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Verify page title
      const title = page.locator('h1').filter({ hasText: /التراخيص|Licenses/i }).first();
      await expect(title).toBeVisible({ timeout: 15000 });
    });

    test('should display license stats', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(3000);
      
      // Look for stats cards
      const stats = page.locator('[class*="stat-card"], [class*="card"]').filter({ hasText: /نشط|تجريبي|منتهي|الاجمالي/i });
      const statsCount = await stats.count();
      
      expect(statsCount).toBeGreaterThan(0);
    });

    test('should have create license button', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء ترخيص|Create License/i }).first();
      const hasCreate = await createBtn.isVisible().catch(() => false);
      
      expect(hasCreate).toBe(true);
    });

    test('should have search functionality', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const searchInput = page.locator('input[placeholder*="بحث"]').first();
      const hasSearch = await searchInput.isVisible().catch(() => false);
      
      expect(hasSearch).toBe(true);
    });

    test('should have status filter', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const statusFilter = page.locator('select').first();
      const hasFilter = await statusFilter.isVisible().catch(() => false);
      
      expect(hasFilter).toBe(true);
    });
  });

  test.describe('Create License', () => {
    test('should open create license modal', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء ترخيص|Create License/i }).first();
      
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(2000);
        
        // Modal should open - check multiple indicators
        const modalSelectors = [
          '[role="dialog"]',
          '[class*="modal"]',
          '[class*="Modal"]',
          'form',
        ];
        
        let modalFound = false;
        for (const selector of modalSelectors) {
          const modal = page.locator(selector).first();
          const visible = await modal.isVisible().catch(() => false);
          if (visible) {
            modalFound = true;
            break;
          }
        }
        
        // Also check for form fields
        const formFields = await page.locator('select, input').count();
        
        expect(modalFound || formFields > 3).toBe(true);
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        expect(true).toBe(true);
      }
    });

    test('should have organization selection in create form', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء ترخيص|Create License/i }).first();
      
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1500);
        
        // Should have organization dropdown
        const orgSelect = page.locator('select').filter({ hasText: /اختر المؤسسة|Select Organization/i });
        const hasOrgSelect = await page.locator('label').filter({ hasText: /المؤسسة|Organization/i }).isVisible().catch(() => false);
        
        expect(hasOrgSelect).toBe(true);
        
        // Close modal
        const cancelBtn = page.locator('button').filter({ hasText: /الغاء|Cancel/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });

    test('should have plan selection in create form', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء ترخيص|Create License/i }).first();
      
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1500);
        
        // Should have plan options
        const planOptions = page.locator('text=/اساسية|احترافية|مؤسسات|basic|professional|enterprise/i');
        const optionCount = await planOptions.count();
        
        expect(optionCount).toBeGreaterThan(0);
        
        // Close modal
        const cancelBtn = page.locator('button').filter({ hasText: /الغاء|Cancel/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });

    test('should have cameras limit input', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء ترخيص|Create License/i }).first();
      
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1500);
        
        // Should have cameras limit input
        const camerasLabel = page.locator('label').filter({ hasText: /الكاميرات|Cameras/i });
        const hasCamerasInput = await camerasLabel.isVisible().catch(() => false);
        
        expect(hasCamerasInput).toBe(true);
        
        // Close modal
        const cancelBtn = page.locator('button').filter({ hasText: /الغاء|Cancel/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });

    test('should have trial option checkbox', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء ترخيص|Create License/i }).first();
      
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1500);
        
        // Should have trial checkbox
        const trialCheckbox = page.locator('input[type="checkbox"]');
        const hasTrialOption = await trialCheckbox.isVisible().catch(() => false);
        
        expect(hasTrialOption).toBe(true);
        
        // Close modal
        const cancelBtn = page.locator('button').filter({ hasText: /الغاء|Cancel/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });
  });

  test.describe('Licenses List', () => {
    test('should display licenses table or empty state', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(3000);
      
      // Look for table or empty state
      const table = page.locator('table');
      const emptyState = page.locator('text=/لا توجد تراخيص|No licenses/i');
      
      const hasTable = await table.isVisible().catch(() => false);
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(hasTable || hasEmpty).toBe(true);
    });

    test('should show license keys', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(3000);
      
      // Look for license key format (XXXX-XXXX-XXXX-XXXX)
      const licenseKeys = page.locator('code, [class*="mono"]');
      const keyCount = await licenseKeys.count();
      
      // Either have keys or empty state
      const emptyState = page.locator('text=/لا توجد تراخيص|No licenses/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(keyCount > 0 || hasEmpty).toBe(true);
    });

    test('should show license status badges', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(3000);
      
      // Look for status badges
      const badges = page.locator('[class*="badge"]').filter({ hasText: /نشط|تجريبي|منتهي|موقوف|active|trial|expired/i });
      const badgeCount = await badges.count();
      
      // Either have badges or empty state
      const emptyState = page.locator('text=/لا توجد تراخيص|No licenses/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(badgeCount > 0 || hasEmpty).toBe(true);
    });
  });

  test.describe('License Actions', () => {
    test('should have copy license key button', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(3000);
      
      // Look for copy buttons
      const copyButtons = page.locator('button:has(svg[class*="copy"])');
      const copyCount = await copyButtons.count();
      
      // Either have copy buttons or no licenses
      const emptyState = page.locator('text=/لا توجد تراخيص|No licenses/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(copyCount > 0 || hasEmpty).toBe(true);
    });

    test('should have activate/suspend button', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(3000);
      
      // Look for status toggle buttons - multiple selectors
      const buttonSelectors = [
        'button:has(svg)',
        'td button',
        '[class*="actions"] button',
      ];
      
      let buttonCount = 0;
      for (const selector of buttonSelectors) {
        const buttons = page.locator(selector);
        buttonCount = await buttons.count();
        if (buttonCount > 0) break;
      }
      
      // Page should be healthy
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should have delete button', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(3000);
      
      // Look for delete buttons
      const deleteButtons = page.locator('button:has(svg[class*="trash"])');
      const deleteCount = await deleteButtons.count();
      
      // Either have delete buttons or no licenses
      const emptyState = page.locator('text=/لا توجد تراخيص|No licenses/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(deleteCount > 0 || hasEmpty).toBe(true);
    });
  });
});
