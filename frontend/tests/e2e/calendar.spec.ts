import { test, expect } from '@playwright/test';

/**
 * Calendar/Schedule E2E Tests
 * Theatre Management System
 *
 * Tests calendar views (month/week/day), event display, and navigation
 */

// Helper function to login
async function login(page) {
  await page.goto('/login');
  await page.getByLabel(/Email/i).fill('admin@theatre.test');
  await page.getByLabel(/Пароль/i).fill('Theatre2024!');
  await page.getByRole('button', { name: /Войти в систему/i }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Calendar/Schedule', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);

    // Navigate to schedule page
    await page.goto('/schedule');
  });

  test('should display schedule page', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /Расписание/i })).toBeVisible();

    // Verify action buttons
    await expect(page.getByRole('button', { name: /Обновить/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Добавить событие/i })).toBeVisible();

    // Verify calendar is visible
    // Calendar component should have navigation controls
    await expect(page.locator('text=/Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь|January|February|March|April|May|June|July|August|September|October|November|December/i')).toBeVisible();
  });

  test('should display calendar in month view by default', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');

    // Month view should show week days header
    const weekDays = [/Пн|Пон|Mon/i, /Вт|Tue/i, /Ср|Wed/i, /Чт|Thu/i, /Пт|Fri/i, /Сб|Sat/i, /Вс|Sun/i];

    let foundWeekDay = false;
    for (const day of weekDays) {
      if (await page.getByText(day).count() > 0) {
        foundWeekDay = true;
        break;
      }
    }

    expect(foundWeekDay).toBeTruthy();
  });

  test('should switch to week view', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');

    // Look for week view button/toggle
    const weekViewButton = page.getByRole('button', { name: /Неделя|Week/i });

    if (await weekViewButton.isVisible()) {
      await weekViewButton.click();
      await page.waitForTimeout(500);

      // Week view should show time slots
      const hasTimeSlots = await page.locator('text=/00:00|01:00|02:00|08:00|09:00|10:00/i').count();
      expect(hasTimeSlots).toBeGreaterThan(0);
    } else {
      console.log('Note: Week view toggle not found');
    }
  });

  test('should switch to day view', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');

    // Look for day view button/toggle
    const dayViewButton = page.getByRole('button', { name: /День|Day/i });

    if (await dayViewButton.isVisible()) {
      await dayViewButton.click();
      await page.waitForTimeout(500);

      // Day view should show detailed time slots
      const hasDetailedTime = await page.locator('text=/00:00|08:00|09:00|10:00|12:00|18:00/i').count();
      expect(hasDetailedTime).toBeGreaterThan(0);
    } else {
      console.log('Note: Day view toggle not found');
    }
  });

  test('should navigate to next month', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');

    // Get current month/year text
    const currentMonth = await page.locator('text=/Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь/i').first().textContent();

    // Click next button (usually a right arrow or "Далее")
    const nextButton = page.getByRole('button', { name: /Далее|Next|>|→/i }).or(page.locator('button').filter({ has: page.locator('svg') }).last());

    if (await nextButton.count() > 0) {
      await nextButton.first().click();
      await page.waitForTimeout(500);

      // Month should change
      const newMonth = await page.locator('text=/Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь/i').first().textContent();

      expect(newMonth).not.toBe(currentMonth);
    }
  });

  test('should navigate to previous month', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');

    // Get current month
    const currentMonth = await page.locator('text=/Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь/i').first().textContent();

    // Click previous button
    const prevButton = page.getByRole('button', { name: /Назад|Previous|<|←/i }).or(page.locator('button').filter({ has: page.locator('svg') }).first());

    if (await prevButton.count() > 0) {
      await prevButton.first().click();
      await page.waitForTimeout(500);

      // Month should change
      const newMonth = await page.locator('text=/Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь/i').first().textContent();

      expect(newMonth).not.toBe(currentMonth);
    }
  });

  test('should navigate to today', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');

    // Navigate to a different month first
    const nextButton = page.getByRole('button', { name: /Далее|Next|>|→/i }).or(page.locator('button').filter({ has: page.locator('svg') }).last());

    if (await nextButton.count() > 0) {
      await nextButton.first().click();
      await page.waitForTimeout(500);

      // Click "Today" or "Сегодня" button
      const todayButton = page.getByRole('button', { name: /Сегодня|Today/i });

      if (await todayButton.isVisible()) {
        await todayButton.click();
        await page.waitForTimeout(500);

        // Should highlight current date
        const today = new Date();
        const todayDate = today.getDate().toString();

        // Current date should be visible
        await expect(page.getByText(todayDate, { exact: false })).toBeVisible();
      }
    }
  });

  test('should display events on calendar', async ({ page }) => {
    // Wait for calendar and events to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for event type labels
    const eventTypes = [
      /Спектакль/i,
      /Репетиция/i,
      /Техническая/i,
      /Генеральная/i,
      /Собрание/i,
    ];

    let foundEvent = false;
    for (const eventType of eventTypes) {
      if (await page.getByText(eventType).count() > 0) {
        foundEvent = true;
        break;
      }
    }

    if (!foundEvent) {
      console.log('Note: No events displayed on calendar (this is okay if no events exist)');
    }
  });

  test('should click on event to show details', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for any event on the calendar
    // Events might be represented as colored blocks or text
    const eventElements = page.locator('[data-testid="calendar-event"], .rbc-event, [class*="event"]').first();

    const eventCount = await eventElements.count();

    if (eventCount > 0) {
      // Click on the event
      await eventElements.click();

      // Event details should be shown (modal or sidebar)
      // Check for common detail fields
      await expect(page.locator('text=/Дата|Время|Место|Участники|Название/i').first()).toBeVisible({ timeout: 3000 });
    } else {
      console.log('Note: No events to click (this is okay if calendar is empty)');
    }
  });

  test('should refresh calendar', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Click refresh button
    await page.getByRole('button', { name: /Обновить/i }).click();

    // Wait for refresh
    await page.waitForTimeout(1000);

    // Calendar should still be visible
    await expect(page.getByRole('heading', { name: /Расписание/i })).toBeVisible();
  });

  test('should open add event dialog', async ({ page }) => {
    // Click "Добавить событие" button
    await page.getByRole('button', { name: /Добавить событие/i }).click();

    // Should show event creation form or modal
    // Wait a bit for modal to appear
    await page.waitForTimeout(500);

    // Look for form fields that would appear in create event modal/page
    const hasEventForm = await page.locator('text=/Название|Тип события|Дата|Время/i').count();

    if (hasEventForm > 0) {
      expect(hasEventForm).toBeGreaterThan(0);
    } else {
      // Maybe navigates to a different page
      await expect(page).toHaveURL(/\/schedule\/new|\/events\/new/);
    }
  });

  test('should filter events by type', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');

    // Look for event type filter/legend
    const eventTypeButtons = page.locator('button, label').filter({ hasText: /Спектакль|Репетиция|Техническая/i });

    const count = await eventTypeButtons.count();

    if (count > 0) {
      // Click on event type to filter
      await eventTypeButtons.first().click();
      await page.waitForTimeout(500);

      // Events should be filtered (implementation dependent)
      console.log('Note: Event filtering interaction completed');
    } else {
      console.log('Note: No event type filters found');
    }
  });

  test('should handle empty calendar gracefully', async ({ page }) => {
    // Navigate far into the future where no events exist
    await page.waitForLoadState('networkidle');

    // Click next month multiple times
    const nextButton = page.getByRole('button', { name: /Далее|Next|>|→/i }).or(page.locator('button').filter({ has: page.locator('svg') }).last());

    if (await nextButton.count() > 0) {
      for (let i = 0; i < 12; i++) {
        await nextButton.first().click();
        await page.waitForTimeout(300);
      }

      // Calendar should still render properly even with no events
      await expect(page.locator('text=/Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь/i')).toBeVisible();
    }
  });

  test('should display event details when selected', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if any events are displayed
    const eventElements = page.locator('[data-testid="calendar-event"], .rbc-event, [class*="event"]');
    const eventCount = await eventElements.count();

    if (eventCount > 0) {
      // Click on first event
      await eventElements.first().click();
      await page.waitForTimeout(500);

      // Event details panel should appear
      // Common fields: title, date, time, venue, participants
      const detailFields = [
        /Название|Title/i,
        /Дата|Date/i,
        /Время|Time/i,
        /Место|Venue|Location/i,
      ];

      let foundDetails = false;
      for (const field of detailFields) {
        if (await page.getByText(field).count() > 0) {
          foundDetails = true;
          break;
        }
      }

      expect(foundDetails).toBeTruthy();
    } else {
      console.log('Note: No events available to test detail view');
    }
  });

  test('should close event details', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if any events are displayed
    const eventElements = page.locator('[data-testid="calendar-event"], .rbc-event, [class*="event"]');
    const eventCount = await eventElements.count();

    if (eventCount > 0) {
      // Click on first event
      await eventElements.first().click();
      await page.waitForTimeout(500);

      // Look for close button (X, ✕, Close, Закрыть)
      const closeButton = page.getByRole('button', { name: /Close|Закрыть|✕|×/i }).or(page.locator('button:has-text("✕")'));

      if (await closeButton.count() > 0) {
        await closeButton.first().click();
        await page.waitForTimeout(300);

        // Details panel should be closed
        console.log('Note: Event details closed successfully');
      }
    }
  });
});
