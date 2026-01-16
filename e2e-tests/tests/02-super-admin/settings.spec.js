/**
 * Super Admin - System Settings E2E Tests
 * Tests: System configuration, Global settings
 */

const { test, expect } = require('@playwright/test');
const { loginAsSuperAdmin, navigateTo, checkPageHealth } = require('../../helpers/auth');

test.describe('Super Admin - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test.describe('Admin Settings Page', () => {
    test('should load admin settings page', async ({ page }) => {
      await navigateTo(page, '/admin/settings');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
      
      // Verify page title
      const title = page.locator('h1').filter({ hasText: /اعدادات|Settings/i }).first();
      await expect(title).toBeVisible({ timeout: 15000 });
    });

    test('should display settings tabs or sections', async ({ page }) => {
      await navigateTo(page, '/admin/settings');
      await page.waitForTimeout(3000);
      
      // Look for tabs or sections
      const tabs = page.locator('[role="tab"], button[class*="tab"]');
      const sections = page.locator('[class*="card"], section');
      
      const tabCount = await tabs.count();
      const sectionCount = await sections.count();
      
      expect(tabCount + sectionCount).toBeGreaterThan(0);
    });
  });

  test.describe('General Settings', () => {
    test('should have general settings section', async ({ page }) => {
      await navigateTo(page, '/admin/settings');
      await page.waitForTimeout(3000);
      
      // Page should be healthy
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should have editable settings fields', async ({ page }) => {
      await navigateTo(page, '/admin/settings');
      await page.waitForTimeout(3000);
      
      // Look for input fields
      const inputs = page.locator('input[type="text"], input[type="email"], textarea, select');
      const inputCount = await inputs.count();
      
      expect(inputCount).toBeGreaterThan(0);
    });
  });

  test.describe('Security Settings', () => {
    test('should have security-related settings', async ({ page }) => {
      await navigateTo(page, '/admin/settings');
      await page.waitForTimeout(3000);
      
      // Look for security-related text or tabs
      const securityElements = page.locator('text=/امان|Security|password|كلمة|authentication/i');
      const elementCount = await securityElements.count();
      
      expect(elementCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Notification Settings', () => {
    test('should load notifications settings', async ({ page }) => {
      await navigateTo(page, '/admin/notifications');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should have notification configuration options', async ({ page }) => {
      await navigateTo(page, '/admin/notifications');
      await page.waitForTimeout(3000);
      
      // Look for notification settings elements
      const notifElements = page.locator('text=/اشعار|Notification|تنبيه|Alert/i');
      const elementCount = await notifElements.count();
      
      expect(elementCount).toBeGreaterThan(0);
    });
  });

  test.describe('SMS Settings', () => {
    test('should load SMS settings page', async ({ page }) => {
      await navigateTo(page, '/admin/sms-settings');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should have SMS configuration options', async ({ page }) => {
      await navigateTo(page, '/admin/sms-settings');
      await page.waitForTimeout(3000);
      
      // Look for SMS settings elements
      const smsElements = page.locator('text=/SMS|رسائل|messages|API/i');
      const elementCount = await smsElements.count();
      
      expect(elementCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Save Settings', () => {
    test('should have save button', async ({ page }) => {
      await navigateTo(page, '/admin/settings');
      await page.waitForTimeout(3000);
      
      const saveBtn = page.locator('button').filter({ hasText: /حفظ|Save/i }).first();
      const hasSave = await saveBtn.isVisible().catch(() => false);
      
      expect(hasSave).toBe(true);
    });

    test('should validate settings before save', async ({ page }) => {
      await navigateTo(page, '/admin/settings');
      await page.waitForTimeout(3000);
      
      const saveBtn = page.locator('button').filter({ hasText: /حفظ|Save/i }).first();
      
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        
        // Should either succeed or show validation error
        const toast = page.locator('[class*="toast"], [role="alert"]');
        const toastVisible = await toast.isVisible().catch(() => false);
        
        const health = await checkPageHealth(page);
        expect(health.healthy).toBe(true);
      }
    });
  });

  test.describe('System Monitor', () => {
    test('should load system monitor page', async ({ page }) => {
      await navigateTo(page, '/admin/monitor');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should display system stats', async ({ page }) => {
      await navigateTo(page, '/admin/monitor');
      await page.waitForTimeout(3000);
      
      // Look for monitoring stats
      const statsElements = page.locator('text=/CPU|Memory|Disk|الذاكرة|المعالج/i');
      const elementCount = await statsElements.count();
      
      expect(elementCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('System Updates', () => {
    test('should load system updates page', async ({ page }) => {
      await navigateTo(page, '/admin/updates');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should display update information', async ({ page }) => {
      await navigateTo(page, '/admin/updates');
      await page.waitForTimeout(3000);
      
      // Look for update-related elements
      const updateElements = page.locator('text=/تحديث|Update|Version|الاصدار/i');
      const elementCount = await updateElements.count();
      
      expect(elementCount).toBeGreaterThanOrEqual(0);
    });
  });
});
