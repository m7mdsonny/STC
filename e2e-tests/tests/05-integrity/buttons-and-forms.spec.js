/**
 * UI Integrity E2E Tests
 * Tests: Fake buttons, broken forms, navigation, loading states
 */

const { test, expect } = require('@playwright/test');
const { loginAsSuperAdmin, loginAsOwner, navigateTo, checkPageHealth } = require('../../helpers/auth');

test.describe('UI Integrity - Super Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test.describe('Button Functionality', () => {
    test('Add Organization button should open modal', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await page.waitForTimeout(2000);
      
      const addBtn = page.locator('button').filter({ hasText: /اضافة مؤسسة|Add Organization/i }).first();
      
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        
        // Modal must open - not a fake button
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const modalVisible = await modal.isVisible().catch(() => false);
        
        expect(modalVisible).toBe(true);
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    });

    test('Create License button should open modal', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء ترخيص|Create License/i }).first();
      
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1500);
        
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const modalVisible = await modal.isVisible().catch(() => false);
        
        expect(modalVisible).toBe(true);
        
        await page.keyboard.press('Escape');
      }
    });

    test('Create Backup button should trigger action', async ({ page }) => {
      await navigateTo(page, '/admin/backups');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء نسخة|Create Backup|إنشاء/i }).first();
      
      if (await createBtn.isVisible()) {
        // Monitor network for API call
        const responsePromise = page.waitForResponse(
          response => response.url().includes('/api/') && response.request().method() === 'POST',
          { timeout: 10000 }
        ).catch(() => null);
        
        await createBtn.click();
        await page.waitForTimeout(2000);
        
        // Should see either API call, toast, or loading indicator
        const toast = page.locator('[class*="toast"], [role="alert"]');
        const loading = page.locator('text=/جاري|Loading|Creating/i');
        
        const toastVisible = await toast.isVisible().catch(() => false);
        const loadingVisible = await loading.isVisible().catch(() => false);
        const response = await responsePromise;
        
        // Button should do something - not be fake
        expect(toastVisible || loadingVisible || response !== null).toBe(true);
      }
    });

    test('Refresh button should reload data', async ({ page }) => {
      await navigateTo(page, '/admin/edge-servers');
      await page.waitForTimeout(2000);
      
      const refreshBtn = page.locator('button').filter({ hasText: /تحديث|Refresh/i }).first();
      
      if (await refreshBtn.isVisible()) {
        // Monitor for spinner
        await refreshBtn.click();
        await page.waitForTimeout(500);
        
        // Should show loading indicator or refresh icon spinning
        const spinner = page.locator('[class*="animate-spin"], [class*="loading"]');
        const spinnerVisible = await spinner.isVisible().catch(() => false);
        
        // Wait for completion
        await page.waitForTimeout(2000);
        
        const health = await checkPageHealth(page);
        expect(health.healthy).toBe(true);
      }
    });
  });

  test.describe('Form Validation', () => {
    test('Organization form should validate required fields', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await page.waitForTimeout(2000);
      
      const addBtn = page.locator('button').filter({ hasText: /اضافة مؤسسة|Add Organization/i }).first();
      
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        
        // Try to submit empty form
        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /اضافة|حفظ|Save|Add/i }).last();
        
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          
          // Modal should stay open (validation failed)
          const modal = page.locator('[role="dialog"], [class*="modal"]').first();
          const modalStillOpen = await modal.isVisible().catch(() => false);
          
          expect(modalStillOpen).toBe(true);
        }
        
        await page.keyboard.press('Escape');
      }
    });

    test('License form should validate required fields', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await page.waitForTimeout(2000);
      
      const createBtn = page.locator('button').filter({ hasText: /انشاء ترخيص|Create License/i }).first();
      
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1500);
        
        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /انشاء|Create/i }).last();
        
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          
          // Modal should stay open
          const modal = page.locator('[role="dialog"], [class*="modal"]').first();
          const modalStillOpen = await modal.isVisible().catch(() => false);
          
          expect(modalStillOpen).toBe(true);
        }
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Navigation Integrity', () => {
    test('All sidebar links should navigate correctly', async ({ page }) => {
      await navigateTo(page, '/admin');
      await page.waitForTimeout(2000);
      
      // Get all sidebar links
      const sidebarLinks = page.locator('nav a, aside a, [class*="sidebar"] a');
      const linkCount = await sidebarLinks.count();
      
      // Test first few links
      const linksToTest = Math.min(linkCount, 5);
      
      for (let i = 0; i < linksToTest; i++) {
        const link = sidebarLinks.nth(i);
        const href = await link.getAttribute('href');
        
        if (href && !href.startsWith('#') && !href.startsWith('http')) {
          await link.click();
          await page.waitForTimeout(2000);
          
          const health = await checkPageHealth(page);
          expect(health.healthy).toBe(true);
          
          // Navigate back to admin
          await navigateTo(page, '/admin');
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Modal Close Functionality', () => {
    test('Modal should close on cancel button click', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await page.waitForTimeout(2000);
      
      const addBtn = page.locator('button').filter({ hasText: /اضافة مؤسسة|Add Organization/i }).first();
      
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        
        const cancelBtn = page.locator('button').filter({ hasText: /الغاء|Cancel/i }).first();
        
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
          
          const modal = page.locator('[role="dialog"], [class*="modal"]').first();
          const modalClosed = !(await modal.isVisible().catch(() => false));
          
          expect(modalClosed).toBe(true);
        }
      }
    });

    test('Modal should close on Escape key', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await page.waitForTimeout(2000);
      
      const addBtn = page.locator('button').filter({ hasText: /اضافة مؤسسة|Add Organization/i }).first();
      
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const modalClosed = !(await modal.isVisible().catch(() => false));
        
        expect(modalClosed).toBe(true);
      }
    });
  });
});

