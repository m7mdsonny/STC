/**
 * Page testing utilities for E2E tests
 */

const { expect } = require('@playwright/test');

/**
 * Test all buttons on a page for functionality
 * @param {import('@playwright/test').Page} page
 */
async function testAllButtons(page) {
  const results = [];
  
  // Find all buttons
  const buttons = await page.locator('button').all();
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    try {
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      const text = await button.textContent().catch(() => '');
      const className = await button.getAttribute('class') || '';
      
      // Skip hidden or disabled buttons
      if (!isVisible || !isEnabled) {
        results.push({
          index: i,
          text: text.trim(),
          status: 'skipped',
          reason: !isVisible ? 'hidden' : 'disabled',
        });
        continue;
      }
      
      // Skip logout button to prevent session loss
      if (text.includes('تسجيل الخروج') || text.includes('logout')) {
        results.push({
          index: i,
          text: text.trim(),
          status: 'skipped',
          reason: 'logout button',
        });
        continue;
      }
      
      // Skip close/cancel buttons in modals to avoid state changes
      if (text.includes('الغاء') || text.includes('إغلاق') || className.includes('close')) {
        results.push({
          index: i,
          text: text.trim(),
          status: 'skipped',
          reason: 'modal control button',
        });
        continue;
      }
      
      results.push({
        index: i,
        text: text.trim(),
        status: 'found',
        visible: isVisible,
        enabled: isEnabled,
      });
    } catch (error) {
      results.push({
        index: i,
        status: 'error',
        error: error.message,
      });
    }
  }
  
  return results;
}

/**
 * Test form submission
 * @param {import('@playwright/test').Page} page
 * @param {Object} formData - Key-value pairs of form field names/placeholders and values
 */
async function testFormSubmission(page, formData) {
  const results = {
    fieldsFound: [],
    fieldsMissing: [],
    submitButton: null,
    submitted: false,
    response: null,
  };
  
  for (const [key, value] of Object.entries(formData)) {
    try {
      // Try multiple selectors
      let input = page.locator(`input[name="${key}"]`);
      if (!await input.isVisible().catch(() => false)) {
        input = page.locator(`input[placeholder*="${key}"]`);
      }
      if (!await input.isVisible().catch(() => false)) {
        input = page.locator(`textarea[name="${key}"]`);
      }
      if (!await input.isVisible().catch(() => false)) {
        input = page.locator(`select[name="${key}"]`);
      }
      
      if (await input.isVisible().catch(() => false)) {
        await input.fill(String(value));
        results.fieldsFound.push(key);
      } else {
        results.fieldsMissing.push(key);
      }
    } catch (error) {
      results.fieldsMissing.push(key);
    }
  }
  
  // Find submit button
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("حفظ")',
    'button:has-text("إضافة")',
    'button:has-text("تأكيد")',
    'button:has-text("إرسال")',
  ];
  
  for (const selector of submitSelectors) {
    const submitBtn = page.locator(selector).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      results.submitButton = await submitBtn.textContent().catch(() => 'Submit');
      break;
    }
  }
  
  return results;
}

/**
 * Test data table functionality
 * @param {import('@playwright/test').Page} page
 */
async function testDataTable(page) {
  const results = {
    found: false,
    headers: [],
    rowCount: 0,
    hasActions: false,
    pagination: null,
    searchable: false,
  };
  
  // Look for table
  const table = page.locator('table').first();
  if (await table.isVisible().catch(() => false)) {
    results.found = true;
    
    // Get headers
    const headers = await page.locator('th').allTextContents();
    results.headers = headers.filter(h => h.trim());
    
    // Count rows
    const rows = await page.locator('tbody tr').count();
    results.rowCount = rows;
    
    // Check for action buttons in rows
    const actionButtons = await page.locator('tbody tr button').count();
    results.hasActions = actionButtons > 0;
    
    // Check for pagination
    const pagination = page.locator('[class*="pagination"], nav:has(button)');
    results.pagination = await pagination.isVisible().catch(() => false);
    
    // Check for search
    const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="search"]');
    results.searchable = await searchInput.isVisible().catch(() => false);
  }
  
  return results;
}

/**
 * Test modal functionality
 * @param {import('@playwright/test').Page} page
 * @param {string} triggerText - Text of button to open modal
 */
