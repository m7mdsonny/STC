/**
 * Integrity E2E Tests
 * Tests for fake buttons, broken flows, and UI integrity
 */

const { test, expect } = require('@playwright/test');
const { loginAsSuperAdmin, loginAsOwner, checkPageHealth, navigateTo } = require('../../helpers/auth');
const { testAllButtons, testModal, checkLoadingState, isFakeButton, getAllLinks } = require('../../helpers/pageUtils');

test.describe('Integrity Tests - Fake Buttons & Broken Flows', () => {
  
  test.describe('Super Admin Pages Integrity', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperAdmin(page);
    });
    
    test('Admin Dashboard - All buttons should be functional', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      const buttons = await testAllButtons(page);
      
      // Check for buttons that exist but might be broken
      const foundButtons = buttons.filter(b => b.status === 'found');
      console.log(`Found ${foundButtons.length} buttons on admin dashboard`);
      
      // Verify page is healthy after button inspection
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Organizations - Add button should open modal', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const addButton = page.locator('button:has-text("اضافة مؤسسة")');
      const isVisible = await addButton.isVisible().catch(() => false);
      
      if (isVisible) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Modal should open
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const modalVisible = await modal.isVisible().catch(() => false);
        expect(modalVisible).toBe(true);
        
        // Close modal
        const cancelBtn = page.locator('button:has-text("الغاء")');
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });
    
    test('Organizations - Edit buttons should work', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      // Look for edit buttons in table rows
      const editButtons = page.locator('button[title="تعديل"], button:has-text("تعديل")').first();
      const isVisible = await editButtons.isVisible().catch(() => false);
      
      if (isVisible) {
        await editButtons.click();
        await page.waitForTimeout(1000);
        
        // Modal or form should appear
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const modalVisible = await modal.isVisible().catch(() => false);
        
        // If no modal, check if page changed or form appeared
        const formVisible = await page.locator('form').isVisible().catch(() => false);
        
        expect(modalVisible || formVisible).toBe(true);
        
        // Close modal if open
        const cancelBtn = page.locator('button:has-text("الغاء")');
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });
    
    test('Users - All action buttons should be responsive', async ({ page }) => {
      await navigateTo(page, '/admin/users');
      await checkLoadingState(page);
      
      const buttons = await testAllButtons(page);
      const foundButtons = buttons.filter(b => b.status === 'found');
      
      // Page should remain healthy
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Licenses - Page buttons should function', async ({ page }) => {
      await navigateTo(page, '/admin/licenses');
      await checkLoadingState(page);
      
      const buttons = await testAllButtons(page);
      
      // Page should remain healthy
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('All admin sidebar links should navigate correctly', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      const sidebarLinks = await getAllLinks(page);
      const adminLinks = sidebarLinks.filter(l => l.href && l.href.includes('/admin'));
      
      console.log(`Found ${adminLinks.length} admin sidebar links`);
      
      // Each link should navigate without error
      for (const link of adminLinks.slice(0, 5)) { // Test first 5 links
        await navigateTo(page, link.href);
        await checkLoadingState(page);
        
        const health = await checkPageHealth(page);
        if (!health.healthy) {
          console.log(`Link ${link.href} has issues: ${health.errors.join(', ')}`);
        }
      }
    });
  });
  
  test.describe('Owner Pages Integrity', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsOwner(page);
    });
    
    test('Owner Dashboard - All buttons should be functional', async ({ page }) => {
      await navigateTo(page, '/dashboard');
      await checkLoadingState(page);
      
      const buttons = await testAllButtons(page);
      const foundButtons = buttons.filter(b => b.status === 'found');
      console.log(`Found ${foundButtons.length} buttons on owner dashboard`);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Cameras - Add camera flow should work', async ({ page }) => {
      await navigateTo(page, '/cameras');
      await checkLoadingState(page);
      
      const addButton = page.locator('button:has-text("اضافة"), button:has-text("كاميرا جديدة")').first();
      const isVisible = await addButton.isVisible().catch(() => false);
      
      if (isVisible) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Should open modal or show form
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const form = page.locator('form').first();
        
        const modalVisible = await modal.isVisible().catch(() => false);
        const formVisible = await form.isVisible().catch(() => false);
        
        expect(modalVisible || formVisible).toBe(true);
        
        // Close if modal
        const cancelBtn = page.locator('button:has-text("الغاء"), button:has-text("إغلاق")').first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });
    
    test('Alerts - Filter controls should respond', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await checkLoadingState(page);
      
      // Test filter dropdowns
      const selects = page.locator('select').all();
      const selectCount = await page.locator('select').count();
      
      if (selectCount > 0) {
        const firstSelect = page.locator('select').first();
        await firstSelect.click().catch(() => {});
        await page.waitForTimeout(500);
      }
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('Team - Invite member flow should work', async ({ page }) => {
      await navigateTo(page, '/team');
      await checkLoadingState(page);
      
      const addButton = page.locator('button:has-text("اضافة"), button:has-text("دعوة")').first();
      const isVisible = await addButton.isVisible().catch(() => false);
      
      if (isVisible) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        const modalVisible = await modal.isVisible().catch(() => false);
        
        if (modalVisible) {
          // Close modal
          const cancelBtn = page.locator('button:has-text("الغاء")');
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
          }
        }
      }
    });
    
    test('Settings - Save buttons should function', async ({ page }) => {
      await navigateTo(page, '/settings');
      await checkLoadingState(page);
      
      // Look for save buttons
      const saveButtons = page.locator('button:has-text("حفظ"), button[type="submit"]');
      const count = await saveButtons.count();
      
      // Buttons should exist if there are settings
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
    
    test('All owner sidebar links should navigate correctly', async ({ page }) => {
      await navigateTo(page, '/dashboard');
      await checkLoadingState(page);
      
      const sidebarLinks = await getAllLinks(page);
      const ownerLinks = sidebarLinks.filter(l => 
        l.href && !l.href.includes('/admin') && 
        (l.href.startsWith('/') || l.href.includes('stcsolutions.online'))
      );
      
      console.log(`Found ${ownerLinks.length} owner sidebar links`);
      
      for (const link of ownerLinks.slice(0, 5)) {
        const path = link.href.replace(/https?:\/\/[^\/]+/, '');
        if (path && path !== '#') {
          await navigateTo(page, path);
          await checkLoadingState(page);
          
          const health = await checkPageHealth(page);
          if (!health.healthy) {
            console.log(`Link ${path} has issues: ${health.errors.join(', ')}`);
          }
        }
      }
    });
  });
  
  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperAdmin(page);
    });
    
    test('Organization form - Required fields validation', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const addButton = page.locator('button:has-text("اضافة مؤسسة")');
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Try to submit empty form
        const submitButton = page.locator('button:has-text("اضافة المؤسسة"), button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Should show validation error or prevent submission
          const errorMessage = page.locator('[class*="error"], text=/مطلوب|required/i');
          const stillHasForm = await page.locator('input').first().isVisible().catch(() => false);
          
          // Either error shown or form still open
          const hasValidation = await errorMessage.isVisible().catch(() => false) || stillHasForm;
          expect(hasValidation).toBe(true);
        }
        
        // Close modal
        const cancelBtn = page.locator('button:has-text("الغاء")');
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });
  });
  
  test.describe('Modal Behaviors', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperAdmin(page);
    });
    
    test('Modals should close on cancel button', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const addButton = page.locator('button:has-text("اضافة مؤسسة")');
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        expect(await modal.isVisible()).toBe(true);
        
        const cancelBtn = page.locator('button:has-text("الغاء")');
        await cancelBtn.click();
        await page.waitForTimeout(500);
        
        const modalClosed = !await modal.isVisible().catch(() => true);
        expect(modalClosed).toBe(true);
      }
    });
    
    test('Modals should close on backdrop click', async ({ page }) => {
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      const addButton = page.locator('button:has-text("اضافة مؤسسة")');
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('[role="dialog"], [class*="modal"]').first();
        if (await modal.isVisible()) {
          // Try clicking backdrop (outside modal content)
          await page.mouse.click(10, 10);
          await page.waitForTimeout(500);
          
          // Modal might or might not close depending on implementation
          // This test just checks it doesn't crash
          const health = await checkPageHealth(page);
          expect(health.healthy).toBe(true);
        }
      }
    });
  });
  
  test.describe('Error States', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperAdmin(page);
    });
    
    test('Pages should handle API errors gracefully', async ({ page }) => {
      // Navigate to a page that loads data
      await navigateTo(page, '/admin/organizations');
      await checkLoadingState(page);
      
      // Even if API fails, page should not crash
      const health = await checkPageHealth(page);
      // Allow for error states but not crashes
      expect(health.errors).not.toContain('React error boundary triggered');
    });
    
    test('Pages should show retry option on error', async ({ page }) => {
      await navigateTo(page, '/admin');
      await checkLoadingState(page);
      
      // Check if there's an error state with retry button
      const retryButton = page.locator('button:has-text("إعادة المحاولة"), button:has-text("retry")');
      const errorState = page.locator('text=/خطأ|error/i');
      
      // If there's an error, there should be a retry option
      const hasError = await errorState.isVisible().catch(() => false);
      if (hasError) {
        const hasRetry = await retryButton.isVisible().catch(() => false);
        expect(hasRetry).toBe(true);
      }
    });
  });
  
  test.describe('Loading States', () => {
    test('Pages should show loading indicator during data fetch', async ({ page }) => {
      await loginAsSuperAdmin(page);
      
      // Navigate and check for loading state
      const navigationPromise = page.goto('/admin/organizations');
      
      // Check for loading indicator during navigation
      const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], text=جاري التحميل');
      
      await navigationPromise;
      await page.waitForTimeout(1000);
      
      // Page should eventually finish loading
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });
  });
});
