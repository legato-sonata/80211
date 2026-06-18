import { test, expect } from '@playwright/test';

test('double tap main gateway', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
  // Wait for canvas to load
  await page.waitForSelector('.canvas-container');
  
  // Find main gateway
  const gateway = page.locator('text="Main Gateway"').locator('..').locator('..');
  
  // Double tap
  await gateway.dblclick();
  
  // Check if sidebar opens
  const sidebar = page.locator('.sidebar');
  await expect(sidebar).toBeVisible();
  
  // Click edit
  await page.locator('text="Edit"').click();
  
  // Edit name
  await page.fill('#node-label', 'Test Gateway');
  
  // Save
  await page.locator('text="Save"').click();
  
  // Check if name changed
  await expect(page.locator('text="Test Gateway"')).toBeVisible();
});
