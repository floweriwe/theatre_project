# E2E Tests - Theatre Management System

End-to-end tests using Playwright for the Theatre Management System frontend.

## Overview

These tests cover critical user flows across all major features:

- **Authentication** - Login, logout, protected routes
- **Inventory** - List, create, edit, delete items
- **Performances** - List, detail view, technical passport
- **Calendar** - Month/week views, event display
- **Documents** - List, upload, filter, view

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers (if not already done):
```bash
npx playwright install chromium
```

3. Make sure the development server is running:
```bash
npm run dev
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests with UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Run Specific Test File

```bash
npx playwright test auth.spec.ts
```

### Run Tests with Debug Mode

```bash
npm run test:e2e:debug
```

### View Test Report

```bash
npm run test:e2e:report
```

## Test Structure

```
tests/e2e/
├── auth.spec.ts         # Authentication tests
├── inventory.spec.ts    # Inventory management tests
├── performance.spec.ts  # Performance/repertoire tests
├── calendar.spec.ts     # Schedule/calendar tests
├── documents.spec.ts    # Document management tests
├── helpers.ts           # Test utilities and helpers
└── README.md           # This file
```

## Test Credentials

Default test credentials (from seed data):

- **Email:** admin@theatre.test
- **Password:** Theatre2024!

## Configuration

Configuration is in `playwright.config.ts` at the project root:

- Base URL: `http://localhost:5173`
- Timeout: 30 seconds per test
- Retries: 1 (2 on CI)
- Screenshots: Only on failure
- Video: Retain on failure
- Traces: Retain on failure

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/feature');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
```

### Using Helpers

```typescript
import {
  login,
  navigateTo,
  searchFor,
  waitForDataLoad
} from './helpers';

test('should search items', async ({ page }) => {
  await login(page);
  await navigateTo(page, 'inventory');
  await searchFor(page, 'реквизит');
  await waitForDataLoad(page);

  // Assertions
});
```

## Best Practices

1. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for elements**: Use `await expect().toBeVisible()` instead of manual waits
3. **Use test data**: Generate unique test data with timestamps
4. **Clean up**: Delete test data after creating it in tests
5. **Test isolation**: Each test should be independent
6. **Descriptive names**: Use clear, descriptive test names

## Debugging Tips

### Visual Debugging

```bash
# Open UI mode for interactive debugging
npm run test:e2e:ui
```

### Debug Mode

```bash
# Run with debugger
npm run test:e2e:debug
```

### Inspect Specific Test

```bash
# Run single test with headed mode
npx playwright test auth.spec.ts:10 --headed
```

### Check Traces

After test failure, traces are saved to `test-results/`. Open them:

```bash
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

Tests are configured to run in CI with:

- Increased retries (2)
- No parallel execution
- Full HTML report generation
- Screenshot/video capture on failure

## Troubleshooting

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check if backend API is responding
- Verify network conditions

### Elements not found

- Check if UI text has changed
- Verify element is actually rendered
- Use `page.pause()` to inspect during test

### Flaky tests

- Add explicit waits for network: `await page.waitForLoadState('networkidle')`
- Use `waitForDataLoad()` helper
- Increase retry count in config

## Test Coverage

Current coverage:

- [ ] Authentication flows
- [ ] Inventory CRUD operations
- [ ] Performance management
- [ ] Schedule/calendar views
- [ ] Document management
- [ ] User profile
- [ ] Admin functions
- [ ] Report generation

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
