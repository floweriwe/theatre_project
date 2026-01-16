# E2E Tests Quick Start

## Prerequisites

```bash
# Install dependencies (if not done)
npm install

# Install browser (if not done)
npx playwright install chromium
```

## Running Tests

### First Time Setup

1. Start dev server in one terminal:
```bash
npm run dev
```

2. Run tests in another terminal:
```bash
npm run test:e2e
```

### Quick Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Interactive UI mode (RECOMMENDED for development)
npm run test:e2e:ui

# See browser while running
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Run Specific Tests

```bash
# Single file
npx playwright test auth.spec.ts

# Single test by line number
npx playwright test auth.spec.ts:47

# By test name
npx playwright test -g "login"

# Only failed tests
npx playwright test --last-failed
```

## Test Suites

| Suite | File | Tests | Coverage |
|-------|------|-------|----------|
| Auth | auth.spec.ts | 10 | Login, logout, validation |
| Inventory | inventory.spec.ts | 13 | CRUD, filters, search |
| Performances | performance.spec.ts | 13 | List, detail, passport |
| Calendar | calendar.spec.ts | 14 | Views, events, navigation |
| Documents | documents.spec.ts | 19 | List, upload, filters |

**Total: 69 tests**

## Debugging

### Visual Debugging
```bash
# Open UI mode
npm run test:e2e:ui
```
- Click on test to run
- See browser, console, network
- Inspect DOM at any point

### Debug Specific Test
```bash
# Add breakpoint in test code
npx playwright test auth.spec.ts:47 --debug
```

### View Traces
After test failure:
```bash
npx playwright show-trace test-results/trace.zip
```

## Common Issues

### Port 5173 in use
```bash
# Kill existing dev server
# Then restart: npm run dev
```

### Tests timing out
- Check if dev server is running
- Check network connection
- Increase timeout in playwright.config.ts

### Elements not found
- UI text may have changed
- Use `--headed` mode to see what's happening
- Check console for errors

## Test Credentials

```
Email: admin@theatre.test
Password: Theatre2024!
```

## Output

Tests generate:
- Screenshots (on failure) → `test-results/`
- Videos (on failure) → `test-results/`
- HTML report → `playwright-report/`
- Traces (on failure) → `test-results/`

## CI Mode

Tests auto-detect CI environment and adjust:
- Sequential execution
- More retries
- Full reporting

## Next Steps

1. Run `npm run test:e2e:ui` to explore tests interactively
2. Make changes, run specific tests
3. Review test reports for failures
4. Add new tests in `tests/e2e/` directory

## Resources

- [Playwright Docs](https://playwright.dev)
- [Test README](./e2e/README.md)
- [Task Summary](./TASK-8-SUMMARY.md)
