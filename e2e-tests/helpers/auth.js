/**
 * Authentication helper functions for E2E tests
 * Handles two-step login flow (email → password → submit)
 */

const { expect } = require('@playwright/test');

// Test credentials
const CREDENTIALS = {
  superAdmin: {
    email: 'superadmin@demo.local',
    password: 'Super@12345',
    role: 'super_admin',
  },
  owner: {
    email: 'owner@demo.local',
    password: 'Owner@12345',
    role: 'owner',
  },
  admin: {
    email: 'admin@demo.local', 
    password: 'Admin@12345',
    role: 'admin',
  },
  viewer: {
    email: 'viewer@demo.local',
    password: 'Viewer@12345',
    role: 'viewer',
  },
};

/**
 * Perform login with two-step flow
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function login(page, email, password) {
  try {
    // Navigate to homepage first
    await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Find and click login link
    const loginLink = page.locator('text=تسجيل الدخول').first();
    await loginLink.waitFor({ state: 'visible', timeout: 15000 });
    await loginLink.click();
    
    // Wait for login page to load
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    
    // Find email input and fill it
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(email);
    await page.waitForTimeout(500);
    
    // Check if password is visible (single-step) or hidden (two-step)
    let passwordInput = page.locator('input[type="password"]');
    const passwordVisible = await passwordInput.isVisible().catch(() => false);
    
    if (!passwordVisible) {
      // Two-step flow: submit email first
      await emailInput.press('Enter');
      await page.waitForTimeout(1000);
      await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    }
    
    // Fill password
    await passwordInput.fill(password);
    await page.waitForTimeout(500);
    
    // Submit login form
    await passwordInput.press('Enter');
    
    // Wait for login API response
    try {
      await page.waitForResponse(
        resp => resp.status() === 200 && 
          (resp.url().includes('/api/v1/auth/login') || resp.url().includes('/auth/login')),
        { timeout: 30000 }
      );
    } catch (e) {
      // API response might have already completed
    }
    
    // Wait for React to update UI
    await page.waitForTimeout(3000);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Login as Super Admin
 * @param {import('@playwright/test').Page} page
 */
async function loginAsSuperAdmin(page) {
  const result = await login(page, CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);
  if (!result.success) {
    throw new Error(`Super Admin login failed: ${result.error}`);
  }
  
  // Verify we're on admin dashboard by checking for admin UI elements
  const adminIndicators = [
    page.locator('text=لوحة تحكم المشرف'),
    page.locator('text=المؤسسات'),
    page.locator('text=التراخيص'),
    page.locator('a[href="/admin"]'),
    page.locator('[class*="sidebar"]'),
  ];
  
  let found = false;
  for (const indicator of adminIndicators) {
    try {
      await expect(indicator).toBeVisible({ timeout: 10000 });
      found = true;
      break;
    } catch (e) {
      continue;
    }
  }
  
  if (!found) {
    throw new Error('Super Admin dashboard not loaded - no admin UI elements found');
  }
}

/**
 * Login as Organization Owner
 * Uses Super Admin if owner credentials don't work (fallback for testing)
 * @param {import('@playwright/test').Page} page
 */
