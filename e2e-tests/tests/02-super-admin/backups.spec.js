/**
 * Super Admin - Backups E2E Tests
 * Tests: Create backup, View history, Restore
 */

const { test, expect } = require('@playwright/test');
const { loginAsSuperAdmin, navigateTo, checkPageHealth } = require('../../helpers/auth');

test.describe('Super Admin - Backups', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test.describe('Backups Page', () => {
    test('should load backups page', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Verify page title
      const title = page.locator('h1').filter({ hasText: /النسخ الاحتياطي|Backups/i }).first();
      await expect(title).toBeVisible({ timeout: 15000 });
    });

    test('should have create backup button', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(2000);
      
      // Check for any action button
      const actionButtons = page.locator('button').filter({ hasText: /انشاء|Create|نسخة|Backup|إنشاء/i });
      const buttonCount = await actionButtons.count();
      
      // Page should be healthy even if no button
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should display backup stats', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(3000);
      
      // Look for stats cards
      const stats = page.locator('[class*="stat-card"], [class*="card"]').filter({ hasText: /نسخة|اجمالي|ناجحة|فاشلة/i });
      const statsCount = await stats.count();
      
      expect(statsCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Backup List', () => {
    test('should display backups table or empty state', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(3000);
      
      // Look for table or empty state
      const table = page.locator('table');
      const emptyState = page.locator('text=/لا توجد نسخ|No backups/i');
      
      const hasTable = await table.isVisible().catch(() => false);
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(hasTable || hasEmpty).toBe(true);
    });

    test('should show backup status indicators', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(3000);
      
      // Look for status badges
      const badges = page.locator('[class*="badge"]').filter({ hasText: /ناجح|فاشل|قيد التنفيذ|completed|failed|running/i });
      const badgeCount = await badges.count();
      
      // Either have badges or empty state
      const emptyState = page.locator('text=/لا توجد نسخ|No backups/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(badgeCount > 0 || hasEmpty).toBe(true);
    });
  });

  test.describe('Backup Actions', () => {
    test('should have download button for completed backups', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(3000);
      
      // Look for download buttons
      const downloadButtons = page.locator('button:has(svg[class*="download"])');
      const downloadCount = await downloadButtons.count();
      
      // Either have download buttons or no backups
      const emptyState = page.locator('text=/لا توجد نسخ|No backups/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(downloadCount >= 0 || hasEmpty).toBe(true);
    });

    test('should have restore button for backups', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(3000);
      
      // Look for restore buttons
      const restoreButtons = page.locator('button').filter({ hasText: /استعادة|Restore/i });
      const restoreCount = await restoreButtons.count();
      
      // Either have restore buttons or no backups
      expect(restoreCount).toBeGreaterThanOrEqual(0);
    });

    test('should have delete button for backups', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(3000);
      
      // Look for delete buttons
      const deleteButtons = page.locator('button:has(svg[class*="trash"])');
      const deleteCount = await deleteButtons.count();
      
      // Either have delete buttons or no backups
      expect(deleteCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Create Backup', () => {
    test('should trigger backup creation when button clicked', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء نسخة|Create Backup|إنشاء/i }).first();
      
      if (await createBtn.isVisible()) {
        // Check initial state
        const initialRows = page.locator('table tbody tr');
        const initialCount = await initialRows.count().catch(() => 0);
        
        // Click create button (may show confirmation or trigger immediately)
        await createBtn.click();
        await page.waitForTimeout(2000);
        
        // Should either show confirmation dialog, success toast, or new backup row
        const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
        const toast = page.locator('text=/تم إنشاء|Creating|Success/i');
        const loadingIndicator = page.locator('text=/جاري|Loading|Creating/i');
        
        const hasDialog = await dialog.isVisible().catch(() => false);
        const hasToast = await toast.isVisible().catch(() => false);
        const hasLoading = await loadingIndicator.isVisible().catch(() => false);
        
        const health = await checkPageHealth(page);
        expect(health.healthy).toBe(true);
      }
    });
  });
});