async function testModal(page, triggerText) {
  const results = {
    triggerFound: false,
    modalOpened: false,
    modalClosed: false,
    hasForm: false,
    formFields: [],
  };
  
  try {
    // Find and click trigger button
    const trigger = page.locator(`button:has-text("${triggerText}")`).first();
    if (await trigger.isVisible().catch(() => false)) {
      results.triggerFound = true;
      await trigger.click();
      await page.waitForTimeout(1000);
      
      // Check if modal opened
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      results.modalOpened = await modal.isVisible().catch(() => false);
      
      if (results.modalOpened) {
        // Check for form in modal
        const form = modal.locator('form');
        results.hasForm = await form.isVisible().catch(() => false);
        
        // Get form fields
        if (results.hasForm) {
          const inputs = await modal.locator('input, select, textarea').all();
          for (const input of inputs) {
            const name = await input.getAttribute('name').catch(() => null);
            const placeholder = await input.getAttribute('placeholder').catch(() => null);
            const type = await input.getAttribute('type').catch(() => 'text');
            results.formFields.push({ name, placeholder, type });
          }
        }
        
        // Try to close modal
        const closeBtn = modal.locator('button:has-text("الغاء"), button:has-text("إغلاق"), button[class*="close"]').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          results.modalClosed = !await modal.isVisible().catch(() => true);
        }
      }
    }
  } catch (error) {
    results.error = error.message;
  }
  
  return results;
}

/**
 * Test API response for a navigation
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 */
async function testAPIResponse(page, path) {
  const apiCalls = [];
  
  // Listen for API calls
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      apiCalls.push({
        url: response.url(),
        status: response.status(),
        ok: response.ok(),
      });
    }
  });
  
  await page.goto(path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  
  return apiCalls;
}

/**
 * Check if element is a "fake" button (looks clickable but does nothing)
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} button
 */
async function isFakeButton(page, button) {
  // Get initial page state
  const initialUrl = page.url();
  const initialContent = await page.content();
  
  // Set up listeners for any changes
  let apiCallMade = false;
  let consoleOutput = false;
  
  const responseHandler = () => { apiCallMade = true; };
  const consoleHandler = () => { consoleOutput = true; };
  
  page.on('response', responseHandler);
  page.on('console', consoleHandler);
  
  try {
    await button.click({ timeout: 5000 });
    await page.waitForTimeout(1000);
  } catch (e) {
    // Click might timeout - that's okay
  }
  
  page.off('response', responseHandler);
  page.off('console', consoleHandler);
  
  // Check if anything changed
  const finalUrl = page.url();
  const finalContent = await page.content();
  
  const urlChanged = initialUrl !== finalUrl;
  const contentChanged = initialContent !== finalContent;
  
  return {
    isFake: !urlChanged && !contentChanged && !apiCallMade,
    urlChanged,
    contentChanged,
    apiCallMade,
    consoleOutput,
  };
}

/**
 * Get all visible links on page
 * @param {import('@playwright/test').Page} page
 */
async function getAllLinks(page) {
  const links = await page.locator('a[href]').all();
  const linkData = [];
  
  for (const link of links) {
    try {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      const isVisible = await link.isVisible();
      
      if (isVisible && href) {
        linkData.push({
          href,
          text: text.trim(),
        });
      }
    } catch (e) {
      // Skip problematic links
    }
  }
  
  return linkData;
}

/**
 * Test loading states
 * @param {import('@playwright/test').Page} page
 */
async function checkLoadingState(page) {
  // Check for loading indicators
  const loadingIndicators = [
    page.locator('[class*="loading"]'),
    page.locator('[class*="spinner"]'),
    page.locator('text=جاري التحميل'),
    page.locator('[class*="animate-spin"]'),
  ];
  
  for (const indicator of loadingIndicators) {
    if (await indicator.isVisible().catch(() => false)) {
      // Wait for loading to complete
      await indicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    }
  }
  
  await page.waitForTimeout(500);
}

/**
 * Capture page state for debugging
 * @param {import('@playwright/test').Page} page
 */
async function capturePageState(page) {
  return {
    url: page.url(),
    title: await page.title(),
    visibleText: await page.locator('body').textContent().then(t => t.substring(0, 500)).catch(() => ''),
    consoleErrors: [],
  };
}

module.exports = {
  testAllButtons,
  testFormSubmission,
  testDataTable,
  testModal,
  testAPIResponse,
  isFakeButton,
  getAllLinks,
  checkLoadingState,
  capturePageState,
};