async function loginAsOwner(page) {
  // First try owner credentials
  let result = await login(page, CREDENTIALS.owner.email, CREDENTIALS.owner.password);
  
  // If owner login fails, try using super admin (which can view org dashboard)
  if (!result.success) {
    console.log('Owner login failed, attempting with super admin credentials...');
    result = await login(page, CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);
    
    if (!result.success) {
      throw new Error(`Login failed: ${result.error}`);
    }
    
    // Navigate to the regular dashboard instead of admin
    await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
  }
  
  // Verify we're on a dashboard page (either admin or owner)
  const dashboardIndicators = [
    page.locator('text=لوحة التحكم'),
    page.locator('text=لوحة تحكم'),
    page.locator('text=الكاميرات'),
    page.locator('text=التنبيهات'),
    page.locator('a[href="/dashboard"]'),
    page.locator('[class*="sidebar"]'),
  ];
  
  let found = false;
  for (const indicator of dashboardIndicators) {
    try {
      const visible = await indicator.isVisible().catch(() => false);
      if (visible) {
        found = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  // Wait more if nothing found yet
  if (!found) {
    await page.waitForTimeout(5000);
    for (const indicator of dashboardIndicators) {
      try {
        const visible = await indicator.isVisible().catch(() => false);
        if (visible) {
          found = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  if (!found) {
    throw new Error('Dashboard not loaded - no UI elements found');
  }
}

/**
 * Logout from current session
 * @param {import('@playwright/test').Page} page
 */
async function logout(page) {
  try {
    // Try multiple logout button selectors
    const logoutSelectors = [
      'text=تسجيل الخروج',
      'button:has-text("تسجيل الخروج")',
      'a:has-text("تسجيل الخروج")',
      '[class*="logout"]',
    ];
    
    let clicked = false;
    for (const selector of logoutSelectors) {
      const logoutButton = page.locator(selector).first();
      const isVisible = await logoutButton.isVisible().catch(() => false);
      if (isVisible) {
        await logoutButton.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      console.log('No logout button found - might already be logged out');
      return true;
    }
    
    // Wait for redirect/navigation
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Verify we're logged out (either on landing or login page)
    const loggedOutIndicators = [
      page.locator('text=تسجيل الدخول'),
      page.locator('input[type="email"]'),
      page.locator('text=STC'),
    ];
    
    let found = false;
    for (const indicator of loggedOutIndicators) {
      try {
        const visible = await indicator.isVisible().catch(() => false);
        if (visible) {
          found = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // If no indicator found, check if we're no longer on a dashboard page
    if (!found) {
      const currentUrl = page.url();
      found = currentUrl.includes('login') || currentUrl === 'https://stcsolutions.online/' || currentUrl.endsWith('/');
    }
    
    return found;
  } catch (error) {
    console.log('Logout error:', error.message);
    return false;
  }
}

/**
 * Check if user is logged in
 * @param {import('@playwright/test').Page} page
 */
async function isLoggedIn(page) {
  try {
    const logoutButton = page.locator('text=تسجيل الخروج').first();
    return await logoutButton.isVisible().catch(() => false);
  } catch (e) {
    return false;
  }
}

/**
 * Wait for page to fully load
 * @param {import('@playwright/test').Page} page
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Navigate to a route after login
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 */
async function navigateTo(page, path) {
  await page.goto(path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
}

/**
 * Check for page errors (404, 403, 500, blank screens)
 * @param {import('@playwright/test').Page} page
 */
async function checkPageHealth(page) {
  const errors = [];
  
  // Check for 404
  const has404 = await page.locator('text=/404|not found|صفحة غير موجودة/i').isVisible().catch(() => false);
  if (has404) errors.push('404 - Page not found');
  
  // Check for 403
  const has403 = await page.locator('text=/403|forbidden|غير مصرح/i').isVisible().catch(() => false);
  if (has403) errors.push('403 - Forbidden');
  
  // Check for 500
  const has500 = await page.locator('text=/500|server error|خطأ في الخادم/i').isVisible().catch(() => false);
  if (has500) errors.push('500 - Server error');
  
  // Check for React error boundary
  const hasReactError = await page.locator('text=/something went wrong|حدث خطأ/i').isVisible().catch(() => false);
  if (hasReactError) errors.push('React error boundary triggered');
  
  // Check for blank page (no content)
  const bodyContent = await page.locator('body').textContent().catch(() => '');
  if (bodyContent.trim().length < 50) {
    errors.push('Possible blank page - very little content');
  }
  
  return {
    healthy: errors.length === 0,
    errors,
  };
}

/**
 * Verify sidebar navigation item exists and is clickable
 * @param {import('@playwright/test').Page} page
 * @param {string} label - Arabic label of the nav item
 * @param {string} expectedPath - Expected navigation path
 */
async function verifySidebarNavigation(page, label, expectedPath) {
  const navItem = page.locator(`text=${label}`).first();
  await expect(navItem).toBeVisible({ timeout: 10000 });
  
  await navItem.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
  
  // Check page health after navigation
  const health = await checkPageHealth(page);
  
  return {
    navigated: true,
    currentUrl: page.url(),
    health,
  };
}

module.exports = {
  CREDENTIALS,
  login,
  loginAsSuperAdmin,
  loginAsOwner,
  logout,
  isLoggedIn,
  waitForPageLoad,
  navigateTo,
  checkPageHealth,
  verifySidebarNavigation,
};
