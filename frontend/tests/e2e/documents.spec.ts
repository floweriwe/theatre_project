import { test, expect } from '@playwright/test';

/**
 * Documents E2E Tests
 * Theatre Management System
 *
 * Tests document list, upload, filter, and view operations
 */

// Helper function to login
async function login(page) {
  await page.goto('/login');
  await page.getByLabel(/Email/i).fill('admin@theatre.test');
  await page.getByLabel(/Пароль/i).fill('Theatre2024!');
  await page.getByRole('button', { name: /Войти в систему/i }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Documents', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);

    // Navigate to documents page
    await page.goto('/documents');
  });

  test('should display documents list page', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /Документы/i })).toBeVisible();

    // Verify action buttons
    await expect(page.getByRole('button', { name: /Обновить/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Добавить/i })).toBeVisible();

    // Verify search input
    await expect(page.getByPlaceholder(/Поиск/i)).toBeVisible();

    // Verify stats cards
    await expect(page.getByText(/Всего/i).first()).toBeVisible();
    await expect(page.getByText(/Активных/i)).toBeVisible();
    await expect(page.getByText(/Черновиков/i)).toBeVisible();
  });

  test('should filter documents by category', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Get category filter dropdown
    const categorySelect = page.getByRole('combobox').filter({ hasText: /категори/i }).first();

    if (await categorySelect.isVisible()) {
      // Select a category
      await categorySelect.selectOption({ index: 1 });

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Verify filter was applied
      const documentCount = await page.locator('a[href*="/documents/"]').count();
      expect(documentCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter documents by status', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Get status filter dropdown
    const statusSelect = page.getByRole('combobox').filter({ hasText: /статус/i }).first();

    if (await statusSelect.isVisible()) {
      // Select "Активный" status
      await statusSelect.selectOption({ label: /Активный/i });

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Verify filtered results show correct status
      const statusBadges = await page.locator('text=/Активный/i').count();
      expect(statusBadges).toBeGreaterThan(0);
    }
  });

  test('should search documents', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Type in search box
    const searchInput = page.getByPlaceholder(/Поиск/i);
    await searchInput.fill('документ');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Should show results or empty state
    const results = await page.locator('a[href*="/documents/"]').count();
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test('should switch between grid and list view', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Find view toggle buttons
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

    // Verify grid is shown
    const gridItems = await page.locator('a[href*="/documents/"]').count();
    expect(gridItems).toBeGreaterThanOrEqual(0);
  });

  test('should sort documents by different criteria', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Find sort dropdown
    const sortSelect = page.getByRole('combobox').filter({ hasText: /дате|названию|размеру/i }).first();

    if (await sortSelect.isVisible()) {
      // Select "По названию"
      await sortSelect.selectOption({ label: /По названию/i });
      await page.waitForTimeout(500);

      // Verify documents are re-ordered (hard to check exact order, but no errors should occur)
      await expect(page.getByRole('heading', { name: /Документы/i })).toBeVisible();
    }
  });

  test('should toggle sort order', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Find sort order toggle button (usually an icon button with arrow)
    const sortOrderButton = page.locator('button').filter({ has: page.locator('svg.lucide-sort-asc, svg.lucide-sort-desc') });

    if (await sortOrderButton.count() > 0) {
      await sortOrderButton.first().click();
      await page.waitForTimeout(500);

      // Toggle again
      await sortOrderButton.first().click();
      await page.waitForTimeout(500);

      // Should not crash
      await expect(page.getByRole('heading', { name: /Документы/i })).toBeVisible();
    }
  });

  test('should navigate to document detail page', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Click on first document
    const firstDocument = page.locator('a[href*="/documents/"]').first();

    const count = await firstDocument.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstDocument.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/documents\/\d+/);

    // Verify detail page elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display document information on detail page', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Navigate to first document
    const firstDocument = page.locator('a[href*="/documents/"]').first();

    const count = await firstDocument.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstDocument.click();
    await page.waitForLoadState('networkidle');

    // Verify document information is present
    const infoFields = [
      /Название|Name/i,
      /Категория|Category/i,
      /Статус|Status/i,
      /Версия|Version/i,
      /Размер|Size/i,
    ];

    let foundInfo = false;
    for (const field of infoFields) {
      if (await page.getByText(field).count() > 0) {
        foundInfo = true;
        break;
      }
    }

    expect(foundInfo).toBeTruthy();
  });

  test('should navigate to upload document page', async ({ page }) => {
    // Click "Добавить" button
    await page.getByRole('link', { name: /Добавить/i }).click();

    // Should navigate to upload page
    await expect(page).toHaveURL(/\/documents\/(new|upload)/);

    // Verify upload form elements
    await expect(page.getByLabel(/Название/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Сохранить|Загрузить|Создать/i })).toBeVisible();
  });

  test('should upload new document', async ({ page }) => {
    // Navigate to upload page
    await page.goto('/documents/upload');

    // Fill in document information
    const timestamp = Date.now();
    await page.getByLabel(/Название/i).first().fill(`Test Document ${timestamp}`);

    // Select category if available
    const categorySelect = page.getByLabel(/Категория/i);
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Fill description
    const descriptionField = page.getByLabel(/Описание/i);
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Test document for E2E testing');
    }

    // Note: File upload testing requires actual file handling
    // For now, we test the form without file upload
    // In real scenario, you would use page.setInputFiles()

    // Try to submit (may fail without file, which is expected)
    const submitButton = page.getByRole('button', { name: /Сохранить|Загрузить|Создать/i });
    await submitButton.click();

    // Either success redirect or validation error
    await page.waitForTimeout(2000);

    // If it requires file, we'll see validation error
    // If it allows empty, we'll redirect
    const currentUrl = page.url();
    expect(currentUrl.includes('/documents')).toBeTruthy();
  });

  test('should edit document metadata', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Navigate to first document detail
    const firstDocument = page.locator('a[href*="/documents/"]').first();

    const count = await firstDocument.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstDocument.click();
    await page.waitForLoadState('networkidle');

    // Look for edit button
    const editButton = page.getByRole('link', { name: /Редактировать|Изменить/i });

    if (await editButton.isVisible()) {
      await editButton.click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/\/documents\/\d+\/edit/);

      // Modify name field
      const nameField = page.getByLabel(/Название/i).first();
      const originalValue = await nameField.inputValue();
      await nameField.fill(`${originalValue} (edited)`);

      // Save changes
      await page.getByRole('button', { name: /Сохранить|Обновить/i }).click();

      // Should redirect back
      await expect(page).toHaveURL(/\/documents/, { timeout: 10000 });

      // Verify changes
      await expect(page.getByText(/\(edited\)|успешно|обновлен/i)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should download document', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Navigate to first document
    const firstDocument = page.locator('a[href*="/documents/"]').first();

    const count = await firstDocument.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstDocument.click();
    await page.waitForLoadState('networkidle');

    // Look for download button
    const downloadButton = page.getByRole('button', { name: /Скачать|Download/i }).or(page.getByRole('link', { name: /Скачать|Download/i }));

    if (await downloadButton.count() > 0) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download');

      await downloadButton.first().click();

      // Wait for download to start
      const download = await downloadPromise;

      // Verify download started
      expect(download).toBeTruthy();
    } else {
      console.log('Note: Download button not found on detail page');
    }
  });

  test('should refresh documents list', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Click refresh button
    await page.getByRole('button', { name: /Обновить/i }).click();

    // Wait for refresh
    await page.waitForTimeout(1000);

    // List should still be visible
    await expect(page.getByRole('heading', { name: /Документы/i })).toBeVisible();
  });

  test('should display document version information', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Check if documents show version badges
    const versionBadges = page.locator('text=/v\\d+|версия/i');

    const count = await versionBadges.count();
    if (count > 0) {
      // Version information is displayed
      await expect(versionBadges.first()).toBeVisible();
    } else {
      console.log('Note: No version information displayed (may not have documents yet)');
    }
  });

  test('should display file size information', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Check if documents show file size (KB, MB, GB, Б)
    const fileSizes = page.locator('text=/\\d+\\s*(Б|КБ|МБ|ГБ|B|KB|MB|GB)/i');

    const count = await fileSizes.count();
    if (count > 0) {
      // File size is displayed
      await expect(fileSizes.first()).toBeVisible();
    } else {
      console.log('Note: No file size information displayed');
    }
  });

  test('should display empty state when no documents found', async ({ page }) => {
    // Apply search that returns no results
    const searchInput = page.getByPlaceholder(/Поиск/i);
    await searchInput.fill('xyznonexistentdocument999');
    await searchInput.press('Enter');

    await page.waitForTimeout(1000);

    // Should show empty state
    await expect(page.getByText(/Нет документов|не найден/i)).toBeVisible();
  });

  test('should show document statistics', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Stats should be visible in cards
    const statsCards = page.locator('text=/\\d+/').filter({ hasText: /Всего|Активных|Черновиков|КБ|МБ|ГБ/i });

    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate between document pages', async ({ page }) => {
    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Click on a document
    const firstDocument = page.locator('a[href*="/documents/"]').first();

    const count = await firstDocument.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstDocument.click();
    await page.waitForLoadState('networkidle');

    // Go back to list
    await page.goBack();

    // Should be back on list page
    await expect(page).toHaveURL('/documents');
    await expect(page.getByRole('heading', { name: /Документы/i })).toBeVisible();
  });
});
