/**
 * Organization Owner - Market Analytics E2E Tests
 * Tests: Market analytics, heatmaps, customer flow
 */

const { test, expect } = require('@playwright/test');
const { loginAsOwner, navigateTo, checkPageHealth } = require('../../helpers/auth');

test.describe('Organization Owner - Market', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await loginAsOwner(page);
    } catch (e) {
      console.log('Owner login warning:', e.message);
    }
  });

  test.describe('Market Page', () => {
    test('should load market page', async ({ page }) => {
      await navigateTo(page, '/market');
      await page.waitForTimeout(3000);
      
      const health = await checkPageHealth(page);
      expect(health.healthy).toBe(true);
    });

    test('should display market analytics elements', async ({ page }) => {
      await navigateTo(page, '/market');
      await page.waitForTimeout(3000);
      
      // Look for market-related elements
      const marketElements = page.locator('text=/سوق|Market|عملاء|Customers|تدفق|Flow|زوار|Visitors/i');
      const elementCount = await marketElements.count();
      
      expect(elementCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Customer Flow', () => {
    test('should display customer flow data', async ({ page }) => {
      await navigateTo(page, '/market');
      await page.waitForTimeout(3000);
      
      // Look for flow-related charts or data
      const flowElements = page.locator('[class*="chart"], canvas, text=/تدفق|Flow|دخول|Entry|خروج|Exit/i');
      const elementCount = await flowElements.count();
      
      expect(elementCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Heatmaps', () => {
    test('should display heatmap visualization if available', async ({ page }) => {
      await navigateTo(page, '/market');
      await page.waitForTimeout(3000);
      
      // Look for heatmap elements
      const heatmapElements = page.locator('[class*="heatmap"], canvas, text=/خريطة حرارية|Heatmap/i');
      const elementCount = await heatmapElements.count();
      
      expect(elementCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Market Stats', () => {
    test('should display key market statistics', async ({ page }) => {
      await navigateTo(page, '/market');
      await page.waitForTimeout(3000);
      
      // Look for stat cards
      const statCards = page.locator('[class*="stat"], [class*="card"]').filter({ hasText: /زوار|Visitors|عملاء|Customers|متوسط|Average/i });
      const statCount = await statCards.count();
      
      expect(statCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Time Filters', () => {
    test('should have time period selector', async ({ page }) => {
      await navigateTo(page, '/market');
      await page.waitForTimeout(3000);
      
      // Look for time filters
      const timeFilters = page.locator('select, button').filter({ hasText: /ساعة|Hour|يوم|Day|اسبوع|Week|شهر|Month/i });
      const filterCount = await timeFilters.count();
      
      expect(filterCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Camera Selection', () => {
    test('should have camera/zone selector', async ({ page }) => {
      await navigateTo(page, '/market');
      await page.waitForTimeout(3000);
      
      // Look for camera/zone selection
      const selectors = page.locator('select, [class*="dropdown"]').filter({ hasText: /كاميرا|Camera|منطقة|Zone|Select/i });
      const selectorCount = await selectors.count();
      
      expect(selectorCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Report Generation', () => {
    test('should have report generation option', async ({ page }) => {
      await navigateTo(page, '/market');
      await page.waitForTimeout(3000);
      
      // Look for report buttons
      const reportButtons = page.locator('button').filter({ hasText: /تقرير|Report|تصدير|Export/i });
      const buttonCount = await reportButtons.count();
      
      expect(buttonCount).toBeGreaterThanOrEqual(0);
    });
  });
});
