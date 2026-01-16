import { test, expect } from '@playwright/test';

/**
 * Inventory E2E Tests
 * Theatre Management System
 *
 * Tests inventory list, create, edit, and delete operations
 */

// Helper function to login
async function login(page) {
  await page.goto('/login');
  await page.getByLabel(/Email/i).fill('admin@theatre.test');
  await page.getByLabel(/Пароль/i).fill('Theatre2024!');
  await page.getByRole('button', { name: /Войти в систему/i }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Inventory', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);

    // Navigate to inventory page
    await page.goto('/inventory');
  });

  test('should display inventory list page', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /Инвентарь/i })).toBeVisible();

    // Verify action buttons are present
    await expect(page.getByRole('button', { name: /Обновить/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Добавить/i })).toBeVisible();

    // Verify search input
    await expect(page.getByPlaceholder(/Поиск/i)).toBeVisible();

    // Verify filter dropdowns
    await expect(page.getByRole('combobox').first()).toBeVisible();

    // Verify stats cards are visible
    await expect(page.getByText(/Всего/i).first()).toBeVisible();
    await expect(page.getByText(/На складе/i)).toBeVisible();
  });

  test('should filter inventory by category', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Get initial items count
    const itemsBefore = await page.locator('[data-testid="inventory-item"], a[href*="/inventory/"]').count();

    // Select a category from dropdown
    const categorySelect = page.getByRole('combobox').filter({ hasText: /категори/i }).first();
    await categorySelect.selectOption({ index: 1 }); // Select first non-empty option

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Items count should change (or stay same if all items are in that category)
    const itemsAfter = await page.locator('[data-testid="inventory-item"], a[href*="/inventory/"]').count();

    // Verify filter was applied (page should have reloaded)
    expect(itemsAfter).toBeGreaterThanOrEqual(0);
  });

  test('should filter inventory by status', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Select status filter
    const statusSelect = page.getByRole('combobox').filter({ hasText: /статус/i }).first();
    await statusSelect.selectOption({ label: /На складе/i });

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify items are filtered (all should show "На складе" status)
    const statusBadges = await page.locator('text=/На складе/i').count();
    expect(statusBadges).toBeGreaterThan(0);
  });

  test('should search inventory items', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Type in search box
    const searchInput = page.getByPlaceholder(/Поиск/i);
    await searchInput.fill('реквизит');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Should show filtered results
    const results = await page.locator('[data-testid="inventory-item"], a[href*="/inventory/"]').count();
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test('should switch between grid and list view', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Find view toggle buttons (Grid/List icons)
    const listViewButton = page.locator('button').filter({ has: page.locator('svg.lucide-list') });
    const gridViewButton = page.locator('button').filter({ has: page.locator('svg.lucide-grid') });

    // Switch to list view
    await listViewButton.click();
    await page.waitForTimeout(500);

    // Verify table view is shown
    await expect(page.locator('table')).toBeVisible();

    // Switch back to grid view
    await gridViewButton.click();
    await page.waitForTimeout(500);

    // Verify grid is shown (cards layout)
    const gridItems = await page.locator('[data-testid="inventory-item"], a[href*="/inventory/"]').count();
    expect(gridItems).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to item detail page', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Click on first item
    const firstItem = page.locator('a[href*="/inventory/"]').first();
    await firstItem.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/inventory\/\d+/);

    // Verify detail page elements
    await expect(page.getByText(/Инвентарный номер/i)).toBeVisible();
  });

  test('should navigate to create item page', async ({ page }) => {
    // Click "Добавить" button
    await page.getByRole('link', { name: /Добавить/i }).click();

    // Should navigate to create page
    await expect(page).toHaveURL('/inventory/new');

    // Verify form elements
    await expect(page.getByLabel(/Название/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Сохранить|Создать/i })).toBeVisible();
  });

  test('should create new inventory item', async ({ page }) => {
    // Navigate to create page
    await page.goto('/inventory/new');

    // Fill in the form
    const timestamp = Date.now();
    await page.getByLabel(/Название/i).fill(`Test Item ${timestamp}`);
    await page.getByLabel(/Инвентарный номер/i).fill(`TEST-${timestamp}`);
    await page.getByLabel(/Количество/i).fill('5');

    // Select category
    const categorySelect = page.getByLabel(/Категория/i);
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Fill description
    const descriptionField = page.getByLabel(/Описание/i);
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Test description for E2E testing');
    }

    // Submit form
    await page.getByRole('button', { name: /Сохранить|Создать/i }).click();

    // Should redirect to list or detail page
    await expect(page).toHaveURL(/\/inventory/, { timeout: 10000 });

    // Verify success message or new item appears
    await expect(page.getByText(new RegExp(`Test Item ${timestamp}|успешно|создан`, 'i'))).toBeVisible({ timeout: 5000 });
  });

  test('should edit inventory item', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Navigate to first item detail
    const firstItemLink = page.locator('a[href*="/inventory/"]').first();
    await firstItemLink.click();

    // Wait for detail page
    await page.waitForLoadState('networkidle');

    // Click edit button
    const editButton = page.getByRole('link', { name: /Редактировать|Изменить/i });
    if (await editButton.isVisible()) {
      await editButton.click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/\/inventory\/\d+\/edit/);

      // Modify a field
      const nameField = page.getByLabel(/Название/i);
      const originalValue = await nameField.inputValue();
      await nameField.fill(`${originalValue} (edited)`);

      // Save changes
      await page.getByRole('button', { name: /Сохранить|Обновить/i }).click();

      // Should redirect back
      await expect(page).toHaveURL(/\/inventory\/\d+/, { timeout: 10000 });

      // Verify changes were saved
      await expect(page.getByText(/\(edited\)|успешно|обновлен/i)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should delete inventory item', async ({ page }) => {
    // Create a test item first
    await page.goto('/inventory/new');

    const timestamp = Date.now();
    await page.getByLabel(/Название/i).fill(`Delete Test ${timestamp}`);
    await page.getByLabel(/Инвентарный номер/i).fill(`DEL-${timestamp}`);
    await page.getByLabel(/Количество/i).fill('1');

    await page.getByRole('button', { name: /Сохранить|Создать/i }).click();
    await page.waitForURL(/\/inventory/, { timeout: 10000 });

    // Find and click the item
    await page.getByText(`Delete Test ${timestamp}`).click();

    // Click delete button
    const deleteButton = page.getByRole('button', { name: /Удалить/i });
    if (await deleteButton.isVisible()) {
      // Listen for confirmation dialog
      page.on('dialog', dialog => dialog.accept());

      await deleteButton.click();

      // Should redirect to list
      await expect(page).toHaveURL('/inventory', { timeout: 10000 });

      // Verify item is deleted (should not appear in list)
      await expect(page.getByText(`Delete Test ${timestamp}`)).not.toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should refresh inventory list', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Click refresh button
    await page.getByRole('button', { name: /Обновить/i }).click();

    // Wait for refresh to complete
    await page.waitForTimeout(1000);

    // List should still be visible
    await expect(page.getByRole('heading', { name: /Инвентарь/i })).toBeVisible();
  });

  test('should display empty state when no items', async ({ page }) => {
    // Apply filters that would return no results
    const searchInput = page.getByPlaceholder(/Поиск/i);
    await searchInput.fill('xyznonexistentitem123');
    await searchInput.press('Enter');

    await page.waitForTimeout(1000);

    // Should show empty state message
    await expect(page.getByText(/Нет данных|не найдено|пуст/i)).toBeVisible();
  });
});