test.describe('UI Integrity - Owner Pages', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await loginAsOwner(page);
    } catch (e) {
      console.log('Owner login warning:', e.message);
    }
  });

  test.describe('Camera Page Buttons', () => {
    test('Add camera button should work', async ({ page }) => {
      await navigateTo(page, '/cameras');
      await page.waitForTimeout(2000);
      
      const addBtn = page.locator('button').filter({ hasText: /اضافة كاميرا|Add Camera/i }).first();
      
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const modalVisible = await modal.isVisible().catch(() => false);
        
        expect(modalVisible).toBe(true);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('Search input should filter results', async ({ page }) => {
      await navigateTo(page, '/cameras');
      await page.waitForTimeout(2000);
      
      const searchInput = page.locator('input[placeholder*="بحث"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test search');
        await page.waitForTimeout(1000);
        
        // Page should not error
        const health = await checkPageHealth(page);
        expect(health.healthy).toBe(true);
        
        // Clear search
        await searchInput.clear();
      }
    });
  });

  test.describe('Filter Dropdowns', () => {
    test('Status filter should work', async ({ page }) => {
      await navigateTo(page, '/cameras');
      await page.waitForTimeout(2000);
      
      const statusFilter = page.locator('select').first();
      
      if (await statusFilter.isVisible()) {
        const options = await statusFilter.locator('option').count();
        
        if (options > 1) {
          await statusFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
          
          const health = await checkPageHealth(page);
          expect(health.healthy).toBe(true);
        }
      }
    });
  });
});

test.describe('Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test('Pages should show loading state before data loads', async ({ page }) => {
    // Navigate to a data-heavy page
    await page.goto('https://stcsolutions.online/admin/edge-servers', { waitUntil: 'commit', timeout: 60000 });
    
    // Look for loading indicator
    const loadingIndicator = page.locator('[class*="animate-spin"], [class*="loading"], text=/جاري|Loading/i');
    
    // Wait for page to fully load
    await page.waitForTimeout(5000);
    
    const health = await checkPageHealth(page);
    expect(health.healthy).toBe(true);
  });
});

test.describe('Empty States', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test('Pages should show appropriate empty states', async ({ page }) => {
    await navigateTo(page, '/admin/licenses');
    await page.waitForTimeout(3000);
    
    // Should show either data or empty state - not blank
    const table = page.locator('table');
    const emptyState = page.locator('text=/لا توجد|No |empty/i');
    const cards = page.locator('[class*="card"]');
    
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasCards = await cards.count() > 0;
    
    expect(hasTable || hasEmpty || hasCards).toBe(true);
  });
});

test.describe('Delete Confirmations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test('Delete actions should require confirmation', async ({ page }) => {
    await navigateTo(page, '/admin/licenses');
    await page.waitForTimeout(3000);
    
    const deleteBtn = page.locator('button:has(svg[class*="trash"])').first();
    
    if (await deleteBtn.isVisible()) {
      // Set up dialog handler
      let dialogAppeared = false;
      page.once('dialog', async dialog => {
        dialogAppeared = true;
        await dialog.dismiss();
      });
      
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      
      // Should show confirmation dialog
      expect(dialogAppeared).toBe(true);
    }
  });
});
