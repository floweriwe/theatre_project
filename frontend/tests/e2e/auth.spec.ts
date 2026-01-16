import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Theatre Management System
 *
 * Tests login, logout, and protected route access
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page before each test
    await page.goto('/login');
  });

  test('should display login page with all elements', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Theatre/);

    // Verify main heading
    await expect(page.getByRole('heading', { name: /Добро пожаловать/i })).toBeVisible();

    // Verify form fields are present
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Пароль/i)).toBeVisible();

    // Verify submit button
    await expect(page.getByRole('button', { name: /Войти в систему/i })).toBeVisible();

    // Verify forgot password link
    await expect(page.getByRole('link', { name: /Забыли пароль/i })).toBeVisible();

    // Verify register link
    await expect(page.getByRole('link', { name: /Создать аккаунт/i })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in the login form
    await page.getByLabel(/Email/i).fill('admin@theatre.test');
    await page.getByLabel(/Пароль/i).fill('Theatre2024!');

    // Click login button
    await page.getByRole('button', { name: /Войти в систему/i }).click();

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/');

    // Verify dashboard elements are visible
    await expect(page.getByRole('heading', { name: /Добр(ое утро|ый день|ый вечер)/i })).toBeVisible();

    // Verify main navigation items are present
    await expect(page.getByText(/Инвентарь/i)).toBeVisible();
    await expect(page.getByText(/Документы/i)).toBeVisible();
    await expect(page.getByText(/Спектакли/i)).toBeVisible();
    await expect(page.getByText(/Расписание/i)).toBeVisible();
  });

  test('should show error message with invalid password', async ({ page }) => {
    // Fill in with wrong password
    await page.getByLabel(/Email/i).fill('admin@theatre.test');
    await page.getByLabel(/Пароль/i).fill('wrongpassword');

    // Click login button
    await page.getByRole('button', { name: /Войти в систему/i }).click();

    // Wait for error message
    await expect(page.getByText(/неверн|ошибка|incorrect/i)).toBeVisible({ timeout: 5000 });

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation error for empty email', async ({ page }) => {
    // Try to submit with empty email
    await page.getByLabel(/Пароль/i).fill('Theatre2024!');
    await page.getByRole('button', { name: /Войти в систему/i }).click();

    // Should show validation error
    await expect(page.getByText(/Введите email|обязательн/i)).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // Fill with invalid email format
    await page.getByLabel(/Email/i).fill('notanemail');
    await page.getByLabel(/Пароль/i).fill('Theatre2024!');
    await page.getByRole('button', { name: /Войти в систему/i }).click();

    // Should show validation error
    await expect(page.getByText(/Некорректный формат email|неправильн/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.getByLabel(/Email/i).fill('admin@theatre.test');
    await page.getByLabel(/Пароль/i).fill('Theatre2024!');
    await page.getByRole('button', { name: /Войти в систему/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL('/');

    // Find and click logout button (usually in user menu or header)
    // Adjust selector based on actual implementation
    const logoutButton = page.getByRole('button', { name: /Выход|Выйти/i });

    // If logout is in a dropdown, click user menu first
    const userMenu = page.getByRole('button', { name: /Профиль|Администратор/i }).first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await logoutButton.click();
    } else {
      await logoutButton.click();
    }

    // Should redirect to login page
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access protected route directly without authentication
    await page.goto('/inventory');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should redirect authenticated user away from login page', async ({ page }) => {
    // Login first
    await page.getByLabel(/Email/i).fill('admin@theatre.test');
    await page.getByLabel(/Пароль/i).fill('Theatre2024!');
    await page.getByRole('button', { name: /Войти в систему/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL('/');

    // Try to go back to login
    await page.goto('/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.getByRole('link', { name: /Забыли пароль/i }).click();

    // Should navigate to forgot password page
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register link
    await page.getByRole('link', { name: /Создать аккаунт/i }).click();

    // Should navigate to register page
    await expect(page).toHaveURL('/register');
  });
});
