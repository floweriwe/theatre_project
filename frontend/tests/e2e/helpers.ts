import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers
 * Theatre Management System
 *
 * Common utilities for E2E tests
 */

/**
 * Login to the application with default admin credentials
 */
export async function login(page: Page, email?: string, password?: string) {
  await page.goto('/login');

  await page.getByLabel(/Email/i).fill(email || 'admin@theatre.test');
  await page.getByLabel(/Пароль/i).fill(password || 'Theatre2024!');

  await page.getByRole('button', { name: /Войти в систему/i }).click();

  // Wait for successful login
  await expect(page).toHaveURL('/', { timeout: 10000 });
  await expect(page.getByRole('heading', { name: /Добр(ое утро|ый день|ый вечер)/i })).toBeVisible();
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  // Look for user menu
  const userMenu = page.getByRole('button', { name: /Профиль|Администратор/i }).first();

  if (await userMenu.isVisible()) {
    await userMenu.click();
  }

  // Click logout
  const logoutButton = page.getByRole('button', { name: /Выход|Выйти/i });
  await logoutButton.click();

  // Should redirect to login
  await expect(page).toHaveURL('/login', { timeout: 5000 });
}

/**
 * Navigate to a specific section
 */
export async function navigateTo(page: Page, section: 'inventory' | 'documents' | 'performances' | 'schedule' | 'dashboard') {
  const routes = {
    inventory: '/inventory',
    documents: '/documents',
    performances: '/performances',
    schedule: '/schedule',
    dashboard: '/',
  };

  await page.goto(routes[section]);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for API response with loading indicator
 */
export async function waitForDataLoad(page: Page) {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Give a bit more time for rendering
  await page.waitForTimeout(500);
}

/**
 * Search for items using search input
 */
export async function searchFor(page: Page, query: string) {
  const searchInput = page.getByPlaceholder(/Поиск/i);
  await searchInput.fill(query);
  await searchInput.press('Enter');
  await waitForDataLoad(page);
}

/**
 * Select option from dropdown by label
 */
export async function selectDropdownOption(page: Page, dropdownLabel: RegExp, optionLabel: string) {
  const dropdown = page.getByRole('combobox').filter({ hasText: dropdownLabel }).first();
  await dropdown.selectOption({ label: optionLabel });
  await waitForDataLoad(page);
}

/**
 * Click view mode button (grid or list)
 */
export async function switchViewMode(page: Page, mode: 'grid' | 'list') {
  const button = mode === 'grid'
    ? page.locator('button').filter({ has: page.locator('svg.lucide-grid') })
    : page.locator('button').filter({ has: page.locator('svg.lucide-list') });

  await button.click();
  await page.waitForTimeout(500);
}

/**
 * Fill form field by label
 */
export async function fillFormField(page: Page, label: RegExp, value: string) {
  const field = page.getByLabel(label);
  await field.fill(value);
}

/**
 * Submit form
 */
export async function submitForm(page: Page) {
  await page.getByRole('button', { name: /Сохранить|Создать|Обновить/i }).click();
}

/**
 * Accept browser dialog (confirm, alert)
 */
export async function acceptDialog(page: Page) {
  page.on('dialog', dialog => dialog.accept());
}

/**
 * Check if element exists without failing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  const count = await element.count();
  return count > 0;
}

/**
 * Get current timestamp for unique test data
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * Format test item name with timestamp
 */
export function generateTestName(prefix: string): string {
  return `${prefix} ${getTimestamp()}`;
}

/**
 * Wait for success message
 */
export async function waitForSuccessMessage(page: Page) {
  await expect(page.getByText(/успешно|создан|обновлен|удален/i)).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for error message
 */
export async function waitForErrorMessage(page: Page) {
  await expect(page.getByText(/ошибка|неверн|incorrect|failed/i)).toBeVisible({ timeout: 5000 });
}

/**
 * Refresh current page data
 */
export async function refreshPage(page: Page) {
  await page.getByRole('button', { name: /Обновить/i }).click();
  await waitForDataLoad(page);
}

/**
 * Click on first item in a list
 */
export async function clickFirstItem(page: Page, itemType: 'inventory' | 'document' | 'performance') {
  const selectors = {
    inventory: 'a[href*="/inventory/"]',
    document: 'a[href*="/documents/"]',
    performance: 'a[href*="/performances/"]',
  };

  const firstItem = page.locator(selectors[itemType]).first();

  const count = await firstItem.count();
  if (count === 0) {
    throw new Error(`No ${itemType} items found`);
  }

  await firstItem.click();
  await waitForDataLoad(page);
}

/**
 * Navigate to create new item page
 */
export async function goToCreatePage(page: Page) {
  await page.getByRole('link', { name: /Добавить/i }).click();
  await waitForDataLoad(page);
}

/**
 * Navigate to edit page from detail page
 */
export async function goToEditPage(page: Page) {
  const editButton = page.getByRole('link', { name: /Редактировать|Изменить/i });

  if (await editButton.isVisible()) {
    await editButton.click();
    await waitForDataLoad(page);
    return true;
  }

  return false;
}

/**
 * Delete item from detail page
 */
export async function deleteItem(page: Page) {
  // Set up dialog handler
  acceptDialog(page);

  const deleteButton = page.getByRole('button', { name: /Удалить/i });

  if (await deleteButton.isVisible()) {
    await deleteButton.click();
    await page.waitForTimeout(1000);
    return true;
  }

  return false;
}

/**
 * Check if page is showing empty state
 */
export async function isEmptyState(page: Page): Promise<boolean> {
  const emptyStateText = await page.getByText(/Нет данных|не найдено|пуст/i).count();
  return emptyStateText > 0;
}

/**
 * Get count of items in current view
 */
export async function getItemCount(page: Page, itemType: 'inventory' | 'document' | 'performance'): Promise<number> {
  const selectors = {
    inventory: 'a[href*="/inventory/"]',
    document: 'a[href*="/documents/"]',
    performance: 'a[href*="/performances/"]',
  };

  return await page.locator(selectors[itemType]).count();
}

/**
 * Take screenshot with name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}
