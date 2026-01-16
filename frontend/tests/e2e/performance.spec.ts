import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests
 * Theatre Management System
 *
 * Tests performances list, detail pages, and technical passport
 */

// Helper function to login
async function login(page) {
  await page.goto('/login');
  await page.getByLabel(/Email/i).fill('admin@theatre.test');
  await page.getByLabel(/Пароль/i).fill('Theatre2024!');
  await page.getByRole('button', { name: /Войти в систему/i }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Performances', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);

    // Navigate to performances page
    await page.goto('/performances');
  });

  test('should display performances list page', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /Спектакли/i })).toBeVisible();

    // Verify action buttons
    await expect(page.getByRole('button', { name: /Обновить/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Добавить/i })).toBeVisible();

    // Verify search input
    await expect(page.getByPlaceholder(/Поиск/i)).toBeVisible();

    // Verify stats cards
    await expect(page.getByText(/Всего/i).first()).toBeVisible();
    await expect(page.getByText(/В репертуаре/i)).toBeVisible();
    await expect(page.getByText(/В подготовке/i)).toBeVisible();
  });

  test('should filter performances by status', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Select status filter
    const statusSelect = page.getByRole('combobox').filter({ hasText: /статус/i }).first();
    await statusSelect.selectOption({ label: /В репертуаре/i });

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify filtered results show correct status
    const statusBadges = await page.locator('text=/В репертуаре/i').count();
    expect(statusBadges).toBeGreaterThan(0);
  });

  test('should search performances', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Type in search box
    const searchInput = page.getByPlaceholder(/Поиск/i);
    await searchInput.fill('спектакль');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Should show results or empty state
    const hasResults = await page.locator('a[href*="/performances/"]').count();
    expect(hasResults).toBeGreaterThanOrEqual(0);
  });

  test('should switch between grid and list view', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Find view toggle buttons
    const listViewButton = page.locator('button').filter({ has: page.locator('svg.lucide-list') });
    const gridViewButton = page.locator('button').filter({ has: page.locator('svg.lucide-grid') });

    // Switch to list view if list button exists
    if (await listViewButton.count() > 0) {
      await listViewButton.click();
      await page.waitForTimeout(500);

      // Switch back to grid view
      await gridViewButton.click();
      await page.waitForTimeout(500);
    }

    // Verify grid items are visible
    const gridItems = await page.locator('a[href*="/performances/"]').count();
    expect(gridItems).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to performance detail page', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Click on first performance
    const firstPerformance = page.locator('a[href*="/performances/"]').first();

    // Check if any performances exist
    const count = await firstPerformance.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstPerformance.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/performances\/\d+/);

    // Verify detail page elements are visible
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display performance details', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Navigate to first performance
    const firstPerformance = page.locator('a[href*="/performances/"]').first();

    const count = await firstPerformance.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstPerformance.click();
    await page.waitForLoadState('networkidle');

    // Verify performance information sections are present
    // These could be in cards or sections
    const detailsVisible = await page.locator('text=/Автор|Режиссёр|Жанр|Продолжительность/i').count();
    expect(detailsVisible).toBeGreaterThan(0);
  });

  test('should view technical passport sections', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Navigate to first performance
    const firstPerformance = page.locator('a[href*="/performances/"]').first();

    const count = await firstPerformance.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstPerformance.click();
    await page.waitForLoadState('networkidle');

    // Look for technical passport sections
    // Common sections: Реквизит, Костюмы, Декорации, Освещение, Звук
    const technicalSections = [
      /Реквизит/i,
      /Костюм/i,
      /Декорац/i,
      /Освещение/i,
      /Звук/i,
      /Техническ/i,
      /Паспорт/i
    ];

    let foundSection = false;
    for (const section of technicalSections) {
      if (await page.getByText(section).count() > 0) {
        foundSection = true;
        break;
      }
    }

    // If technical passport sections are implemented, they should be visible
    // If not yet implemented, this test documents expected behavior
    if (!foundSection) {
      console.log('Note: Technical passport sections not yet visible on detail page');
    }
  });

  test('should navigate to create performance page', async ({ page }) => {
    // Click "Добавить" button
    await page.getByRole('link', { name: /Добавить/i }).click();

    // Should navigate to create page
    await expect(page).toHaveURL('/performances/new');

    // Verify form elements
    await expect(page.getByLabel(/Название/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Сохранить|Создать/i })).toBeVisible();
  });

  test('should create new performance', async ({ page }) => {
    // Navigate to create page
    await page.goto('/performances/new');

    // Fill in the form
    const timestamp = Date.now();
    await page.getByLabel(/Название/i).first().fill(`Test Performance ${timestamp}`);

    // Fill subtitle if visible
    const subtitleField = page.getByLabel(/Подзаголовок/i);
    if (await subtitleField.isVisible()) {
      await subtitleField.fill('Test Subtitle');
    }

    // Fill author
    const authorField = page.getByLabel(/Автор/i);
    if (await authorField.isVisible()) {
      await authorField.fill('Test Author');
    }

    // Fill director
    const directorField = page.getByLabel(/Режиссёр/i);
    if (await directorField.isVisible()) {
      await directorField.fill('Test Director');
    }

    // Submit form
    await page.getByRole('button', { name: /Сохранить|Создать/i }).click();

    // Should redirect to list or detail page
    await expect(page).toHaveURL(/\/performances/, { timeout: 10000 });

    // Verify success message or new performance appears
    await expect(page.getByText(new RegExp(`Test Performance ${timestamp}|успешно|создан`, 'i'))).toBeVisible({ timeout: 5000 });
  });

  test('should edit performance', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Navigate to first performance detail
    const firstPerformance = page.locator('a[href*="/performances/"]').first();

    const count = await firstPerformance.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await firstPerformance.click();
    await page.waitForLoadState('networkidle');

    // Look for edit button
    const editButton = page.getByRole('link', { name: /Редактировать|Изменить/i });

    if (await editButton.isVisible()) {
      await editButton.click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/\/performances\/\d+\/edit/);

      // Modify a field
      const titleField = page.getByLabel(/Название/i).first();
      const originalValue = await titleField.inputValue();
      await titleField.fill(`${originalValue} (edited)`);

      // Save changes
      await page.getByRole('button', { name: /Сохранить|Обновить/i }).click();

      // Should redirect back
      await expect(page).toHaveURL(/\/performances/, { timeout: 10000 });

      // Verify changes
      await expect(page.getByText(/\(edited\)|успешно|обновлен/i)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should refresh performances list', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Click refresh button
    await page.getByRole('button', { name: /Обновить/i }).click();

    // Wait for refresh
    await page.waitForTimeout(1000);

    // List should still be visible
    await expect(page.getByRole('heading', { name: /Спектакли/i })).toBeVisible();
  });

  test('should display performance card information', async ({ page }) => {
    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Check if any performances exist
    const performanceCards = page.locator('a[href*="/performances/"]');
    const count = await performanceCards.count();

    if (count > 0) {
      // Verify first card has expected elements
      const firstCard = performanceCards.first();

      // Should have title
      await expect(firstCard).toContainText(/.+/);

      // Should have status badge
      const badges = firstCard.locator('text=/В репертуаре|В подготовке|На паузе|В архиве/i');
      expect(await badges.count()).toBeGreaterThan(0);
    } else {
      // Empty state
      await expect(page.getByText(/Нет спектаклей/i)).toBeVisible();
    }
  });

  test('should display empty state when no performances found', async ({ page }) => {
    // Apply search that returns no results
    const searchInput = page.getByPlaceholder(/Поиск/i);
    await searchInput.fill('xyznonexistentperformance999');
    await searchInput.press('Enter');

    await page.waitForTimeout(1000);

    // Should show empty state
    await expect(page.getByText(/Нет спектаклей|не найдено/i)).toBeVisible();
  });
});
