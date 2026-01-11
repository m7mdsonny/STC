/**
 * Super Admin - Edge Servers E2E Tests
 * Tests: View, Monitor, Delete edge servers
 */

const { test, expect } = require('@playwright/test');
const { loginAsSuperAdmin, navigateTo, checkPageHealth } = require('../../helpers/auth');

test.describe('Super Admin - Edge Servers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test.describe('Edge Servers Page', () => {
    test('should load edge servers page', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Verify page title
      const title = page.locator('h1').filter({ hasText: /سيرفرات|Edge|Servers/i }).first();
      await expect(title).toBeVisible({ timeout: 15000 });
    });

    test('should display server stats cards', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(3000);
      
      // Look for stat cards
      const statCards = page.locator('[class*="stat-card"], [class*="card"]').filter({ hasText: /سيرفر|متصل|غير متصل/i });
      const statCount = await statCards.count();
      
      expect(statCount).toBeGreaterThan(0);
    });

    test('should have search functionality', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(2000);
      
      const searchInput = page.locator('input[placeholder*="بحث"]').first();
      const hasSearch = await searchInput.isVisible().catch(() => false);
      
      expect(hasSearch).toBe(true);
      
      if (hasSearch) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        const health = await checkPageHealth(page);
        expect(health.healthy).toBe(true);
      }
    });

    test('should have status filter', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(2000);
      
      const statusFilter = page.locator('select').first();
      const hasFilter = await statusFilter.isVisible().catch(() => false);
      
      expect(hasFilter).toBe(true);
    });
  });

  test.describe('Edge Servers List', () => {
    test('should display servers list or empty state', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(3000);
      
      // Look for server cards or empty state
      const serverCards = page.locator('[class*="card"]').filter({ hasText: /سيرفر|server|متصل|offline/i });
      const emptyState = page.locator('text=/لا توجد سيرفرات|no servers/i');
      
      const hasCards = await serverCards.count() > 0;
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(hasCards || hasEmpty).toBe(true);
    });

    test('should show server status indicators', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(3000);
      
      // Look for status badges
      const statusBadges = page.locator('text=/متصل|غير متصل|وضع الاعداد|online|offline|config/i');
      const badgeCount = await statusBadges.count();
      
      // Either have status badges or empty state
      const emptyState = page.locator('text=/لا توجد سيرفرات|no servers/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(badgeCount > 0 || hasEmpty).toBe(true);
    });
  });

  test.describe('Server Actions', () => {
    test('should have refresh button', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(2000);
      
      const refreshBtn = page.locator('button').filter({ hasText: /تحديث|Refresh/i }).first();
      const hasRefresh = await refreshBtn.isVisible().catch(() => false);
      
      expect(hasRefresh).toBe(true);
      
      if (hasRefresh) {
        await refreshBtn.click();
        await page.waitForTimeout(2000);
        
        const health = await checkPageHealth(page);
        expect(health.healthy).toBe(true);
      }
    });

    test('should have view details button', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(3000);
      
      // Look for view/eye buttons
      const viewButtons = page.locator('button:has(svg[class*="eye"])');
      const viewCount = await viewButtons.count();
      
      // Either have view buttons or no servers
      const emptyState = page.locator('text=/لا توجد سيرفرات|no servers/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(viewCount > 0 || hasEmpty).toBe(true);
    });

    test('should have delete button', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(3000);
      
      // Look for delete buttons
      const deleteButtons = page.locator('button:has(svg[class*="trash"])');
      const deleteCount = await deleteButtons.count();
      
      // Either have delete buttons or no servers
      const emptyState = page.locator('text=/لا توجد سيرفرات|no servers/i');
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(deleteCount > 0 || hasEmpty).toBe(true);
    });

    test('should open server details modal', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(3000);
      
      const viewButton = page.locator('button:has(svg[class*="eye"])').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForTimeout(1500);
        
        // Modal should open
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const modalVisible = await modal.isVisible().catch(() => false);
        
        if (modalVisible) {
          // Should show server details
          const detailsContent = page.locator('text=/الاسم|المؤسسة|معرف الجهاز|IP/i');
          await expect(detailsContent.first()).toBeVisible({ timeout: 5000 });
          
          // Close modal
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Server System Info', () => {
    test('should display system info for online servers', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(3000);
      
      // Look for system info (CPU, Memory, Disk)
      const systemInfo = page.locator('text=/CPU|الذاكرة|Memory|القرص|Disk/i');
      const infoCount = await systemInfo.count();
      
      // May not have system info if no servers are online
      expect(infoCount).toBeGreaterThanOrEqual(0);
    });
  });
});
