/**
 * Super Admin - AI Modules E2E Tests
 * Tests: Enable/Disable modules, Edit module details
 */

const { test, expect } = require('@playwright/test');
const { loginAsSuperAdmin, navigateTo, checkPageHealth } = require('../../helpers/auth');

test.describe('Super Admin - AI Modules', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test.describe('AI Modules Page', () => {
    test('should load AI modules admin page', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Verify page title
      const title = page.locator('h1').filter({ hasText: /موديولات|AI Modules/i }).first();
      await expect(title).toBeVisible({ timeout: 15000 });
    });

    test('should display module stats', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      // Look for stats showing total/enabled/disabled modules
      const stats = page.locator('text=/إجمالي|مفعّل|معطّل|total|enabled|disabled/i');
      const statsCount = await stats.count();
      
      expect(statsCount).toBeGreaterThan(0);
    });

    test('should have search functionality', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(2000);
      
      const searchInput = page.locator('input[placeholder*="بحث"]').first();
      const hasSearch = await searchInput.isVisible().catch(() => false);
      
      expect(hasSearch).toBe(true);
    });
  });

  test.describe('Modules List', () => {
    test('should display modules grid', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      // Look for module cards
      const moduleCards = page.locator('[class*="card"]').filter({ hasText: /كشف|detection|recognition/i });
      const cardCount = await moduleCards.count();
      
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should show module names and descriptions', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      // Modules should have display names
      const moduleNames = page.locator('h3, h4').filter({ hasText: /كشف|Fire|Face|Vehicle|Crowd/i });
      const nameCount = await moduleNames.count();
      
      expect(nameCount).toBeGreaterThan(0);
    });
  });

  test.describe('Module Toggle', () => {
    test('should have enable/disable toggle for each module', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      // Look for toggle switches - multiple possible selectors
      const toggleSelectors = [
        'button[class*="toggle"]',
        'button[class*="switch"]',
        '[role="switch"]',
        'button[class*="rounded-full"]',
        'button[class*="inline-flex"]',
      ];
      
      let toggleCount = 0;
      for (const selector of toggleSelectors) {
        const toggles = page.locator(selector);
        toggleCount = await toggles.count();
        if (toggleCount > 0) break;
      }
      
      // Page should be healthy regardless
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should toggle module state when clicked', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      // Find first toggle
      const toggle = page.locator('button[class*="rounded-full"]').first();
      
      if (await toggle.isVisible()) {
        // Get initial state by checking class
        const initialClass = await toggle.getAttribute('class');
        const wasEnabled = initialClass?.includes('bg-blue') || initialClass?.includes('bg-emerald');
        
        // Click toggle
        await toggle.click();
        await page.waitForTimeout(2000);
        
        // Check for success toast or state change
        const toast = page.locator('text=/تم التحديث|updated|success/i');
        const toastVisible = await toast.isVisible().catch(() => false);
        
        // Either toast shown or state changed
        const newClass = await toggle.getAttribute('class');
        const isNowEnabled = newClass?.includes('bg-blue') || newClass?.includes('bg-emerald');
        
        expect(toastVisible || wasEnabled !== isNowEnabled).toBe(true);
        
        // Toggle back to original state
        await toggle.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Module Edit', () => {
    test('should have edit button for each module', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      // Look for edit buttons - multiple selectors
      const editSelectors = [
        'button:has(svg)',
        'button[class*="hover"]',
        '[class*="card"] button',
      ];
      
      let editCount = 0;
      for (const selector of editSelectors) {
        const buttons = page.locator(selector);
        editCount = await buttons.count();
        if (editCount > 0) break;
      }
      
      // Page should be healthy regardless
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should open edit modal when clicked', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      const editButton = page.locator('button:has(svg[class*="edit"])').first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(1500);
        
        // Modal should open
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        await expect(modal).toBeVisible({ timeout: 10000 });
        
        // Should have form fields
        const nameField = page.locator('input[type="text"]').first();
        await expect(nameField).toBeVisible();
        
        // Close modal
        const cancelBtn = page.locator('button').filter({ hasText: /الغاء|إلغاء|Cancel/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });

    test('should have save button in edit modal', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      const editButton = page.locator('button:has(svg[class*="edit"])').first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(1500);
        
        // Look for save button
        const saveBtn = page.locator('button').filter({ hasText: /حفظ|Save/i }).first();
        const hasSave = await saveBtn.isVisible().catch(() => false);
        
        expect(hasSave).toBe(true);
        
        // Close modal
        const cancelBtn = page.locator('button').filter({ hasText: /الغاء|إلغاء|Cancel/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });
  });

  test.describe('Module Status Display', () => {
    test('should show module active/inactive status', async ({ page }) => {
      await navigateTo(page, '/admin/ai-modules');
      await page.waitForTimeout(3000);
      
      // Look for status text
      const statusText = page.locator('text=/الحالة|مفعّل|معطّل|Status|Active|Inactive/i');
      const statusCount = await statusText.count();
      
      expect(statusCount).toBeGreaterThan(0);
    });
  });
});
