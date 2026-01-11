const { test, expect } = require('@playwright/test');

test('Super Admin login - REAL TWO STEP FLOW (ENTER SUBMIT)', async ({ page }) => {
  
  // 1️⃣ Open the production website
  await page.goto('https://stcsolutions.online', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // 2️⃣ Navigate to login page
  // Find and click "تسجيل الدخول" link
  const loginLink = page.locator('text=تسجيل الدخول').first();
  await expect(loginLink).toBeVisible({ timeout: 10000 });
  await loginLink.click();
  
  // Wait for navigation to login page
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');

  // 3️⃣ STEP 1: Find and fill email input
  // Wait for email input to be visible (resilient locator)
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  
  // Fill email
  await emailInput.fill('superadmin@demo.local');
  
  // Wait a bit for React state updates
  await page.waitForTimeout(500);
  
  // 4️⃣ STEP 2: Find password input
  // Password input may be visible from start OR appear after email submission
  let passwordInput = page.locator('input[type="password"]');
  
  // Check if password is already visible
  const passwordInitiallyVisible = await passwordInput.isVisible().catch(() => false);
  
  if (!passwordInitiallyVisible) {
    // Two-step flow: Password appears after email submission
    // Submit email via Enter key
    await emailInput.press('Enter');
    
    // Wait for password input to appear (with retry)
    await page.waitForTimeout(1000); // Give time for React to update
    await expect(passwordInput).toBeVisible({ timeout: 15000 });
  }
  
  // 5️⃣ STEP 3: Fill and submit password
  // Password input is now visible
  await passwordInput.fill('Super@12345');
  
  // Wait a bit for React state updates
  await page.waitForTimeout(500);
  
  // Submit password via Enter key
  await passwordInput.press('Enter');
  
  // 6️⃣ Wait for successful API response
  // Wait for login API call to complete
  await page.waitForResponse(
    resp =>
      resp.status() === 200 &&
      (resp.url().includes('/api/v1/auth/login') ||
       resp.url().includes('/auth/login')),
    { timeout: 20000 }
  );
  
  // 7️⃣ Wait for React state updates and navigation
  // Give React time to update UI after successful login
  await page.waitForTimeout(3000);
  
  // 8️⃣ Verify successful login by detecting dashboard UI elements
  // DO NOT check URL - it may remain /login
  // Check for sidebar or navigation elements that indicate successful login
  
  // Super admin sidebar contains: لوحة التحكم, المؤسسات, المستخدمين, etc.
  const dashboardElements = [
    page.locator('text=لوحة التحكم'),
    page.locator('text=المؤسسات'),
    page.locator('text=المستخدمين'),
    page.locator('text=التراخيص'),
    page.locator('text=الاعدادات'),
    page.locator('text=/dashboard|organizations|users|licenses|settings/i'),
    page.locator('text=/organizations|المؤسسات/i'),
    page.locator('text=/users|المستخدمين/i'),
    page.locator('text=/edge|سيرفرات/i'),
    page.locator('text=/total|إجمالي/i'),
    // Also check for navigation/sidebar structure
    page.locator('nav, [class*="sidebar"], [class*="navigation"]'),
  ];
  
  // Wait for at least one dashboard element to be visible
  let dashboardFound = false;
  for (const locator of dashboardElements) {
    try {
      await expect(locator).toBeVisible({ timeout: 10000 });
      dashboardFound = true;
      break;
    } catch (e) {
      // Continue to next element
    }
  }
  
  // Final verification: Ensure we found dashboard elements
  expect(dashboardFound).toBe(true);
  
  // Test passed - login was successful
});
